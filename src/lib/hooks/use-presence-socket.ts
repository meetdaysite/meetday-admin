"use client"

import { useEffect } from "react"
import { io, type Socket } from "socket.io-client"
import { onAuthStateChanged } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase/config"

function getOrigin(): string {
	const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
	return baseUrl.replace(/\/api(\/v\d+)?$/, "")
}

/**
 * Keeps a live socket connected to /notifications while the admin panel is open, so other
 * admins can see this account as "online" (the backend checks for a connected socket in this
 * user's room). No payload handling needed here — presence is just "is a socket connected".
 */
export function usePresenceSocket() {
	useEffect(() => {
		let cancelled = false
		let socket: Socket | null = null

		const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
			if (!user || socket || cancelled) return
			const token = await user.getIdToken()
			if (cancelled) return

			socket = io(`${getOrigin()}/notifications`, {
				auth: { token },
				transports: ["polling", "websocket"],
			})

			socket.on("disconnect", async (reason) => {
				// "io server disconnect" is the one reason Socket.IO won't auto-reconnect for —
				// everything else is retried automatically, with the token refreshed per attempt below.
				if (reason === "io server disconnect") {
					const freshToken = await firebaseAuth.currentUser?.getIdToken(true)
					if (freshToken && socket) {
						socket.auth = { token: freshToken }
						socket.connect()
					}
				}
			})

			socket.io.on("reconnect_attempt", async () => {
				const freshToken = await firebaseAuth.currentUser?.getIdToken(true)
				if (freshToken && socket) socket.auth = { token: freshToken }
			})
		})

		return () => {
			cancelled = true
			unsubscribe()
			socket?.disconnect()
		}
	}, [])
}
