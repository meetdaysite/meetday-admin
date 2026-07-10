import { apiClient } from "./client"
import type { Review } from "@/types"

// ─── Raw API types ─────────────────────────────────────────────────────────────

type ApiReview = {
	id: string
	rating: number
	body: string | null
	highlights: string[]
	isVisible: boolean
	createdAt: string
	event: { id: string; title: string }
	user: { id: string; firstName: string; lastName: string; email: string } | null
}

type ApiReviewsResponse = {
	reviews: ApiReview[]
	total: number
	page: number
	limit: number
}

export type ReviewsListResponse = {
	reviews: Review[]
	total: number
	page: number
	limit: number
}

// ─── Mapping ───────────────────────────────────────────────────────────────────

function mapReview(r: ApiReview): Review {
	return {
		id: r.id,
		rating: r.rating,
		content: r.body,
		highlights: r.highlights ?? [],
		isVisible: r.isVisible,
		createdAt: r.createdAt,
		event: r.event,
		reviewer: r.user ?? null,
	}
}

// ─── API functions ─────────────────────────────────────────────────────────────

export async function getReviews(params: { page: number; limit: number }): Promise<ReviewsListResponse> {
	const { data } = await apiClient.get<ApiReviewsResponse>("/admin/reviews", { params })
	return {
		reviews: (data.reviews ?? []).map(mapReview),
		total: data.total,
		page: data.page,
		limit: data.limit,
	}
}

export async function updateReviewVisibility(id: string, isVisible: boolean): Promise<Review> {
	const { data } = await apiClient.patch<ApiReview>(`/admin/reviews/${id}/visibility`, { isVisible })
	return mapReview(data)
}
