import { apiClient } from "./client"
import type { RoleDefinition } from "@/types"

export async function fetchAdminRoles(): Promise<RoleDefinition[]> {
	const { data } = await apiClient.get<RoleDefinition[]>("/admin/roles", {
		params: { adminOnly: true },
	})
	return data
}
