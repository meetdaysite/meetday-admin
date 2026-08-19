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
}

export type SponsorshipChatMessage = {
	id: string
	senderType: ChatSenderType
	senderId: string
	content: string
	mediaUrl?: string | null
	createdAt: string
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
	payload: { content?: string; mediaKey?: string },
): Promise<SponsorshipChatMessage> {
	const { data } = await apiClient.post<SponsorshipChatMessage>(`/admin/sponsorship-chats/${interestId}/messages`, payload)
	return data
}
