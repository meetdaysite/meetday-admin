import { apiClient } from "./client"
import type { Host, HostDetail, ApprovalStatus, KycStatus, HostPlan } from "@/types"

export type GetHostsParams = {
	approvalStatus?: ApprovalStatus
	kycStatus?: KycStatus
	plan?: HostPlan
	city?: string
	page?: number
	limit?: number
}

export type HostsListResponse = {
	hosts: Host[]
	total: number
	page: number
	limit: number
}

export async function getHosts(params?: GetHostsParams): Promise<HostsListResponse> {
	const { data } = await apiClient.get<HostsListResponse>("/admin/hosts", { params })
	return data
}

export async function getHostById(id: string): Promise<HostDetail> {
	const { data } = await apiClient.get<HostDetail>(`/admin/hosts/${id}`)
	return data
}

export async function approveHost(id: string): Promise<void> {
	await apiClient.post(`/admin/hosts/${id}/approve`)
}

export async function rejectHost(id: string, rejectionReason: string): Promise<void> {
	await apiClient.post(`/admin/hosts/${id}/reject`, { rejectionReason })
}
