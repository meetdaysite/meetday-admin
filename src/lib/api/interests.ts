import { apiClient } from "./client"
import type { Interest, InterestDetail } from "@/types"

export async function getInterests(): Promise<Interest[]> {
	const { data } = await apiClient.get<Interest[]>("/admin/interests")
	return data
}

export async function getInterestById(id: string): Promise<InterestDetail> {
	const { data } = await apiClient.get<InterestDetail>(`/admin/interests/${id}`)
	return data
}

export async function createInterest(payload: {
	name: string
	description?: string
	image?: string
}): Promise<Interest> {
	const { data } = await apiClient.post<Interest>("/admin/interests", payload)
	return data
}

export async function updateInterest(
	id: string,
	payload: { name?: string; description?: string; image?: string },
): Promise<Interest> {
	const { data } = await apiClient.patch<Interest>(`/admin/interests/${id}`, payload)
	return data
}

export async function replaceInterestCategories(
	id: string,
	categoryIds: string[],
): Promise<InterestDetail> {
	const { data } = await apiClient.put<InterestDetail>(`/admin/interests/${id}/categories`, { categoryIds })
	return data
}
