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
