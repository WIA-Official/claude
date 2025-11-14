// WIA Neural Code Reader Service Worker v1.1.0
// 100년 후에도 존재할 수 있는 코드

const CACHE_NAME = 'wia-neural-v1.1.0';
const urlsToCache = [
  '/',
  '/wia-reader.html',
  '/manifest.json',
  '/assets/js/wia-multi-format.js',
  '/assets/js/wia-reed-solomon.js',
  '/assets/js/wia-human-proof.js',
  '/assets/js/wia-accessibility.js',
  '/assets/js/wia-emergency.js',
  '/assets/js/wia-privacy.js',
  '/assets/js/wia-neural-decoder.js',
  '/assets/js/wia-data-types.js',
  '/assets/js/wia-engine-BEAUTIFUL-QR.js',
  '/assets/js/wia-engine-100KB.js',
  '/assets/js/wia-neural-decoder-100KB.js',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install 이벤트
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        
        // 각 URL을 개별적으로 시도
        const cachePromises = urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`[ServiceWorker] Failed to cache ${url}:`, err);
            return Promise.resolve(); // 실패해도 계속 진행
          });
        });
        
        return Promise.all(cachePromises);
      })
  );
  
  self.skipWaiting();
});

// Activate 이벤트
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('wia-')) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch 이벤트
self.addEventListener('fetch', event => {
  // chrome-extension:// 스킴은 무시
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // DevTools 관련 요청 무시
  if (event.request.url.includes('chrome-devtools://')) {
    return;
  }
  
  // POST 요청은 캐시하지 않음
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          // 유효한 응답만 캐시
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // chrome-extension 스킴이 아닌 경우만 캐시
          if (!event.request.url.startsWith('chrome-extension://')) {
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          
          return response;
        });
      })
      .catch(() => {
        // 오프라인 폴백
        if (event.request.destination === 'document') {
          return caches.match('/wia-reader.html');
        }
      })
  );
});

console.log('[ServiceWorker] Loaded successfully v1.1.0');
