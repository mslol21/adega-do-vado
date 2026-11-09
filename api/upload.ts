/**
 * Authenticated Neon Object Storage uploader (Vercel Function).
 * Credentials are server-side only. The Data API authenticates the caller
 * and RLS limits visible profiles to the caller's own memberships.
 */
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const matchesMagic = (bytes: Uint8Array, type: string) => {
  if (type === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v);
  if (type === 'image/webp') return bytes.length >= 12 &&
    [82,73,70,70].every((v,i)=>bytes[i] === v) &&
    [87,69,66,80].every((v,i)=>bytes[8+i] === v);
  return false;
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  const bearer = request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1];
  if (!bearer || bearer.length > 8192) return json({ error: 'Faça login como administrador.' }, 401);

  const dataApi = process.env.NEON_STORAGE_DATA_API_URL;
  const token = process.env.NEON_STORAGE_API_TOKEN;
  const projectId = process.env.NEON_STORAGE_PROJECT_ID;
  const branchId = process.env.NEON_STORAGE_BRANCH_ID;
  const publicBase = process.env.NEON_STORAGE_PUBLIC_BASE;
  if (!dataApi || !token || !projectId || !branchId || !publicBase)
    return json({ error: 'Armazenamento não configurado no servidor.' }, 503);

  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 4 * 1024 * 1024) return json({ error: 'Imagem muito grande (limite 3 MB).' }, 413);
    const form = await request.formData();
    const file = form.get('file');
    const storeId = form.get('storeId');
    if (!(file instanceof File) || (storeId !== 'adega' && storeId !== 'tabacaria'))
      return json({ error: 'Arquivo ou loja inválida.' }, 400);
    if (file.size < 1 || file.size > 3 * 1024 * 1024)
      return json({ error: 'A imagem precisa ter até 3 MB.' }, 413);
    const types: Record<string, string> = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
    const ext = types[file.type];
    if (!ext) return json({ error: 'Envie JPG, PNG ou WEBP.' }, 415);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesMagic(bytes, file.type)) return json({ error: 'Arquivo de imagem inválido.' }, 415);

    // Data API requires a valid signed Neon Auth token. RLS grants the caller
    // only their own profile rows; store and role are checked server-side.
    const profilesUrl = new URL(dataApi.replace(/\/$/, '') + '/profiles');
    profilesUrl.searchParams.set('select', 'id');
    profilesUrl.searchParams.set('store_id', 'eq.' + storeId);
    profilesUrl.searchParams.set('role', 'eq.ADMIN');
    profilesUrl.searchParams.set('limit', '1');
    const profileResponse = await fetch(profilesUrl, {
      headers: { 'Authorization': 'Bearer ' + bearer, 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (!profileResponse.ok) return json({ error: 'Sessão inválida ou expirada.' }, 401);
    const profiles: unknown = await profileResponse.json();
    if (!Array.isArray(profiles) || profiles.length !== 1)
      return json({ error: 'Sem permissão administrativa nesta loja.' }, 403);

    const key = storeId + '/uploads/' + crypto.randomUUID() + '.' + ext;
    const presignEndpoint = 'https://console.neon.tech/api/v2/projects/' +
      encodeURIComponent(projectId) + '/branches/' + encodeURIComponent(branchId) +
      '/buckets/products/objects/' + encodeURIComponent(key) + '/presign';
    const signedResponse = await fetch(presignEndpoint, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'upload', content_type: file.type, expires_in_seconds: 120 }),
      cache: 'no-store',
    });
    if (!signedResponse.ok) {
      console.error('Neon Storage presign failed:', signedResponse.status);
      return json({ error: 'Falha ao preparar upload no Neon.' }, 502);
    }
    const signed = await signedResponse.json() as { url?: string; headers?: Record<string,string> };
    if (!signed.url) return json({ error: 'Neon não retornou uma URL de upload.' }, 502);
    const uploadUrl = new URL(signed.url);
    if (uploadUrl.protocol !== 'https:' || !uploadUrl.hostname.endsWith('.neon.tech'))
      return json({ error: 'Destino do armazenamento inválido.' }, 502);

    const upload = await fetch(signed.url, {
      method: 'PUT', headers: { 'Content-Type': file.type, ...(signed.headers || {}) },
      body: bytes,
    });
    if (!upload.ok) {
      console.error('Neon Storage PUT failed:', upload.status);
      return json({ error: 'Não foi possível enviar a imagem ao Neon Storage.' }, 502);
    }
    return json({ url: publicBase.replace(/\/$/, '') + '/' + key });
  } catch (err) {
    console.error('Neon upload failed:', err instanceof Error ? err.name : 'unknown');
    return json({ error: 'Não foi possível processar a imagem.' }, 500);
  }
}
