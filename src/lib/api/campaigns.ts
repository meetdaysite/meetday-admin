import { apiClient } from "./client"
import type { Campaign, CampaignsListResponse, CampaignStatus } from "@/types"

export type GetCampaignsParams = {
	status?: CampaignStatus
	city?: string
	brandProfileId?: string
	page?: number
	limit?: number
}

export async function getPendingCampaigns(
	params?: { page?: number; limit?: number },
): Promise<CampaignsListResponse> {
	const { data } = await apiClient.get<CampaignsListResponse>("/admin/campaigns/pending", {
		params,
	})
	return data
}

export async function getCampaigns(
	params?: GetCampaignsParams,
): Promise<CampaignsListResponse> {
	const { data } = await apiClient.get<CampaignsListResponse>("/admin/campaigns", { params })
	return data
}

export async function getCampaignById(id: string): Promise<Campaign> {
	const { data } = await apiClient.get<Campaign>(`/admin/campaigns/${id}`)
	return data
}

export async function approveCampaign(id: string): Promise<void> {
	await apiClient.post(`/admin/campaigns/${id}/approve`)
}

export async function rejectCampaign(id: string, remark: string): Promise<void> {
	await apiClient.post(`/admin/campaigns/${id}/reject`, { remark })
}
