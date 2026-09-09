import { apiClient } from "./client"
import type { Category } from "@/types"

export async function getCategories(type?: "EXPERIENCE" | "SPACE"): Promise<Category[]> {
	const { data } = await apiClient.get<Category[]>("/admin/categories", { params: type ? { type } : undefined })
	return data
}

export async function createCategory(payload: { name: string; description?: string }): Promise<Category> {
	const { data } = await apiClient.post<Category>("/admin/categories", payload)
	return data
}

export async function updateCategory(
	id: string,
	payload: { name?: string; description?: string; isActive?: boolean },
): Promise<Category> {
	const { data } = await apiClient.patch<Category>(`/admin/categories/${id}`, payload)
	return data
}
