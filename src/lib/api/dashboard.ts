import { apiClient } from "./client"

export type DashboardRevenuePeriod =
	| "TODAY"
	| "THIS_WEEK"
	| "THIS_MONTH"
	| "THIS_QUARTER"
	| "THIS_YEAR"

export type DashboardStatsResponse = {
	pendingReviews: number
	liveEvents: number
	liveEventsStartingToday: number
	supportFlags: number
	revenueToday: number
	revenueTodayDelta: number
}

export type DashboardReviewQueueResponse = {
	hostApprovals: number
	eventApprovals: number
	contributorRequests: number
	reportedContent: number
}

export type DashboardLiveOperationsResponse = {
	eventsLiveNow: number
	checkInsToday: number
	capacityAlerts: number
}

export type DashboardRevenueTimeSeriesPoint = {
	date: string
	ticketRevenue: number
	platformFee: number
}

export type DashboardRevenueResponse = {
	total: number
	totalDelta: number
	ticketRevenue: number
	platformFees: number
	sponsorships: number
	others: number
	timeSeries: DashboardRevenueTimeSeriesPoint[]
}

export type DashboardRecentActivityItem = {
	id: string
	action: string
	label: string
	subLabel: string
	actorName: string
	timestamp: string
}

export type DashboardRecentActivityResponse = {
	items: DashboardRecentActivityItem[]
}

export type DashboardHealthResponse = {
	server: "operational" | "degraded" | "down" | "maintenance"
	paymentGateway: "operational" | "degraded" | "down" | "maintenance"
	notifications: "operational" | "degraded" | "down" | "maintenance"
	checkInSystem: "operational" | "degraded" | "down" | "maintenance"
}

export type GetDashboardSnapshotParams = {
	period?: DashboardRevenuePeriod
	limit?: number
}

export type DashboardSnapshot = {
	stats: DashboardStatsResponse
	reviewQueue: DashboardReviewQueueResponse
	liveOperations: DashboardLiveOperationsResponse
	revenue: DashboardRevenueResponse
	recentActivity: DashboardRecentActivityResponse
	health: DashboardHealthResponse
}

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
	const { data } = await apiClient.get<DashboardStatsResponse>("/admin/dashboard/stats")
	return data
}

export async function getDashboardReviewQueue(): Promise<DashboardReviewQueueResponse> {
	const { data } = await apiClient.get<DashboardReviewQueueResponse>("/admin/dashboard/review-queue")
	return data
}

export async function getDashboardLiveOperations(): Promise<DashboardLiveOperationsResponse> {
	const { data } = await apiClient.get<DashboardLiveOperationsResponse>("/admin/dashboard/live-operations")
	return data
}

export async function getDashboardRevenue(
	params?: Pick<GetDashboardSnapshotParams, "period">,
): Promise<DashboardRevenueResponse> {
	const { data } = await apiClient.get<DashboardRevenueResponse>("/admin/dashboard/revenue", {
		params: {
			period: params?.period ?? "THIS_MONTH",
		},
	})
	return data
}

export async function getDashboardRecentActivity(
	params?: Pick<GetDashboardSnapshotParams, "limit">,
): Promise<DashboardRecentActivityResponse> {
	const { data } = await apiClient.get<DashboardRecentActivityResponse>("/admin/dashboard/recent-activity", {
		params: {
			limit: params?.limit ?? 20,
		},
	})
	return data
}

export async function getDashboardHealth(): Promise<DashboardHealthResponse> {
	const { data } = await apiClient.get<DashboardHealthResponse>("/admin/dashboard/health")
	return data
}

export async function getDashboardSnapshot(
	params?: GetDashboardSnapshotParams,
): Promise<DashboardSnapshot> {
	const [stats, reviewQueue, liveOperations, revenue, recentActivity, health] = await Promise.all([
		getDashboardStats(),
		getDashboardReviewQueue(),
		getDashboardLiveOperations(),
		getDashboardRevenue({ period: params?.period }),
		getDashboardRecentActivity({ limit: params?.limit }),
		getDashboardHealth(),
	])

	return {
		stats,
		reviewQueue,
		liveOperations,
		revenue,
		recentActivity,
		health,
	}
}
