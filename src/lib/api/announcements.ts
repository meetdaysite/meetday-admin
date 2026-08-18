import { apiClient } from "./client"

export type SendAnnouncementPayload = {
	allBrands?: boolean
	allCommunity?: boolean
	brandIds?: string[]
	hostIds?: string[]
	subject?: string
	message: string
}

export type SendAnnouncementResponse = {
	queued: number
}

export async function sendAnnouncement(payload: SendAnnouncementPayload): Promise<SendAnnouncementResponse> {
	const { data } = await apiClient.post<SendAnnouncementResponse>("/admin/announcements/send", payload)
	return data
}
