import { apiClient } from "./client"
import type { SponsorshipDetail, SponsorshipsListResponse, SponsorshipStatus } from "@/types"

export type GetSponsorshipsParams = {
	status?: SponsorshipStatus
	city?: string
	hostProfileId?: string
	page?: number
	limit?: number
}

export async function getPendingSponsorships(
	params?: { page?: number; limit?: number },
): Promise<SponsorshipsListResponse> {
	const { data } = await apiClient.get<SponsorshipsListResponse>("/admin/sponsorships/pending", {
		params,
	})
	return data
}

export async function getSponsorships(
	params?: GetSponsorshipsParams,
): Promise<SponsorshipsListResponse> {
	const { data } = await apiClient.get<SponsorshipsListResponse>("/admin/sponsorships", { params })
	return data
}

export async function getSponsorshipById(id: string): Promise<SponsorshipDetail> {
	const { data } = await apiClient.get<SponsorshipDetail>(`/admin/sponsorships/${id}`)
	return data
}

export async function approveSponsorship(id: string): Promise<void> {
	await apiClient.post(`/admin/sponsorships/${id}/approve`)
}

export async function rejectSponsorship(id: string, remark: string): Promise<void> {
	await apiClient.post(`/admin/sponsorships/${id}/reject`, { remark })
}

export type GetPendingSponsorshipRevisionsParams = {
	page?: number
	limit?: number
}

export async function getPendingSponsorshipRevisions(
	params?: GetPendingSponsorshipRevisionsParams,
): Promise<SponsorshipsListResponse> {
	const { data } = await apiClient.get<SponsorshipsListResponse>(
		"/admin/sponsorships/revisions/pending",
		{ params },
	)
	return data
}

export async function approveSponsorshipRevision(id: string): Promise<void> {
	await apiClient.post(`/admin/sponsorships/${id}/revision/approve`)
}

export async function rejectSponsorshipRevision(id: string, remark: string): Promise<void> {
	await apiClient.post(`/admin/sponsorships/${id}/revision/reject`, { remark })
}
