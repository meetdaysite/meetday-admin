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
	isCampaign?: boolean
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
	isDealClosed?: boolean
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
	editedAt?: string | null
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

export async function editSponsorshipChatMessage(
	interestId: string,
	messageId: string,
	content: string,
): Promise<SponsorshipChatMessage> {
	const { data } = await apiClient.patch<SponsorshipChatMessage>(
		`/admin/sponsorship-chats/${interestId}/messages/${messageId}`,
		{ content },
	)
	return data
}

export async function deleteSponsorshipChatMessage(
	interestId: string,
	messageId: string,
): Promise<{ message: string; deleted: boolean }> {
	const { data } = await apiClient.delete<{ message: string; deleted: boolean }>(
		`/admin/sponsorship-chats/${interestId}/messages/${messageId}`,
	)
	return data
}

export type SponsorshipDealStatus = "PENDING_APPROVAL" | "CHANGES_REQUESTED" | "APPROVED"

export type SponsorshipDeal = {
	id: string
	sponsorshipInterestId: string
	proposalId?: string | null
	proposalName?: string | null
	communityName?: string
	brandName?: string
	hostName?: string
	projectName: string
	startDate: string
	endDate: string | null
	time: string | null
	venue: string
	sponsorshipAmount: string | number
	sponsorshipCategory: string | null
	barterElements: string | null
	deliverables: string
	otherTerms: string | null
	additionalNotes: string | null
	status: SponsorshipDealStatus
	version: number
	changeRequestNote: string | null
	platformFeeAmount?: number | null
	transactionFeeAmount?: number | null
	taxAmount?: number | null
	totalAmount?: number | null
	paymentStatus: "UNPAID" | "PAID"
	paymentExpiresAt: string | null
	paidAt: string | null
	approvedAt: string | null
	razorpayPaymentId?: string | null
	invoicePdfUrl?: string | null
	invoicePdfKey?: string | null
	report?: { id: string; status?: string; summary?: string } | null
	createdAt: string
	updatedAt: string
}

export type SponsorshipDealReport = {
	id: string
	sponsorshipDealId: string
	projectName?: string
	eventDate?: string
	venue?: string
	time?: string | null
	guestCount?: string | null
	ageRange?: string | null
	deliverables?: string[]
	videoLinks?: string[]
	socialLinks?: string[]
	summary: string
	status?: "PENDING" | "APPROVED" | "REVISION_REQUESTED" | string
	revisionNote?: string | null
	proofKeys?: string[]
	proofUrls: string[]
	notes: string | null
	submittedById: string
	submittedAt: string
	updatedAt: string
}

export function isReportApproved(report?: SponsorshipDealReport | null): boolean {
	if (!report) return false
	if (report.status === "APPROVED") return true
	try {
		const parsed = JSON.parse(report.summary)
		return parsed.status === "APPROVED"
	} catch {
		return false
	}
}

export type DealPaymentDisplayStatus = "PENDING" | "PAID" | "EXPIRED"

export function getDealPaymentDisplayStatus(deal: { paymentStatus: "UNPAID" | "PAID"; paymentExpiresAt: string | null }): DealPaymentDisplayStatus {
	if (deal.paymentStatus === "PAID") return "PAID"
	if (deal.paymentExpiresAt && new Date(deal.paymentExpiresAt).getTime() < Date.now()) return "EXPIRED"
	return "PENDING"
}

export async function getSponsorshipDeal(interestId: string): Promise<SponsorshipDeal | null> {
	try {
		const { data } = await apiClient.get<SponsorshipDeal | null>(`/admin/sponsorship-chats/${interestId}/deal`)
		return data
	} catch (err: any) {
		if (err?.response?.status === 404) {
			try {
				const { data: allDeals } = await apiClient.get<SponsorshipDeal[]>("/admin/sponsorship-deals")
				const match = allDeals?.find((d) => d.sponsorshipInterestId === interestId)
				if (match) return match
			} catch {}
			try {
				const { data: campaignDeals } = await apiClient.get<SponsorshipDeal[]>("/admin/campaign-deals")
				const match = campaignDeals?.find((d) => d.sponsorshipInterestId === interestId)
				if (match) return match
			} catch {}
		}
		return null
	}
}

export async function getSponsorshipDealReport(interestId: string): Promise<SponsorshipDealReport | null> {
	try {
		const { data } = await apiClient.get<SponsorshipDealReport | null>(`/admin/sponsorship-chats/${interestId}/deal/report`)
		return data
	} catch {
		return null
	}
}

export async function getSponsorshipDealReportPdfUrl(interestId: string): Promise<string> {
	const { data } = await apiClient.get<{ url: string }>(`/admin/sponsorship-chats/${interestId}/deal/report/pdf`)
	return data.url
}

export async function getSponsorshipDealInvoiceUrl(interestId: string): Promise<string> {
	const { data } = await apiClient.get<{ url: string }>(`/admin/sponsorship-chats/${interestId}/deal/invoice`)
	return data.url
}
