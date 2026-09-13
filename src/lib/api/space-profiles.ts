import { apiClient } from "./client"

export type SpacePartnerListItem = {
	id: string
	businessName: string
	logoUrl: string | null
	user: { id: string; firstName: string; lastName: string; email: string }
}

export async function getSpacePartners(search?: string): Promise<SpacePartnerListItem[]> {
	const { data } = await apiClient.get<SpacePartnerListItem[]>("/admin/space-profiles", {
		params: search ? { search } : undefined,
	})
	return data
}

export type SpaceProfileStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "NOT_ACTIVATED"

export type SpacePartnerRep = {
	id: string
	businessName: string
	phone: string | null
	operatingCities: string[]
	profileStatus: SpaceProfileStatus
	user: { id: string; firstName: string; lastName: string; email: string }
	createdAt: string
}

export type GetSpacePartnersRepsParams = {
	search?: string
	city?: string
	profileStatus?: SpaceProfileStatus | "ALL"
	page?: number
	limit?: number
}

export type SpacePartnersRepsResponse = {
	spacePartners: SpacePartnerRep[]
	total: number
	page: number
	limit: number
}

export async function getSpacePartnersReps(params?: GetSpacePartnersRepsParams): Promise<SpacePartnersRepsResponse> {
	const { data } = await apiClient.get<SpacePartnersRepsResponse>("/admin/space-partners", { params })
	return data
}

