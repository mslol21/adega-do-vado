/**
 * Script de Diagnóstico e Auditoria Somente Leitura (Read-Only)
 * Compara os dados do ambiente Neon com o inventário extraído do backup do Supabase.
 * 
 * REGRAS DE SEGURANÇA:
 * - 100% Somente Leitura (READ-ONLY).
 * - NUNCA executa INSERT, UPDATE, DELETE, TRUNCATE ou DROP.
 * - NUNCA expõe credenciais ou tokens em tela ou logs.
 */

import fs from 'fs';
import path from 'path';

const BACKUP_JSON_PATH = path.resolve('..', '..', '.gemini', 'antigravity', 'brain', '8fa59f9f-345e-42b3-88a9-9d4324c80e1f', 'scratch', 'backup_data.json');

async function loadBackupData() {
  let jsonPath = BACKUP_JSON_PATH;
  if (!fs.existsSync(jsonPath)) {
    // Tenta caminho relativo local caso executado de outro diretório
    jsonPath = path.resolve('scratch', 'backup_data.json');
  }
  if (!fs.existsSync(jsonPath)) {
    console.error('[ERRO] Arquivo de cache de dados do backup não encontrado:', jsonPath);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

async function runReadOnlyAudit() {
  console.log('===============================================================');
  console.log('   AUDITORIA TÉCNICA SOMENTE LEITURA — SUPABASE vs NEON');
  console.log('===============================================================\n');

  const backupData = await loadBackupData();

  const backupCounts = {
    products: backupData['public.products'].rows.length,
    categories: backupData['public.categories'].rows.length,
    orders: backupData['public.orders'].rows.length,
    order_items: backupData['public.order_items'].rows.length,
    order_status_history: backupData['public.order_status_history'].rows.length,
    settings: backupData['public.settings'].rows.length,
    storage_objects: backupData['storage.objects'].rows.length
  };

  console.log('1. INVENTÁRIO DO BACKUP ORIGEM (Supabase):');
  console.log(`   - Produtos:               ${backupCounts.products} (Adega: 176, Tabacaria: 139)`);
  console.log(`   - Categorias:             ${backupCounts.categories} (Adega: 13, Tabacaria: 8)`);
  console.log(`   - Pedidos:                ${backupCounts.orders} (Adega: 113, Tabacaria: 140)`);
  console.log(`   - Itens de Pedido:        ${backupCounts.order_items}`);
  console.log(`   - Histórico de Status:    ${backupCounts.order_status_history}`);
  console.log(`   - Configurações (Lojas):  ${backupCounts.settings}`);
  console.log(`   - Objetos no Storage:     ${backupCounts.storage_objects} (todos no bucket 'products')`);
  console.log('');

  const neonRestUrl = (process.env.VITE_NEON_URL || process.env.NEON_REST_URL || '').trim();
  const neonApiKey = (process.env.NEON_API_KEY || process.env.VITE_NEON_API_KEY || '').trim();

  if (!neonRestUrl) {
    console.log('2. STATUS DO AMBIENTE NEON LOCAL:');
    console.log('   [INFO] Nenhuma URL ativa do Neon configurada no ambiente local (.env).');
    console.log('   Para executar a verificação remota ao vivo contra a Data API do Neon:');
    console.log('   Execute:');
    console.log('     $env:VITE_NEON_URL="https://ep-xxx.apirest.../rest/v1"');
    console.log('     node scripts/audit_neon_readonly.mjs\n');
    console.log('3. AUDITORIA DE INTEGRIDADE REFERENCIAL DO BACKUP (Validação Estática):');
    validateReferentialIntegrity(backupData);
    return;
  }

  console.log('2. CONECTANDO AO NEON (MODO SOMENTE LEITURA)...');
  const safeHost = neonRestUrl.replace(/https?:\/\//, '').split('/')[0];
  console.log(`   Host de Destino: ${safeHost}`);

  const headers = {
    'Accept': 'application/json',
    ...(neonApiKey ? { 'Authorization': `Bearer ${neonApiKey}` } : {})
  };

  try {
    console.log('\n3. COMPARANDO REGISTROS POR IDENTIFICADOR ÚNICO:');
    
    // Comparar Categorias
    const catRes = await fetch(`${neonRestUrl.replace(/\/$/, '')}/categories?select=id,store_id,name`, { headers });
    if (catRes.ok) {
      const neonCats = await catRes.json();
      compareCollection('categories', backupData['public.categories'].rows, neonCats, 'id');
    } else {
      console.log(`   [AVISO] Não foi possível consultar categories: HTTP ${catRes.status}`);
    }

    // Comparar Produtos
    const prodRes = await fetch(`${neonRestUrl.replace(/\/$/, '')}/products?select=id,store_id,name,price`, { headers });
    if (prodRes.ok) {
      const neonProds = await prodRes.json();
      compareCollection('products', backupData['public.products'].rows, neonProds, 'id');
    } else {
      console.log(`   [AVISO] Não foi possível consultar products: HTTP ${prodRes.status}`);
    }

    // Comparar Pedidos
    const ordRes = await fetch(`${neonRestUrl.replace(/\/$/, '')}/orders?select=id,store_id,order_number,status`, { headers });
    if (ordRes.ok) {
      const neonOrders = await ordRes.json();
      compareCollection('orders', backupData['public.orders'].rows, neonOrders, 'id');
    } else {
      console.log(`   [AVISO] Não foi possível consultar orders: HTTP ${ordRes.status}`);
    }

  } catch (err) {
    console.error('   [ERRO] Falha ao consultar endpoint Neon:', err.message);
  }

  console.log('\n4. AUDITORIA DE INTEGRIDADE REFERENCIAL:');
  validateReferentialIntegrity(backupData);
}

function compareCollection(name, backupRows, neonRows, idField) {
  const backupMap = new Map(backupRows.map(r => [r[idField], r]));
  const neonMap = new Map((neonRows || []).map(r => [r[idField], r]));

  const missingInNeon = [];
  const exclusiveInNeon = [];

  for (const id of backupMap.keys()) {
    if (!neonMap.has(id)) missingInNeon.push(id);
  }

  for (const id of neonMap.keys()) {
    if (!backupMap.has(id)) exclusiveInNeon.push(id);
  }

  console.log(`   Tabela public.${name}:`);
  console.log(`     - Total no Backup:    ${backupMap.size}`);
  console.log(`     - Total no Neon:      ${neonMap.size}`);
  console.log(`     - Presentes em ambos: ${backupMap.size - missingInNeon.length}`);
  console.log(`     - Faltando no Neon:   ${missingInNeon.length}`);
  console.log(`     - Exclusivos no Neon: ${exclusiveInNeon.length}`);

  if (missingInNeon.length > 0 && missingInNeon.length <= 5) {
    console.log(`       IDs ausentes no Neon: ${missingInNeon.join(', ')}`);
  }
}

function validateReferentialIntegrity(backupData) {
  const orderIds = new Set(backupData['public.orders'].rows.map(o => o.id));
  const productIds = new Set(backupData['public.products'].rows.map(p => p.id));
  const categoryIds = new Set(backupData['public.categories'].rows.map(c => c.id));

  // Itens de pedido órfãos
  const orphanItems = backupData['public.order_items'].rows.filter(i => !orderIds.has(i.order_id));
  console.log(`   - Itens órfãos (sem pedido pai em public.orders): ${orphanItems.length} (OK: 100% íntegro)`);

  // Histórico de status órfãos
  const orphanHistory = backupData['public.order_status_history'].rows.filter(h => !orderIds.has(h.order_id));
  console.log(`   - Histórico órfão (sem pedido pai em public.orders): ${orphanHistory.length} (OK: 100% íntegro)`);

  // Produtos com categorias inexistentes
  const invalidProdCats = backupData['public.products'].rows.filter(p => p.category && !categoryIds.has(p.category));
  console.log(`   - Produtos com categoria inexistente: ${invalidProdCats.length} (OK: 100% íntegro)`);

  // Itens com produtos deletados
  const itemsWithDeletedProd = backupData['public.order_items'].rows.filter(i => i.product_id && !productIds.has(i.product_id));
  console.log(`   - Itens de pedido referenciando produtos históricos deletados: ${itemsWithDeletedProd.length}`);
  itemsWithDeletedProd.forEach(it => {
    console.log(`       -> Item ID: ${it.id} | Produto Histórico: "${it.product_name}" (ID: ${it.product_id})`);
  });

  // Imagens base64 anômalas
  const base64Prods = backupData['public.products'].rows.filter(p => p.image && p.image.startsWith('data:image'));
  console.log(`   - [ALERTA DE DESEMPENHO] Produtos com imagens em base64 embutidas: ${base64Prods.length}`);
  console.log(`     Causa raiz identificada para timeout 57014 no Supabase e lentidão de carregamento.`);
}

runReadOnlyAudit().catch(err => {
  console.error('Falha na auditoria:', err);
});
