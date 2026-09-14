import { apiClient } from "./client"

export type SpaceHostChatStatus = "REQUESTED" | "ACCEPTED" | "DECLINED"
export type SpaceHostChatSenderType = "SPACE" | "HOST" | "ADMIN"

export type SpaceHostChatThread = {
	id: string
	hostProfileId: string
	spaceProfileId: string
	communityName: string
	communityLogoUrl?: string | null
	spaceName: string
	spaceLogoUrl?: string | null
	chatStatus: SpaceHostChatStatus
	createdAt: string
	chatAcceptedAt: string | null
	lastMessageAt: string | null
	lastMessagePreview: string | null
	unreadCount: number
	hasUnreadMention?: boolean
}

export type SpaceHostChatReplyTo = {
	id: string
	senderType: SpaceHostChatSenderType
	content: string
	hasMedia: boolean
}

export type SpaceHostChatMessage = {
	id: string
	senderType: SpaceHostChatSenderType
	senderId: string
	content: string
	mediaUrl?: string | null
	messageType?: string
	deletedAt?: string | null
	createdAt: string
	replyTo?: SpaceHostChatReplyTo | null
}

export async function getSpaceHostChats(status?: SpaceHostChatStatus): Promise<SpaceHostChatThread[]> {
	const { data } = await apiClient.get<SpaceHostChatThread[]>("/admin/space-host-chats", {
		params: status ? { status } : undefined,
	})
	return data
}

export async function getPendingSpaceHostChatsCount(): Promise<number> {
	const { data } = await apiClient.get<number>("/admin/space-host-chats/pending-count")
	return data
}

export async function getSpaceHostChatMessages(
	interestId: string,
): Promise<{ messages: SpaceHostChatMessage[]; chatStatus: SpaceHostChatStatus }> {
	const { data } = await apiClient.get<{ messages: SpaceHostChatMessage[]; chatStatus: SpaceHostChatStatus }>(
		`/admin/space-host-chats/${interestId}/messages`,
	)
	return data
}

export async function sendSpaceHostChatMessage(
	interestId: string,
	payload: { content?: string; mediaKey?: string; replyToId?: string },
): Promise<SpaceHostChatMessage> {
	const { data } = await apiClient.post<SpaceHostChatMessage>(`/admin/space-host-chats/${interestId}/messages`, payload)
	return data
}

export async function deleteSpaceHostChatMessage(
	interestId: string,
	messageId: string,
): Promise<{ message: string; deleted: boolean }> {
	const { data } = await apiClient.delete<{ message: string; deleted: boolean }>(
		`/admin/space-host-chats/${interestId}/messages/${messageId}`,
	)
	return data
}
