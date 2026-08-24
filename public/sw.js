// Minimal service worker — exists to satisfy PWA installability criteria.
// Intentionally does NOT cache API responses or app data: this is an admin
// dashboard, staleness would be actively harmful. Only static, versioned
// assets are cached; everything else always goes to the network.
const STATIC_CACHE = "meetday-admin-static-v1"
const STATIC_ASSET_PATTERN = /\/_next\/static\/|\/icons\/|\.(?:png|svg|ico)$/

self.addEventListener("install", (event) => {
	self.skipWaiting()
})

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))),
		),
	)
	self.clients.claim()
})

self.addEventListener("fetch", (event) => {
	const { request } = event
	if (request.method !== "GET" || !STATIC_ASSET_PATTERN.test(new URL(request.url).pathname)) {
		return // let the browser handle everything else (pages, API calls) normally
	}

	event.respondWith(
		caches.open(STATIC_CACHE).then(async (cache) => {
			const cached = await cache.match(request)
			if (cached) return cached
			const response = await fetch(request)
			if (response.ok) cache.put(request, response.clone())
			return response
		}),
	)
})
