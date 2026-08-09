import { apiClient } from "./client"
import type { CommunityProfileDetail, CommunityProfilesListResponse } from "@/types"

export async function getPendingCommunityProfiles(
	params?: { page?: number; limit?: number },
): Promise<CommunityProfilesListResponse> {
	const { data } = await apiClient.get<CommunityProfilesListResponse>("/admin/community-profiles/pending", {
		params,
	})
	return data
}

export async function getCommunityProfileById(id: string): Promise<CommunityProfileDetail> {
	const { data } = await apiClient.get<CommunityProfileDetail>(`/admin/community-profiles/${id}`)
	return data
}

export async function approveCommunityProfile(id: string): Promise<void> {
	await apiClient.post(`/admin/community-profiles/${id}/approve`)
}

export async function rejectCommunityProfile(id: string, remark: string): Promise<void> {
	await apiClient.post(`/admin/community-profiles/${id}/reject`, { remark })
}
