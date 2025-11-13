// WIA Neural Code Reader Service Worker
// 버전: 1.0.0
// 100년 후에도 존재할 수 있는 코드

const CACHE_NAME = 'wia-neural-v1.0.0';
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
  '/assets/css/wia-reader.css',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install 이벤트 - 캐시 생성
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache.filter(url => {
          // 존재하는 파일만 캐시
          return fetch(url, { method: 'HEAD' })
            .then(() => true)
            .catch(() => false);
        }));
      })
      .catch(err => {
        console.error('[ServiceWorker] Cache failed:', err);
      })
  );
  
  // 즉시 활성화
  self.skipWaiting();
});

// Activate 이벤트 - 이전 캐시 정리
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // 즉시 제어 획득
  return self.clients.claim();
});

// Fetch 이벤트 - 캐시 우선 전략
self.addEventListener('fetch', event => {
  // POST 요청은 캐시하지 않음
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // 캐시에서 발견
          console.log('[ServiceWorker] From cache:', event.request.url);
          return response;
        }
        
        // 네트워크에서 가져오기
        console.log('[ServiceWorker] Fetching:', event.request.url);
        
        return fetch(event.request).then(response => {
          // 유효한 응답만 캐시
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // 응답 복제 (캐시용)
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // 오프라인 페이지 제공
        console.log('[ServiceWorker] Offline mode');
        
        // HTML 요청인 경우 오프라인 페이지
        if (event.request.destination === 'document') {
          return caches.match('/wia-reader.html');
        }
        
        // 이미지 요청인 경우 기본 아이콘
        if (event.request.destination === 'image') {
          return caches.match('/icons/icon-192x192.png');
        }
      })
  );
});

// 백그라운드 동기화
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  
  if (event.tag === 'sync-wia-data') {
    event.waitUntil(syncData());
  }
});

// 푸시 알림
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'WIA Neural Code 알림',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('WIA Neural Code', options)
  );
});

// 데이터 동기화 함수
async function syncData() {
  console.log('[ServiceWorker] Syncing data...');
  // 실제 동기화 로직 구현
  return true;
}

// 캐시 크기 관리
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
}

console.log('[ServiceWorker] Loaded successfully');
