/**
 * 🔧 WIA Neural Code Reader - Service Worker
 *
 * **"오프라인 우선 - 인터넷 없이도 작동"**
 *
 * 기능:
 * - 오프라인 캐싱
 * - 즉시 업데이트
 * - 백그라운드 동기화
 *
 * @version 1.0.0
 */

const CACHE_NAME = 'wia-reader-v1.0.0';

const urlsToCache = [
    '/wia-reader.html',
    '/assets/js/wia-data-types.js',
    '/assets/js/wia-engine-BEAUTIFUL-QR.js',
    '/assets/js/wia-engine-100KB.js',
    '/assets/js/wia-neural-decoder.js',
    '/assets/js/wia-neural-decoder-100KB.js',
    '/assets/js/wia-reed-solomon.js',
    '/assets/js/wia-multi-format.js',
    '/assets/js/wia-human-proof.js',
    '/assets/js/wia-accessibility.js',
    '/assets/js/wia-emergency.js',
    '/assets/js/wia-privacy.js'
];

// 설치
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: 설치 중...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 캐시 저장 중...');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ Service Worker: 설치 완료');
                return self.skipWaiting();  // 즉시 활성화
            })
    );
});

// 활성화
self.addEventListener('activate', (event) => {
    console.log('🔧 Service Worker: 활성화 중...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ 이전 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker: 활성화 완료');
            return self.clients.claim();  // 즉시 제어
        })
    );
});

// Fetch (오프라인 우선 전략)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에 있으면 캐시에서 반환
                if (response) {
                    console.log('📦 캐시에서 로드:', event.request.url);
                    return response;
                }

                // 없으면 네트워크에서 가져오기
                console.log('🌐 네트워크에서 로드:', event.request.url);

                return fetch(event.request).then((response) => {
                    // 캐시에 저장 (동적 캐싱)
                    if (!response || response.status !== 200 || response.type === 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            }).catch(() => {
                // 오프라인이고 캐시에도 없을 때
                console.log('❌ 오프라인 - 캐시 없음:', event.request.url);

                // 기본 응답 (선택사항)
                return new Response('오프라인 상태입니다.', {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            })
    );
});

// 메시지 수신
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('🔧 Service Worker 로드 완료');
console.log('  - 캐시 버전:', CACHE_NAME);
console.log('  - 오프라인 우선 전략');
console.log('  - 즉시 업데이트');
