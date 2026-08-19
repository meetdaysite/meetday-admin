import { apiClient } from "./client"

export type MeetdayChatThread = {
	id: string
	userId: string
	userName: string
	userEmail: string
	userRole: string | null
	createdAt: string
	lastMessageAt: string | null
	lastMessagePreview: string | null
	unreadCount: number
	userLogoUrl?: string | null
	userAvatarUrl?: string | null
}

export type MeetdayChatMessage = {
	id: string
	senderType: "USER" | "ADMIN"
	senderId: string
	content: string
	mediaUrl?: string | null
	createdAt: string
	hostReadAt?: string | null
	brandReadAt?: string | null
}

export async function getMeetdayChats(): Promise<MeetdayChatThread[]> {
	const { data } = await apiClient.get<MeetdayChatThread[]>("/admin/meetday-chats")
	return data
}

export async function getMeetdayChatUnreadCount(): Promise<number> {
	const { data } = await apiClient.get<number>("/admin/meetday-chats/unread-count")
	return data
}

export async function getMeetdayChatMessages(threadId: string): Promise<{ messages: MeetdayChatMessage[] }> {
	const { data } = await apiClient.get<{ messages: MeetdayChatMessage[] }>(`/admin/meetday-chats/${threadId}/messages`)
	return data
}

export async function sendMeetdayChatMessage(
	threadId: string,
	payload: { content?: string; mediaKey?: string },
): Promise<MeetdayChatMessage> {
	const { data } = await apiClient.post<MeetdayChatMessage>(`/admin/meetday-chats/${threadId}/messages`, payload)
	return data
}
