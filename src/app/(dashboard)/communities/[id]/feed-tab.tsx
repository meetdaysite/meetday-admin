"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
	Search,
	LayoutList,
	LayoutGrid,
	MessageSquare,
	Heart,
	Eye,
	CheckCircle,
	XCircle,
	ChevronDown,
	ChevronRight,
	Lightbulb,
	Flag,
	Shield,
	Volume2,
	AlertTriangle,
	Bell,
	Pin,
	PinOff,
	Trash2,
	Users,
	Plus,
	X,
	ImagePlus,
	type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { StatCard } from "@/components/dashboard/stat-card"
import {
	getCommunityFeedTab,
	getCommunityFeedPosts,
	approveFeedPost,
	rejectFeedPost,
	deleteFeedPost,
	pinFeedPost,
	unpinFeedPost,
	resolveFeedReport,
	dismissFeedReport,
	createFeedPost,
	type CommunityFeedTabData,
	type CommunityFeedPost,
	type CommunityFeedOverviewItem,
	type CreateFeedPostRequest,
} from "@/lib/api/communities"
import { uploadFeedMedia } from "@/lib/api/storage"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const POST_TYPE_BADGE: Record<string, string> = {
	Photo: "bg-purple-100 text-purple-700",
	Text:  "bg-blue-100 text-blue-700",
	Poll:  "bg-amber-100 text-amber-700",
}

const ICON_MAP: Record<string, LucideIcon> = {
	shield: Shield, speaker: Volume2, warning: AlertTriangle, bell: Bell,
}

type ViewMode = "list" | "grid"

const STATUS_OPTIONS = [
	{ label: "All Status", value: "" },
	{ label: "Queue",      value: "PENDING" },
	{ label: "Published",  value: "PUBLISHED" },
	{ label: "Reported",   value: "REPORTED" },
	{ label: "Rejected",   value: "REJECTED" },
]

const TYPE_OPTIONS = [
	{ label: "All Types", value: "" },
	{ label: "Photo",     value: "PHOTO" },
	{ label: "Text",      value: "TEXT" },
	{ label: "Poll",      value: "POLL" },
]

const SORT_OPTIONS = [
	{ label: "Newest First",  value: "newest" },
	{ label: "Oldest First",  value: "oldest" },
	{ label: "Most Engaged",  value: "most_engaged" },
]

const TIME_OPTIONS = [
	{ label: "All Time",   value: "" },
	{ label: "Today",      value: "today" },
	{ label: "This Week",  value: "week" },
	{ label: "This Month", value: "month" },
]

function timeRangeParams(range: string): { from?: string; to?: string } {
	const now = new Date()
	if (range === "today") {
		const start = new Date(now); start.setHours(0, 0, 0, 0)
		return { from: start.toISOString() }
	}
	if (range === "week")  return { from: new Date(now.getTime() - 7  * 864e5).toISOString() }
	if (range === "month") return { from: new Date(now.getTime() - 30 * 864e5).toISOString() }
	return {}
}

// ─── Overview Sparkline Row ────────────────────────────────────────────────────

function OverviewRow({ item }: { item: CommunityFeedOverviewItem }) {
	const chartData = item.sparkline.map((v, i) => ({ i, v }))
	return (
		<div className="flex items-center gap-2 py-2">
			<div className="flex-1 min-w-0">
				<p className="text-xs text-text-secondary">{item.label}</p>
				<div className="flex items-center gap-1.5 mt-0.5">
					<span className="text-sm font-bold text-text-primary">{item.value}</span>
					<span
						className={cn(
							"text-[10px] font-semibold",
							item.direction === "up" ? "text-green-500" : "text-red-500",
						)}
					>
						{item.direction === "up" ? "↑" : "↓"} {item.growth}%
					</span>
				</div>
			</div>
			<div className="w-20 h-8 shrink-0">
				<ResponsiveContainer width="100%" height={32}>
					<LineChart data={chartData}>
						<Line
							type="monotone"
							dataKey="v"
							stroke={item.color}
							strokeWidth={1.5}
							dot={false}
							isAnimationActive={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	)
}

// ─── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({
	post,
	onApprove,
	onReject,
	onDelete,
	onPin,
	onUnpin,
	isActing,
}: {
	post: CommunityFeedPost
	onApprove: (id: string) => void
	onReject:  (id: string) => void
	onDelete:  (id: string) => void
	onPin:     (id: string) => void
	onUnpin:   (id: string) => void
	isActing:  boolean
}) {
	return (
		<div className="rounded-xl border border-border-default bg-surface-card p-4 flex flex-col gap-3">
			{/* Author row */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2.5">
					{post.authorAvatarUrl ? (
						<img
							src={post.authorAvatarUrl}
							alt={post.authorName}
							className="h-9 w-9 shrink-0 rounded-full object-cover"
						/>
					) : (
						<div
							className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
							style={{ backgroundColor: post.authorAvatarColor }}
						>
							{post.authorAvatarInitial}
						</div>
					)}
					<div className="min-w-0">
						<span className="text-sm font-semibold text-text-primary">{post.authorName}</span>
						<p className="text-[11px] text-text-tertiary">{post.timeAgo}</p>
					</div>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<span
						className={cn(
							"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
							POST_TYPE_BADGE[post.postType] ?? "bg-neutral-100 text-text-secondary",
						)}
					>
						{post.postType}
					</span>
				</div>
			</div>

			{/* Media + Content */}
			<div className="flex gap-3">
				{post.mediaThumbnail && (
					<img
						src={post.mediaThumbnail}
						alt=""
						className="h-16 w-24 shrink-0 rounded-lg object-cover"
					/>
				)}
				<div className="flex-1 min-w-0">
					{post.content ? (
						<p className="text-xs text-text-primary leading-relaxed whitespace-pre-line line-clamp-3">
							{post.content}
						</p>
					) : (
						<p className="text-xs text-text-tertiary italic">No text content</p>
					)}
					{post.hashtags.length > 0 && (
						<p className="mt-1 text-[11px] font-medium text-blue-500">
							{post.hashtags.join(" ")}
						</p>
					)}
				</div>
			</div>

			{/* Engagement + Actions */}
			<div className="flex items-center justify-between pt-1">
				<div className="flex items-center gap-4 text-[11px] text-text-tertiary">
					<span className="flex items-center gap-1">
						<MessageSquare size={11} /> {post.comments}
					</span>
					<span className="flex items-center gap-1">
						<Heart size={11} /> {post.reactions}
					</span>
					<span className="flex items-center gap-1">
						<Eye size={11} /> {post.views}
					</span>
					{post.pendingReportCount > 0 && (
						<span className="flex items-center gap-1 text-red-500 font-semibold">
							<Flag size={11} /> {post.pendingReportCount} report{post.pendingReportCount !== 1 ? "s" : ""}
						</span>
					)}
				</div>
				<div className="flex items-center gap-1.5">
					{post.status === "Queue" && (
						<>
							<button
								onClick={() => onApprove(post.id)}
								disabled={isActing}
								className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<CheckCircle size={12} /> {isActing ? "…" : "Approve"}
							</button>
							<button
								onClick={() => onReject(post.id)}
								disabled={isActing}
								className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<XCircle size={12} /> {isActing ? "…" : "Reject"}
							</button>
						</>
					)}
					{post.status !== "Queue" && (
						<span
							className={cn(
								"inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
								post.status === "Published" ? "bg-green-100 text-green-700"
								: post.status === "Rejected"  ? "bg-red-100 text-red-700"
								: post.status === "Pinned"    ? "bg-purple-100 text-purple-700"
								: post.status === "Reported"  ? "bg-amber-100 text-amber-700"
								: "bg-neutral-100 text-neutral-600",
							)}
						>
							{post.status}
						</span>
					)}
					{post.status === "Published" && (
						<button
							onClick={() => onPin(post.id)}
							disabled={isActing}
							title="Pin post"
							className="rounded-lg p-1.5 text-text-tertiary hover:text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50"
						>
							<Pin size={12} />
						</button>
					)}
					{post.status === "Pinned" && (
						<button
							onClick={() => onUnpin(post.id)}
							disabled={isActing}
							title="Unpin post"
							className="rounded-lg p-1.5 text-purple-600 hover:text-text-tertiary hover:bg-neutral-50 transition-colors disabled:opacity-50"
						>
							<PinOff size={12} />
						</button>
					)}
					<button
						onClick={() => onDelete(post.id)}
						disabled={isActing}
						title="Delete post"
						className="rounded-lg p-1.5 text-text-tertiary hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
					>
						<Trash2 size={12} />
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function FeedTab({ communityId }: { communityId: string }) {
	const [data, setData]               = useState<CommunityFeedTabData | null>(null)
	const [posts, setPosts]             = useState<CommunityFeedPost[]>([])
	const [total, setTotal]             = useState(0)
	const [totalPages, setTotalPages]   = useState(1)
	const [isLoading, setIsLoading]     = useState(true)
	const [isPostsLoading, setIsPostsLoading] = useState(true)
	const [error, setError]             = useState<string | null>(null)

	const [viewMode, setViewMode]         = useState<ViewMode>("list")
	const [searchInput, setSearchInput]   = useState("")
	const [committedSearch, setCommittedSearch] = useState("")
	const [filterStatus, setFilterStatus] = useState("")
	const [filterType, setFilterType]     = useState("")
	const [filterTime, setFilterTime]     = useState("")
	const [sort, setSort]                 = useState("newest")
	const [page, setPage]                 = useState(1)
	const [pendingPostIds, setPendingPostIds] = useState<Set<string>>(new Set())

	const [createOpen, setCreateOpen]       = useState(false)
	const [createType, setCreateType]       = useState<CreateFeedPostRequest["postType"]>("TEXT")
	const [createCategory, setCreateCategory] = useState<CreateFeedPostRequest["category"]>("GENERAL")
	const [createContent, setCreateContent] = useState("")
	const [createPollOptions, setCreatePollOptions] = useState(["", ""])
	const [mediaItems, setMediaItems]       = useState<{ key: string; preview: string }[]>([])
	const [isUploadingMedia, setIsUploadingMedia] = useState(false)
	const [isCreating, setIsCreating]       = useState(false)
	const mediaInputRef = useRef<HTMLInputElement>(null)

	const searchTimerRef = useRef<ReturnType<typeof setTimeout>>()

	function handleSearchChange(v: string) {
		setSearchInput(v)
		clearTimeout(searchTimerRef.current)
		searchTimerRef.current = setTimeout(() => {
			setCommittedSearch(v)
			setPage(1)
		}, 350)
	}

	const loadTab = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			setData(await getCommunityFeedTab(communityId))
		} catch {
			setError("Failed to load feed.")
		} finally {
			setIsLoading(false)
		}
	}, [communityId])

	const loadPosts = useCallback(async () => {
		setIsPostsLoading(true)
		try {
			const result = await getCommunityFeedPosts(communityId, {
				status:   filterStatus || undefined,
				postType: filterType   || undefined,
				search:   committedSearch || undefined,
				sort,
				page,
				limit: PAGE_SIZE,
				...timeRangeParams(filterTime),
			})
			setPosts(result.posts)
			setTotal(result.total)
			setTotalPages(result.totalPages)
		} catch {
			toast.error("Failed to load posts.")
		} finally {
			setIsPostsLoading(false)
		}
	}, [communityId, filterStatus, filterType, committedSearch, sort, page, filterTime])

	useEffect(() => { void loadTab() }, [loadTab])
	useEffect(() => { void loadPosts() }, [loadPosts])

	async function handleApprove(id: string) {
		setPendingPostIds(s => new Set(s).add(id))
		try {
			await approveFeedPost(communityId, id)
			setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "Published" as const } : p))
			toast.success("Post approved")
		} catch {
			toast.error("Failed to approve post")
		} finally {
			setPendingPostIds(s => { const n = new Set(s); n.delete(id); return n })
		}
	}
	async function handleReject(id: string) {
		setPendingPostIds(s => new Set(s).add(id))
		try {
			await rejectFeedPost(communityId, id)
			setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "Rejected" as const } : p))
			toast.success("Post rejected")
		} catch {
			toast.error("Failed to reject post")
		} finally {
			setPendingPostIds(s => { const n = new Set(s); n.delete(id); return n })
		}
	}

	async function handleDelete(id: string) {
		setPendingPostIds(s => new Set(s).add(id))
		try {
			await deleteFeedPost(communityId, id)
			setPosts(prev => prev.filter(p => p.id !== id))
			toast.success("Post deleted")
		} catch {
			toast.error("Failed to delete post")
		} finally {
			setPendingPostIds(s => { const n = new Set(s); n.delete(id); return n })
		}
	}
	async function handlePin(id: string) {
		setPendingPostIds(s => new Set(s).add(id))
		try {
			await pinFeedPost(communityId, id)
			setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "Pinned" as const } : p))
			toast.success("Post pinned")
		} catch {
			toast.error("Failed to pin post")
		} finally {
			setPendingPostIds(s => { const n = new Set(s); n.delete(id); return n })
		}
	}
	async function handleUnpin(id: string) {
		setPendingPostIds(s => new Set(s).add(id))
		try {
			await unpinFeedPost(communityId, id)
			setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "Published" as const } : p))
			toast.success("Post unpinned")
		} catch {
			toast.error("Failed to unpin post")
		} finally {
			setPendingPostIds(s => { const n = new Set(s); n.delete(id); return n })
		}
	}
	async function handleResolveReport(reportId: string) {
		try {
			await resolveFeedReport(communityId, reportId)
			setData(prev => prev ? {
				...prev,
				recentReports: prev.recentReports.filter(r => r.id !== reportId),
			} : prev)
			toast.success("Report resolved")
		} catch {
			toast.error("Failed to resolve report")
		}
	}
	async function handleDismissReport(reportId: string) {
		try {
			await dismissFeedReport(communityId, reportId)
			setData(prev => prev ? {
				...prev,
				recentReports: prev.recentReports.filter(r => r.id !== reportId),
			} : prev)
			toast.success("Report dismissed")
		} catch {
			toast.error("Failed to dismiss report")
		}
	}

	async function handleMediaSelect(files: FileList | null) {
		if (!files || files.length === 0) return
		const remaining = 4 - mediaItems.length
		const toUpload = Array.from(files).slice(0, remaining)
		if (toUpload.length === 0) return
		setIsUploadingMedia(true)
		try {
			const results = await Promise.all(
				toUpload.map(async file => {
					const preview = URL.createObjectURL(file)
					const key = await uploadFeedMedia(communityId, file)
					return { key, preview }
				}),
			)
			setMediaItems(prev => [...prev, ...results])
		} catch {
			toast.error("Failed to upload image")
		} finally {
			setIsUploadingMedia(false)
			if (mediaInputRef.current) mediaInputRef.current.value = ""
		}
	}

	async function handleCreate() {
		if (!createContent.trim()) return
		setIsCreating(true)
		try {
			const payload: CreateFeedPostRequest = {
				postType: createType,
				category: createCategory,
				content:  createContent.trim(),
				...(mediaItems.length > 0 ? { mediaKeys: mediaItems.map(m => m.key) } : {}),
				...(createType === "POLL" ? { pollOptions: createPollOptions.filter(o => o.trim()) } : {}),
			}
			await createFeedPost(communityId, payload)
			toast.success("Post created successfully")
			setCreateOpen(false)
			setCreateContent("")
			setCreatePollOptions(["", ""])
			setCreateType("TEXT")
			setCreateCategory("GENERAL")
			setMediaItems([])
			void loadPosts()
		} catch {
			toast.error("Failed to create post")
		} finally {
			setIsCreating(false)
		}
	}

	function handleFilterChange(setter: (v: string) => void, v: string) {
		setter(v)
		setPage(1)
	}

	const stats     = data?.stats
	const queuePosts = posts.filter(p => p.status === "Queue")
	const otherPosts = posts.filter(p => p.status !== "Queue")

	if (error) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error}
			</div>
		)
	}

	return (
		<>
		<div className="flex items-start gap-5">
			{/* ── Main ──────────────────────────────────────────────────────── */}
			<div className="flex-1 min-w-0 flex flex-col gap-5">
				{/* Header */}
				<div className="flex items-start justify-between gap-3">
					<div>
						<h2 className="text-base font-semibold text-text-primary">
							Community Feed Management
						</h2>
						<p className="mt-0.5 text-xs text-text-tertiary">
							Review, moderate and manage all community posts and interactions.
						</p>
					</div>
					<button
						onClick={() => setCreateOpen(true)}
						className="flex shrink-0 items-center gap-1.5 rounded-lg bg-action-primary px-3 py-2 text-xs font-semibold text-action-primary-text hover:opacity-90 transition-opacity"
					>
						<Plus size={13} /> Create Post
					</button>
				</div>

				{/* Stat cards */}
				<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
					<StatCard
						icon={Pin}
						label="Post Queue"
						value={isLoading ? "—" : (stats?.postQueue ?? 0)}
						sub="Awaiting review"
						accent="purple"
					/>
					<StatCard
						icon={Users}
						label="Published"
						value={isLoading ? "—" : (stats?.published ?? 0)}
						sub="Live posts"
						accent="green"
					/>
					<StatCard
						icon={Flag}
						label="Reported"
						value={isLoading ? "—" : (stats?.reported ?? 0)}
						sub="Needs attention"
						accent="rose"
					/>
					<StatCard
						icon={CheckCircle}
						label="Pinned"
						value={isLoading ? "—" : (stats?.pinned ?? 0)}
						sub="Pinned posts"
						accent="amber"
					/>
				</div>

				{/* Toolbar */}
				<div className="flex items-center gap-2 flex-wrap">
					{/* Search */}
					<div className="relative">
						<Search
							size={13}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
						/>
						<input
							type="text"
							placeholder="Search posts..."
							value={searchInput}
							onChange={e => handleSearchChange(e.target.value)}
							className="h-8 w-44 rounded-lg border border-border-default bg-surface-card pl-8 pr-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
						/>
					</div>
					{/* Post type */}
					<div className="relative">
						<select
							value={filterType}
							onChange={e => handleFilterChange(setFilterType, e.target.value)}
							className="h-8 appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-7 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
						>
							{TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
						</select>
						<ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
					</div>
					{/* Time */}
					<div className="relative">
						<select
							value={filterTime}
							onChange={e => handleFilterChange(setFilterTime, e.target.value)}
							className="h-8 appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-7 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
						>
							{TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
						</select>
						<ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
					</div>
					{/* Status */}
					<div className="relative">
						<select
							value={filterStatus}
							onChange={e => handleFilterChange(setFilterStatus, e.target.value)}
							className="h-8 appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-7 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
						>
							{STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
						</select>
						<ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
					</div>
					{/* Sort */}
					<div className="relative ml-auto">
						<select
							value={sort}
							onChange={e => handleFilterChange(setSort, e.target.value)}
							className="h-8 appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-7 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
						>
							{SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
						</select>
						<ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
					</div>
					{/* View toggle */}
					<div className="flex rounded-lg border border-border-default overflow-hidden">
						<button
							onClick={() => setViewMode("list")}
							className={cn(
								"flex items-center px-2.5 py-1.5 transition-colors",
								viewMode === "list"
									? "bg-action-primary text-action-primary-text"
									: "bg-surface-card text-text-secondary hover:bg-neutral-50",
							)}
						>
							<LayoutList size={13} />
						</button>
						<button
							onClick={() => setViewMode("grid")}
							className={cn(
								"flex items-center px-2.5 py-1.5 border-l border-border-default transition-colors",
								viewMode === "grid"
									? "bg-action-primary text-action-primary-text"
									: "bg-surface-card text-text-secondary hover:bg-neutral-50",
							)}
						>
							<LayoutGrid size={13} />
						</button>
					</div>
				</div>

				{/* Post Queue section */}
				{!isPostsLoading && queuePosts.length > 0 && (
					<div className="flex flex-col gap-3">
						<div>
							<h3 className="text-sm font-semibold text-text-primary">
								Post Queue ({queuePosts.length})
							</h3>
							<p className="text-[11px] text-text-tertiary mt-0.5">
								Posts awaiting your review and approval.
							</p>
						</div>
						<div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2" : "flex flex-col")}>
							{queuePosts.map(post => (
								<PostCard key={post.id} post={post} onApprove={handleApprove} onReject={handleReject} onDelete={handleDelete} onPin={handlePin} onUnpin={handleUnpin} isActing={pendingPostIds.has(post.id)} />
							))}
						</div>
					</div>
				)}

				{/* All Posts section */}
				{!isPostsLoading && otherPosts.length > 0 && (
					<div className="flex flex-col gap-3">
						<h3 className="text-sm font-semibold text-text-primary">
							All Posts {total > 0 && <span className="text-text-tertiary font-normal">({total})</span>}
						</h3>
						<div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2" : "flex flex-col")}>
							{otherPosts.map(post => (
								<PostCard key={post.id} post={post} onApprove={handleApprove} onReject={handleReject} onDelete={handleDelete} onPin={handlePin} onUnpin={handleUnpin} isActing={pendingPostIds.has(post.id)} />
							))}
						</div>
					</div>
				)}

				{/* Pagination */}
				{!isPostsLoading && totalPages > 1 && (
					<div className="flex items-center justify-center gap-2">
						<button
							disabled={page === 1}
							onClick={() => setPage(p => p - 1)}
							className="rounded-lg border border-border-default bg-surface-card px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
						>
							Previous
						</button>
						<span className="text-xs text-text-tertiary tabular-nums">
							Page {page} of {totalPages}
						</span>
						<button
							disabled={page >= totalPages}
							onClick={() => setPage(p => p + 1)}
							className="rounded-lg border border-border-default bg-surface-card px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
						>
							Next
						</button>
					</div>
				)}

				{isPostsLoading && (
					<div className="flex h-36 items-center justify-center rounded-xl border border-border-default bg-surface-card">
						<p className="text-sm text-text-tertiary">Loading posts…</p>
					</div>
				)}

				{!isPostsLoading && posts.length === 0 && (
					<div className="flex h-36 items-center justify-center rounded-xl border border-border-default bg-surface-card">
						<p className="text-sm text-text-tertiary">No posts found.</p>
					</div>
				)}
			</div>

			{/* ── Sidebar ───────────────────────────────────────────────────── */}
			<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">
				{/* Feed Overview */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-1">
						<h3 className="text-sm font-semibold text-text-primary">Feed Overview</h3>
						<span className="text-[10px] text-text-tertiary">Last 7 Days</span>
					</div>
					<div className="divide-y divide-border-subtle">
						{(data?.overview ?? []).map(item => (
							<OverviewRow key={item.label} item={item} />
						))}
					</div>
				</div>


				{/* Recent Reports */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-3">Recent Reports</h3>
					{(data?.recentReports ?? []).length === 0 ? (
						<p className="text-[11px] text-text-tertiary text-center py-2">No pending reports</p>
					) : (
						<div className="flex flex-col gap-3">
							{(data?.recentReports ?? []).map(report => (
								<div key={report.id} className="flex flex-col gap-1.5">
									<div className="flex items-center gap-2.5">
										{report.reporterAvatarUrl ? (
											<img
												src={report.reporterAvatarUrl}
												alt={report.reporterName}
												className="h-7 w-7 shrink-0 rounded-full object-cover"
											/>
										) : (
											<div
												className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
												style={{ backgroundColor: report.reporterAvatarColor }}
											>
												{report.reporterAvatarInitial}
											</div>
										)}
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-1.5">
												<span
													className={cn(
														"h-1.5 w-1.5 shrink-0 rounded-full",
														report.severityColor === "red"    ? "bg-red-500"
														: report.severityColor === "green" ? "bg-green-500"
														: "bg-amber-400",
													)}
												/>
												<p className="text-xs font-medium text-text-primary truncate">{report.type}</p>
											</div>
											{report.postSnippet && (
												<p className="text-[10px] text-text-tertiary truncate mt-0.5">&ldquo;{report.postSnippet}&rdquo;</p>
											)}
											<p className="text-[10px] text-text-tertiary">by {report.reporterName} · {report.timeAgo}</p>
										</div>
									</div>
									<div className="flex items-center gap-1.5 pl-9">
										<button
											onClick={() => handleResolveReport(report.id)}
											className="flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 hover:bg-green-100 transition-colors"
										>
											<CheckCircle size={9} /> Resolve
										</button>
										<button
											onClick={() => handleDismissReport(report.id)}
											className="flex items-center gap-1 rounded-md border border-border-default bg-surface-card px-2 py-0.5 text-[10px] font-semibold text-text-secondary hover:bg-neutral-50 transition-colors"
										>
											<X size={9} /> Dismiss
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Tip */}
				<div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
					<div className="flex items-center gap-2 mb-1.5">
						<Lightbulb size={13} className="text-purple-500 shrink-0" />
						<h3 className="text-xs font-semibold text-purple-800">Tip</h3>
					</div>
					<p className="text-[11px] text-purple-700 leading-relaxed">
						{data?.tip ?? "Use pinned posts to highlight important updates or community guidelines."}
					</p>
				</div>
			</div>
		</div>

		{/* ── Create Post Modal ──────────────────────────────────────────── */}
		{createOpen && (
			<div
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
				onClick={e => { if (e.target === e.currentTarget) { setCreateOpen(false); setMediaItems([]) } }}
			>
				<div className="w-full max-w-md rounded-2xl border border-border-default bg-surface-card shadow-xl">
					<div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
						<h2 className="text-sm font-semibold text-text-primary">Create Post</h2>
						<button
							onClick={() => { setCreateOpen(false); setMediaItems([]) }}
							className="rounded-lg p-1 text-text-tertiary hover:bg-surface-card-muted transition-colors"
						>
							<X size={15} />
						</button>
					</div>
					<div className="flex flex-col gap-4 px-5 py-4">
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1.5">
								<label className="text-[11px] font-medium text-text-secondary">Post Type</label>
								<select
									value={createType}
									onChange={e => setCreateType(e.target.value as CreateFeedPostRequest["postType"])}
									className="h-8 rounded-lg border border-border-default bg-surface-card px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
								>
									<option value="TEXT">Text</option>
									<option value="PHOTO">Photo</option>
									<option value="POLL">Poll</option>
								</select>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-[11px] font-medium text-text-secondary">Category</label>
								<select
									value={createCategory}
									onChange={e => setCreateCategory(e.target.value as CreateFeedPostRequest["category"])}
									className="h-8 rounded-lg border border-border-default bg-surface-card px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
								>
									<option value="GENERAL">General</option>
									<option value="MEMORIES">Memories</option>
									<option value="RECOMMENDATION">Recommendation</option>
									<option value="QUESTION">Question</option>
									<option value="POLL">Poll</option>
								</select>
							</div>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-[11px] font-medium text-text-secondary">Content</label>
							<textarea
								value={createContent}
								onChange={e => setCreateContent(e.target.value)}
								rows={4}
								placeholder="Write your post…"
								className="resize-none rounded-lg border border-border-default bg-surface-card px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
							/>
						</div>
						{/* Image upload — shown for PHOTO and TEXT (optional attachment) */}
					{createType !== "POLL" && (
						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<label className="text-[11px] font-medium text-text-secondary">
									{createType === "PHOTO" ? "Images" : "Images (optional)"}
								</label>
								{mediaItems.length > 0 && (
									<span className="text-[10px] text-text-tertiary">{mediaItems.length}/4</span>
								)}
							</div>

							{/* Uploaded previews */}
							{mediaItems.length > 0 && (
								<div className="grid grid-cols-4 gap-2">
									{mediaItems.map((m, i) => (
										<div key={m.key} className="relative aspect-square">
											<img
												src={m.preview}
												alt=""
												className="h-full w-full rounded-lg object-cover"
											/>
											<button
												onClick={() => setMediaItems(prev => prev.filter((_, j) => j !== i))}
												className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow"
											>
												<X size={9} />
											</button>
										</div>
									))}
								</div>
							)}

							{/* Upload trigger */}
							{mediaItems.length < 4 && (
								<>
									<input
										ref={mediaInputRef}
										type="file"
										accept="image/jpeg,image/png,image/webp"
										multiple
										className="hidden"
										onChange={e => handleMediaSelect(e.target.files)}
									/>
									<button
										type="button"
										onClick={() => mediaInputRef.current?.click()}
										disabled={isUploadingMedia}
										className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border-default bg-surface-card-muted py-3 text-[11px] text-text-tertiary hover:border-border-focus hover:text-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isUploadingMedia ? (
											<>
												<div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border-default border-t-action-primary" />
												Uploading…
											</>
										) : (
											<>
												<ImagePlus size={13} />
												{mediaItems.length === 0 ? "Add images" : "Add more"}
											</>
										)}
									</button>
								</>
							)}
						</div>
					)}

					{createType === "POLL" && (
							<div className="flex flex-col gap-2">
								<label className="text-[11px] font-medium text-text-secondary">Poll Options</label>
								{createPollOptions.map((opt, i) => (
									<div key={i} className="flex items-center gap-2">
										<input
											type="text"
											value={opt}
											onChange={e => {
												const next = [...createPollOptions]
												next[i] = e.target.value
												setCreatePollOptions(next)
											}}
											placeholder={`Option ${i + 1}`}
											className="h-8 flex-1 rounded-lg border border-border-default bg-surface-card px-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
										/>
										{createPollOptions.length > 2 && (
											<button
												onClick={() => setCreatePollOptions(prev => prev.filter((_, j) => j !== i))}
												className="text-text-tertiary hover:text-red-500 transition-colors"
											>
												<X size={13} />
											</button>
										)}
									</div>
								))}
								{createPollOptions.length < 5 && (
									<button
										onClick={() => setCreatePollOptions(prev => [...prev, ""])}
										className="flex items-center gap-1 text-[11px] text-text-tertiary hover:text-text-primary transition-colors"
									>
										<Plus size={11} /> Add option
									</button>
								)}
							</div>
						)}
					</div>
					<div className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-3">
						<button
							onClick={() => { setCreateOpen(false); setMediaItems([]) }}
							className="rounded-lg border border-border-default bg-surface-card px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleCreate}
							disabled={isCreating || isUploadingMedia || !createContent.trim()}
							className="rounded-lg bg-action-primary px-4 py-1.5 text-xs font-semibold text-action-primary-text hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isCreating ? "Publishing…" : "Publish Post"}
						</button>
					</div>
				</div>
			</div>
		)}
		</>
	)
}
