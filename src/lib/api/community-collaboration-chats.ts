import { apiClient } from "./client"

export type CommunityCollaborationChatStatus = "REQUESTED" | "ACCEPTED" | "DECLINED"

export type CommunityCollaborationChatThread = {
	id: string
	requesterCommunityId: string
	targetCommunityId: string
	requesterCommunityName: string
	targetCommunityName: string
	requesterLogoUrl?: string | null
	targetLogoUrl?: string | null
	chatStatus: CommunityCollaborationChatStatus
	createdAt: string
	lastMessageAt: string | null
	lastMessagePreview: string | null
	unreadCount: number
}

export type CommunityCollaborationChatMessage = {
	id: string
	senderType: string
	senderId: string
	content: string
	mediaUrl?: string | null
	messageType?: string
	deletedAt?: string | null
	createdAt: string
	replyTo?: { id: string; senderType: string; content: string; hasMedia: boolean } | null
}

export async function getCommunityCollaborationChats(status?: CommunityCollaborationChatStatus) {
	const { data } = await apiClient.get<CommunityCollaborationChatThread[]>("/admin/community-collaboration-chats", { params: status ? { status } : undefined })
	return data
}

export async function getCommunityCollaborationChatMessages(interestId: string) {
	const { data } = await apiClient.get<{ messages: CommunityCollaborationChatMessage[]; chatStatus: CommunityCollaborationChatStatus }>(`/admin/community-collaboration-chats/${interestId}/messages`)
	return data
}

export async function sendCommunityCollaborationChatMessage(interestId: string, payload: { content?: string; mediaKey?: string; replyToId?: string }) {
	const { data } = await apiClient.post<CommunityCollaborationChatMessage>(`/admin/community-collaboration-chats/${interestId}/messages`, payload)
	return data
}

export async function deleteCommunityCollaborationChatMessage(interestId: string, messageId: string) {
	const { data } = await apiClient.delete<{ message: string; deleted: boolean }>(`/admin/community-collaboration-chats/${interestId}/messages/${messageId}`)
	return data
}
