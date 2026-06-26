// TODO: Replace all mock data and simulated delays with real API calls via apiClient
// import { apiClient } from "./client"
import { apiClient } from "./client"
import type {
	Community,
	CommunityStatus,
	AssignableCommunityRole,
	CreateCommunityDraftRequest,
	UpdateCommunitySettingsRequest,
	AssignCommunityMemberRequest,
} from "@/types"

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
	id: string,
	status: CommunityStatus,
): Promise<void> {
	// TODO: await apiClient.patch(`/admin/communities/${id}/status`, { status })
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

export async function approveCommunity(id: string): Promise<void> {
	// TODO: await apiClient.post(`/admin/communities/${id}/approve`)
	await new Promise(r => setTimeout(r, 500))
}

export async function rejectCommunity(id: string, reason: string): Promise<void> {
	// TODO: await apiClient.post(`/admin/communities/${id}/reject`, { reason })
	await new Promise(r => setTimeout(r, 500))
}

export async function bulkApproveCommunities(ids: string[]): Promise<void> {
	// TODO: await apiClient.post("/admin/communities/bulk-approve", { ids })
	await new Promise(r => setTimeout(r, 700))
}

export async function bulkRejectCommunities(ids: string[], reason: string): Promise<void> {
	// TODO: await apiClient.post("/admin/communities/bulk-reject", { ids, reason })
	await new Promise(r => setTimeout(r, 700))
}

// ─── Community Detail — API response types ────────────────────────────────────

import type {
	CommunityFeedPosting,
	CommunityChatPermission,
	CommunityDmPolicy,
	CommunityPhotoSharing,
	CommunityAccess,
	CommunityMemberVisibility,
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
	matchPct: number | null
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
	category: { id: string; name: string } | null
	access: CommunityAccess
	primaryCity: string
	communityCities: string[]
	communityUrl: string
	status: CommunityStatus
	createdAt: string
	publishedAt: string | null
	settings: ApiCommunitySettings | null
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
		matchPct: null,
		coverUrl: e.coverUrl,
		coverInitial: e.title[0].toUpperCase(),
	}))

	const recentActivity: CommunityDetailActivity[] = o.recentActivity.map((a, i) => ({
		id: `${a.type}-${i}`,
		type: ACTIVITY_TYPE_MAP[a.type] ?? "post",
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
		category: null,
		access: o.community.access,
		primaryCity: "",
		communityCities: [],
		communityUrl: o.community.url,
		status: o.community.status,
		createdAt: o.community.createdAt,
		publishedAt: null,
		settings: null,
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

export type ExperiencePerfMetric = {
	label: string
	value: string
	trend: { value: number; direction: "up" | "down"; label?: string }
	color: string
	spark: { v: number }[]
}

export type ExperienceTopItem = {
	id: string
	rank: number
	name: string
	coverColor: string
	coverInitial: string
	bookings: number
	revenue: string
}

export type CommunityExperienceTabStats = {
	totalExperiences: number
	upcoming: number
	live: number
	completed: number
	drafts: number
	cancelled: number
	totalBookings: number
	totalRevenue: string
}

export type CommunityExperienceTabData = {
	stats: CommunityExperienceTabStats
	performance: ExperiencePerfMetric[]
	topPerforming: ExperienceTopItem[]
	experiences: CommunityExperienceItem[]
}

// ─── Experiences Tab mock data ─────────────────────────────────────────────────

const MOCK_EXP_STATS: CommunityExperienceTabStats = {
	totalExperiences: 18,
	upcoming: 7,
	live: 2,
	completed: 11,
	drafts: 3,
	cancelled: 0,
	totalBookings: 1248,
	totalRevenue: "₹3.2L",
}

const MOCK_EXP_PERFORMANCE: ExperiencePerfMetric[] = [
	{
		label: "Bookings",
		value: "482",
		trend: { value: 24, direction: "up", label: "%" },
		color: "#9333ea",
		spark: [320, 340, 360, 380, 400, 420, 410, 440, 460, 482].map(v => ({ v })),
	},
	{
		label: "Revenue",
		value: "₹1.42L",
		trend: { value: 18, direction: "up", label: "%" },
		color: "#22c55e",
		spark: [90000, 95000, 100000, 105000, 110000, 120000, 125000, 130000, 138000, 142000].map(v => ({ v })),
	},
	{
		label: "Attendance Rate",
		value: "78%",
		trend: { value: 11, direction: "up", label: "%" },
		color: "#f59e0b",
		spark: [60, 63, 65, 67, 70, 72, 73, 75, 77, 78].map(v => ({ v })),
	},
]

const MOCK_TOP_PERFORMING: ExperienceTopItem[] = [
	{ id: "e-1", rank: 1, name: "Night Rituals",     coverColor: "#1a0533", coverInitial: "N", bookings: 142, revenue: "₹58.8K" },
	{ id: "e-3", rank: 2, name: "After Hours",       coverColor: "#0c1a2e", coverInitial: "A", bookings: 176, revenue: "₹84.3K" },
	{ id: "e-2", rank: 3, name: "Rooftop Sundowner", coverColor: "#1a0a05", coverInitial: "R", bookings: 98,  revenue: "₹36.7K" },
]

const MOCK_EXPERIENCES: CommunityExperienceItem[] = [
	{ id: "e-1", name: "Night Rituals – Deep House Session", coverColor: "#1a0533", coverInitial: "N", tags: ["Music", "DJ Set"],     date: "May 24, 2024", time: "Sat • 8:00 PM",  status: "UPCOMING",  bookingsSold: 142, bookingsTotal: 200, revenue: 58800, visibility: "PUBLIC" },
	{ id: "e-2", name: "Rooftop Sundowner",                  coverColor: "#1a0a05", coverInitial: "R", tags: ["Music", "Rooftop"],    date: "May 26, 2024", time: "Sun • 5:30 PM",  status: "UPCOMING",  bookingsSold: 98,  bookingsTotal: 150, revenue: 36750, visibility: "PUBLIC" },
	{ id: "e-3", name: "After Hours – Techno Takeover",      coverColor: "#0c1a2e", coverInitial: "A", tags: ["Music", "Techno"],     date: "May 31, 2024", time: "Fri • 11:00 PM", status: "UPCOMING",  bookingsSold: 176, bookingsTotal: 250, revenue: 84320, visibility: "PUBLIC" },
	{ id: "e-4", name: "Acoustic Evenings",                  coverColor: "#0a1a0a", coverInitial: "A", tags: ["Music", "Live Band"],  date: "Jun 02, 2024", time: "Sun • 7:00 PM",  status: "DRAFT",     bookingsSold: 0,   bookingsTotal: 100, revenue: 0,     visibility: "DRAFT" },
	{ id: "e-5", name: "Sunset Sessions",                    coverColor: "#1a0a00", coverInitial: "S", tags: ["Music", "Chill"],      date: "May 12, 2024", time: "Sun • 6:00 PM",  status: "COMPLETED", bookingsSold: 120, bookingsTotal: 120, revenue: 45600, visibility: "PUBLIC" },
	{ id: "e-6", name: "Neon Nights",                        coverColor: "#0a1628", coverInitial: "N", tags: ["Music", "DJ Set"],     date: "May 05, 2024", time: "Sun • 9:00 PM",  status: "COMPLETED", bookingsSold: 200, bookingsTotal: 200, revenue: 76000, visibility: "PUBLIC" },
	{ id: "e-7", name: "Vinyl Vibes",                        coverColor: "#1a051a", coverInitial: "V", tags: ["Music", "Vinyl"],      date: "Apr 28, 2024", time: "Sun • 4:00 PM",  status: "COMPLETED", bookingsSold: 88,  bookingsTotal: 100, revenue: 25520, visibility: "PUBLIC" },
	{ id: "e-8", name: "Open Decks Community Night",         coverColor: "#05101a", coverInitial: "O", tags: ["Music", "Open Decks"], date: "Apr 20, 2024", time: "Sat • 8:00 PM",  status: "COMPLETED", bookingsSold: 60,  bookingsTotal: 80,  revenue: 18900, visibility: "PRIVATE" },
]

// ─── Experiences Tab API ───────────────────────────────────────────────────────

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

export async function getCommunityExperiencesTab(communityId: string): Promise<CommunityExperienceTabData> {
	// TODO: const { data } = await apiClient.get<CommunityExperienceTabData>(`/admin/communities/${communityId}/experiences/tab`)
	// TODO: return data
	void communityId
	await new Promise(r => setTimeout(r, 600))
	return {
		stats: MOCK_EXP_STATS,
		performance: MOCK_EXP_PERFORMANCE,
		topPerforming: MOCK_TOP_PERFORMING,
		experiences: MOCK_EXPERIENCES,
	}
}

// ─── Feed Tab ─────────────────────────────────────────────────────────────────

export type CommunityPostType    = "Photo" | "Text" | "Gallery" | "Video" | "Poll"
export type CommunityPostStatus  = "Queue" | "Published" | "Rejected" | "Pinned"
export type CommunityPostBadge   = "New Member" | "Top Contributor" | "Moderator" | "Owner"

export type CommunityFeedPost = {
	id:           string
	authorName:   string
	authorHandle: string
	authorAvatarColor: string
	authorAvatarInitial: string
	authorBadge:  CommunityPostBadge | null
	timeAgo:      string
	postType:     CommunityPostType
	content:      string
	hashtags:     string[]
	imageColor:   string | null  // gradient/color for placeholder image
	comments:     number
	likes:        number
	views:        number
	status:       CommunityPostStatus
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
	id:          string
	type:        string
	reporterName: string
	reporterAvatarColor: string
	reporterAvatarInitial: string
	timeAgo:     string
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
	posts:           CommunityFeedPost[]
	tip:             string
}

const MOCK_FEED_STATS: CommunityFeedStats = {
	postQueue: 12,
	published: 156,
	reported:  8,
	pinned:    3,
}

const MOCK_FEED_OVERVIEW: CommunityFeedOverviewItem[] = [
	{
		label: "Total Posts",  value: "156",  growth: 18, direction: "up",
		color: "#a855f7",
		sparkline: [60, 70, 65, 80, 90, 85, 100, 110, 105, 120, 130, 156],
	},
	{
		label: "Engagement",   value: "2.4K", growth: 22, direction: "up",
		color: "#22c55e",
		sparkline: [900, 1100, 1000, 1300, 1400, 1350, 1600, 1800, 1750, 2000, 2200, 2400],
	},
	{
		label: "Reports Received", value: "18", growth: 10, direction: "down",
		color: "#ef4444",
		sparkline: [30, 28, 25, 22, 26, 24, 20, 18, 22, 19, 17, 18],
	},
	{
		label: "Posts Approved", value: "142", growth: 16, direction: "up",
		color: "#3b82f6",
		sparkline: [50, 60, 58, 72, 80, 78, 90, 100, 98, 115, 130, 142],
	},
]

const MOCK_MODERATION_TOOLS: CommunityModerationTool[] = [
	{ label: "Auto-moderation",  description: "Manage keywords and filters",     iconKey: "shield",  color: "text-green-500",  bg: "bg-green-50" },
	{ label: "Muted Words",      description: "24 words configured",             iconKey: "speaker", color: "text-blue-500",   bg: "bg-blue-50" },
	{ label: "Member Warnings",  description: "12 active warnings",              iconKey: "warning", color: "text-amber-500",  bg: "bg-amber-50" },
	{ label: "Content Alerts",   description: "Real-time monitoring active",     iconKey: "bell",    color: "text-indigo-500", bg: "bg-indigo-50" },
]

const MOCK_RECENT_REPORTS: CommunityRecentReport[] = [
	{ id: "rr-1", type: "Spam or Promotion",   reporterName: "Neha Patel",   reporterAvatarColor: "#f43f5e", reporterAvatarInitial: "N", timeAgo: "10m ago" },
	{ id: "rr-2", type: "Inappropriate Content", reporterName: "Rohan Verma", reporterAvatarColor: "#22c55e", reporterAvatarInitial: "R", timeAgo: "45m ago" },
	{ id: "rr-3", type: "Harassment / Abuse",  reporterName: "Simran Kaur",  reporterAvatarColor: "#a855f7", reporterAvatarInitial: "S", timeAgo: "2h ago" },
]

const MOCK_FEED_POSTS: CommunityFeedPost[] = [
	{
		id: "post-1",
		authorName: "Arjun Mehta", authorHandle: "@arjun_m", authorAvatarColor: "#f59e0b", authorAvatarInitial: "A",
		authorBadge: "New Member", timeAgo: "2 hours ago", postType: "Photo",
		content: "That sunset set was unreal! 🌅🔥\nWho else was there? What a vibe!",
		hashtags: ["#SunsetSessions"], imageColor: "linear-gradient(135deg,#4c1d95,#db2777)",
		comments: 24, likes: 89, views: 420, status: "Queue",
	},
	{
		id: "post-2",
		authorName: "Riya Banerjee", authorHandle: "@riya_b", authorAvatarColor: "#ec4899", authorAvatarInitial: "R",
		authorBadge: "New Member", timeAgo: "3 hours ago", postType: "Text",
		content: "Anyone going to the Night Rituals event this Friday?\nLooking for company! 🎶",
		hashtags: [], imageColor: "linear-gradient(135deg,#1e3a5f,#312e81)",
		comments: 18, likes: 35, views: 210, status: "Queue",
	},
	{
		id: "post-3",
		authorName: "Kabir Shah", authorHandle: "@kabir_s", authorAvatarColor: "#6366f1", authorAvatarInitial: "K",
		authorBadge: "Top Contributor", timeAgo: "5 hours ago", postType: "Gallery",
		content: "Few shots from last night's after party! 📸\nThe energy was next level.",
		hashtags: [], imageColor: "linear-gradient(135deg,#7f1d1d,#1c1917)",
		comments: 32, likes: 112, views: 560, status: "Queue",
	},
	{
		id: "post-4",
		authorName: "Priya Sharma", authorHandle: "@priya_s", authorAvatarColor: "#3b82f6", authorAvatarInitial: "P",
		authorBadge: null, timeAgo: "1 day ago", postType: "Photo",
		content: "Incredible night at the rooftop mixer! Already counting down to the next one. 🌆",
		hashtags: ["#MeetdayVibes", "#Rooftop"], imageColor: "linear-gradient(135deg,#0c4a6e,#134e4a)",
		comments: 41, likes: 156, views: 780, status: "Published",
	},
	{
		id: "post-5",
		authorName: "Dev Nair", authorHandle: "@dev_n", authorAvatarColor: "#22c55e", authorAvatarInitial: "D",
		authorBadge: "Top Contributor", timeAgo: "2 days ago", postType: "Text",
		content: "What's everyone's favourite Meetday moment so far? Drop it below! 👇",
		hashtags: ["#Community"], imageColor: null,
		comments: 67, likes: 203, views: 1100, status: "Published",
	},
]

// ─── Announcements Tab ────────────────────────────────────────────────────────

export type AnnouncementStatus   = "Published" | "Scheduled" | "Draft"
export type AnnouncementAudience = "All Members" | "Community Members" | "New Members" | "Moderators"

export type AnnouncementItem = {
	id:              string
	title:           string
	status:          AnnouncementStatus
	audience:        AnnouncementAudience
	content:         string
	imageGradient:   string
	isPinned:        boolean
	// Published
	authorName:      string
	authorInitial:   string
	authorAvatarColor: string
	timeAgo:         string | null
	views:           number | null
	opens:           number | null
	clicks:          number | null
	// Scheduled
	scheduledFor:    string | null
	estimatedReach:  string | null
}

export type AnnouncementsTabStats = {
	published:      number
	publishedGrowth: number
	scheduled:      number
	scheduledGrowth: number
	drafts:         number
	draftsGrowth:   number
	totalReach:     string
	totalReachGrowth: number
}

export type AnnouncementsTabSidebarManager = {
	id:     string
	name:   string
	initial: string
	avatarColor: string
	role:   "Owner" | "Manager" | "Moderator"
}

export type AnnouncementsTabData = {
	stats:        AnnouncementsTabStats
	announcements: AnnouncementItem[]
	communityUrl: string
	communityStatus: "Active" | "Inactive"
	createdOn:    string
	visibility:   string
	managers:     AnnouncementsTabSidebarManager[]
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

const MOCK_ANNOUNCEMENTS_MANAGERS: AnnouncementsTabSidebarManager[] = [
	{ id: "m-1", name: "Arjun Mehta",   initial: "A", avatarColor: "#f59e0b", role: "Owner" },
	{ id: "m-2", name: "Riya Banerjee", initial: "R", avatarColor: "#ec4899", role: "Manager" },
	{ id: "m-3", name: "Kabir Shah",    initial: "K", avatarColor: "#6366f1", role: "Manager" },
	{ id: "m-4", name: "Ishita Dey",    initial: "I", avatarColor: "#a855f7", role: "Moderator" },
	{ id: "m-5", name: "Manav Sinha",   initial: "M", avatarColor: "#22c55e", role: "Moderator" },
]

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
			audience:         "All Members",
			content:          item.body,
			imageGradient:    ANN_CATEGORY_GRADIENT[item.category] ?? ANN_DEFAULT_GRADIENT,
			isPinned:         item.isPinned,
			authorName:       item.author.name,
			authorInitial:    item.author.name?.[0]?.toUpperCase() ?? "?",
			authorAvatarColor: ANN_AVATAR_COLORS[i % ANN_AVATAR_COLORS.length],
			timeAgo:          isPublished && item.publishedAt ? toTimeAgo(item.publishedAt) : null,
			views:            isPublished ? item.reachCount    : null,
			opens:            isPublished ? item.likeCount     : null,
			clicks:           isPublished ? item.bookmarkCount : null,
			scheduledFor:     isScheduled && item.scheduledAt ? formatScheduledAt(item.scheduledAt) : null,
			estimatedReach:   null,
		}
	})

	const reachVal   = statsData.totalReach.value
	const totalReach = reachVal >= 1000 ? `${(reachVal / 1000).toFixed(1)}K` : String(reachVal)
	const reachGrowth = statsData.totalReach.changePercent ?? 0

	return {
		stats: {
			published:        statsData.published, publishedGrowth: 0,
			scheduled:        statsData.scheduled, scheduledGrowth: 0,
			drafts:           statsData.drafts,    draftsGrowth: 0,
			totalReach,                            totalReachGrowth: reachGrowth,
		},
		announcements,
		communityUrl:    "meetday.ai/communities/meetday-music-nights",
		communityStatus: "Active",
		createdOn:       "25 May 2024",
		visibility:      "Public Community",
		managers:        MOCK_ANNOUNCEMENTS_MANAGERS,
	}
}

export async function getCommunityFeedTab(communityId: string): Promise<CommunityFeedTabData> {
	// TODO: const { data } = await apiClient.get<CommunityFeedTabData>(`/admin/communities/${communityId}/feed/tab`)
	// TODO: return data
	void communityId
	await new Promise(r => setTimeout(r, 600))
	return {
		stats:           MOCK_FEED_STATS,
		overview:        MOCK_FEED_OVERVIEW,
		moderationTools: MOCK_MODERATION_TOOLS,
		recentReports:   MOCK_RECENT_REPORTS,
		posts:           MOCK_FEED_POSTS,
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
	// UI-only fields (not returned by API)
	iconColor: string
	members: number
	online: number
	isPrivate: boolean
}

export type ReportedChatMessage = {
	id: string; authorName: string; authorAvatarColor: string; authorAvatarInitial: string
	message: string; channel: string; timeAgo: string
}

export type PinnedChatMessage = {
	id: string; title: string; channel: string; pinnedBy: string; pinnedByInitial: string; pinnedByColor: string
}

export type MutedChatUser = {
	id: string; name: string; avatarColor: string; avatarInitial: string; mutedInChannels: number; timeAgo: string
}

export type AutoModerationFilter = { label: string; enabled: boolean }

export type ChatOverviewItem = {
	label: string; value: string; growth: number; direction: "up" | "down"; color: string; sparkline: number[]
}

export type ChatModerationTool = {
	label: string; description: string; iconKey: "flag" | "search" | "ban" | "warning"; color: string; bg: string
}

export type ChatTabStats = {
	totalChannels: number; activeMembers: number; onlineNow: number
	reportedMessages: number; mutedUsers: number; pinnedMessages: number
}

export type ChatTabData = {
	stats: ChatTabStats
	channels: ChatChannel[]
	reportedMessages: ReportedChatMessage[]
	pinnedMessages: PinnedChatMessage[]
	mutedUsers: MutedChatUser[]
	autoModFilters: AutoModerationFilter[]
	overview: ChatOverviewItem[]
	moderationTools: ChatModerationTool[]
}

const MOCK_CHAT_STATS: ChatTabStats = {
	totalChannels: 8, activeMembers: 1248, onlineNow: 86,
	reportedMessages: 12, mutedUsers: 18, pinnedMessages: 24,
}

const MOCK_CHAT_CHANNELS: ChatChannel[] = [
	{ id: "ch-1", name: "general",                description: "General discussions for all community members.", iconColor: "#6366f1", members: 1024, online: 42, isPrivate: false },
	{ id: "ch-2", name: "event-talk",             description: "Talk about events, lineups and experiences.",    iconColor: "#f59e0b", members: 756,  online: 28, isPrivate: false },
	{ id: "ch-3", name: "music-recommendations",  description: "Share and discover new music.",                  iconColor: "#ec4899", members: 612,  online: 18, isPrivate: false },
	{ id: "ch-4", name: "after-parties",          description: "Find and plan after parties & hangouts.",        iconColor: "#ef4444", members: 324,  online: 12, isPrivate: false },
	{ id: "ch-5", name: "vip-lounge",             description: "VIP members only lounge.",                      iconColor: "#a855f7", members: 198,  online: 6,  isPrivate: true },
]

const MOCK_REPORTED_MESSAGES: ReportedChatMessage[] = [
	{ id: "rm-1", authorName: "Rohan Verma",  authorAvatarColor: "#22c55e", authorAvatarInitial: "R", message: "Check out this link for free tickets!!! bit.ly/xyz", channel: "general",     timeAgo: "10m ago" },
	{ id: "rm-2", authorName: "Simran Kaur",  authorAvatarColor: "#a855f7", authorAvatarInitial: "S", message: "This artist is trash 🤮",                           channel: "event-talk",   timeAgo: "25m ago" },
	{ id: "rm-3", authorName: "Vivek Sharma", authorAvatarColor: "#3b82f6", authorAvatarInitial: "V", message: "Selling passes cheap, DM me 🚨",                    channel: "general",      timeAgo: "1h ago" },
	{ id: "rm-4", authorName: "Neha Patel",   authorAvatarColor: "#f43f5e", authorAvatarInitial: "N", message: "Anyone up for something after 2 AM?",               channel: "after-parties", timeAgo: "2h ago" },
]

const MOCK_PINNED_MESSAGES: PinnedChatMessage[] = [
	{ id: "pm-1", title: "Event Guidelines",      channel: "#general",      pinnedBy: "Arjun Mehta",   pinnedByInitial: "A", pinnedByColor: "#f59e0b" },
	{ id: "pm-2", title: "Weekend Lineup Thread", channel: "#event-talk",   pinnedBy: "Riya Banerjee", pinnedByInitial: "R", pinnedByColor: "#ec4899" },
	{ id: "pm-3", title: "After Party Rules",     channel: "#after-parties", pinnedBy: "Kabir Shah",   pinnedByInitial: "K", pinnedByColor: "#6366f1" },
]

const MOCK_MUTED_USERS: MutedChatUser[] = [
	{ id: "mu-1", name: "Aditya Singh",   avatarColor: "#3b82f6", avatarInitial: "A", mutedInChannels: 3, timeAgo: "2d ago" },
	{ id: "mu-2", name: "Karan Malhotra", avatarColor: "#f59e0b", avatarInitial: "K", mutedInChannels: 2, timeAgo: "5d ago" },
	{ id: "mu-3", name: "Pooja Iyer",     avatarColor: "#ec4899", avatarInitial: "P", mutedInChannels: 1, timeAgo: "1w ago" },
]

const MOCK_AUTO_MOD_FILTERS: AutoModerationFilter[] = [
	{ label: "Profanity filter",     enabled: true },
	{ label: "Spam links filter",    enabled: true },
	{ label: "Invite links filter",  enabled: true },
	{ label: "Caps lock filter",     enabled: true },
]

const MOCK_CHAT_OVERVIEW: ChatOverviewItem[] = [
	{ label: "Messages Sent",      value: "4.2K", growth: 18, direction: "up",   color: "#a855f7", sparkline: [2800, 3100, 2900, 3400, 3600, 3500, 3800, 4000, 3900, 4100, 4000, 4200] },
	{ label: "Active Participants", value: "1.1K", growth: 16, direction: "up",   color: "#22c55e", sparkline: [700, 780, 750, 850, 900, 880, 950, 1000, 980, 1050, 1080, 1100] },
	{ label: "Reports Received",    value: "28",   growth: 12, direction: "down",  color: "#ef4444", sparkline: [40, 38, 35, 32, 36, 34, 30, 28, 32, 29, 27, 28] },
	{ label: "Messages Approved",   value: "312",  growth: 22, direction: "up",   color: "#3b82f6", sparkline: [180, 200, 195, 230, 250, 245, 270, 285, 280, 300, 308, 312] },
]

const MOCK_CHAT_MOD_TOOLS: ChatModerationTool[] = [
	{ label: "Review Reported Messages", description: "12 pending reviews",       iconKey: "flag",    color: "text-red-500",    bg: "bg-red-50" },
	{ label: "Keyword Alerts",           description: "15 keywords configured",   iconKey: "search",  color: "text-blue-500",   bg: "bg-blue-50" },
	{ label: "Blocked Links",            description: "8 links blocked",          iconKey: "ban",     color: "text-orange-500", bg: "bg-orange-50" },
	{ label: "Content Warnings",         description: "3 active warnings",        iconKey: "warning", color: "text-amber-500",  bg: "bg-amber-50" },
]

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
		members:      0,
		online:       0,
		isPrivate:    false,
	}))

	return {
		stats:            { ...MOCK_CHAT_STATS, totalChannels: channels.length },
		channels,
		reportedMessages: MOCK_REPORTED_MESSAGES,
		pinnedMessages:   MOCK_PINNED_MESSAGES,
		mutedUsers:       MOCK_MUTED_USERS,
		autoModFilters:   MOCK_AUTO_MOD_FILTERS,
		overview:         MOCK_CHAT_OVERVIEW,
		moderationTools:  MOCK_CHAT_MOD_TOOLS,
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
	label: string; value: number; growth: number; color: string; barColor: string
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
	avatarColor: string; avatarInitial: string; points: number
}

export type AnalyticsTopHost = {
	id: string; name: string; handle: string
	avatarColor: string; avatarInitial: string; eventCount: number
}

export type AnalyticsTabData = {
	stats:              AnalyticsTabStats
	growthData:         GrowthDataPoint[]
	growthSummary:      { membersJoined: number; membersLeft: number; netGrowth: number; growthRate: number }
	engagementBreakdown: EngagementBreakdownItem[]
	experiencesImpact:  { totalBookings: number; bookingsGrowth: number }
	topExperiences:     AnalyticsTopExperience[]
	communityHealth:    { score: number; maxScore: number; label: string; factors: HealthFactor[] }
	interests:          AnalyticsInterestSegment[]
	topCities:          AnalyticsTopCity[]
	ageDistribution:    AgeGroup[]
	topContributors:    TopContributor[]
	topHosts:           AnalyticsTopHost[]
	lastUpdated:        string
}

const MOCK_ANALYTICS_STATS: AnalyticsTabStats = {
	members: 1248,          membersGrowth: 18,
	activeMembers: 786,     activeMembersGrowth: 12,
	experiencesBooked: 482, experiencesBookedGrowth: 24,
	communityRevenue: "₹3.2L", communityRevenueGrowth: 16,
	retention: 72,          retentionGrowth: 5,
}

const MOCK_GROWTH_DATA: GrowthDataPoint[] = [
	{ label: "Apr 21", membersJoined: 45,  membersLeft: 18, netGrowth: 27 },
	{ label: "Apr 28", membersJoined: 68,  membersLeft: 22, netGrowth: 46 },
	{ label: "May 5",  membersJoined: 92,  membersLeft: 20, netGrowth: 72 },
	{ label: "May 12", membersJoined: 125, membersLeft: 25, netGrowth: 100 },
	{ label: "May 19", membersJoined: 150, membersLeft: 28, netGrowth: 122 },
]

const MOCK_ENGAGEMENT_BREAKDOWN: EngagementBreakdownItem[] = [
	{ label: "Posts",               value: 156,   growth: 18, color: "#a855f7", barColor: "#a855f7" },
	{ label: "Comments",            value: 342,   growth: 22, color: "#3b82f6", barColor: "#3b82f6" },
	{ label: "Reactions",           value: 1248,  growth: 30, color: "#ef4444", barColor: "#ef4444" },
	{ label: "Shares",              value: 276,   growth: 15, color: "#f59e0b", barColor: "#f59e0b" },
	{ label: "Chat Messages",       value: 2421,  growth: 20, color: "#22c55e", barColor: "#22c55e" },
	{ label: "Announcement Opens",  value: 1876,  growth: 25, color: "#06b6d4", barColor: "#06b6d4" },
]

const MOCK_TOP_EXPERIENCES_ANALYTICS: AnalyticsTopExperience[] = [
	{ id: "e1", name: "Night Rituals",    imageGradient: "linear-gradient(135deg,#4c1d95,#db2777)", bookings: 162, revenue: "₹1.1L", attendancePct: 82 },
	{ id: "e2", name: "After Hours",      imageGradient: "linear-gradient(135deg,#1e3a5f,#0ea5e9)", bookings: 128, revenue: "₹84K",  attendancePct: 79 },
	{ id: "e3", name: "Neon Nights",      imageGradient: "linear-gradient(135deg,#064e3b,#10b981)", bookings: 104, revenue: "₹62K",  attendancePct: 76 },
	{ id: "e4", name: "Sunset Sessions",  imageGradient: "linear-gradient(135deg,#92400e,#f59e0b)", bookings: 88,  revenue: "₹55K",  attendancePct: 71 },
]

const MOCK_COMMUNITY_HEALTH = {
	score: 92, maxScore: 100, label: "Excellent",
	factors: [
		{ label: "Member Growth",    score: 18, max: 20 },
		{ label: "Engagement",       score: 19, max: 20 },
		{ label: "Event Attendance", score: 18, max: 20 },
		{ label: "Report Rate",      score: 19, max: 20 },
		{ label: "Retention",        score: 18, max: 20 },
	],
}

const MOCK_ANALYTICS_INTERESTS: AnalyticsInterestSegment[] = [
	{ label: "Music Lovers",    pct: 52, color: "#a855f7" },
	{ label: "Creative Pros",   pct: 22, color: "#3b82f6" },
	{ label: "Night Explorers", pct: 16, color: "#22c55e" },
	{ label: "Event Hosts",     pct: 10, color: "#f59e0b" },
]

const MOCK_ANALYTICS_CITIES: AnalyticsTopCity[] = [
	{ city: "Kolkata",   pct: 28, color: "#a855f7" },
	{ city: "Mumbai",    pct: 22, color: "#3b82f6" },
	{ city: "Delhi",     pct: 18, color: "#22c55e" },
	{ city: "Bangalore", pct: 12, color: "#f59e0b" },
	{ city: "Others",    pct: 20, color: "#9ca3af" },
]

const MOCK_AGE_DISTRIBUTION: AgeGroup[] = [
	{ range: "18-24", pct: 14 },
	{ range: "25-34", pct: 38 },
	{ range: "35-44", pct: 28 },
	{ range: "45-54", pct: 14 },
	{ range: "55+",   pct: 6  },
]

const MOCK_TOP_CONTRIBUTORS: TopContributor[] = [
	{ rank: 1, name: "Rishav",  handle: "@rishav.live",      avatarColor: "#3b82f6", avatarInitial: "R", points: 320 },
	{ rank: 2, name: "Ananya",  handle: "@ananya.music",     avatarColor: "#ec4899", avatarInitial: "A", points: 260 },
	{ rank: 3, name: "Arjun",   handle: "@arjun.beats",      avatarColor: "#f59e0b", avatarInitial: "A", points: 210 },
	{ rank: 4, name: "Neha",    handle: "@neha.vibes",       avatarColor: "#f43f5e", avatarInitial: "N", points: 180 },
	{ rank: 5, name: "Kabir",   handle: "@kabir.collects",   avatarColor: "#6366f1", avatarInitial: "K", points: 150 },
]

const MOCK_ANALYTICS_TOP_HOSTS: AnalyticsTopHost[] = [
	{ id: "h1", name: "Bestcurate",        handle: "@beatcurate", avatarColor: "#1e1b4b", avatarInitial: "B", eventCount: 8 },
	{ id: "h2", name: "Luna Nights",       handle: "@lunanights", avatarColor: "#4c1d95", avatarInitial: "L", eventCount: 6 },
	{ id: "h3", name: "Rooftop Collective",handle: "@rooftop.co", avatarColor: "#1c1917", avatarInitial: "R", eventCount: 5 },
]

export async function getCommunityAnalytics(communityId: string): Promise<AnalyticsTabData> {
	// TODO: const { data } = await apiClient.get<AnalyticsTabData>(`/admin/communities/${communityId}/analytics/tab`)
	// TODO: return data
	void communityId
	await new Promise(r => setTimeout(r, 600))
	return {
		stats:               MOCK_ANALYTICS_STATS,
		growthData:          MOCK_GROWTH_DATA,
		growthSummary:       { membersJoined: 312, membersLeft: 68, netGrowth: 244, growthRate: 18 },
		engagementBreakdown: MOCK_ENGAGEMENT_BREAKDOWN,
		experiencesImpact:   { totalBookings: 482, bookingsGrowth: 24 },
		topExperiences:      MOCK_TOP_EXPERIENCES_ANALYTICS,
		communityHealth:     MOCK_COMMUNITY_HEALTH,
		interests:           MOCK_ANALYTICS_INTERESTS,
		topCities:           MOCK_ANALYTICS_CITIES,
		ageDistribution:     MOCK_AGE_DISTRIBUTION,
		topContributors:     MOCK_TOP_CONTRIBUTORS,
		topHosts:            MOCK_ANALYTICS_TOP_HOSTS,
		lastUpdated:         "May 19, 2024 • 10:30 AM",
	}
}

// ─── Managers Tab ─────────────────────────────────────────────────────────────

export type ManagerRoleType = "Owner" | "Manager" | "Moderator" | "View Only"

export type ManagerTeamMember = {
	id: string; name: string; email: string
	avatarColor: string; avatarInitial: string
	role: ManagerRoleType
	permissionsLabel: string; permissionsCount: number
	joinedDate: string; status: "Active" | "Inactive"
}

export type ManagerPermissionRow = {
	label: string; owner: boolean; manager: boolean; moderator: boolean; viewOnly: boolean
}

export type ManagerRoleOverview = {
	role: ManagerRoleType; description: string; permissions: number; maxPermissions: number
	iconKey: "crown" | "shield" | "users" | "eye"; color: string; bg: string; border: string
}

export type ManagerActivityItem = {
	id: string; text: string; timeAgo: string
	iconKey: "promote" | "join" | "edit"; iconColor: string; iconBg: string
}

export type ManagersTabStats = {
	owners: number; managers: number; moderators: number; viewOnly: number; totalUsers: number
}

export type ManagersAccessSummary = { label: string; count: number; pct: number; color: string }

export type ManagersTabData = {
	stats:           ManagersTabStats
	teamMembers:     ManagerTeamMember[]
	permissionMatrix: ManagerPermissionRow[]
	roleOverview:    ManagerRoleOverview[]
	activities:      ManagerActivityItem[]
	accessSummary:   ManagersAccessSummary[]
}

const MOCK_MANAGERS_STATS: ManagersTabStats = {
	owners: 2, managers: 5, moderators: 18, viewOnly: 7, totalUsers: 32,
}

const MOCK_TEAM_MEMBERS: ManagerTeamMember[] = [
	{ id: "tm-1", name: "Arjun Mehta",   email: "arjun@beatcurate.com",  avatarColor: "#f59e0b", avatarInitial: "A", role: "Owner",     permissionsLabel: "Full Access",         permissionsCount: 12, joinedDate: "Apr 20, 2024", status: "Active" },
	{ id: "tm-2", name: "Riya Banerjee", email: "riya@lunanights.com",   avatarColor: "#ec4899", avatarInitial: "R", role: "Manager",   permissionsLabel: "Content + Members",   permissionsCount: 6,  joinedDate: "Apr 22, 2024", status: "Active" },
	{ id: "tm-3", name: "Kabir Shah",    email: "kabir@rooftop.co",      avatarColor: "#6366f1", avatarInitial: "K", role: "Manager",   permissionsLabel: "Events + Analytics",  permissionsCount: 5,  joinedDate: "Apr 25, 2024", status: "Active" },
	{ id: "tm-4", name: "Neha Patel",    email: "neha.vibes@mmn.com",    avatarColor: "#f43f5e", avatarInitial: "N", role: "Moderator", permissionsLabel: "Content Moderation",  permissionsCount: 4,  joinedDate: "May 02, 2024", status: "Active" },
	{ id: "tm-5", name: "Rohan Verma",   email: "rohan.live@mmn.com",    avatarColor: "#22c55e", avatarInitial: "R", role: "Moderator", permissionsLabel: "Chat + Reports",      permissionsCount: 3,  joinedDate: "May 05, 2024", status: "Active" },
]

const MOCK_PERMISSION_MATRIX: ManagerPermissionRow[] = [
	{ label: "Manage Community Settings",         owner: true,  manager: true,  moderator: false, viewOnly: false },
	{ label: "Manage Members & Roles",            owner: true,  manager: true,  moderator: true,  viewOnly: false },
	{ label: "Create & Manage Experiences",       owner: true,  manager: true,  moderator: false, viewOnly: false },
	{ label: "Manage Feed & Announcements",       owner: true,  manager: true,  moderator: true,  viewOnly: false },
	{ label: "Moderate Content (Posts & Comments)", owner: true, manager: true, moderator: true,  viewOnly: false },
	{ label: "Manage Chat & Messages",            owner: true,  manager: true,  moderator: true,  viewOnly: false },
	{ label: "View Analytics & Reports",          owner: true,  manager: true,  moderator: true,  viewOnly: true  },
	{ label: "Export Data",                       owner: true,  manager: true,  moderator: false, viewOnly: false },
]

const MOCK_ROLE_OVERVIEW: ManagerRoleOverview[] = [
	{ role: "Owner",     description: "Full access to all features",        permissions: 12, maxPermissions: 12, iconKey: "crown",  color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100" },
	{ role: "Manager",   description: "Manage community operations",        permissions: 6,  maxPermissions: 12, iconKey: "shield", color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100" },
	{ role: "Moderator", description: "Moderate content and users",         permissions: 4,  maxPermissions: 12, iconKey: "users",  color: "text-green-500",  bg: "bg-green-50",  border: "border-green-100" },
	{ role: "View Only", description: "View data and analytics",            permissions: 2,  maxPermissions: 12, iconKey: "eye",    color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
]

const MOCK_MANAGER_ACTIVITIES: ManagerActivityItem[] = [
	{ id: "a-1", text: "Riya Banerjee was promoted to Manager",   timeAgo: "2 hours ago", iconKey: "promote", iconColor: "text-purple-500", iconBg: "bg-purple-50" },
	{ id: "a-2", text: "Neha Patel joined as Moderator",          timeAgo: "1 day ago",   iconKey: "join",    iconColor: "text-green-500",  iconBg: "bg-green-50" },
	{ id: "a-3", text: "Arjun Mehta updated role permissions",    timeAgo: "2 days ago",  iconKey: "edit",    iconColor: "text-amber-500",  iconBg: "bg-amber-50" },
	{ id: "a-4", text: "Rohan Verma joined as Moderator",         timeAgo: "3 days ago",  iconKey: "join",    iconColor: "text-green-500",  iconBg: "bg-green-50" },
]

const MOCK_ACCESS_SUMMARY: ManagersAccessSummary[] = [
	{ label: "Owners",     count: 2,  pct: 6,  color: "#a855f7" },
	{ label: "Managers",   count: 5,  pct: 16, color: "#3b82f6" },
	{ label: "Moderators", count: 18, pct: 56, color: "#22c55e" },
	{ label: "View Only",  count: 7,  pct: 22, color: "#f97316" },
]

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

const MANAGER_PERMISSIONS: Record<ManagerRoleType, { label: string; count: number }> = {
	"Owner":     { label: "Full Access",        count: 12 },
	"Manager":   { label: "Content + Members",  count: 6  },
	"Moderator": { label: "Content Moderation", count: 4  },
	"View Only": { label: "View Only",          count: 2  },
}

const AVATAR_COLORS = ["#f59e0b", "#ec4899", "#6366f1", "#f43f5e", "#22c55e", "#3b82f6", "#a855f7", "#f97316"]

export async function getCommunityManagers(communityId: string): Promise<ManagersTabData> {
	const { data } = await apiClient.get<ApiManagerEntry[]>(`/admin/communities/${communityId}/managers`)

	const teamMembers: ManagerTeamMember[] = data.map((m, i) => {
		const role = MANAGER_ROLE_MAP[m.role] ?? "View Only"
		const perms = MANAGER_PERMISSIONS[role]
		return {
			id:               m.userId,
			name:             `${m.firstName} ${m.lastName}`,
			email:            "",
			avatarColor:      AVATAR_COLORS[i % AVATAR_COLORS.length],
			avatarInitial:    m.firstName[0].toUpperCase(),
			role,
			permissionsLabel: perms.label,
			permissionsCount: perms.count,
			joinedDate:       "",
			status:           "Active" as const,
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

	return {
		stats,
		teamMembers,
		permissionMatrix: MOCK_PERMISSION_MATRIX,
		roleOverview:     MOCK_ROLE_OVERVIEW,
		activities:       MOCK_MANAGER_ACTIVITIES,
		accessSummary,
	}
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
