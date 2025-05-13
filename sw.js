// sw.js
const CACHE_NAME = 'hesap-makinesi-pwa-v1.1'; // Önbellek adını her güncellemede değiştirin (v1.1, v1.2 vb.)
const PRECACHE_ASSETS = [
  './', // Uygulamanın kök dizini (genellikle index.html'e yönlendirir)
  './index.html', // ANA HTML DOSYANIZIN ADI BURAYA! Eğer farklıysa güncelleyin.
  // İkonları da önbelleğe almak iyi bir fikirdir.
  // Tarayıcının hangisini seçeceğini bilemeyiz, bu yüzden en sık kullanılanları veya hepsini ekleyebilirsiniz.
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
  // Eğer CSS veya diğer JavaScript dosyalarınız ayrı ise onları da buraya ekleyin:
  // './css/style.css',
  // './js/another-script.js'
];

// Yükleme (install) olayı: Önbelleğe alınacak varlıkları ekler
self.addEventListener('install', event => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting on install');
        return self.skipWaiting(); // Yeni service worker'ın hemen aktif olmasını sağlar
      })
      .catch(error => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

// Etkinleştirme (activate) olayı: Eski önbellekleri temizler
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim(); // Kontrolü hemen ele alır
    })
  );
});

// Getirme (fetch) olayı: İstekleri yakalar ve önbellekten sunar (Cache-first stratejisi)
self.addEventListener('fetch', event => {
  // Sadece GET isteklerini ve http/https şemalarını önbelleğe alalım
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // console.log('[Service Worker] Returning response from cache:', event.request.url);
          return cachedResponse;
        }
        // console.log('[Service Worker] Fetching response from network:', event.request.url);
        return fetch(event.request).then(networkResponse => {
          // İsteğe bağlı: Ağa yapılan istekleri de dinamik olarak önbelleğe alabilirsiniz
          // Ancak bu, önbelleğin gereksiz yere büyümesine neden olabilir.
          // Özellikle sadece uygulama kabuğunu (app shell) önbelleğe almak istiyorsanız bu kısmı atlayın.
          /*
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          */
          return networkResponse;
        }).catch(error => {
          console.error('[Service Worker] Fetch failed; returning offline page instead.', error);
          // İsteğe bağlı: Genel bir çevrimdışı sayfası döndürebilirsiniz.
          // return caches.match('./offline.html');
        });
      })
  );
});