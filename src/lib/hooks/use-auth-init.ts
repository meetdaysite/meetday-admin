"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth.store"
import { apiClient } from "@/lib/api/client"
import { setAuthToken } from "@/lib/api/client"
import type { Role } from "@/types"

type MeResponse = {
	user: { id: string; name: string; email: string }
	role: Role
	cityScope?: string
}

export function useAuthInit() {
	const token = useAuthStore((s) => s.token)
	const user = useAuthStore((s) => s.user)
	const setAuth = useAuthStore((s) => s.setAuth)
	const clearAuth = useAuthStore((s) => s.clearAuth)
	const setInitialized = useAuthStore((s) => s.setInitialized)

	useEffect(() => {
		if (!token) return

		if (user) {
			// Full state already hydrated from persistence.
			setInitialized()
			return
		}

		// Token was persisted but user context was lost (e.g. page reload).
		// Restore session by calling /auth/me with the stored token.
		setAuthToken(token)
		apiClient
			.get<MeResponse>("/auth/me")
			.then(({ data }) => setAuth(data.user, data.role, token, data.cityScope))
			.catch(() => clearAuth())
			.finally(() => setInitialized())
	}, [token])
}
