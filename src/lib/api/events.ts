import { apiClient } from "./client"
import type { Event, EventDetail, EventStatus } from "@/types"

export type GetEventsParams = {
	status?: EventStatus
	city?: string
	hostProfileId?: string
	categoryId?: string
	page?: number
	limit?: number
}

export type EventsListResponse = {
	events: Event[]
	total: number
	page: number
	limit: number
}

export async function getPendingEvents(): Promise<EventsListResponse> {
	const { data } = await apiClient.get<EventsListResponse>("/admin/events/pending")
	return data
}

export async function getEvents(params?: GetEventsParams): Promise<EventsListResponse> {
	const { data } = await apiClient.get<EventsListResponse>("/admin/events", { params })
	return data
}

export async function getEventById(id: string): Promise<EventDetail> {
	const { data } = await apiClient.get<EventDetail>(`/admin/events/${id}`)
	return data
}

export async function approveEvent(id: string): Promise<void> {
	await apiClient.post(`/admin/events/${id}/approve`)
}

export async function rejectEvent(id: string, remark: string): Promise<void> {
	await apiClient.post(`/admin/events/${id}/reject`, { remark })
}
