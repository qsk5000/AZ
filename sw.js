const CACHE_NAME = 'mizaniq-v2';
const ASSETS = [
  '/Mizanapp/',
  '/Mizanapp/index.html',
  '/Mizanapp/manifest.json',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@300;400;500;700&display=swap'
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching assets...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // الروابط الخارجية تفتح بشكل طبيعي
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests (Single Page App logic)
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => {
        return caches.match('/Mizanapp/index.html');
      })
    );
    return;
  }

  // باقي الطلبات (CSS, JS, Images) -> Cache First Strategy
  e.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(networkResponse => {
        // التحقق من صحة الاستجابة قبل تخزينها
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // إذا فشلت الشبكة وكان الطلب لصورة مثلاً، يمكنك إرجاع صورة افتراضية هنا
        if (request.destination === 'document') {
          return caches.match('/Mizanapp/index.html');
        }
      });
    })
  );
});
