import { useAuthStore } from "@/stores/auth.store"
import type { Permission } from "@/types"

export function usePermission(permission: Permission): boolean {
	return useAuthStore(s => s.hasPermission(permission))
}
