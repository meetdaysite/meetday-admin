import { apiClient } from "./client"
import type { HostKycDetails } from "@/types"

export async function getHostKycDetails(hostProfileId: string): Promise<HostKycDetails> {
	const { data } = await apiClient.get<HostKycDetails>(`/admin/hosts/${hostProfileId}/kyc`)
	return data
}

export async function verifyHostKyc(hostProfileId: string): Promise<HostKycDetails> {
	const { data } = await apiClient.post<HostKycDetails>(`/admin/hosts/${hostProfileId}/kyc/verify`)
	return data
}

export async function rejectHostKyc(hostProfileId: string, reason: string): Promise<HostKycDetails> {
	const { data } = await apiClient.post<HostKycDetails>(`/admin/hosts/${hostProfileId}/kyc/reject`, { reason })
	return data
}
