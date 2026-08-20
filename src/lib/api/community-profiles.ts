import { apiClient } from "./client"
import type {
	ApprovalStatus,
	CommunityProfileDetail,
	CommunityProfilesListResponse,
	CreateCommunityProfilePayload,
	EligibleHostsListResponse,
} from "@/types"

export async function getPendingCommunityProfiles(
	params?: { page?: number; limit?: number },
): Promise<CommunityProfilesListResponse> {
	const { data } = await apiClient.get<CommunityProfilesListResponse>("/admin/community-profiles/pending", {
		params,
	})
	return data
}

export async function getCommunityProfiles(
	params?: { status?: ApprovalStatus; page?: number; limit?: number },
): Promise<CommunityProfilesListResponse> {
	const { data } = await apiClient.get<CommunityProfilesListResponse>("/admin/community-profiles", { params })
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

export async function getPendingCommunityProfileRevisions(
	params?: { page?: number; limit?: number },
): Promise<CommunityProfilesListResponse> {
	const { data } = await apiClient.get<CommunityProfilesListResponse>("/admin/community-profiles/revisions/pending", {
		params,
	})
	return data
}

export async function approveCommunityProfileRevision(id: string): Promise<void> {
	await apiClient.post(`/admin/community-profiles/${id}/revision/approve`)
}

export async function rejectCommunityProfileRevision(id: string, remark: string): Promise<void> {
	await apiClient.post(`/admin/community-profiles/${id}/revision/reject`, { remark })
}

export async function getEligibleHosts(
	params?: { search?: string; page?: number; limit?: number },
): Promise<EligibleHostsListResponse> {
	const { data } = await apiClient.get<EligibleHostsListResponse>("/admin/community-profiles/eligible-hosts", {
		params,
	})
	return data
}

export async function createCommunityProfile(
	payload: CreateCommunityProfilePayload,
): Promise<CommunityProfileDetail> {
	const { data } = await apiClient.post<CommunityProfileDetail>("/admin/community-profiles", payload)
	return data
}

export async function updateCommunityProfile(
	id: string,
	payload: Partial<Omit<CreateCommunityProfilePayload, "hostProfileId">> & { secondaryImageKey?: string; isHidden?: boolean },
): Promise<CommunityProfileDetail> {
	const { data } = await apiClient.patch<CommunityProfileDetail>(`/admin/community-profiles/${id}`, payload)
	return data
}

export async function setCommunityProfileVisibility(id: string, isHidden: boolean): Promise<CommunityProfileDetail> {
	const { data } = await apiClient.patch<CommunityProfileDetail>(`/admin/community-profiles/${id}/visibility`, { isHidden })
	return data
}
