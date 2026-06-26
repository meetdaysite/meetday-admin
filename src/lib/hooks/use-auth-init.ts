"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth.store"
import { apiClient } from "@/lib/api/client"
import { setAuthToken } from "@/lib/api/client"
import type { Role } from "@/types"

type MeResponse = {
	id: string
	email: string
	firstName: string
	lastName: string
	role: { name: Role }
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

		// Always restore the axios default header on reload (in-memory state is
		// cleared on every page load; Firebase currentUser restores async so we
		// can't rely solely on the request interceptor for the first requests).
		setAuthToken(token)

		if (user) {
			// Full state already hydrated from persistence.
			setInitialized()
			return
		}

		// Token was persisted but user context was lost (e.g. page reload with
		// old localStorage format). Restore session by calling /auth/me.
		apiClient
			.get<MeResponse>("/auth/me")
			.then(({ data }) => setAuth(
				{ id: data.id, name: `${data.firstName} ${data.lastName}`, email: data.email },
				data.role?.name,
				token,
				data.cityScope,
			))
			.catch(() => clearAuth())
			.finally(() => setInitialized())
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token])
}
