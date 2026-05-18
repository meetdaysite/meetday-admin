import { apiClient } from "./client"
import type { AuditLog } from "@/types"

export type GetAuditLogsParams = {
	actorId?: string
	entityType?: string
	entityId?: string
	action?: string
	from?: string
	to?: string
	page?: number
	limit?: number
}

export type AuditLogsListResponse = {
	data: AuditLog[]
	total: number
	page: number
	limit: number
}

export async function getAuditLogs(params?: GetAuditLogsParams): Promise<AuditLogsListResponse> {
	const { data } = await apiClient.get<AuditLogsListResponse>("/admin/audit-logs", { params })
	return data
}
