"use client"

import { useEffect } from "react"

// Registers the PWA service worker — split into its own client component so
// the root layout can stay a server component.
export function ServiceWorkerRegistration() {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js").catch(() => {
				// Non-fatal — the app works fine without it, just not installable/offline-cached.
			})
		}
	}, [])

	return null
}
