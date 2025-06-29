// MTG Scanner Pro - Simplified Service Worker for Alpha Testing
// Focuses on PWA install capability without complex caching

const CACHE_NAME = 'mtg-scanner-alpha-v1.0.0';

// Install event - minimal setup
self.addEventListener('install', event => {
    console.log('🚀 MTG Scanner Pro SW: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 MTG Scanner Pro SW: Basic cache created');
                // Only cache essential files that definitely exist
                return cache.addAll([
                    '/manifest.json'
                ]).catch(error => {
                    console.log('⚠️ MTG Scanner Pro SW: Some files not cached (normal in dev)');
                });
            })
            .then(() => {
                console.log('✅ MTG Scanner Pro SW: Installation complete');
                return self.skipWaiting(); // Activate immediately
            })
    );
});

// Activate event - clean up
self.addEventListener('activate', event => {
    console.log('⚡ MTG Scanner Pro SW: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ MTG Scanner Pro SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ MTG Scanner Pro SW: Activated and ready!');
                return self.clients.claim();
            })
    );
});

// Fetch event - minimal interference for development
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip webpack dev server requests
    if (url.pathname.includes('webpack') || 
        url.pathname.includes('hot-update') ||
        url.pathname.includes('sockjs-node')) {
        return;
    }
    
    // Skip external APIs - always fetch fresh
    if (url.hostname.includes('googleapis.com') || 
        url.hostname.includes('scryfall.com') ||
        url.hostname.includes('cdnjs.cloudflare.com')) {
        return;
    }
    
    // For manifest.json, try cache first, then network
    if (url.pathname === '/manifest.json') {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(request)
                        .then(response => {
                            if (response && response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(request, responseClone));
                            }
                            return response;
                        });
                })
                .catch(() => {
                    console.log('📄 MTG Scanner Pro SW: Manifest fetch failed');
                    return new Response('{}', {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }
    
    // For all other requests during development, just pass through
    // This prevents interference with webpack dev server
    event.respondWith(
        fetch(request).catch(error => {
            console.log('🔄 MTG Scanner Pro SW: Network request failed for:', url.pathname);
            // Return a proper error response instead of undefined
            return new Response('Service temporarily unavailable', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
            });
        })
    );
});

// Message handling for app communication
self.addEventListener('message', event => {
    const { data } = event;
    
    switch (data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({
                version: CACHE_NAME,
                status: 'active',
                mode: 'alpha'
            });
            break;
            
        case 'CLEAR_CACHE':
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }).then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
            
        default:
            console.log('📨 MTG Scanner Pro SW: Message received:', data.type);
    }
});

// Error handling
self.addEventListener('error', event => {
    console.error('❌ MTG Scanner Pro SW: Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('❌ MTG Scanner Pro SW: Unhandled rejection:', event.reason);
    event.preventDefault();
});

console.log('🎯 MTG Scanner Pro Service Worker (Alpha) loaded successfully!');