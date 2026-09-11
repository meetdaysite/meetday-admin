import { apiClient } from "./client"

export type SpaceDealStatus = "PENDING_APPROVAL" | "CHANGES_REQUESTED" | "APPROVED"
export type SpaceRequesterType = "BRAND" | "COMMUNITY"

export type SpaceDeal = {
	id: string
	spaceInterestId: string
	spaceCommunityProfileId: string
	spaceName: string
	requesterType: SpaceRequesterType
	requesterName: string
	projectName: string
	goals: string | string[] | null
	venue: string
	time: string | null
	targetAudience: string | string[] | null
	startDate: string
	endDate: string | null
	sponsorshipAmount: string | number
	barterElements: string | null
	deliverables: string
	otherTerms: string | null
	additionalNotes: string | null
	status: SpaceDealStatus
	changeRequestNote: string | null
	approvedAt: string | null
	createdAt: string
	updatedAt: string
}

export async function getSpaceDeals(status?: SpaceDealStatus): Promise<SpaceDeal[]> {
	const { data } = await apiClient.get<SpaceDeal[]>("/admin/space-deals", {
		params: status ? { status } : undefined,
	})
	return data
}
