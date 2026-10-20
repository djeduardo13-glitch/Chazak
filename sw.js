// ══════════════════════════════════════════
// Chazak — Service Worker (FASE 2 — PWA Offline)
// IMPORTANTE: sempre que a versão da app mudar, atualizar CACHE_NAME
// abaixo (mesmo número da versão) para forçar a renovação da cache.
// Os ficheiros da app só são atualizados nos utilizadores quando
// CACHE_NAME muda. Ficheiro novo na app → acrescentar a PRECACHE.
// ══════════════════════════════════════════
const CACHE_NAME = 'chazak-cache-v5.8.0';

// Todos os ficheiros da app. São guardados juntos, da mesma versão,
// para nunca misturar um index.html antigo com JS/CSS novos (ou vice-versa).
const PRECACHE = [
  './index.html',
  './css/style.css',
  './js/core.js',
  './js/mocidade.js',
  './js/palavras.js',
  './js/agenda.js',
  './js/biblia.js',
  './js/gist.js',
  './js/nuvem.js',
  './js/dados.js',
  './js/navegacao.js',
  './js/boot.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];
const PRECACHE_URLS = new Set(PRECACHE.map((p) => new URL(p, self.location).href));

// ── INSTALL: pré-cacheia TODOS os ficheiros da versão ──
// addAll é tudo-ou-nada: se um ficheiro falhar, a instalação falha e a
// versão anterior continua inteira. cache:'reload' ignora a cache HTTP do
// navegador, para não guardar uma cópia antiga de algum ficheiro.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE.map((p) => new Request(p, { cache: 'reload' })))
    )
  );
});

// ── ACTIVATE: remove caches de versões antigas ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

function semLigacao() {
  return new Response(
    'Sem ligação e sem cópia guardada para este recurso.',
    { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
}

// ── FETCH ──
// • Ficheiros da app (PRECACHE) e navegação → só da cache desta versão,
//   sem atualização em segundo plano (evita misturar versões).
// • Outros pedidos do mesmo domínio → rede primeiro, cache como reserva.
// Nunca intercepta pedidos a outros domínios (GitHub API do Gist,
// Supabase, Google Fonts, etc.) — esses vão sempre direto à rede.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;               // não intercepta POST/PATCH (ex: Gist API)

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // não intercepta pedidos externos

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // "./" e "./index.html" (com ou sem ?query) são a mesma página
      const path = url.origin + url.pathname;
      const key = path.endsWith('/') ? new URL('./index.html', self.location).href : path;
      if (PRECACHE_URLS.has(key)) {
        const cached = await cache.match(key);
        if (cached) return cached;
        // Cache ainda não pronta (1ª visita) — vai à rede
        return fetch(req).catch(() => semLigacao());
      }

      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (e) {
        return (await cache.match(req)) || semLigacao();
      }
    })
  );
});
