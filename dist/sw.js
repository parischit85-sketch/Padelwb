// Service Worker per Paris League PWA
const CACHE_NAME = 'paris-league-v1.1.0';
const urlsToCache = [
  '/',
  '/src/main.jsx',
  '/logo.png',
  '/favicon.ico',
  '/manifest.json',
  // Aggiungi altre risorse critiche qui
];

// Installazione del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
});

// Attivazione del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercettazione delle richieste di rete
self.addEventListener('fetch', (event) => {
  // Solo per richieste GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se è in cache, restituisci la versione cached
        if (response) {
          return response;
        }

        // Altrimenti, fetch dalla rete
        return fetch(event.request)
          .then((response) => {
            // Verifica se la risposta è valida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona la risposta per la cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            // Ritorna una pagina offline personalizzata se disponibile
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Gestione dei messaggi dall'app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notifica quando la PWA può essere installata
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('[SW] PWA installation prompt ready');
  event.preventDefault();
});

// Gestione degli aggiornamenti dell'app
self.addEventListener('controllerchange', () => {
  console.log('[SW] New service worker activated');
  window.location.reload();
});
