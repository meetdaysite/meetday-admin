import { apiClient } from "./client"

export type SpaceChatStatus = "REQUESTED" | "ACCEPTED" | "DECLINED"
export type SpaceChatSenderType = "SPACE" | "BRAND" | "COMMUNITY" | "ADMIN"
export type SpaceRequesterType = "BRAND" | "COMMUNITY"

export type SpaceChatThread = {
	id: string
	spaceCommunityProfileId: string
	spaceName: string
	spaceLogoUrl?: string | null
	requesterType: SpaceRequesterType
	requesterName: string
	requesterLogoUrl?: string | null
	chatStatus: SpaceChatStatus
	createdAt: string
	chatAcceptedAt: string | null
	lastMessageAt: string | null
	lastMessagePreview: string | null
	unreadCount: number
	hasUnreadMention?: boolean
}

export type SpaceChatReplyTo = {
	id: string
	senderType: SpaceChatSenderType
	content: string
	hasMedia: boolean
}

export type SpaceChatMessage = {
	id: string
	senderType: SpaceChatSenderType
	senderId: string
	content: string
	mediaUrl?: string | null
	deletedAt?: string | null
	createdAt: string
	replyTo?: SpaceChatReplyTo | null
}

export async function getSpaceChats(status?: SpaceChatStatus): Promise<SpaceChatThread[]> {
	const { data } = await apiClient.get<SpaceChatThread[]>("/admin/space-chats", {
		params: status ? { status } : undefined,
	})
	return data
}

export async function getPendingSpaceChatsCount(): Promise<number> {
	const { data } = await apiClient.get<number>("/admin/space-chats/pending-count")
	return data
}

export async function getSpaceChatMessages(
	interestId: string,
): Promise<{ messages: SpaceChatMessage[]; chatStatus: SpaceChatStatus }> {
	const { data } = await apiClient.get<{ messages: SpaceChatMessage[]; chatStatus: SpaceChatStatus }>(
		`/admin/space-chats/${interestId}/messages`,
	)
	return data
}

export async function sendSpaceChatMessage(
	interestId: string,
	payload: { content?: string; mediaKey?: string; replyToId?: string },
): Promise<SpaceChatMessage> {
	const { data } = await apiClient.post<SpaceChatMessage>(`/admin/space-chats/${interestId}/messages`, payload)
	return data
}

export async function deleteSpaceChatMessage(
	interestId: string,
	messageId: string,
): Promise<{ message: string; deleted: boolean }> {
	const { data } = await apiClient.delete<{ message: string; deleted: boolean }>(
		`/admin/space-chats/${interestId}/messages/${messageId}`,
	)
	return data
}
