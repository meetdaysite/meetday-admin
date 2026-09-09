import { apiClient } from "./client"
import type {
	ApprovalStatus,
	SpaceCommunityProfileDetail,
	SpaceCommunityProfilesListResponse,
	CreateSpaceCommunityProfilePayload,
	EligibleSpacePartnersListResponse,
} from "@/types"

export async function getPendingSpaceCommunityProfiles(
	params?: { page?: number; limit?: number },
): Promise<SpaceCommunityProfilesListResponse> {
	const { data } = await apiClient.get<SpaceCommunityProfilesListResponse>("/admin/space-community-profiles/pending", {
		params,
	})
	return data
}

export async function getSpaceCommunityProfiles(
	params?: { status?: ApprovalStatus; page?: number; limit?: number },
): Promise<SpaceCommunityProfilesListResponse> {
	const { data } = await apiClient.get<SpaceCommunityProfilesListResponse>("/admin/space-community-profiles", { params })
	return data
}

export async function getSpaceCommunityProfileById(id: string): Promise<SpaceCommunityProfileDetail> {
	const { data } = await apiClient.get<SpaceCommunityProfileDetail>(`/admin/space-community-profiles/${id}`)
	return data
}

export async function approveSpaceCommunityProfile(id: string): Promise<void> {
	await apiClient.post(`/admin/space-community-profiles/${id}/approve`)
}

export async function rejectSpaceCommunityProfile(id: string, remark: string): Promise<void> {
	await apiClient.post(`/admin/space-community-profiles/${id}/reject`, { remark })
}

export async function getPendingSpaceCommunityProfileRevisions(
	params?: { page?: number; limit?: number },
): Promise<SpaceCommunityProfilesListResponse> {
	const { data } = await apiClient.get<SpaceCommunityProfilesListResponse>("/admin/space-community-profiles/revisions/pending", {
		params,
	})
	return data
}

export async function approveSpaceCommunityProfileRevision(id: string): Promise<void> {
	await apiClient.post(`/admin/space-community-profiles/${id}/revision/approve`)
}

export async function rejectSpaceCommunityProfileRevision(id: string, remark: string): Promise<void> {
	await apiClient.post(`/admin/space-community-profiles/${id}/revision/reject`, { remark })
}

export async function getEligibleSpacePartners(
	params?: { search?: string; page?: number; limit?: number },
): Promise<EligibleSpacePartnersListResponse> {
	const { data } = await apiClient.get<EligibleSpacePartnersListResponse>("/admin/space-community-profiles/eligible-space-partners", {
		params,
	})
	return data
}

export async function createSpaceCommunityProfile(
	payload: CreateSpaceCommunityProfilePayload,
): Promise<SpaceCommunityProfileDetail> {
	const { data } = await apiClient.post<SpaceCommunityProfileDetail>("/admin/space-community-profiles", payload)
	return data
}

export async function updateSpaceCommunityProfile(
	id: string,
	payload: Partial<Omit<CreateSpaceCommunityProfilePayload, "spaceProfileId">> & { posterKey?: string; isHidden?: boolean },
): Promise<SpaceCommunityProfileDetail> {
	const { data } = await apiClient.patch<SpaceCommunityProfileDetail>(`/admin/space-community-profiles/${id}`, payload)
	return data
}

export async function setSpaceCommunityProfileVisibility(id: string, isHidden: boolean): Promise<SpaceCommunityProfileDetail> {
	const { data } = await apiClient.patch<SpaceCommunityProfileDetail>(`/admin/space-community-profiles/${id}/visibility`, { isHidden })
	return data
}
