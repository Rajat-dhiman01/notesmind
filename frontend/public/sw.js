// frontend/public/sw.js

const CACHE_NAME = 'notesmind-v1'

self.addEventListener('install', event => {
  // No pre-caching on install — avoids fetch errors in dev
  // Production assets get cached on first visit via the fetch handler below
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  // Delete old caches from previous versions
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept API calls — always go to network
  if (url.hostname.includes('railway.app') || url.pathname.startsWith('/auth')) {
    return
  }

  // Never intercept PostHog analytics
  if (url.hostname.includes('posthog.com')) {
    return
  }

  // Network first for navigation (HTML pages) — fall back to cache if offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // Cache first for static assets — JS, CSS, images
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        // Only cache successful same-origin responses
        if (response && response.status === 200 && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
    })
  )
})