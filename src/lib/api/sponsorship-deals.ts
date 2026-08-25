import { apiClient } from "./client"

export type SponsorshipDealStatus = "PENDING_APPROVAL" | "CHANGES_REQUESTED" | "APPROVED"

export type SponsorshipDeal = {
	id: string
	sponsorshipInterestId: string
	proposalId: string
	proposalName: string
	communityName: string
	brandName: string
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

export async function getCampaignDeals(status?: SponsorshipDealStatus): Promise<SponsorshipDeal[]> {
	const { data } = await apiClient.get<SponsorshipDeal[]>("/admin/campaign-deals", {
		params: status ? { status } : undefined,
	})
	return data
}
