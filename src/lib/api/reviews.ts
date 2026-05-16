import { apiClient } from "./client"
import type { Review } from "@/types"

export type ReviewsListResponse = {
	reviews: Review[]
	total: number
	page: number
	limit: number
}

export async function getReviews(params: { page: number; limit: number }): Promise<ReviewsListResponse> {
	const { data } = await apiClient.get<ReviewsListResponse>("/admin/reviews", { params })
	return data
}

export async function updateReviewVisibility(id: string, isVisible: boolean): Promise<Review> {
	const { data } = await apiClient.patch<Review>(`/admin/reviews/${id}/visibility`, { isVisible })
	return data
}
