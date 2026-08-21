import { apiClient } from "./client"

export type SponsorshipDealPaymentStatus = "UNPAID" | "PAID"

export type SponsorshipDealPayment = {
	id: string
	sponsorshipInterestId: string
	proposalId: string
	proposalName: string
	communityName: string
	brandName: string
	projectName: string
	sponsorshipAmount: string | number
	platformFeeAmount: string | number | null
	taxAmount: string | number | null
	totalAmount: string | number | null
	paymentStatus: SponsorshipDealPaymentStatus
	paymentExpiresAt: string | null
	paidAt: string | null
	razorpayPaymentId: string | null
	approvedAt: string | null
}

export async function getSponsorshipDealPayments(): Promise<SponsorshipDealPayment[]> {
	const { data } = await apiClient.get<SponsorshipDealPayment[]>("/admin/sponsorship-deals", {
		params: { status: "APPROVED" },
	})
	return data
}
