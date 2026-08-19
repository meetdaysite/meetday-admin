import { apiClient } from "./client"

export type SponsorshipDealStatus = "PENDING_APPROVAL" | "CHANGES_REQUESTED" | "APPROVED"

export type SponsorshipDeal = {
	id: string
	sponsorshipInterestId: string
	proposalId: string
	proposalName: string
	communityName: string
	brandName: string
	eventName: string
	eventDate: string
	eventTime: string | null
	venue: string
	finalAmount: string | number
	deliverables: string
	otherTerms: string | null
	additionalNotes: string | null
	status: SponsorshipDealStatus
	version: number
	changeRequestNote: string | null
	approvedAt: string | null
	createdAt: string
	updatedAt: string
}

export async function getSponsorshipDeals(status?: SponsorshipDealStatus): Promise<SponsorshipDeal[]> {
	const { data } = await apiClient.get<SponsorshipDeal[]>("/admin/sponsorship-deals", {
		params: status ? { status } : undefined,
	})
	return data
}
