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

export async function getPendingHosts(params?: GetHostsParams): Promise<HostsListResponse> {
	const { data } = await apiClient.get<HostsListResponse>("/admin/hosts/pending", { params })
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

export async function suspendHost(id: string, reason: string): Promise<void> {
	await apiClient.post(`/admin/hosts/${id}/suspend`, { reason })
}

export async function restoreHost(id: string): Promise<void> {
	await apiClient.post(`/admin/hosts/${id}/restore`)
}

export type InviteHostPayload = {
	name: string
	email: string
	phone?: string
	city: string
}

export async function inviteHost(payload: InviteHostPayload): Promise<void> {
	await apiClient.post("/admin/hosts/invite", payload)
}

export type BulkInviteHostsPayload = {
	hosts: { name: string; email: string; phone: string; city: string }[]
}

export type BulkInviteHostsResult = {
	sent: number
	failed: { email: string; reason: string }[]
}

export async function inviteHostsBulk(payload: BulkInviteHostsPayload): Promise<BulkInviteHostsResult> {
	const { data } = await apiClient.post<BulkInviteHostsResult>("/admin/hosts/invite/bulk", payload)
	return data
}
