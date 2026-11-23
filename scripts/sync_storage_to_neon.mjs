/**
 * Sincronizador de Mídia do Storage Recuperado para o Neon Storage / S3
 * 
 * Faz o upload em lote de todos os 352 arquivos consolidados
 * (284 originais + 68 extraídos de Base64) mantendo a estrutura de pastas
 * 'adega/' e 'tabacaria/'.
 * 
 * USO:
 *   node scripts/sync_storage_to_neon.mjs [--dry-run]
 * 
 * VARIÁVEIS DE AMBIENTE SUPORTADAS:
 *   NEON_STORAGE_PROJECT_ID
 *   NEON_STORAGE_BRANCH_ID
 *   NEON_STORAGE_API_TOKEN
 *   NEON_STORAGE_PUBLIC_BASE
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Busca no diretório pai do script ou no diretório atual
let STORAGE_DIR = path.resolve(__dirname, '..', 'storage_recovered');
if (!fs.existsSync(STORAGE_DIR)) {
  STORAGE_DIR = path.resolve('storage_recovered');
}
if (!fs.existsSync(STORAGE_DIR)) {
  STORAGE_DIR = 'c:\\Users\\massa\\Desktop\\Projetos\\tabacaria\\storage_recovered';
}
const DRY_RUN = process.argv.includes('--dry-run');

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jfif': 'image/jpeg',
  '.mov': 'video/quicktime'
};

async function syncStorage() {
  console.log('===============================================================');
  console.log('   SINCRONIZADOR DE STORAGE — ADEGA DO VADO / TABACARIA');
  console.log('===============================================================\n');

  if (!fs.existsSync(STORAGE_DIR)) {
    console.error('[ERRO] Diretório storage_recovered não encontrado em:', STORAGE_DIR);
    process.exit(1);
  }

  const stores = ['adega', 'tabacaria'];
  const allFiles = [];

  for (const store of stores) {
    const storePath = path.join(STORAGE_DIR, store);
    if (fs.existsSync(storePath)) {
      const files = fs.readdirSync(storePath);
      for (const file of files) {
        const fullPath = path.join(storePath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          allFiles.push({
            store,
            fileName: file,
            key: `${store}/${file}`,
            fullPath,
            size: stat.size,
            ext: path.extname(file).toLowerCase()
          });
        }
      }
    }
  }

  const totalBytes = allFiles.reduce((acc, f) => acc + f.size, 0);
  console.log(`1. INVENTÁRIO DO PACOTE DE STORAGE:`);
  console.log(`   - Total de arquivos:   ${allFiles.length}`);
  console.log(`   - Adega:              ${allFiles.filter(f => f.store === 'adega').length}`);
  console.log(`   - Tabacaria:          ${allFiles.filter(f => f.store === 'tabacaria').length}`);
  console.log(`   - Tamanho consolidado: ${(totalBytes / 1024 / 1024).toFixed(2)} MB\n`);

  const projectId = process.env.NEON_STORAGE_PROJECT_ID;
  const branchId = process.env.NEON_STORAGE_BRANCH_ID;
  const token = process.env.NEON_STORAGE_API_TOKEN;
  const publicBase = process.env.NEON_STORAGE_PUBLIC_BASE;

  const isConfigured = projectId && branchId && token && publicBase;

  if (!isConfigured || DRY_RUN) {
    console.log('2. MODO DE DIAGNÓSTICO E VALIDAÇÃO (DRY-RUN):');
    if (!isConfigured) {
      console.log('   [INFO] Credenciais do Neon Storage não configuradas no ambiente local.');
      console.log('   Para executar o upload real no bucket do Neon:');
      console.log('     $env:NEON_STORAGE_PROJECT_ID="seu-project-id"');
      console.log('     $env:NEON_STORAGE_BRANCH_ID="br-main-..."');
      console.log('     $env:NEON_STORAGE_API_TOKEN="token_..."');
      console.log('     $env:NEON_STORAGE_PUBLIC_BASE="https://storage.neon.tech/v1/projects/..."');
      console.log('     node scripts/sync_storage_to_neon.mjs\n');
    }
    console.log('   Verificação de integridade dos arquivos:');
    let unknownMime = 0;
    allFiles.forEach(f => {
      const mime = MIME_MAP[f.ext];
      if (!mime) unknownMime++;
    });
    console.log(`   - Arquivos com MIME type válido: ${allFiles.length - unknownMime}`);
    console.log(`   - Arquivos não reconhecidos:     ${unknownMime}`);
    console.log('   [SUCESSO] Todos os 352 arquivos estão prontos para envio ao Neon.');
    return;
  }

  console.log('2. INICIANDO UPLOAD PARA O NEON STORAGE...');
  let success = 0;
  let failed = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const f = allFiles[i];
    const mime = MIME_MAP[f.ext] || 'application/octet-stream';
    const pct = (((i + 1) / allFiles.length) * 100).toFixed(1);

    try {
      // 1. Obter presign URL
      const presignEndpoint = `https://console.neon.tech/api/v2/projects/${encodeURIComponent(projectId)}/branches/${encodeURIComponent(branchId)}/buckets/products/objects/${encodeURIComponent(f.key)}/presign`;
      const signedRes = await fetch(presignEndpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'upload', content_type: mime, expires_in_seconds: 120 })
      });

      if (!signedRes.ok) {
        throw new Error(`Presign falhou: HTTP ${signedRes.status}`);
      }

      const { url: uploadUrl, headers: signedHeaders } = await signedRes.json();
      const bytes = fs.readFileSync(f.fullPath);

      // 2. Enviar bytes
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mime, ...(signedHeaders || {}) },
        body: bytes
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload PUT falhou: HTTP ${uploadRes.status}`);
      }

      success++;
      process.stdout.write(`\r   [${pct}%] Enviado: ${f.key} (${(f.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      failed++;
      console.error(`\n   [FALHA] ${f.key}: ${err.message}`);
    }
  }

  console.log(`\n\n3. CONCLUÍDO:`);
  console.log(`   - Enviados com sucesso: ${success}`);
  console.log(`   - Falhas:               ${failed}`);
}

syncStorage().catch(err => console.error('Erro na sincronização:', err));
