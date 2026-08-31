// ══════════════════════════════════════════
// Chazak — Service Worker (FASE 2 — PWA Offline)
// IMPORTANTE: sempre que a versão da app mudar, atualizar CACHE_NAME
// abaixo (mesmo número da versão) para forçar a renovação da cache.
// ══════════════════════════════════════════
const CACHE_NAME = 'chazak-cache-v5.6.0';

// ── INSTALL: tenta pré-cachear a página principal ──
// (agnóstico ao nome exato do ficheiro — funciona quer se chame
// chazak.html, index.html, ou qualquer outro)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled([
        cache.add(self.registration.scope),
        cache.add('./'),
      ]);
    })
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

// ── FETCH: cache-first com atualização em segundo plano ──
// Nunca intercepta pedidos a outros domínios (GitHub API do Gist,
// Google Fonts, etc.) — esses vão sempre direto à rede, preservando
// o comportamento da Fase 1 (Backup Gist) sem qualquer alteração.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;               // não intercepta POST/PATCH (ex: Gist API)

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // não intercepta pedidos externos

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);

      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      if (cached) {
        // Serve imediatamente do cache; atualiza em segundo plano se houver rede
        event.waitUntil(networkFetch);
        return cached;
      }

      // Sem cache ainda — espera a rede
      const fresh = await networkFetch;
      return fresh || new Response(
        'Sem ligação e sem cópia guardada para este recurso.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    })
  );
});
