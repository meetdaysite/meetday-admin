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
