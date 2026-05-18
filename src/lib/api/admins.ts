import { apiClient } from "./client"
import type { Admin, Role } from "@/types"

export type InviteAdminPayload = {
	email: string
	firstName: string
	lastName: string
	roleId: string
	managedCities?: string[]
}

export async function inviteAdmin(payload: InviteAdminPayload): Promise<{ message: string }> {
	const { data } = await apiClient.post<{ message: string }>("/admin/invite", payload)
	return data
}

export type GetAdminsParams = {
	role?: Exclude<Role, "SUPER_ADMIN">
	isActive?: boolean
	page?: number
	limit?: number
}

export type AdminsListResponse = {
	admins: Admin[]
	total: number
	page: number
	limit: number
}

export async function getAdmins(params?: GetAdminsParams): Promise<AdminsListResponse> {
	const { data } = await apiClient.get<AdminsListResponse>("/admin/admins", { params })
	return data
}

export async function deactivateAdmin(id: string): Promise<void> {
	await apiClient.patch(`/admin/admins/${id}/deactivate`)
}

export async function reactivateAdmin(id: string): Promise<void> {
	await apiClient.patch(`/admin/admins/${id}/reactivate`)
}
