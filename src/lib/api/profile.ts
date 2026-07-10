import { apiClient } from "./client"
import type { Role } from "@/types"

export type AdminProfile = {
	id: string
	firstName: string
	lastName: string
	email: string
	phone: string | null
	avatarUrl: string | null
	isActive: boolean
	role: { name: Role }
	createdAt: string
	updatedAt: string
}

export async function getAdminProfile(): Promise<AdminProfile> {
	const { data } = await apiClient.get<AdminProfile>("/admin/me")
	return data
}

export type UpdateAdminProfilePayload = Partial<{
	avatarKey: string
	phone: string
	firstName: string
	lastName: string
}>

export async function updateAdminProfile(payload: UpdateAdminProfilePayload): Promise<AdminProfile> {
	const { data } = await apiClient.patch<AdminProfile>("/admin/me", payload)
	return data
}
