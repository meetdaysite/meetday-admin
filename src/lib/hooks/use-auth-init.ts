"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { onIdTokenChanged } from "firebase/auth"
import { useAuthStore } from "@/stores/auth.store"
import { apiClient } from "@/lib/api/client"
import { setAuthToken } from "@/lib/api/client"
import { firebaseAuth } from "@/lib/firebase/config"
import type { Role } from "@/types"

type MeResponse = {
	id: string
	email: string
	firstName: string
	lastName: string
	role: { name: Role }
	adminRole: Role | null
	cityScope?: string
}

const ADMIN_ROLES = ["SUPER_ADMIN", "CITY_ADMIN", "MODERATOR", "SUPPORT"] as const

export function useAuthInit() {
	const token = useAuthStore((s) => s.token)
	const user = useAuthStore((s) => s.user)
	const setAuth = useAuthStore((s) => s.setAuth)
	const clearAuth = useAuthStore((s) => s.clearAuth)
	const setInitialized = useAuthStore((s) => s.setInitialized)
	const router = useRouter()

	// Firebase revokes a user's refresh tokens when their password changes
	// (e.g. via the reset-password flow completed on another device/tab).
	// This fires once that revocation is detected on background token refresh,
	// letting us log the user out here instead of waiting for the next failed
	// API call.
	useEffect(() => {
		const unsubscribe = onIdTokenChanged(firebaseAuth, (firebaseUser) => {
			if (!firebaseUser && useAuthStore.getState().token) {
				clearAuth()
				router.replace("/login")
			}
		})
		return () => unsubscribe()
	}, [clearAuth, router])

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
			.then(({ data }) => {
				// A user primarily HOST/BRAND/USER can hold admin access as a secondary
				// grant (adminRole) instead of their primary role.
				const effectiveRole = (ADMIN_ROLES as readonly string[]).includes(data.role?.name)
					? data.role.name
					: data.adminRole
				if (!effectiveRole) throw new Error("No admin access")
				setAuth(
					{ id: data.id, name: `${data.firstName} ${data.lastName}`, email: data.email },
					effectiveRole,
					token,
					data.cityScope,
				)
			})
			.catch(() => clearAuth())
			.finally(() => setInitialized())
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token])
}
