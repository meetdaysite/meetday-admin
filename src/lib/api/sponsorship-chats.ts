import { apiClient } from "./client"

export type SponsorshipChatStatus = "REQUESTED" | "ACCEPTED"
export type ChatSenderType = "HOST" | "BRAND" | "ADMIN"

export type SponsorshipChatThread = {
	id: string
	proposalId: string
	proposalName: string
	communityName: string
	brandName: string
	chatStatus: SponsorshipChatStatus
	createdAt: string
	chatAcceptedAt: string | null
	lastMessageAt: string | null
	lastMessagePreview: string | null
	unreadCount: number
	brandLogoUrl?: string | null
	communityLogoUrl?: string | null
}

export type SponsorshipChatReplyTo = {
	id: string
	senderType: ChatSenderType
	content: string
	hasMedia: boolean
}

export type SponsorshipChatMessage = {
	id: string
	senderType: ChatSenderType
	senderId: string
	messageType?: "TEXT" | "SYSTEM"
	content: string
	mediaUrl?: string | null
	deletedAt?: string | null
	createdAt: string
	hostReadAt?: string | null
	brandReadAt?: string | null
	replyTo?: SponsorshipChatReplyTo | null
}

export async function getSponsorshipChats(status?: SponsorshipChatStatus): Promise<SponsorshipChatThread[]> {
	const { data } = await apiClient.get<SponsorshipChatThread[]>("/admin/sponsorship-chats", {
		params: status ? { status } : undefined,
	})
	return data
}

export async function getPendingSponsorshipChatsCount(): Promise<number> {
	const { data } = await apiClient.get<number>("/admin/sponsorship-chats/pending-count")
	return data
}

export async function getSponsorshipChatMessages(
	interestId: string,
): Promise<{ messages: SponsorshipChatMessage[]; chatStatus: SponsorshipChatStatus }> {
	const { data } = await apiClient.get<{ messages: SponsorshipChatMessage[]; chatStatus: SponsorshipChatStatus }>(
		`/admin/sponsorship-chats/${interestId}/messages`,
	)
	return data
}

export async function sendSponsorshipChatMessage(
	interestId: string,
	payload: { content?: string; mediaKey?: string; replyToId?: string },
): Promise<SponsorshipChatMessage> {
	const { data } = await apiClient.post<SponsorshipChatMessage>(`/admin/sponsorship-chats/${interestId}/messages`, payload)
	return data
}
