import { apiClient } from "./client"

export type SponsorshipChatStatus = "REQUESTED" | "ACCEPTED"
export type ChatSenderType = "HOST" | "BRAND" | "ADMIN"
export type ChatThreadType = "SPONSORSHIP" | "CAMPAIGN"

export type SponsorshipChatThread = {
	id: string
	type?: ChatThreadType
	proposalId?: string | null
	proposalName?: string | null
	campaignId?: string | null
	campaignName?: string | null
	communityName: string
	brandName: string
	senderRole?: "BRAND" | "HOST"
	senderName?: string
	senderLogoUrl?: string | null
	receiverRole?: "HOST" | "BRAND"
	receiverName?: string
	receiverLogoUrl?: string | null
	targetName?: string
	chatStatus: SponsorshipChatStatus
	createdAt: string
	chatAcceptedAt: string | null
	lastMessageAt: string | null
	lastMessagePreview: string | null
	unreadCount: number
	hasUnreadMention?: boolean
	brandLogoUrl?: string | null
	communityLogoUrl?: string | null
	isDealLocked?: boolean
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

export type GetSponsorshipChatsParams = {
	status?: SponsorshipChatStatus
	type?: ChatThreadType
}

export async function getSponsorshipChats(
	paramsOrStatus?: SponsorshipChatStatus | GetSponsorshipChatsParams,
): Promise<SponsorshipChatThread[]> {
	const params = typeof paramsOrStatus === "string" ? { status: paramsOrStatus } : paramsOrStatus
	const { data } = await apiClient.get<SponsorshipChatThread[]>("/admin/sponsorship-chats", {
		params,
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
