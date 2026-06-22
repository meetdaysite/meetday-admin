"use client"

import { useCallback, useEffect, useState } from "react"
import {
	Settings, Plus, Search, LayoutList, LayoutGrid,
	MessageSquare, Heart, Eye, CheckCircle, XCircle, ExternalLink,
	ChevronDown, ChevronRight, Lightbulb, Flag, Shield, Volume2,
	AlertTriangle, Bell, Pin, Users,
	type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
	LineChart, Line, ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/Button"
import { StatCard } from "@/components/dashboard/stat-card"
import {
	getCommunityFeedTab,
	type CommunityFeedTabData,
	type CommunityFeedPost,
	type CommunityFeedOverviewItem,
} from "@/lib/api/communities"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const POST_TYPE_BADGE: Record<string, string> = {
	Photo:   "bg-purple-100 text-purple-700",
	Text:    "bg-blue-100 text-blue-700",
	Gallery: "bg-teal-100 text-teal-700",
	Video:   "bg-rose-100 text-rose-700",
	Poll:    "bg-amber-100 text-amber-700",
}

const MEMBER_BADGE: Record<string, string> = {
	"New Member":       "bg-blue-100 text-blue-700",
	"Top Contributor":  "bg-amber-100 text-amber-700",
	"Moderator":        "bg-green-100 text-green-700",
	"Owner":            "bg-purple-100 text-purple-700",
}

const ICON_MAP: Record<string, LucideIcon> = {
	shield:  Shield,
	speaker: Volume2,
	warning: AlertTriangle,
	bell:    Bell,
}

type ViewMode    = "list" | "grid"
type FilterType  = "All Post Types" | "Photo" | "Text" | "Gallery" | "Video" | "Poll"
type FilterTime  = "All Time" | "Today" | "This Week" | "This Month"
type FilterStatus = "All Status" | "Queue" | "Published" | "Rejected" | "Pinned"
type SortMode    = "Newest First" | "Oldest First" | "Most Likes" | "Most Views"

// ─── Overview Sparkline Row ────────────────────────────────────────────────────

function OverviewRow({ item }: { item: CommunityFeedOverviewItem }) {
	const chartData = item.sparkline.map((v, i) => ({ i, v }))
	return (
		<div className="flex items-center gap-2 py-2">
			<div className="flex-1 min-w-0">
				<p className="text-xs text-text-secondary">{item.label}</p>
				<div className="flex items-center gap-1.5 mt-0.5">
					<span className="text-sm font-bold text-text-primary">{item.value}</span>
					<span className={cn(
						"text-[10px] font-semibold",
						item.direction === "up" ? "text-green-500" : "text-red-500",
					)}>
						{item.direction === "up" ? "↑" : "↓"} {item.growth}%
					</span>
				</div>
			</div>
			<div className="w-20 h-8 shrink-0">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={chartData}>
						<Line
							type="monotone" dataKey="v" stroke={item.color}
							strokeWidth={1.5} dot={false} isAnimationActive={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	)
}

// ─── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({ post, onApprove, onReject }: {
	post: CommunityFeedPost
	onApprove: (id: string) => void
	onReject:  (id: string) => void
}) {
	return (
		<div className="rounded-xl border border-border-default bg-surface-card p-4 flex flex-col gap-3">
			{/* Author row */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2.5">
					<div
						className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
						style={{ backgroundColor: post.authorAvatarColor }}
					>
						{post.authorAvatarInitial}
					</div>
					<div className="min-w-0">
						<div className="flex items-center gap-1.5 flex-wrap">
							<span className="text-sm font-semibold text-text-primary">{post.authorName}</span>
							{post.authorBadge && (
								<span className={cn(
									"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
									MEMBER_BADGE[post.authorBadge] ?? "bg-neutral-100 text-text-secondary",
								)}>
									{post.authorBadge}
								</span>
							)}
						</div>
						<p className="text-[11px] text-text-tertiary">{post.timeAgo}</p>
					</div>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<span className={cn(
						"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
						POST_TYPE_BADGE[post.postType] ?? "bg-neutral-100 text-text-secondary",
					)}>
						{post.postType}
					</span>
					<button className="rounded-md p-1 text-text-secondary hover:bg-neutral-100 transition-colors">
						<svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
							<circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>
						</svg>
					</button>
				</div>
			</div>

			{/* Content */}
			<div className="flex gap-3">
				{post.imageColor && (
					<div
						className="h-16 w-24 shrink-0 rounded-lg"
						style={{ background: post.imageColor }}
					/>
				)}
				<div className="flex-1 min-w-0">
					<p className="text-xs text-text-primary leading-relaxed whitespace-pre-line line-clamp-3">
						{post.content}
					</p>
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
						<Heart size={11} /> {post.likes}
					</span>
					<span className="flex items-center gap-1">
						<Eye size={11} /> {post.views}
					</span>
				</div>
				{post.status === "Queue" && (
					<div className="flex items-center gap-2">
						<button
							onClick={() => onApprove(post.id)}
							className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] font-semibold text-green-700 hover:bg-green-100 transition-colors"
						>
							<CheckCircle size={12} /> Approve
						</button>
						<button
							onClick={() => onReject(post.id)}
							className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition-colors"
						>
							<XCircle size={12} /> Reject
						</button>
						<button className="flex items-center gap-1 rounded-lg border border-border-default bg-surface-card px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:bg-neutral-50 transition-colors">
							<ExternalLink size={12} /> View
						</button>
					</div>
				)}
				{post.status !== "Queue" && (
					<span className={cn(
						"inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
						post.status === "Published" ? "bg-green-100 text-green-700"
						: post.status === "Rejected"  ? "bg-red-100 text-red-700"
						: "bg-amber-100 text-amber-700",
					)}>
						{post.status}
					</span>
				)}
			</div>
		</div>
	)
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function FeedTab({ communityId }: { communityId: string }) {
	const [data, setData]             = useState<CommunityFeedTabData | null>(null)
	const [isLoading, setIsLoading]   = useState(true)
	const [error, setError]           = useState<string | null>(null)
	const [viewMode, setViewMode]     = useState<ViewMode>("list")
	const [search, setSearch]         = useState("")
	const [filterType, setFilterType] = useState<FilterType>("All Post Types")
	const [filterTime, setFilterTime] = useState<FilterTime>("All Time")
	const [filterStatus, setFilterStatus] = useState<FilterStatus>("All Status")
	const [sort, setSort]             = useState<SortMode>("Newest First")
	const [posts, setPosts]           = useState<CommunityFeedPost[]>([])
	const [showAll, setShowAll]       = useState(false)

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const result = await getCommunityFeedTab(communityId)
			setData(result)
			setPosts(result.posts)
		} catch {
			setError("Failed to load feed.")
		} finally {
			setIsLoading(false)
		}
	}, [communityId])

	useEffect(() => { load() }, [load])

	function handleApprove(id: string) {
		setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "Published" as const } : p))
		toast.success("Post approved")
	}

	function handleReject(id: string) {
		setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "Rejected" as const } : p))
		toast.error("Post rejected")
	}

	const filtered = posts.filter(p => {
		const q = search.trim().toLowerCase()
		const matchSearch = !q || p.content.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q)
		const matchType   = filterType === "All Post Types" || p.postType === filterType
		const matchStatus = filterStatus === "All Status"    || p.status === filterStatus
		return matchSearch && matchType && matchStatus
	})

	const queueCount = posts.filter(p => p.status === "Queue").length
	const queuePosts = filtered.filter(p => p.status === "Queue")
	const otherPosts = filtered.filter(p => p.status !== "Queue")

	const displayedOther = showAll ? otherPosts : otherPosts.slice(0, 3)

	if (error) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
		)
	}

	const stats = data?.stats

	return (
		<div className="flex items-start gap-5">

			{/* ── Main ──────────────────────────────────────────────────────── */}
			<div className="flex-1 min-w-0 flex flex-col gap-5">

				{/* Header */}
				<div className="flex items-start justify-between gap-4 flex-wrap">
					<div>
						<h2 className="text-base font-semibold text-text-primary">Community Feed Management</h2>
						<p className="mt-0.5 text-xs text-text-tertiary">Review, moderate and manage all community posts and interactions.</p>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<Button variant="secondary" size="sm" radius="md" leftIcon={<Settings size={13} />}
							onClick={() => toast.info("Feed settings coming soon")}>
							Feed Settings
						</Button>
						<Button variant="primary" size="sm" radius="md" leftIcon={<Plus size={13} />}
							onClick={() => toast.info("Create post coming soon")}>
							Create Community Post
						</Button>
					</div>
				</div>

				{/* Stat cards — same pattern as other tabs */}
				{/* TODO: wire trend values from getCommunityFeedTab API response */}
				<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
					<StatCard icon={Pin}        label="Post Queue"  value={isLoading ? "—" : (stats?.postQueue  ?? 0)} sub="Awaiting review" accent="purple" />
					<StatCard icon={Users}      label="Published"   value={isLoading ? "—" : (stats?.published  ?? 0)} sub="Live posts"       accent="green" />
					<StatCard icon={Flag}       label="Reported"    value={isLoading ? "—" : (stats?.reported   ?? 0)} sub="Needs attention"  accent="rose" />
					<StatCard icon={CheckCircle} label="Pinned"     value={isLoading ? "—" : (stats?.pinned     ?? 0)} sub="Pinned posts"     accent="amber" />
				</div>

				{/* Toolbar: search · filters · sort · view toggle — single row */}
				<div className="flex items-center gap-2">
					{/* Search */}
					<div className="relative">
						<Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
						<input
							type="text"
							placeholder="Search posts..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							className="h-8 w-44 rounded-lg border border-border-default bg-surface-card pl-8 pr-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
						/>
					</div>
					{/* Post type */}
					<div className="relative">
						<select value={filterType} onChange={e => setFilterType(e.target.value as FilterType)}
							className="h-8 appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-7 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus">
							{(["All Post Types","Photo","Text","Gallery","Video","Poll"] as FilterType[]).map(t => <option key={t}>{t}</option>)}
						</select>
						<ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
					</div>
					{/* Time */}
					<div className="relative">
						<select value={filterTime} onChange={e => setFilterTime(e.target.value as FilterTime)}
							className="h-8 appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-7 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus">
							{(["All Time","Today","This Week","This Month"] as FilterTime[]).map(t => <option key={t}>{t}</option>)}
						</select>
						<ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
					</div>
					{/* Status */}
					<div className="relative">
						<select value={filterStatus} onChange={e => setFilterStatus(e.target.value as FilterStatus)}
							className="h-8 appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-7 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus">
							{(["All Status","Queue","Published","Rejected","Pinned"] as FilterStatus[]).map(t => <option key={t}>{t}</option>)}
						</select>
						<ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
					</div>
					{/* Sort — pushed to the right */}
					<div className="relative ml-auto">
						<select value={sort} onChange={e => setSort(e.target.value as SortMode)}
							className="h-8 appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-7 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus">
							{(["Newest First","Oldest First","Most Likes","Most Views"] as SortMode[]).map(t => <option key={t}>{t}</option>)}
						</select>
						<ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
					</div>
					{/* View toggle */}
					<div className="flex rounded-lg border border-border-default overflow-hidden">
						<button onClick={() => setViewMode("list")}
							className={cn("flex items-center px-2.5 py-1.5 transition-colors",
								viewMode === "list" ? "bg-action-primary text-action-primary-text" : "bg-surface-card text-text-secondary hover:bg-neutral-50")}>
							<LayoutList size={13} />
						</button>
						<button onClick={() => setViewMode("grid")}
							className={cn("flex items-center px-2.5 py-1.5 border-l border-border-default transition-colors",
								viewMode === "grid" ? "bg-action-primary text-action-primary-text" : "bg-surface-card text-text-secondary hover:bg-neutral-50")}>
							<LayoutGrid size={13} />
						</button>
					</div>
				</div>

				{/* Post Queue section */}
				{queuePosts.length > 0 && (
					<div className="flex flex-col gap-3">
						<div>
							<h3 className="text-sm font-semibold text-text-primary">Post Queue ({queueCount})</h3>
							<p className="text-[11px] text-text-tertiary mt-0.5">Posts awaiting your review and approval.</p>
						</div>
						<div className={cn(
							"gap-3",
							viewMode === "grid" ? "grid grid-cols-2" : "flex flex-col",
						)}>
							{queuePosts.map(post => (
								<PostCard key={post.id} post={post} onApprove={handleApprove} onReject={handleReject} />
							))}
						</div>
					</div>
				)}

				{/* Other posts */}
				{otherPosts.length > 0 && (
					<div className="flex flex-col gap-3">
						<h3 className="text-sm font-semibold text-text-primary">All Posts</h3>
						<div className={cn(
							"gap-3",
							viewMode === "grid" ? "grid grid-cols-2" : "flex flex-col",
						)}>
							{displayedOther.map(post => (
								<PostCard key={post.id} post={post} onApprove={handleApprove} onReject={handleReject} />
							))}
						</div>
						{otherPosts.length > 3 && (
							<button
								onClick={() => setShowAll(v => !v)}
								className="flex items-center justify-center gap-1.5 rounded-xl border border-border-default bg-surface-card py-2.5 text-xs font-medium text-text-secondary hover:bg-neutral-50 transition-colors w-full"
							>
								{showAll ? "Show less" : `Load more posts`}
								<ChevronDown size={13} className={cn("transition-transform", showAll && "rotate-180")} />
							</button>
						)}
					</div>
				)}

				{!isLoading && filtered.length === 0 && (
					<div className="flex h-36 items-center justify-center rounded-xl border border-border-default bg-surface-card">
						<p className="text-sm text-text-tertiary">No posts found.</p>
					</div>
				)}

				{isLoading && (
					<div className="flex h-36 items-center justify-center rounded-xl border border-border-default bg-surface-card">
						<p className="text-sm text-text-tertiary">Loading feed…</p>
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
					<button className="mb-2 text-xs font-medium text-text-brand hover:underline block ml-auto"
						onClick={() => toast.info("Analytics coming soon")}>
						View Analytics
					</button>
					<div className="divide-y divide-border-subtle">
						{(data?.overview ?? []).map(item => (
							<OverviewRow key={item.label} item={item} />
						))}
					</div>
				</div>

				{/* Moderation Tools */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-2">Moderation Tools</h3>
					<div className="flex flex-col">
						{(data?.moderationTools ?? []).map(tool => {
							const Icon = ICON_MAP[tool.iconKey] ?? Shield
							return (
								<button
									key={tool.label}
									className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-card-muted transition-colors text-left"
									onClick={() => toast.info(`${tool.label} coming soon`)}
								>
									<div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", tool.bg)}>
										<Icon size={13} className={tool.color} />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-xs font-medium text-text-primary">{tool.label}</p>
										<p className="text-[10px] text-text-tertiary truncate">{tool.description}</p>
									</div>
									<ChevronRight size={12} className="text-text-tertiary shrink-0" />
								</button>
							)
						})}
					</div>
				</div>

				{/* Recent Reports */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Recent Reports</h3>
						<button className="text-xs font-medium text-text-brand hover:underline"
							onClick={() => toast.info("View all reports coming soon")}>
							View All
						</button>
					</div>
					<div className="flex flex-col gap-2.5">
						{(data?.recentReports ?? []).map(report => (
							<div key={report.id} className="flex items-center gap-2.5">
								<div
									className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
									style={{ backgroundColor: report.reporterAvatarColor }}
								>
									{report.reporterAvatarInitial}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-xs font-medium text-text-primary truncate">{report.type}</p>
									<p className="text-[10px] text-text-tertiary">by {report.reporterName}</p>
								</div>
								<div className="flex items-center gap-1.5 shrink-0">
									<span className="text-[10px] text-text-tertiary">{report.timeAgo}</span>
									<span className="h-1.5 w-1.5 rounded-full bg-red-500" />
								</div>
							</div>
						))}
					</div>
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
	)
}
