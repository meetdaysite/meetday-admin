// TODO: Replace all mock data and simulated delays with real API calls via apiClient
// import { apiClient } from "./client"
import { apiClient } from "./client"
import type {
	Community,
	CommunityStatus,
	CommunityVisibility,
	CommunityAccess,
	CreateCommunityDraftRequest,
	UpdateCommunitySettingsRequest,
	AssignCommunityMemberRequest,
} from "@/types"

export type { CommunityStatus, CommunityVisibility, CommunityAccess }

// ─── Types ────────────────────────────────────────────────────────────────────

export type CommunityStats = {
	totalCommunities: number
	activeCommunities: number
	totalMembers: number
	upcomingEvents: number
	avgEngagementRate: number
	// TODO: add trend fields (e.g. totalCommunitiesGrowth, totalMembersGrowth) from API
}

export type GetCommunitiesParams = {
	status?: CommunityStatus
	city?: string
	categoryId?: string
	search?: string
	page?: number
	limit?: number
}

export type CommunitiesListResponse = {
	communities: Community[]
	total: number
	page: number
	limit: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_STATS: CommunityStats = {
	totalCommunities: 24,
	activeCommunities: 18,
	totalMembers: 18600,
	upcomingEvents: 96,
	avgEngagementRate: 72,
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getCommunityStats(): Promise<CommunityStats> {
	// TODO: const { data } = await apiClient.get<CommunityStats>("/admin/communities/stats")
	// TODO: return data
	await new Promise(r => setTimeout(r, 400))
	return MOCK_STATS
}

export async function getCommunities(params?: GetCommunitiesParams): Promise<CommunitiesListResponse> {
	const { data } = await apiClient.get<{ data: Community[]; total: number; page: number; limit: number }>(
		"/admin/communities",
		{ params },
	)
	return {
		communities: data.data,
		total: data.total,
		page: data.page,
		limit: data.limit,
	}
}

export async function updateCommunityStatus(
	_id: string,
	_status: CommunityStatus,
): Promise<void> {
	// TODO: await apiClient.patch(`/admin/communities/${_id}/status`, { status: _status })
	await new Promise(r => setTimeout(r, 400))
}

// ─── Queue types ──────────────────────────────────────────────────────────────

export type CommunityQueueStats = {
	pendingReview: number
	approvedToday: number
	rejectedToday: number
	avgReviewTimeHours: number
}

export type CommunityQueueInsight = {
	label: string
	pct: number
	color: string
}

export type CommunityQueueReviewer = {
	id: string
	name: string
	role: string
	initial: string
	reviewed: number
	quota: number
}

export type CommunityQueueActivity = {
	id: string
	actorName: string
	actorInitial: string
	action: string
	targetName: string
	timeAgo: string
	type: "approve" | "reject" | "changes"
}

export type GetCommunityQueueParams = {
	status?: CommunityStatus
	categoryId?: string
	visibility?: CommunityVisibility
	page?: number
	limit?: number
}

export type CommunityQueueResponse = {
	items: CommunityQueueItem[]
	total: number
	page: number
	limit: number
}

// ─── Queue mock data ──────────────────────────────────────────────────────────

import type { CommunityQueueItem } from "@/types"

const MOCK_QUEUE_STATS: CommunityQueueStats = {
	pendingReview: 12,
	approvedToday: 5,
	rejectedToday: 2,
	avgReviewTimeHours: 8,
}

export const MOCK_QUEUE_INSIGHTS: CommunityQueueInsight[] = [
	{ label: "Music",       pct: 42, color: "#9333ea" },
	{ label: "Networking",  pct: 24, color: "#3b82f6" },
	{ label: "Wellness",    pct: 18, color: "#22c55e" },
	{ label: "Creative",    pct: 16, color: "#f59e0b" },
]

export const MOCK_QUEUE_REVIEWERS: CommunityQueueReviewer[] = [
	{ id: "r-1", name: "Rishav Sharma", role: "Lead Reviewer", initial: "R", reviewed: 18, quota: 25 },
	{ id: "r-2", name: "Priya Mehta",   role: "Reviewer",      initial: "P", reviewed: 12, quota: 25 },
	{ id: "r-3", name: "Aniket Verma",  role: "Reviewer",      initial: "A", reviewed: 15, quota: 25 },
]

export const MOCK_QUEUE_ACTIVITY: CommunityQueueActivity[] = [
	{ id: "a-1", actorName: "Priya Mehta",   actorInitial: "P", action: "approved",           targetName: "Meetday Wellness Circle", timeAgo: "1 hour ago",  type: "approve" },
	{ id: "a-2", actorName: "Aniket Verma",  actorInitial: "A", action: "requested changes on", targetName: "Startup Founders Hub",  timeAgo: "2 hours ago", type: "changes" },
	{ id: "a-3", actorName: "Rishav Sharma", actorInitial: "R", action: "approved",           targetName: "Music Nights Kolkata",   timeAgo: "3 hours ago", type: "approve" },
]

const h = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString()
const d = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

const MOCK_QUEUE: CommunityQueueItem[] = [
	{ id: "q-1",  name: "Meetday Music Nights",  thumbnailUrl: null, category: { id: "cat-music",      name: "Music"          }, visibility: "PUBLIC",      memberCount: 1600, submittedBy: { id: "u-1",  name: "Rishav Sharma" }, submittedAt: h(2),  status: "PENDING_ADMIN_REVIEW" },
	{ id: "q-2",  name: "Founder's Huddle",       thumbnailUrl: null, category: { id: "cat-net",        name: "Networking"     }, visibility: "PRIVATE",     memberCount: 680,  submittedBy: { id: "u-2",  name: "Priya Mehta"   }, submittedAt: h(5),  status: "PENDING_ADMIN_REVIEW" },
	{ id: "q-3",  name: "Wellness Circle",        thumbnailUrl: null, category: { id: "cat-well",       name: "Wellness"       }, visibility: "PUBLIC",      memberCount: 940,  submittedBy: { id: "u-3",  name: "Anjali Verma"  }, submittedAt: d(1),  status: "PENDING_ADMIN_REVIEW" },
	{ id: "q-4",  name: "Street Photographers",   thumbnailUrl: null, category: { id: "cat-creat",      name: "Creative"       }, visibility: "PUBLIC",      memberCount: 420,  submittedBy: { id: "u-4",  name: "Karan Das"     }, submittedAt: d(1),  status: "PENDING_ADMIN_REVIEW" },
	{ id: "q-5",  name: "Code & Coffee",          thumbnailUrl: null, category: { id: "cat-tech",       name: "Tech"           }, visibility: "PRIVATE",     memberCount: 560,  submittedBy: { id: "u-5",  name: "Arjun Nair"    }, submittedAt: d(2),  status: "PENDING_ADMIN_REVIEW" },
	{ id: "q-6",  name: "Goal Getters",           thumbnailUrl: null, category: { id: "cat-pg",         name: "Personal Growth"}, visibility: "PUBLIC",      memberCount: 310,  submittedBy: { id: "u-6",  name: "Neha Kapoor"   }, submittedAt: d(2),  status: "PENDING_ADMIN_REVIEW" },
	{ id: "q-7",  name: "Travel Buddies India",   thumbnailUrl: null, category: { id: "cat-travel",     name: "Travel"         }, visibility: "PUBLIC",      memberCount: 1100, submittedBy: { id: "u-7",  name: "Mohit Bansal"  }, submittedAt: d(3),  status: "PENDING_ADMIN_REVIEW" },
	{ id: "q-8",  name: "Book Club Mumbai",       thumbnailUrl: null, category: { id: "cat-lifestyle",  name: "Lifestyle"      }, visibility: "PUBLIC",      memberCount: 450,  submittedBy: { id: "u-8",  name: "Sneha Pillai"  }, submittedAt: d(4),  status: "PENDING_ADMIN_REVIEW" },
	{ id: "q-9",  name: "Fitness First",          thumbnailUrl: null, category: { id: "cat-well",       name: "Wellness"       }, visibility: "PUBLIC",      memberCount: 720,  submittedBy: { id: "u-9",  name: "Rahul Gupta"   }, submittedAt: d(4),  status: "PENDING_ADMIN_REVIEW" },
	{ id: "q-10", name: "Design Talks",           thumbnailUrl: null, category: { id: "cat-creat",      name: "Creative"       }, visibility: "PRIVATE",     memberCount: 280,  submittedBy: { id: "u-10", name: "Aditi Shah"    }, submittedAt: d(5),  status: "PENDING_ADMIN_REVIEW" },
	{ id: "q-11", name: "Poets Corner",           thumbnailUrl: null, category: { id: "cat-arts",       name: "Arts"           }, visibility: "PUBLIC",      memberCount: 190,  submittedBy: { id: "u-11", name: "Vijay Kumar"   }, submittedAt: d(5),  status: "PENDING_ADMIN_REVIEW" },
	{ id: "q-12", name: "Startup Founders Club",  thumbnailUrl: null, category: { id: "cat-business",   name: "Business"       }, visibility: "INVITE_ONLY", memberCount: 850,  submittedBy: { id: "u-12", name: "Deepak Mehta"  }, submittedAt: d(6),  status: "PENDING_ADMIN_REVIEW" },
]

// ─── Queue API functions ───────────────────────────────────────────────────────

export async function getCommunityQueueStats(): Promise<CommunityQueueStats> {
	// TODO: const { data } = await apiClient.get<CommunityQueueStats>("/admin/communities/queue/stats")
	// TODO: return data
	await new Promise(r => setTimeout(r, 400))
	return MOCK_QUEUE_STATS
}

export async function getCommunityQueue(params?: GetCommunityQueueParams): Promise<CommunityQueueResponse> {
	// TODO: const { data } = await apiClient.get<CommunityQueueResponse>("/admin/communities/queue", { params })
	// TODO: return data
	await new Promise(r => setTimeout(r, 600))

	let filtered = [...MOCK_QUEUE]
	if (params?.status)     filtered = filtered.filter(c => c.status === params.status)
	if (params?.visibility) filtered = filtered.filter(c => c.visibility === params.visibility)
	if (params?.categoryId) filtered = filtered.filter(c => c.category?.id === params.categoryId)

	const limit = params?.limit ?? 10
	const page  = params?.page  ?? 1
	const start = (page - 1) * limit

	return { items: filtered.slice(start, start + limit), total: filtered.length, page, limit }
}

export async function approveCommunity(_id: string): Promise<void> {
	// TODO: await apiClient.post(`/admin/communities/${_id}/approve`)
	await new Promise(r => setTimeout(r, 500))
}

export async function rejectCommunity(_id: string, _reason: string): Promise<void> {
	// TODO: await apiClient.post(`/admin/communities/${_id}/reject`, { reason: _reason })
	await new Promise(r => setTimeout(r, 500))
}

export async function bulkApproveCommunities(_ids: string[]): Promise<void> {
	// TODO: await apiClient.post("/admin/communities/bulk-approve", { ids: _ids })
	await new Promise(r => setTimeout(r, 700))
}

export async function bulkRejectCommunities(_ids: string[], _reason: string): Promise<void> {
	// TODO: await apiClient.post("/admin/communities/bulk-reject", { ids: _ids, reason: _reason })
	await new Promise(r => setTimeout(r, 700))
}

// ─── Community Detail — API response types ────────────────────────────────────

import type {
	CommunityFeedPosting,
	CommunityChatPermission,
	CommunityDmPolicy,
	CommunityPhotoSharing,
} from "@/types"

export type ApiCommunitySettings = {
	id: string
	communityId: string
	chatEnabled: boolean
	feedEnabled: boolean
	announcementsEnabled: boolean
	memberDirectoryEnabled: boolean
	experiencesTabEnabled: boolean
	feedPosting: CommunityFeedPosting
	chat: CommunityChatPermission
	spamDetection: boolean
	toxicContentDetection: boolean
	linkFiltering: boolean
	duplicateContentDetection: boolean
	reportThreshold: number
	dmPolicy: CommunityDmPolicy
	photoSharing: CommunityPhotoSharing
	createdAt: string
	updatedAt: string
}

type OverviewStatField = {
	value: number
	delta7d: number
	deltaPct: number
	sparkline: number[]
}

export type ApiOverviewResponse = {
	community: {
		id: string
		name: string
		slug: string
		type: string
		status: CommunityStatus
		access: CommunityAccess
		description: string | null
		iconUrl: string | null
		coverUrl: string | null
		createdAt: string
		url: string
	}
	stats: {
		totalMembers: OverviewStatField
		activeExperiences: OverviewStatField
		postReach7d: OverviewStatField
		messages7d: OverviewStatField
	}
	upcomingExperiences: {
		id: string
		title: string
		eventDate: string
		city: string
		coverUrl: string | null
		attendeeCount: number
		avgRating: number | null
	}[]
	managers: {
		userId: string
		firstName: string
		lastName: string
		avatarUrl: string | null
		role: string
	}[]
	recentActivity: {
		type: string
		title: string
		actor: string | null
		at: string
	}[]
	topEngagement7d: {
		posts: number
		comments: number
		reactions: number
		shares: number
		newMembers: number
	}
}

// ─── Community Detail — UI model types ───────────────────────────────────────

export type CommunityDetailStatCard = {
	label: string
	value: string | number
	trend?: { value: number; direction: "up" | "down"; label?: string }
	sub: string
	color: string
	spark: { v: number }[]
}

export type CommunityDetailManager = {
	id: string
	name: string
	initial: string
	avatarUrl: string | null
	role: "Owner" | "Manager" | "Moderator"
}

export type CommunityDetailExperience = {
	id: string
	title: string
	date: string
	venue: string
	attendeeCount: number
	rating: number | null
	coverUrl: string | null
	coverInitial: string
}

export type CommunityDetailActivity = {
	id: string
	type: "member" | "experience" | "post" | "announcement"
	title: string
	description: string
	timeAgo: string
}

export type CommunityDetailEngagement = {
	label: string
	value: number
	max: number
	color: string
}

export type CommunityDetailData = {
	id: string
	slug: string
	name: string
	description: string | null
	thumbnailUrl: string | null
	iconUrl: string | null
	isMeetdayManaged: boolean
	access: CommunityAccess
	communityUrl: string
	status: CommunityStatus
	createdAt: string
	statCards: CommunityDetailStatCard[]
	managers: CommunityDetailManager[]
	upcomingExperiences: CommunityDetailExperience[]
	recentActivity: CommunityDetailActivity[]
	topEngagement: CommunityDetailEngagement[]
}

// ─── Community Detail API ──────────────────────────────────────────────────────

function toTimeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime()
	const m = Math.floor(diff / 60000)
	if (m < 1)  return "just now"
	if (m < 60) return `${m}m ago`
	const h = Math.floor(m / 60)
	if (h < 24) return `${h}h ago`
	const d = Math.floor(h / 24)
	return `${d}d ago`
}

const ACTIVITY_TYPE_MAP: Record<string, CommunityDetailActivity["type"]> = {
	NEW_POST:             "post",
	MEMBER_JOINED:        "member",
	ANNOUNCEMENT_CREATED: "announcement",
	NEW_EXPERIENCE:       "experience",
}

const DISPLAY_ROLES: Record<string, "Owner" | "Manager" | "Moderator"> = {
	OWNER: "Owner", MANAGER: "Manager", MODERATOR: "Moderator",
}

export async function getCommunityById(id: string): Promise<CommunityDetailData> {
	const { data: o } = await apiClient.get<ApiOverviewResponse>(
		`/admin/communities/${id}/overview`,
	)

	const statCards: CommunityDetailStatCard[] = [
		{
			label: "Total Members",
			value: o.stats.totalMembers.value,
			trend: {
				value: Math.abs(o.stats.totalMembers.deltaPct),
				direction: o.stats.totalMembers.delta7d >= 0 ? "up" : "down",
				label: "% vs last 7d",
			},
			sub: `${o.stats.totalMembers.delta7d >= 0 ? "+" : ""}${o.stats.totalMembers.delta7d} this week`,
			color: "#9333ea",
			spark: o.stats.totalMembers.sparkline.map(v => ({ v })),
		},
		{
			label: "Active Experiences",
			value: o.stats.activeExperiences.value,
			trend: {
				value: Math.abs(o.stats.activeExperiences.deltaPct),
				direction: o.stats.activeExperiences.delta7d >= 0 ? "up" : "down",
				label: "% vs last 7d",
			},
			sub: `${o.stats.activeExperiences.delta7d >= 0 ? "+" : ""}${o.stats.activeExperiences.delta7d} this week`,
			color: "#3b82f6",
			spark: o.stats.activeExperiences.sparkline.map(v => ({ v })),
		},
		{
			label: "Post Reach (7d)",
			value: o.stats.postReach7d.value,
			trend: {
				value: Math.abs(o.stats.postReach7d.deltaPct),
				direction: o.stats.postReach7d.delta7d >= 0 ? "up" : "down",
				label: "% vs last 7d",
			},
			sub: `${o.stats.postReach7d.delta7d >= 0 ? "+" : ""}${o.stats.postReach7d.delta7d} this week`,
			color: "#22c55e",
			spark: o.stats.postReach7d.sparkline.map(v => ({ v })),
		},
		{
			label: "Messages (7d)",
			value: o.stats.messages7d.value,
			trend: {
				value: Math.abs(o.stats.messages7d.deltaPct),
				direction: o.stats.messages7d.delta7d >= 0 ? "up" : "down",
				label: "% vs last 7d",
			},
			sub: `${o.stats.messages7d.delta7d >= 0 ? "+" : ""}${o.stats.messages7d.delta7d} this week`,
			color: "#f59e0b",
			spark: o.stats.messages7d.sparkline.map(v => ({ v })),
		},
	]

	const managers: CommunityDetailManager[] = o.managers
		.filter(m => m.role in DISPLAY_ROLES)
		.map(m => ({
			id: m.userId,
			name: `${m.firstName} ${m.lastName}`,
			initial: m.firstName[0].toUpperCase(),
			avatarUrl: m.avatarUrl,
			role: DISPLAY_ROLES[m.role],
		}))

	const upcomingExperiences: CommunityDetailExperience[] = o.upcomingExperiences.map(e => ({
		id: e.id,
		title: e.title,
		date: new Date(e.eventDate).toLocaleDateString("en-GB", {
			weekday: "short", day: "numeric", month: "short",
		}),
		venue: e.city,
		attendeeCount: e.attendeeCount,
		rating: e.avgRating,
		coverUrl: e.coverUrl,
		coverInitial: e.title[0].toUpperCase(),
	}))

	const recentActivity: CommunityDetailActivity[] = o.recentActivity
		.filter(a => a.type in ACTIVITY_TYPE_MAP)
		.map((a, i) => ({
			id: `${a.type}-${i}`,
			type: ACTIVITY_TYPE_MAP[a.type],
			title: a.title,
			description: a.actor ?? "",
			timeAgo: toTimeAgo(a.at),
		}))

	const eng = o.topEngagement7d
	const engMax = Math.max(eng.posts, eng.comments, eng.reactions, eng.shares, eng.newMembers, 1)
	const topEngagement: CommunityDetailEngagement[] = [
		{ label: "Posts",       value: eng.posts,       max: engMax, color: "#a855f7" },
		{ label: "Comments",    value: eng.comments,    max: engMax, color: "#3b82f6" },
		{ label: "Reactions",   value: eng.reactions,   max: engMax, color: "#ef4444" },
		{ label: "Shares",      value: eng.shares,      max: engMax, color: "#f59e0b" },
		{ label: "New Members", value: eng.newMembers,  max: engMax, color: "#22c55e" },
	]

	return {
		id: o.community.id,
		slug: o.community.slug,
		name: o.community.name,
		description: o.community.description,
		thumbnailUrl: o.community.coverUrl,
		iconUrl: o.community.iconUrl,
		isMeetdayManaged: o.community.type === "MEETDAY_MANAGED_PUBLIC",
		access: o.community.access,
		communityUrl: o.community.url,
		status: o.community.status,
		createdAt: o.community.createdAt,
		statCards,
		managers,
		upcomingExperiences,
		recentActivity,
		topEngagement,
	}
}

// ─── Experiences Tab types ─────────────────────────────────────────────────────

export type CommunityExperienceStatus = "UPCOMING" | "LIVE" | "COMPLETED" | "DRAFT" | "CANCELLED"

export type CommunityExperienceItem = {
	id: string
	name: string
	coverUrl: string | null
	coverColor: string
	coverInitial: string
	tags: string[]
	date: string
	time: string
	status: CommunityExperienceStatus
	bookingsSold: number
	bookingsTotal: number
	revenue: number
	visibility: "PUBLIC" | "PRIVATE" | "DRAFT"
}

export type ExperienceTabCounts = {
	all: number; upcoming: number; live: number
	completed: number; drafts: number; cancelled: number
}

export type ExperiencePerf30d = {
	bookings:      { value: number; deltaPct: number }
	revenue:       { value: number; deltaPct: number }
	attendanceRate:{ value: number | null; deltaPct: number }
}

export type ExperienceTopPerformer = {
	id: string; name: string
	coverUrl: string | null; coverColor: string; coverInitial: string
	bookings: number; revenue: number
}

export type CommunityExperienceTabStats = {
	totalExperiences: number; upcoming: number; completed: number
	totalBookings: number; totalRevenue: number
}

export type CommunityExperienceTabData = {
	stats:        CommunityExperienceTabStats
	tabCounts:    ExperienceTabCounts
	experiences:  CommunityExperienceItem[]
	total:        number
	page:         number
	performance30d: ExperiencePerf30d
	topPerforming: ExperienceTopPerformer[]
}

export type ExperienceTabParams = {
	status?: string; search?: string; sort?: string; page?: number; limit?: number
}

// ─── Experiences Tab API types ─────────────────────────────────────────────────

type ApiExpItem = {
	id: string; title: string; coverUrl: string | null; tags: string[]
	eventDate: string; startTime: string; computedStatus: CommunityExperienceStatus
	bookings: { confirmed: number; capacity: number; pct: number }
	revenue: number; visibility: "PUBLIC" | "PRIVATE" | "DRAFT"
}

type ApiExpResponse = {
	stats: { totalExperiences: number; upcoming: number; completed: number; totalBookings: number; totalRevenue: number }
	tabCounts: ExperienceTabCounts
	experiences: ApiExpItem[]
	total: number; page: number; limit: number
	sidebar: {
		performance30d: ExperiencePerf30d
		topExperiences: { id: string; title: string; coverUrl: string | null; bookings: number; revenue: number }[]
	}
}

const EXP_COVER_COLORS = ["#1a0533", "#0c1a2e", "#1a0a05", "#0a1a0c", "#1a051a", "#051028"]
function expCoverColor(id: string): string {
	let h = 0
	for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff
	return EXP_COVER_COLORS[h % EXP_COVER_COLORS.length]
}

export async function getCommunityExperiencesTab(
	communityId: string,
	params: ExperienceTabParams = {},
): Promise<CommunityExperienceTabData> {
	const qs = new URLSearchParams()
	if (params.status && params.status !== "ALL") qs.set("status", params.status)
	if (params.search) qs.set("search", params.search)
	if (params.sort)   qs.set("sort", params.sort)
	if (params.page)   qs.set("page", String(params.page))
	if (params.limit)  qs.set("limit", String(params.limit))

	const { data: o } = await apiClient.get<ApiExpResponse>(
		`/admin/communities/${communityId}/experiences?${qs}`,
	)

	const experiences: CommunityExperienceItem[] = o.experiences.map(e => ({
		id:           e.id,
		name:         e.title,
		coverUrl:     e.coverUrl,
		coverColor:   expCoverColor(e.id),
		coverInitial: e.title[0].toUpperCase(),
		tags:         e.tags,
		date:         new Date(e.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
		time:         `${new Date(e.eventDate).toLocaleDateString("en-US", { weekday: "short" })} • ${e.startTime}`,
		status:       e.computedStatus,
		bookingsSold: e.bookings.confirmed,
		bookingsTotal:e.bookings.capacity,
		revenue:      e.revenue,
		visibility:   e.visibility,
	}))

	const topPerforming: ExperienceTopPerformer[] = o.sidebar.topExperiences.map(t => ({
		id:           t.id,
		name:         t.title,
		coverUrl:     t.coverUrl,
		coverColor:   expCoverColor(t.id),
		coverInitial: t.title[0].toUpperCase(),
		bookings:     t.bookings,
		revenue:      t.revenue,
	}))

	return {
		stats:          o.stats,
		tabCounts:      o.tabCounts,
		experiences,
		total:          o.total,
		page:           o.page,
		performance30d: o.sidebar.performance30d,
		topPerforming,
	}
}

// ─── Members Tab types ─────────────────────────────────────────────────────────

export type CommunityMemberRole   = "Member" | "Moderator" | "Manager" | "Owner"
export type CommunityMemberStatus = "Active" | "Inactive" | "Banned"

export type CommunityMemberItem = {
	id: string
	name: string
	handle: string
	avatarColor: string
	avatarInitial: string
	joinDate: string
	joinTime: string
	lastActive: string
	lastActiveTime: string
	engagementPct: number
	role: CommunityMemberRole
	status: CommunityMemberStatus
	isNew: boolean
}

export type CommunityMembersTabStats = {
	totalMembers: number
	activeMembers: number
	activeMembersGrowth: number
	newMembers: number
	newMembersGrowth: number
	engagementRate: number
	engagementRateGrowth: number
	retentionRate: number
	retentionRateGrowth: number
	inactiveMembers: number
	bannedMembers: number
}

export type CommunityMembersTabData = {
	stats: CommunityMembersTabStats
	topCities:  { city: string; pct: number; color: string }[]
	segments:   { label: string; pct: number; color: string }[]
	members: CommunityMemberItem[]
}

// ─── Members Tab mock data ──────────────────────────────────────────────────────

const MOCK_MEMBERS_STATS: CommunityMembersTabStats = {
	totalMembers: 1248,
	activeMembers: 786,        activeMembersGrowth: 12,
	newMembers: 142,           newMembersGrowth: 18,
	engagementRate: 62,        engagementRateGrowth: 8,
	retentionRate: 72,         retentionRateGrowth: 6,
	inactiveMembers: 216,
	bannedMembers: 12,
}

const MOCK_TOP_CITIES = [
	{ city: "Kolkata",   pct: 38, color: "#9333ea" },
	{ city: "Mumbai",    pct: 22, color: "#3b82f6" },
	{ city: "Delhi",     pct: 18, color: "#22c55e" },
	{ city: "Bangalore", pct: 12, color: "#f59e0b" },
	{ city: "Others",    pct: 10, color: "#9ca3af" },
]

const MOCK_MEMBER_SEGMENTS = [
	{ label: "Music Lovers",    pct: 52, color: "#9333ea" },
	{ label: "Creative Pros",   pct: 22, color: "#3b82f6" },
	{ label: "Night Explorers", pct: 16, color: "#22c55e" },
	{ label: "Event Hosts",     pct: 10, color: "#f59e0b" },
]

const MOCK_MEMBERS: CommunityMemberItem[] = [
	{ id: "mem-1", name: "Rishav Sen",    handle: "@rishav.live",    avatarColor: "#3b82f6", avatarInitial: "R", joinDate: "May 18, 2024", joinTime: "9:42 PM",  lastActive: "Today",       lastActiveTime: "2:15 PM",  engagementPct: 85, role: "Member",    status: "Active",   isNew: true },
	{ id: "mem-2", name: "Ananya Gupta",  handle: "@ananya.music",   avatarColor: "#ec4899", avatarInitial: "A", joinDate: "May 17, 2024", joinTime: "6:10 PM",  lastActive: "Today",       lastActiveTime: "11:30 AM", engagementPct: 78, role: "Member",    status: "Active",   isNew: true },
	{ id: "mem-3", name: "Arjun Mehta",   handle: "@arjun.beats",    avatarColor: "#f59e0b", avatarInitial: "A", joinDate: "May 16, 2024", joinTime: "4:05 PM",  lastActive: "Yesterday",   lastActiveTime: "10:45 PM", engagementPct: 54, role: "Member",    status: "Active",   isNew: true },
	{ id: "mem-4", name: "Neha Patel",    handle: "@neha.vibes",     avatarColor: "#f43f5e", avatarInitial: "N", joinDate: "May 15, 2024", joinTime: "3:22 PM",  lastActive: "3 days ago",  lastActiveTime: "8:20 PM",  engagementPct: 48, role: "Moderator", status: "Active",   isNew: false },
	{ id: "mem-5", name: "Kabir Singh",   handle: "@kabir.collects", avatarColor: "#6366f1", avatarInitial: "K", joinDate: "May 14, 2024", joinTime: "1:11 PM",  lastActive: "7 days ago",  lastActiveTime: "9:15 PM",  engagementPct: 22, role: "Member",    status: "Inactive", isNew: false },
	{ id: "mem-6", name: "Ishita Roy",    handle: "@ishita.roy",     avatarColor: "#a855f7", avatarInitial: "I", joinDate: "May 13, 2024", joinTime: "12:08 PM", lastActive: "10 days ago", lastActiveTime: "6:40 PM",  engagementPct: 18, role: "Member",    status: "Inactive", isNew: false },
	{ id: "mem-7", name: "Rohan Das",     handle: "@rohan.das",      avatarColor: "#22c55e", avatarInitial: "R", joinDate: "May 12, 2024", joinTime: "10:33 AM", lastActive: "1 day ago",   lastActiveTime: "7:05 PM",  engagementPct: 70, role: "Member",    status: "Active",   isNew: false },
	{ id: "mem-8", name: "Meera Nair",    handle: "@meera.nair",     avatarColor: "#f97316", avatarInitial: "M", joinDate: "May 10, 2024", joinTime: "8:55 PM",  lastActive: "15 days ago", lastActiveTime: "11:10 AM", engagementPct: 15, role: "Member",    status: "Banned",   isNew: false },
]

// ─── Members Tab API ────────────────────────────────────────────────────────────

export async function getCommunityMembersTab(communityId: string): Promise<CommunityMembersTabData> {
	// TODO: const { data } = await apiClient.get<CommunityMembersTabData>(`/admin/communities/${communityId}/members/tab`)
	// TODO: return data
	void communityId
	await new Promise(r => setTimeout(r, 600))
	return { stats: MOCK_MEMBERS_STATS, topCities: MOCK_TOP_CITIES, segments: MOCK_MEMBER_SEGMENTS, members: MOCK_MEMBERS }
}

// ─── Feed Tab ─────────────────────────────────────────────────────────────────

export type CommunityPostType   = "Photo" | "Text" | "Poll"
export type CommunityPostStatus = "Queue" | "Published" | "Rejected" | "Pinned" | "Reported"

export type CommunityFeedPost = {
	id:                  string
	authorName:          string
	authorAvatarUrl:     string | null
	authorAvatarColor:   string
	authorAvatarInitial: string
	authorBadge:         null
	timeAgo:             string
	postType:            CommunityPostType
	content:             string
	hashtags:            string[]
	mediaThumbnail:      string | null
	comments:            number
	reactions:           number
	views:               number
	status:              CommunityPostStatus
	pendingReportCount:  number
}

export type FeedPostsParams = {
	status?:   string
	postType?: string
	search?:   string
	sort?:     string
	from?:     string
	to?:       string
	page?:     number
	limit?:    number
}

export type CommunityFeedPostsData = {
	posts:      CommunityFeedPost[]
	total:      number
	page:       number
	totalPages: number
}

export type CommunityFeedOverviewItem = {
	label:       string
	value:       string
	growth:      number
	direction:   "up" | "down"
	color:       string
	sparkline:   number[]
}

export type CommunityModerationTool = {
	label:       string
	description: string
	iconKey:     "shield" | "speaker" | "warning" | "bell"
	color:       string
	bg:          string
}

export type CommunityRecentReport = {
	id:                    string
	postId:                string
	postSnippet:           string | null
	type:                  string
	reporterName:          string
	reporterAvatarUrl:     string | null
	reporterAvatarColor:   string
	reporterAvatarInitial: string
	severityColor:         "red" | "yellow" | "green"
	timeAgo:               string
}

export type CommunityFeedStats = {
	postQueue:  number
	published:  number
	reported:   number
	pinned:     number
}

export type CommunityFeedTabData = {
	stats:           CommunityFeedStats
	overview:        CommunityFeedOverviewItem[]
	moderationTools: CommunityModerationTool[]
	recentReports:   CommunityRecentReport[]
	tip:             string
}

// ─── Feed Overview API ────────────────────────────────────────────────────────

type ApiFeedOverviewMetric = { value: number; deltaPct: number; sparkline: number[] }
type ApiFeedOverviewData = {
	totalPosts:       ApiFeedOverviewMetric
	engagement:       ApiFeedOverviewMetric
	reportsReceived:  ApiFeedOverviewMetric
	postsApproved:    ApiFeedOverviewMetric
}

const FEED_OVERVIEW_CONFIG: {
	key: keyof ApiFeedOverviewData; label: string; color: string
}[] = [
	{ key: "totalPosts",      label: "Total Posts",      color: "#a855f7" },
	{ key: "engagement",      label: "Engagement",       color: "#22c55e" },
	{ key: "reportsReceived", label: "Reports Received", color: "#ef4444" },
	{ key: "postsApproved",   label: "Posts Approved",   color: "#3b82f6" },
]

function formatOverviewValue(v: number): string {
	if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
	return String(v)
}

const MOCK_MODERATION_TOOLS: CommunityModerationTool[] = [
	{ label: "Auto-moderation",  description: "Manage keywords and filters",     iconKey: "shield",  color: "text-green-500",  bg: "bg-green-50" },
	{ label: "Muted Words",      description: "24 words configured",             iconKey: "speaker", color: "text-blue-500",   bg: "bg-blue-50" },
	{ label: "Member Warnings",  description: "12 active warnings",              iconKey: "warning", color: "text-amber-500",  bg: "bg-amber-50" },
	{ label: "Content Alerts",   description: "Real-time monitoring active",     iconKey: "bell",    color: "text-indigo-500", bg: "bg-indigo-50" },
]

// ─── Recent Reports API ───────────────────────────────────────────────────────

type ApiRecentReport = {
	reportId:      string
	postId:        string
	postSnippet:   string | null
	reporter:      { name: string; avatarUrl: string | null }
	reason:        string
	body:          string | null
	label:         string
	severityColor: string
	reportedAt:    string
}

const REPORT_AVATAR_COLORS = ["#3b82f6","#ec4899","#f59e0b","#6366f1","#22c55e","#f43f5e","#a855f7"]
function reporterAvatarColor(name: string): string {
	let h = 0
	for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff
	return REPORT_AVATAR_COLORS[h % REPORT_AVATAR_COLORS.length]
}

function toSeverityColor(s: string): CommunityRecentReport["severityColor"] {
	if (s === "red" || s === "green") return s
	return "yellow"
}

// ─── Feed Posts API ───────────────────────────────────────────────────────────

type ApiFeedPost = {
	id: string
	postType: "TEXT" | "PHOTO" | "POLL"
	status: "PENDING" | "PUBLISHED" | "REJECTED" | "DELETED"
	content: string
	mediaUrls: string[]
	author: { id: string; name: string; avatarUrl: string | null }
	pendingReportCount: number
	counts: { reactions: number; comments: number; shares: number; views: number }
	isPinned: boolean
	deletedAt: string | null
	createdAt: string
}

type ApiFeedPostsResponse = {
	items: ApiFeedPost[]
	total: number
	page: number
	limit: number
	totalPages: number
}

const FEED_POST_AUTHOR_COLORS = ["#3b82f6","#ec4899","#f59e0b","#6366f1","#22c55e","#f43f5e","#a855f7"]
function feedAuthorColor(id: string): string {
	let h = 0
	for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff
	return FEED_POST_AUTHOR_COLORS[h % FEED_POST_AUTHOR_COLORS.length]
}

function mapFeedPostStatus(apiStatus: string, isPinned: boolean): CommunityPostStatus {
	if (isPinned && apiStatus === "PUBLISHED") return "Pinned"
	const m: Record<string, CommunityPostStatus> = {
		PENDING: "Queue", PUBLISHED: "Published", REJECTED: "Rejected",
	}
	return m[apiStatus] ?? "Published"
}

const FEED_POST_TYPE_MAP: Record<string, CommunityPostType> = {
	TEXT: "Text", PHOTO: "Photo", POLL: "Poll",
}

export async function getCommunityFeedPosts(
	communityId: string,
	params: FeedPostsParams = {},
): Promise<CommunityFeedPostsData> {
	const qs = new URLSearchParams()
	if (params.status)   qs.set("status",   params.status)
	if (params.postType) qs.set("postType",  params.postType)
	if (params.search)   qs.set("search",    params.search)
	if (params.sort)     qs.set("sort",      params.sort)
	if (params.from)     qs.set("from",      params.from)
	if (params.to)       qs.set("to",        params.to)
	if (params.page)     qs.set("page",      String(params.page))
	if (params.limit)    qs.set("limit",     String(params.limit))
	const { data: o } = await apiClient.get<ApiFeedPostsResponse>(
		`/admin/communities/${communityId}/feed/posts?${qs}`,
	)
	return {
		posts: o.items.map(item => ({
			id:                  item.id,
			authorName:          item.author.name,
			authorAvatarUrl:     item.author.avatarUrl,
			authorAvatarColor:   feedAuthorColor(item.author.id),
			authorAvatarInitial: item.author.name[0]?.toUpperCase() ?? "?",
			authorBadge:         null,
			timeAgo:             toTimeAgo(item.createdAt),
			postType:            FEED_POST_TYPE_MAP[item.postType] ?? "Text",
			content:             item.content,
			hashtags:            item.content.match(/#\w+/g) ?? [],
			mediaThumbnail:      item.mediaUrls[0] ?? null,
			comments:            item.counts.comments,
			reactions:           item.counts.reactions,
			views:               item.counts.views,
			status:              mapFeedPostStatus(item.status, item.isPinned),
			pendingReportCount:  item.pendingReportCount,
		})),
		total:      o.total,
		page:       o.page,
		totalPages: o.totalPages,
	}
}

export async function approveFeedPost(communityId: string, postId: string): Promise<void> {
	await apiClient.post(`/admin/communities/${communityId}/feed/posts/${postId}/approve`)
}

export async function rejectFeedPost(communityId: string, postId: string): Promise<void> {
	await apiClient.post(`/admin/communities/${communityId}/feed/posts/${postId}/reject`)
}

export async function deleteFeedPost(communityId: string, postId: string): Promise<void> {
	await apiClient.delete(`/admin/communities/${communityId}/feed/posts/${postId}`)
}

export async function pinFeedPost(communityId: string, postId: string): Promise<void> {
	await apiClient.post(`/admin/communities/${communityId}/feed/posts/${postId}/pin`)
}

export async function unpinFeedPost(communityId: string, postId: string): Promise<void> {
	await apiClient.delete(`/admin/communities/${communityId}/feed/posts/${postId}/pin`)
}

export async function resolveFeedReport(communityId: string, reportId: string): Promise<void> {
	await apiClient.patch(`/admin/communities/${communityId}/feed/reports/${reportId}/resolve`)
}

export async function dismissFeedReport(communityId: string, reportId: string): Promise<void> {
	await apiClient.patch(`/admin/communities/${communityId}/feed/reports/${reportId}/dismiss`)
}

export type CreateFeedPostRequest = {
	postType: "TEXT" | "PHOTO" | "POLL"
	category: "GENERAL" | "MEMORIES" | "RECOMMENDATION" | "QUESTION" | "POLL"
	content: string
	mediaKeys?: string[]
	pollOptions?: string[]
}

export async function createFeedPost(
	communityId: string,
	payload: CreateFeedPostRequest,
): Promise<{ id: string; status: string; createdAt: string }> {
	const { data } = await apiClient.post<{ id: string; status: string; createdAt: string }>(
		`/admin/communities/${communityId}/feed/posts`,
		payload,
	)
	return data
}

// ─── Announcements Tab ────────────────────────────────────────────────────────

export type AnnouncementStatus = "Published" | "Scheduled" | "Draft"

export type AnnouncementItem = {
	id:              string
	title:           string
	status:          AnnouncementStatus
	content:         string
	imageUrl:        string | null
	imageGradient:   string
	isPinned:        boolean
	// Published
	authorName:      string
	authorInitial:   string
	authorAvatarColor: string
	timeAgo:         string | null
	views:           number | null
	likes:           number | null
	bookmarks:       number | null
	// Scheduled
	scheduledFor:    string | null
}

export type AnnouncementsTabStats = {
	published:        number
	scheduled:        number
	drafts:           number
	totalReach:       string
	totalReachGrowth: number
}

export type AnnouncementsTabData = {
	stats:         AnnouncementsTabStats
	announcements: AnnouncementItem[]
}

// ─── Announcements Tab — API response type ────────────────────────────────────

type ApiAnnouncementItem = {
	id: string
	communityId: string
	authorId: string
	authorRole: string
	category: string
	title: string
	body: string
	imageKey: string | null
	status: "PUBLISHED" | "SCHEDULED" | "DRAFT"
	scheduledAt: string | null
	isPinned: boolean
	pinnedAt: string | null
	likeCount: number
	bookmarkCount: number
	reachCount: number
	publishedAt: string | null
	deletedAt: string | null
	createdAt: string
	updatedAt: string
	author: { id: string; name: string; avatarUrl: string | null; isBrand: boolean }
	imageUrl: string | null
}

const ANN_STATUS_MAP: Record<ApiAnnouncementItem["status"], AnnouncementStatus> = {
	PUBLISHED: "Published",
	SCHEDULED: "Scheduled",
	DRAFT:     "Draft",
}

const ANN_CATEGORY_GRADIENT: Record<string, string> = {
	COMMUNITY_UPDATE:    "linear-gradient(135deg,#1e3a5f,#1d4ed8,#0ea5e9)",
	EVENT_REMINDER:      "linear-gradient(135deg,#92400e,#b45309,#f59e0b)",
	EVENT_DROP:          "linear-gradient(135deg,#064e3b,#065f46,#10b981)",
	EVENT_ANNOUNCEMENT:  "linear-gradient(135deg,#4c1d95,#7c3aed,#db2777)",
	ALERT:               "linear-gradient(135deg,#7f1d1d,#991b1b,#ef4444)",
	PROMOTION:           "linear-gradient(135deg,#1e1b4b,#312e81,#ec4899)",
	NEWS:                "linear-gradient(135deg,#1e293b,#334155,#475569)",
	MILESTONE:           "linear-gradient(135deg,#3b0764,#6b21a8,#a855f7)",
}
const ANN_DEFAULT_GRADIENT = "linear-gradient(135deg,#1c1917,#292524,#44403c)"

const ANN_AVATAR_COLORS = ["#6366f1","#f59e0b","#ec4899","#22c55e","#3b82f6","#a855f7","#f97316"]

function formatScheduledAt(iso: string): string {
	const d = new Date(iso)
	return (
		d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
		" • " +
		d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
	)
}


export async function getCommunityAnnouncementsTab(communityId: string): Promise<AnnouncementsTabData> {
	const [{ data: listData }, { data: statsData }] = await Promise.all([
		apiClient.get<{
			items: ApiAnnouncementItem[]
			total: number
			page: number
			limit: number
			totalPages: number
		}>(`/admin/communities/${communityId}/announcements`, { params: { limit: 50 } }),
		apiClient.get<{
			published: number
			scheduled: number
			drafts: number
			totalReach: { value: number; changePercent: number | null; windowDays: number }
		}>(`/admin/communities/${communityId}/announcements/stats`),
	])

	const items = listData.items

	const announcements: AnnouncementItem[] = items.map((item, i) => {
		const status      = ANN_STATUS_MAP[item.status] ?? "Draft"
		const isPublished = status === "Published"
		const isScheduled = status === "Scheduled"
		return {
			id:               item.id,
			title:            item.title,
			status,
			content:          item.body,
			imageUrl:         item.imageUrl ?? null,
			imageGradient:    ANN_CATEGORY_GRADIENT[item.category] ?? ANN_DEFAULT_GRADIENT,
			isPinned:         item.isPinned,
			authorName:       item.author.name,
			authorInitial:    item.author.name?.[0]?.toUpperCase() ?? "?",
			authorAvatarColor: ANN_AVATAR_COLORS[i % ANN_AVATAR_COLORS.length],
			timeAgo:          isPublished && item.publishedAt ? toTimeAgo(item.publishedAt) : null,
			views:            isPublished ? item.reachCount    : null,
			likes:            isPublished ? item.likeCount     : null,
			bookmarks:        isPublished ? item.bookmarkCount : null,
			scheduledFor:     isScheduled && item.scheduledAt ? formatScheduledAt(item.scheduledAt) : null,
		}
	})

	const reachVal   = statsData.totalReach.value
	const totalReach = reachVal >= 1000 ? `${(reachVal / 1000).toFixed(1)}K` : String(reachVal)
	const reachGrowth = statsData.totalReach.changePercent ?? 0

	return {
		stats: {
			published:        statsData.published,
			scheduled:        statsData.scheduled,
			drafts:           statsData.drafts,
			totalReach,
			totalReachGrowth: reachGrowth,
		},
		announcements,
	}
}

export async function getCommunityFeedTab(communityId: string): Promise<CommunityFeedTabData> {
	const [{ data: statsData }, { data: overviewData }, { data: reportsData }] = await Promise.all([
		apiClient.get<CommunityFeedStats>(`/admin/communities/${communityId}/feed/stats`),
		apiClient.get<ApiFeedOverviewData>(`/admin/communities/${communityId}/feed/overview`),
		apiClient.get<ApiRecentReport[]>(`/admin/communities/${communityId}/feed/reports/recent`),
	])
	const overview: CommunityFeedOverviewItem[] = FEED_OVERVIEW_CONFIG.map(cfg => {
		const m = overviewData[cfg.key]
		return {
			label:     cfg.label,
			value:     formatOverviewValue(m.value),
			growth:    Math.abs(m.deltaPct),
			direction: m.deltaPct >= 0 ? "up" : "down",
			color:     cfg.color,
			sparkline: m.sparkline,
		}
	})
	const recentReports: CommunityRecentReport[] = reportsData.map(r => ({
		id:                    r.reportId,
		postId:                r.postId,
		postSnippet:           r.postSnippet,
		type:                  r.label,
		reporterName:          r.reporter.name,
		reporterAvatarUrl:     r.reporter.avatarUrl,
		reporterAvatarColor:   reporterAvatarColor(r.reporter.name),
		reporterAvatarInitial: r.reporter.name[0]?.toUpperCase() ?? "?",
		severityColor:         toSeverityColor(r.severityColor),
		timeAgo:               toTimeAgo(r.reportedAt),
	}))
	return {
		stats:           statsData,
		overview,
		moderationTools: MOCK_MODERATION_TOOLS,
		recentReports,
		tip:             "Use pinned posts to highlight important updates or community guidelines.",
	}
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

export type ChatChannel = {
	id: string
	name: string
	description: string
	slug: string
	isDefault: boolean
	position: number
	welcomeTitle: string
	welcomeBody: string
	quickReplies: string[]
	iconColor: string
}

export type ChatTabData = {
	totalChannels: number
	channels: ChatChannel[]
}


// ─── Channel management ───────────────────────────────────────────────────────

export type CreateChannelRequest = {
	name: string
	description?: string
	welcomeTitle?: string
	welcomeBody?: string
	quickReplies?: string[]
}

export type UpdateChannelRequest = Partial<CreateChannelRequest>

export async function createCommunityChannel(
	communityId: string,
	body: CreateChannelRequest,
): Promise<ApiChannelEntry> {
	const { data } = await apiClient.post<ApiChannelEntry>(`/communities/${communityId}/channels`, body)
	return data
}

export async function updateCommunityChannel(
	communityId: string,
	channelId: string,
	body: UpdateChannelRequest,
): Promise<void> {
	await apiClient.patch(`/communities/${communityId}/channels/${channelId}`, body)
}

export async function deleteCommunityChannel(
	communityId: string,
	channelId: string,
): Promise<void> {
	await apiClient.delete(`/communities/${communityId}/channels/${channelId}`)
}

export async function reorderCommunityChannels(
	communityId: string,
	orderedIds: string[],
): Promise<void> {
	await apiClient.patch(`/communities/${communityId}/channels/order`, { orderedIds })
}

type ApiChannelEntry = {
	id: string
	name: string
	slug: string
	description: string
	isDefault: boolean
	position: number
	welcomeTitle: string
	welcomeBody: string
	quickReplies: string[]
}

const CHANNEL_ICON_COLORS = ["#6366f1", "#f59e0b", "#ec4899", "#ef4444", "#a855f7", "#22c55e", "#3b82f6", "#f97316"]

export async function getCommunityChat(communityId: string): Promise<ChatTabData> {
	const { data } = await apiClient.get<ApiChannelEntry[]>(`/communities/${communityId}/channels`)

	const channels: ChatChannel[] = data.map((ch, i) => ({
		id:           ch.id,
		name:         ch.name,
		description:  ch.description ?? "",
		slug:         ch.slug,
		isDefault:    ch.isDefault,
		position:     ch.position,
		welcomeTitle: ch.welcomeTitle ?? "",
		welcomeBody:  ch.welcomeBody ?? "",
		quickReplies: ch.quickReplies ?? [],
		iconColor:    CHANNEL_ICON_COLORS[i % CHANNEL_ICON_COLORS.length],
	}))

	return {
		totalChannels: channels.length,
		channels,
	}
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

export type AnalyticsTabStats = {
	members: number; membersGrowth: number
	activeMembers: number; activeMembersGrowth: number
	experiencesBooked: number; experiencesBookedGrowth: number
	communityRevenue: string; communityRevenueGrowth: number
	retention: number; retentionGrowth: number
}

export type GrowthDataPoint = {
	label: string; membersJoined: number; membersLeft: number; netGrowth: number
}

export type EngagementBreakdownItem = {
	label: string; value: number; growth: number; barColor: string
}

export type AnalyticsTopExperience = {
	id: string; name: string; imageGradient: string
	bookings: number; revenue: string; attendancePct: number
}

export type HealthFactor = { label: string; score: number; max: number }

export type AnalyticsInterestSegment = { label: string; pct: number; color: string }

export type AnalyticsTopCity = { city: string; pct: number; color: string }

export type AgeGroup = { range: string; pct: number }

export type TopContributor = {
	rank: number; name: string; handle: string
	avatarUrl: string | null; avatarColor: string; avatarInitial: string; points: number
}

export type AnalyticsTopHost = {
	id: string; name: string; handle: string
	avatarUrl: string | null; avatarColor: string; avatarInitial: string; eventCount: number
}

export type AnalyticsTabData = {
	stats:               AnalyticsTabStats
	growthData:          GrowthDataPoint[]
	growthSummary:       { membersJoined: number; membersLeft: number; netGrowth: number; growthRate: number }
	engagementBreakdown: EngagementBreakdownItem[]
	experiencesImpact:   { totalBookings: number; bookingsGrowth: number }
	topExperiences:      AnalyticsTopExperience[]
	communityHealth:     { score: number; maxScore: number; label: string; factors: HealthFactor[] }
	interests:           AnalyticsInterestSegment[]
	topCities:           AnalyticsTopCity[]
	ageDistribution:     AgeGroup[]
	topContributors:     TopContributor[]
	topHosts:            AnalyticsTopHost[]
}

// ─── Analytics API types ───────────────────────────────────────────────────────

type ApiAnalyticsMetric   = { value: number; deltaPct: number }
type ApiEngagementMetric  = { value: number; changePct: number }

type ApiAnalyticsData = {
	summary: {
		members: ApiAnalyticsMetric; activeMembers: ApiAnalyticsMetric
		experiencesBooked: ApiAnalyticsMetric; communityRevenue: ApiAnalyticsMetric
		retention: ApiAnalyticsMetric
	}
	growth: {
		series: { date: string; joined: number; left: number; netGrowth: number }[]
		totalJoined: number; totalLeft: number; netGrowth: number; growthRatePct: number
	}
	engagement: {
		posts: ApiEngagementMetric; comments: ApiEngagementMetric
		reactions: ApiEngagementMetric; shares: ApiEngagementMetric
		chatMessages: ApiEngagementMetric; announcementReach: ApiEngagementMetric
	}
	experiencesImpact: {
		totalBookings: { value: number; changePct: number }
		topExperiences: { id: string; title: string; bookings: number; revenue: number; attendancePct: number }[]
	}
	healthScore: {
		total: number; rating: string
		factors: { memberGrowth: number; engagement: number; eventAttendance: number; reportRate: number; retention: number }
	}
	memberInsights: {
		interests: { name: string; pct: number }[]
		topCities: { city: string; pct: number }[]
		ageDistribution: { range: string; label: string; pct: number }[]
	}
	topContributors: { userId: string; name: string; handle: string | null; avatarUrl: string | null; activityScore: number }[]
	topHosts: { userId: string; name: string; handle: string | null; avatarUrl: string | null; eventCount: number }[]
}

// ─── Analytics transform helpers ───────────────────────────────────────────────

const HEALTH_RATING_LABEL: Record<string, string> = {
	EXCELLENT: "Excellent", GOOD: "Good", FAIR: "Fair",
	NEEDS_ATTENTION: "Needs Attention",
}

const EXP_GRADIENTS = [
	"linear-gradient(135deg,#4c1d95,#db2777)",
	"linear-gradient(135deg,#1e3a5f,#0ea5e9)",
	"linear-gradient(135deg,#064e3b,#10b981)",
	"linear-gradient(135deg,#92400e,#f59e0b)",
	"linear-gradient(135deg,#1e1b4b,#6366f1)",
]

const INTEREST_COLORS  = ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#f43f5e", "#06b6d4"]
const CITY_COLORS      = ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#9ca3af"]
const CONTRIB_COLORS   = ["#f59e0b", "#9ca3af", "#cd7f32", "#6366f1", "#3b82f6"]

const ENGAGEMENT_CONFIG: { key: keyof ApiAnalyticsData["engagement"]; label: string; color: string }[] = [
	{ key: "posts",             label: "Posts",              color: "#a855f7" },
	{ key: "comments",          label: "Comments",           color: "#3b82f6" },
	{ key: "reactions",         label: "Reactions",          color: "#ef4444" },
	{ key: "shares",            label: "Shares",             color: "#f59e0b" },
	{ key: "chatMessages",      label: "Chat Messages",      color: "#22c55e" },
	{ key: "announcementReach", label: "Announcement Reach", color: "#06b6d4" },
]

function formatRevenue(paise: number): string {
	const rs = paise / 100
	if (rs >= 10_000_000) return `₹${(rs / 10_000_000).toFixed(1)}Cr`
	if (rs >= 100_000)    return `₹${(rs / 100_000).toFixed(1)}L`
	if (rs >= 1_000)      return `₹${(rs / 1_000).toFixed(0)}K`
	return `₹${rs}`
}

function formatGrowthDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export async function getCommunityAnalytics(communityId: string): Promise<AnalyticsTabData> {
	const { data: o } = await apiClient.get<ApiAnalyticsData>(
		`/admin/communities/${communityId}/analytics`,
	)

	return {
		stats: {
			members:                 o.summary.members.value,
			membersGrowth:           o.summary.members.deltaPct,
			activeMembers:           o.summary.activeMembers.value,
			activeMembersGrowth:     o.summary.activeMembers.deltaPct,
			experiencesBooked:       o.summary.experiencesBooked.value,
			experiencesBookedGrowth: o.summary.experiencesBooked.deltaPct,
			communityRevenue:        formatRevenue(o.summary.communityRevenue.value),
			communityRevenueGrowth:  o.summary.communityRevenue.deltaPct,
			retention:               o.summary.retention.value,
			retentionGrowth:         o.summary.retention.deltaPct,
		},
		growthData: o.growth.series.map(s => ({
			label:         formatGrowthDate(s.date),
			membersJoined: s.joined,
			membersLeft:   s.left,
			netGrowth:     s.netGrowth,
		})),
		growthSummary: {
			membersJoined: o.growth.totalJoined,
			membersLeft:   o.growth.totalLeft,
			netGrowth:     o.growth.netGrowth,
			growthRate:    o.growth.growthRatePct,
		},
		engagementBreakdown: ENGAGEMENT_CONFIG.map(cfg => ({
			label:    cfg.label,
			value:    o.engagement[cfg.key].value,
			growth:   o.engagement[cfg.key].changePct,
			barColor: cfg.color,
		})),
		experiencesImpact: {
			totalBookings:  o.experiencesImpact.totalBookings.value,
			bookingsGrowth: o.experiencesImpact.totalBookings.changePct,
		},
		topExperiences: o.experiencesImpact.topExperiences.map((e, i) => ({
			id:            e.id,
			name:          e.title,
			imageGradient: EXP_GRADIENTS[i % EXP_GRADIENTS.length],
			bookings:      e.bookings,
			revenue:       formatRevenue(e.revenue),
			attendancePct: e.attendancePct,
		})),
		communityHealth: {
			score:    o.healthScore.total,
			maxScore: 100,
			label:    HEALTH_RATING_LABEL[o.healthScore.rating] ?? o.healthScore.rating,
			factors: [
				{ label: "Member Growth",    score: o.healthScore.factors.memberGrowth,   max: 20 },
				{ label: "Engagement",       score: o.healthScore.factors.engagement,      max: 20 },
				{ label: "Event Attendance", score: o.healthScore.factors.eventAttendance, max: 20 },
				{ label: "Report Rate",      score: o.healthScore.factors.reportRate,      max: 20 },
				{ label: "Retention",        score: o.healthScore.factors.retention,       max: 20 },
			],
		},
		interests: o.memberInsights.interests.map((s, i) => ({
			label: s.name,
			pct:   s.pct,
			color: INTEREST_COLORS[i % INTEREST_COLORS.length],
		})),
		topCities: o.memberInsights.topCities.map((c, i) => ({
			city:  c.city,
			pct:   c.pct,
			color: CITY_COLORS[i % CITY_COLORS.length],
		})),
		ageDistribution: o.memberInsights.ageDistribution.map(a => ({
			range: a.label,
			pct:   a.pct,
		})),
		topContributors: o.topContributors.map((c, i) => ({
			rank:          i + 1,
			name:          c.name,
			handle:        c.handle ? `@${c.handle}` : "",
			avatarUrl:     c.avatarUrl,
			avatarColor:   CONTRIB_COLORS[i % CONTRIB_COLORS.length],
			avatarInitial: c.name[0].toUpperCase(),
			points:        c.activityScore,
		})),
		topHosts: o.topHosts.map((h, i) => ({
			id:            h.userId,
			name:          h.name,
			handle:        h.handle ? `@${h.handle}` : "",
			avatarUrl:     h.avatarUrl,
			avatarColor:   CONTRIB_COLORS[i % CONTRIB_COLORS.length],
			avatarInitial: h.name[0].toUpperCase(),
			eventCount:    h.eventCount,
		})),
	}
}

// ─── Managers Tab ─────────────────────────────────────────────────────────────

export type ManagerRoleType = "Owner" | "Manager" | "Moderator" | "View Only"

export type ManagerTeamMember = {
	id: string; name: string
	avatarUrl: string | null; avatarColor: string; avatarInitial: string
	role: ManagerRoleType
}

export type ManagersTabStats = {
	owners: number; managers: number; moderators: number; viewOnly: number; totalUsers: number
}

export type ManagersAccessSummary = { label: string; count: number; pct: number; color: string }

export type ManagersTabData = {
	stats:         ManagersTabStats
	teamMembers:   ManagerTeamMember[]
	accessSummary: ManagersAccessSummary[]
}


type ApiManagerEntry = {
	userId: string
	firstName: string
	lastName: string
	avatarUrl: string | null
	role: string
}

const MANAGER_ROLE_MAP: Record<string, ManagerRoleType> = {
	OWNER:    "Owner",
	MANAGER:  "Manager",
	MODERATOR: "Moderator",
	HOST:     "View Only",
}


const AVATAR_COLORS = ["#f59e0b", "#ec4899", "#6366f1", "#f43f5e", "#22c55e", "#3b82f6", "#a855f7", "#f97316"]

export async function getCommunityManagers(communityId: string): Promise<ManagersTabData> {
	const { data } = await apiClient.get<ApiManagerEntry[]>(`/admin/communities/${communityId}/managers`)

	const teamMembers: ManagerTeamMember[] = data.map((m, i) => {
		const role = MANAGER_ROLE_MAP[m.role] ?? "View Only"
		return {
			id:           m.userId,
			name:         `${m.firstName} ${m.lastName}`,
			avatarUrl:    m.avatarUrl,
			avatarColor:  AVATAR_COLORS[i % AVATAR_COLORS.length],
			avatarInitial: m.firstName[0].toUpperCase(),
			role,
		}
	})

	const counts = { Owner: 0, Manager: 0, Moderator: 0, "View Only": 0 }
	for (const m of teamMembers) counts[m.role]++

	const stats: ManagersTabStats = {
		owners:     counts.Owner,
		managers:   counts.Manager,
		moderators: counts.Moderator,
		viewOnly:   counts["View Only"],
		totalUsers: data.length,
	}

	const total = data.length || 1
	const accessSummary: ManagersAccessSummary[] = [
		{ label: "Owners",     count: counts.Owner,         pct: Math.round(counts.Owner / total * 100),         color: "#a855f7" },
		{ label: "Managers",   count: counts.Manager,       pct: Math.round(counts.Manager / total * 100),       color: "#3b82f6" },
		{ label: "Moderators", count: counts.Moderator,     pct: Math.round(counts.Moderator / total * 100),     color: "#22c55e" },
		{ label: "View Only",  count: counts["View Only"],  pct: Math.round(counts["View Only"] / total * 100),  color: "#f97316" },
	].filter(s => s.count > 0)

	return { stats, teamMembers, accessSummary }
}

// ─── Create Community workflow ────────────────────────────────────────────────

export async function createCommunityDraft(
	payload: CreateCommunityDraftRequest,
): Promise<{ id: string }> {
	const { data } = await apiClient.post<{ id: string }>("/admin/communities", payload)
	return data
}

export async function updateCommunityDraft(
	id: string,
	payload: CreateCommunityDraftRequest,
): Promise<void> {
	await apiClient.patch(`/admin/communities/${id}`, payload)
}


export async function updateCommunitySettings(
	id: string,
	payload: UpdateCommunitySettingsRequest,
): Promise<void> {
	await apiClient.put(`/admin/communities/${id}/settings`, payload)
}

export async function replaceCommunityInterests(
	id: string,
	interestIds: string[],
): Promise<void> {
	await apiClient.put(`/admin/communities/${id}/interests`, { interestIds })
}

export async function setCommunityCities(
	id: string,
	payload: { primaryCity: string; communityCities: string[] },
): Promise<void> {
	await apiClient.put(`/admin/communities/${id}/cities`, payload)
}

export async function attachCommunityEvent(
	id: string,
	eventId: string,
): Promise<void> {
	await apiClient.post(`/admin/communities/${id}/events`, { eventId })
}

export async function resyncCommunityEvents(id: string): Promise<void> {
	await apiClient.post(`/admin/communities/${id}/events/resync`)
}

export async function assignCommunityMember(
	id: string,
	payload: AssignCommunityMemberRequest,
): Promise<void> {
	await apiClient.post(`/admin/communities/${id}/members`, payload)
}

export async function removeCommunityMember(
	communityId: string,
	memberId: string,
): Promise<void> {
	await apiClient.delete(`/admin/communities/${communityId}/members/${memberId}`)
}

export async function detachCommunityEvent(
	communityId: string,
	eventId: string,
): Promise<void> {
	await apiClient.delete(`/admin/communities/${communityId}/events/${eventId}`)
}

export async function publishCommunity(id: string): Promise<void> {
	await apiClient.post(`/admin/communities/${id}/publish`)
}

// ─── Announcements ────────────────────────────────────────────────────────────

export type CreateAnnouncementRequest = {
	category: string
	title: string
	body: string
	imageKey?: string
	scheduledAt?: string
}

export type AnnouncementCreatedResponse = {
	id: string
	communityId: string
	category: string
	title: string
	body: string
	publishedAt: string
}

export async function deleteCommunityAnnouncement(
	communityId: string,
	announcementId: string,
): Promise<void> {
	await apiClient.delete(`/admin/communities/${communityId}/announcements/${announcementId}`)
}

export async function pinCommunityAnnouncement(
	communityId: string,
	announcementId: string,
): Promise<void> {
	await apiClient.post(`/admin/communities/${communityId}/announcements/${announcementId}/pin`)
}

export async function unpinCommunityAnnouncement(
	communityId: string,
	announcementId: string,
): Promise<void> {
	await apiClient.delete(`/admin/communities/${communityId}/announcements/${announcementId}/pin`)
}

export async function createCommunityAnnouncement(
	communityId: string,
	payload: CreateAnnouncementRequest,
): Promise<AnnouncementCreatedResponse> {
	const { data } = await apiClient.post<AnnouncementCreatedResponse>(
		`/admin/communities/${communityId}/announcements`,
		payload,
	)
	return data
}
