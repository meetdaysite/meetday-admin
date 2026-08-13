import { apiClient } from "./client"
import type { Brand, BrandProfileStatus, BrandsListResponse } from "@/types"

export type GetBrandsParams = {
	profileStatus?: BrandProfileStatus
	page?: number
	limit?: number
}

export async function getBrands(params?: GetBrandsParams): Promise<BrandsListResponse> {
	const { data } = await apiClient.get<BrandsListResponse>("/admin/brands", { params })
	return data
}

export type { Brand }
