import { apiClient } from "./client"

export type SendAnnouncementPayload = {
	allBrands?: boolean
	allCommunity?: boolean
	brandIds?: string[]
	hostIds?: string[]
	subject?: string
	message: string
	recipientsSummary?: string
}

export type SendAnnouncementResponse = {
	queued: number
}

export async function sendAnnouncement(payload: SendAnnouncementPayload): Promise<SendAnnouncementResponse> {
	const { data } = await apiClient.post<SendAnnouncementResponse>("/admin/announcements/send", payload)
	return data
}

export type Announcement = {
	id: string
	subject: string
	message: string
	recipientCount: number
	recipientsSummary: string
	createdAt: string
	sentBy: { firstName: string; lastName: string; email: string }
}

export type AnnouncementsListResponse = {
	announcements: Announcement[]
	total: number
	page: number
	limit: number
}

export async function getAnnouncements(params?: { page?: number; limit?: number }): Promise<AnnouncementsListResponse> {
	const { data } = await apiClient.get<AnnouncementsListResponse>("/admin/announcements", { params })
	return data
}
