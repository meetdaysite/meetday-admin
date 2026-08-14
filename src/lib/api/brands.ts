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

export async function approveBrand(id: string): Promise<void> {
	await apiClient.post(`/admin/brands/${id}/approve`)
}

export async function rejectBrand(id: string, remark: string): Promise<void> {
	await apiClient.post(`/admin/brands/${id}/reject`, { remark })
}

export type { Brand }
