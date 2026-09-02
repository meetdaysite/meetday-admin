import { apiClient } from "./client"

export type SponsorshipDealPaymentStatus = "UNPAID" | "PAID"
export type SponsorshipDealPaymentMode = "ONLINE" | "OFFLINE"

export type SponsorshipDealPayment = {
	id: string
	sponsorshipInterestId: string
	proposalId: string
	proposalName: string
	communityName: string
	brandName: string
	projectName: string
	dealType?: "SPONSORSHIP" | "CAMPAIGN"
	sponsorshipAmount: string | number
	platformFeeAmount: string | number | null
	transactionFeeAmount: string | number | null
	taxAmount: string | number | null
	totalAmount: string | number | null
	paymentStatus: SponsorshipDealPaymentStatus
	paymentMode: SponsorshipDealPaymentMode | null
	paymentExpiresAt: string | null
	paidAt: string | null
	razorpayPaymentId: string | null
	approvedAt: string | null
}

export async function getSponsorshipDealPayments(): Promise<SponsorshipDealPayment[]> {
	const [sponsorshipRes, campaignRes] = await Promise.all([
		apiClient.get<SponsorshipDealPayment[]>("/admin/sponsorship-deals", {
			params: { status: "APPROVED" },
		}).then((res) => (res.data || []).map((d) => ({ ...d, dealType: "SPONSORSHIP" as const }))).catch(() => []),
		apiClient.get<SponsorshipDealPayment[]>("/admin/campaign-deals", {
			params: { status: "APPROVED" },
		}).then((res) => (res.data || []).map((d) => ({ ...d, dealType: "CAMPAIGN" as const }))).catch(() => []),
	])

	const combined = [...sponsorshipRes, ...campaignRes]
	return combined.sort((a, b) => {
		const timeA = new Date(a.approvedAt || 0).getTime()
		const timeB = new Date(b.approvedAt || 0).getTime()
		return timeB - timeA
	})
}

export async function markSponsorshipDealPaidOffline(
	dealId: string,
	payload: { transactionFeeAmount?: number; paidAt?: string },
): Promise<SponsorshipDealPayment> {
	const { data } = await apiClient.patch<SponsorshipDealPayment>(`/admin/sponsorship-deals/${dealId}/mark-paid-offline`, payload)
	return data
}

