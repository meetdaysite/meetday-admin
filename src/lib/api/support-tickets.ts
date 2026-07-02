import { apiClient } from "./client"
import type { SupportTicket, TicketStatus, TicketPriority, TicketCategory } from "@/types"

export type GetSupportTicketsParams = {
	status?: TicketStatus
	priority?: TicketPriority
	category?: TicketCategory
	assignedTo?: string
	from?: string
	to?: string
	page?: number
	limit?: number
}

export type SupportTicketsListResponse = {
	items: SupportTicket[]
	total: number
	page: number
	limit: number
}

export async function getSupportTickets(
	params?: GetSupportTicketsParams,
): Promise<SupportTicketsListResponse> {
	const { data } = await apiClient.get<SupportTicketsListResponse>("/support-tickets/admin", {
		params,
	})
	return data
}

export async function getSupportTicketById(id: string): Promise<SupportTicket> {
	const { data } = await apiClient.get<SupportTicket>(`/support-tickets/admin/${id}`)
	return data
}

export async function assignTicket(id: string, adminUserId: string): Promise<SupportTicket> {
	const { data } = await apiClient.post<SupportTicket>(`/support-tickets/admin/${id}/assign`, {
		adminUserId,
	})
	return data
}

export async function resolveTicket(id: string, resolution: string): Promise<SupportTicket> {
	const { data } = await apiClient.post<SupportTicket>(`/support-tickets/admin/${id}/resolve`, {
		resolution,
	})
	return data
}

export async function closeTicket(id: string): Promise<SupportTicket> {
	const { data } = await apiClient.post<SupportTicket>(`/support-tickets/admin/${id}/close`)
	return data
}

export async function escalateTicket(id: string, priority: TicketPriority): Promise<SupportTicket> {
	const { data } = await apiClient.post<SupportTicket>(`/support-tickets/admin/${id}/escalate`, {
		priority,
	})
	return data
}
