import { apiClient } from "./client"
import type { Coupon, CouponTarget, DiscountType } from "@/types"

// ─── Params & responses ───────────────────────────────────────────────────────

export type GetCouponsParams = {
	page?: number
	limit?: number
	target?: CouponTarget
	isActive?: boolean
}

export type CouponsListResponse = {
	coupons: Coupon[]
	total: number
	page: number
	limit: number
}

export type CreateCouponPayload = {
	code: string
	description?: string
	target: CouponTarget
	discountType: DiscountType
	discountValue: number
	maxUsages?: number | null
	maxUsagesPerUser?: number | null
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getCoupons(params?: GetCouponsParams): Promise<CouponsListResponse> {
	const { data } = await apiClient.get<CouponsListResponse>("/admin/coupons", { params })
	return data
}

export async function getCouponById(id: string): Promise<Coupon> {
	const { data } = await apiClient.get<Coupon>(`/admin/coupons/${id}`)
	return data
}

export async function createCoupon(payload: CreateCouponPayload): Promise<Coupon> {
	const { data } = await apiClient.post<Coupon>("/admin/coupons", payload)
	return data
}

export async function disableCoupon(id: string): Promise<void> {
	await apiClient.patch(`/admin/coupons/${id}/disable`)
}
