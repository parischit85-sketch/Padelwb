// Service Worker per Play-Sport.pro PWA
const CACHE_NAME = 'play-sport-pro-v1.0.0';
const urlsToCache = [
  '/',
  '/src/main.jsx',
  '/play-sport-pro_horizontal.svg',
  '/play-sport-pro_icon_only.svg',
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

// ============================================
// PUSH NOTIFICATIONS
// ============================================

// Gestione ricezione push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('[SW] Push data parsing error:', error);
    data = { title: 'Play-Sport.pro', body: 'Nuova notifica disponibile!' };
  }

  const options = {
    title: data.title || 'Play-Sport.pro',
    body: data.body || 'Hai una nuova notifica',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    image: data.image || '/logo.png',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      ...data.data
    },
    actions: [
      {
        action: 'open',
        title: 'Apri App',
        icon: '/icons/icon.svg'
      },
      {
        action: 'dismiss', 
        title: 'Ignora',
        icon: '/icons/icon.svg'
      }
    ],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
      .then(() => console.log('[SW] Notification displayed'))
      .catch(error => console.error('[SW] Notification display failed:', error))
  );
});

// Gestione click su notifica
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  notification.close();

  if (action === 'dismiss') {
    console.log('[SW] Notification dismissed');
    return;
  }

  // Apri/Focus app
  const urlToOpen = action === 'open' || !action ? (data.url || '/') : '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // Cerca una finestra già aperta
        for (const client of clients) {
          if (client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
            console.log('[SW] Focusing existing window');
            return client.focus();
          }
        }
        
        // Apri nuova finestra
        if (clients.openWindow) {
          console.log('[SW] Opening new window:', urlToOpen);
          return clients.openWindow(urlToOpen);
        }
      })
      .catch(error => console.error('[SW] Notification click handling failed:', error))
  );
});

// Gestione chiusura notifica
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  // Analytics tracking opzionale
  // gtag('event', 'notification_closed', {
  //   notification_tag: event.notification.tag
  // });
});
