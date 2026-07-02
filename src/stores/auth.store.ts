import type { Permission, Role } from "@/types";
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { signOut } from "firebase/auth"
import { setAuthToken } from "@/lib/api/client"
import { firebaseAuth } from "@/lib/firebase/config"

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
	SUPER_ADMIN: [
		"admin.invite",
		"host.invite",
		"host.approve",
		"event.approve",
		"coupon.create",
		"coupon.view",
		"moderation.read",
		"moderation.action",
		"category.manage",
		"interest.manage",
		"order.view",
		"audit.read",
		"community.manage",
		"support.view",
	],
	CITY_ADMIN: [
		"host.invite",
		"host.approve",
		"event.approve",
		"moderation.read",
		"moderation.action",
		"order.view",
		"audit.read",
		"community.manage",
		"support.view",
	],
	MODERATOR: ["moderation.read", "moderation.action", "order.view"],
	SUPPORT:   ["moderation.read", "order.view", "support.view"],
}

type AuthState = {
	user: { id: string; name: string; email: string } | null
	role: Role | null
	cityScope: string | null
	token: string | null
	isInitializing: boolean
	setAuth: (user: AuthState["user"], role: Role, token: string, cityScope?: string) => void
	clearAuth: () => void
	hasPermission: (permission: Permission) => boolean
	setInitialized: () => void
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			role: null,
			cityScope: null,
			token: null,
			isInitializing: true,
			setInitialized: () => set({ isInitializing: false }),
			setAuth: (user, role, token, cityScope = undefined) => {
				setAuthToken(token)
				set({ user, role, token, cityScope })
			},
			clearAuth: () => {
				setAuthToken(null)
				signOut(firebaseAuth)
				set({ user: null, role: null, token: null, cityScope: null })
			},
			hasPermission: permission => {
				const role = get().role
				if (!role) return false
				return ROLE_PERMISSIONS[role].includes(permission)
			},
		}),
		{
			name: "meetday-auth",
			skipHydration: true,
			partialize: (state) => ({ token: state.token, user: state.user, role: state.role, cityScope: state.cityScope }),
		},
	),
)
