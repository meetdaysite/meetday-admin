"use client"

import { useCallback, useEffect, useState } from "react"
import {
	Plus, Megaphone, Calendar, FileText, Eye, Mail, MousePointer,
	Pencil, Copy, MoreHorizontal, ChevronLeft, ChevronRight,
	ClipboardCopy, Share2, CalendarPlus, MessageSquare, Download,
	Users, type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { StatCard } from "@/components/dashboard/stat-card"
import {
	getCommunityAnnouncementsTab,
	type AnnouncementsTabData,
	type AnnouncementItem,
	type AnnouncementStatus,
} from "@/lib/api/communities"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<AnnouncementStatus, string> = {
	Published: "bg-green-100 text-green-700",
	Scheduled: "bg-blue-100 text-blue-700",
	Draft:     "bg-neutral-100 text-neutral-600",
}

const ROLE_BADGE: Record<string, string> = {
	Owner:     "bg-amber-100 text-amber-700",
	Manager:   "bg-purple-100 text-purple-700",
	Moderator: "bg-green-100 text-green-700",
}

const QUICK_ACTIONS: { label: string; icon: LucideIcon; bg: string; color: string }[] = [
	{ label: "Create Announcement", icon: Megaphone,    bg: "bg-red-50",    color: "text-red-500" },
	{ label: "Schedule Event",      icon: CalendarPlus, bg: "bg-purple-50", color: "text-purple-500" },
	{ label: "Post in Community",   icon: MessageSquare, bg: "bg-green-50", color: "text-green-500" },
	{ label: "Export Members",      icon: Download,     bg: "bg-blue-50",   color: "text-blue-500" },
]

type FilterStatus = "All Announcements" | "Published" | "Scheduled" | "Draft"
type SortMode    = "Newest First" | "Oldest First" | "Most Views"
const PAGE_SIZE  = 10

// ─── Announcement Row ─────────────────────────────────────────────────────────

function AnnouncementRow({ item }: { item: AnnouncementItem }) {
	const isPublished = item.status === "Published"
	const isScheduled = item.status === "Scheduled"

	return (
		<div className="flex items-start gap-4 rounded-xl border border-border-default bg-surface-card p-4">
			{/* Cover image */}
			<div
				className="h-24 w-20 shrink-0 rounded-lg"
				style={{ background: item.imageGradient }}
			/>

			{/* Middle content */}
			<div className="flex-1 min-w-0">
				<h4 className="text-sm font-semibold text-text-primary mb-1">{item.title}</h4>
				<div className="flex items-center gap-2 mb-2">
					<span className={cn(
						"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
						STATUS_BADGE[item.status],
					)}>
						{item.status}
					</span>
					<span className="text-[11px] text-text-tertiary">• {item.audience}</span>
				</div>
				<p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-2">
					{item.content}
				</p>

				{isScheduled && item.scheduledFor && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
							<Calendar size={11} className="shrink-0" />
							<span>Scheduled for <span className="font-medium text-text-secondary">{item.scheduledFor}</span></span>
						</div>
						{item.estimatedReach && (
							<div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
								<Eye size={11} className="shrink-0" />
								<span>Estimated Reach <span className="font-medium text-text-secondary">{item.estimatedReach}</span></span>
							</div>
						)}
					</div>
				)}

				{(isPublished || item.timeAgo) && (
					<div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
						<div
							className="h-4 w-4 shrink-0 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
							style={{ backgroundColor: item.authorAvatarColor }}
						>
							{item.authorInitial}
						</div>
						<span>By {item.authorName} • {item.timeAgo}</span>
					</div>
				)}
			</div>

			{/* Right: stats (published) or schedule info (scheduled) */}
			{isPublished && item.views !== null && (
				<div className="hidden md:flex items-center gap-6 shrink-0 pr-2">
					<div className="flex flex-col items-center gap-0.5">
						<div className="flex items-center gap-1 text-text-secondary">
							<Eye size={13} />
							<span className="text-sm font-bold text-text-primary">
								{item.views >= 1000 ? `${(item.views / 1000).toFixed(1)}K` : item.views}
							</span>
						</div>
						<span className="text-[10px] text-text-tertiary">Views</span>
					</div>
					<div className="flex flex-col items-center gap-0.5">
						<div className="flex items-center gap-1 text-text-secondary">
							<Mail size={13} />
							<span className="text-sm font-bold text-text-primary">{item.opens}</span>
						</div>
						<span className="text-[10px] text-text-tertiary">Opens</span>
					</div>
					<div className="flex flex-col items-center gap-0.5">
						<div className="flex items-center gap-1 text-text-secondary">
							<MousePointer size={13} />
							<span className="text-sm font-bold text-text-primary">{item.clicks}</span>
						</div>
						<span className="text-[10px] text-text-tertiary">Clicks</span>
					</div>
				</div>
			)}

			{isScheduled && item.scheduledFor && (
				<div className="hidden md:flex flex-col gap-1.5 shrink-0 pr-2 min-w-[140px]">
					<div className="text-[11px] text-text-tertiary">Scheduled for</div>
					<div className="text-xs font-semibold text-text-primary">{item.scheduledFor}</div>
					{item.estimatedReach && (
						<>
							<div className="text-[11px] text-text-tertiary mt-1">Estimated Reach</div>
							<div className="text-xs font-semibold text-text-primary">{item.estimatedReach}</div>
						</>
					)}
				</div>
			)}

			{/* Actions */}
			<div className="flex items-center gap-1.5 shrink-0">
				<button
					onClick={() => toast.info("Edit coming soon")}
					className="flex items-center gap-1 rounded-lg border border-border-default bg-surface-card px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
				>
					<Pencil size={11} /> Edit
				</button>
				<button
					onClick={() => toast.info("Duplicate coming soon")}
					className="flex items-center gap-1 rounded-lg border border-border-default bg-surface-card px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
				>
					<Copy size={11} /> Duplicate
				</button>
				<button className="rounded-lg border border-border-default bg-surface-card p-1.5 text-text-secondary hover:bg-neutral-50 transition-colors">
					<MoreHorizontal size={13} />
				</button>
			</div>
		</div>
	)
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AnnouncementsTab({ communityId }: { communityId: string }) {
	const [data, setData]           = useState<AnnouncementsTabData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError]         = useState<string | null>(null)
	const [filter, setFilter]       = useState<FilterStatus>("All Announcements")
	const [sort, setSort]           = useState<SortMode>("Newest First")
	const [page, setPage]           = useState(1)

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			setData(await getCommunityAnnouncementsTab(communityId))
		} catch {
			setError("Failed to load announcements.")
		} finally {
			setIsLoading(false)
		}
	}, [communityId])

	useEffect(() => { load() }, [load])
	useEffect(() => { setPage(1) }, [filter, sort])

	const filtered = (() => {
		if (!data) return []
		let items = data.announcements
		if (filter !== "All Announcements") items = items.filter(a => a.status === filter)
		if (sort === "Most Views") items = [...items].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
		else if (sort === "Oldest First") items = [...items].reverse()
		return items
	})()

	const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
	const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
	const stats      = data?.stats

	if (error) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
		)
	}

	return (
		<div className="flex items-start gap-5">

			{/* ── Main ──────────────────────────────────────────────────────── */}
			<div className="flex-1 min-w-0 flex flex-col gap-5">

				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-base font-semibold text-text-primary">Announcements</h2>
						<p className="mt-0.5 text-xs text-text-tertiary">Create and manage announcements for your community members.</p>
					</div>
					<Button variant="primary" size="sm" radius="md" leftIcon={<Plus size={13} />}
						onClick={() => toast.info("Create announcement coming soon")}>
						Create Announcement
					</Button>
				</div>

				{/* Stat cards */}
				{/* TODO: wire growth values from getCommunityAnnouncementsTab API response */}
				<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
					<StatCard icon={Megaphone} label="Published"        value={isLoading ? "—" : (stats?.published ?? 0)}  trend={stats ? { value: stats.publishedGrowth,   direction: "up"                                        } : undefined} sub="vs last 7 days" accent="purple" />
					<StatCard icon={Calendar}  label="Scheduled"        value={isLoading ? "—" : (stats?.scheduled ?? 0)}  trend={stats ? { value: stats.scheduledGrowth,   direction: "up"                                        } : undefined} sub="vs last 7 days" accent="sky" />
					<StatCard icon={FileText}  label="Drafts"           value={isLoading ? "—" : (stats?.drafts    ?? 0)}  trend={stats ? { value: Math.abs(stats.draftsGrowth), direction: stats.draftsGrowth >= 0 ? "up" : "down" } : undefined} sub="vs last 7 days" accent="amber" />
					<StatCard icon={Eye}       label="Total Reach (7D)" value={isLoading ? "—" : (stats?.totalReach ?? "—")} trend={stats ? { value: stats.totalReachGrowth, direction: "up"                                        } : undefined} sub="vs last 7 days" accent="green" />
				</div>

				{/* Toolbar */}
				<div className="flex items-center gap-2">
					{/* Filter */}
					<div className="relative">
						<select
							value={filter}
							onChange={e => setFilter(e.target.value as FilterStatus)}
							className="h-8 appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-7 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
						>
							{(["All Announcements","Published","Scheduled","Draft"] as FilterStatus[]).map(f => (
								<option key={f}>{f}</option>
							))}
						</select>
						<ChevronRight size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-text-tertiary" />
					</div>
					{/* Sort */}
					<div className="relative">
						<select
							value={sort}
							onChange={e => setSort(e.target.value as SortMode)}
							className="h-8 appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-7 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
						>
							{(["Newest First","Oldest First","Most Views"] as SortMode[]).map(s => (
								<option key={s}>{s}</option>
							))}
						</select>
						<ChevronRight size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-text-tertiary" />
					</div>
				</div>

				{/* List */}
				{isLoading ? (
					<div className="flex h-40 items-center justify-center rounded-xl border border-border-default bg-surface-card">
						<p className="text-sm text-text-tertiary">Loading announcements…</p>
					</div>
				) : paginated.length === 0 ? (
					<div className="flex h-40 items-center justify-center rounded-xl border border-border-default bg-surface-card">
						<p className="text-sm text-text-tertiary">No announcements found.</p>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{paginated.map(item => (
							<AnnouncementRow key={item.id} item={item} />
						))}
					</div>
				)}

				{/* Pagination */}
				{!isLoading && filtered.length > 0 && (
					<div className="flex items-center justify-between text-xs text-text-tertiary">
						<span>
							Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} announcements
						</span>
						{totalPages > 1 && (
							<div className="flex items-center gap-1">
								<button
									onClick={() => setPage(p => Math.max(1, p - 1))}
									disabled={page === 1}
									className="rounded-md p-1 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
								>
									<ChevronLeft size={14} />
								</button>
								{Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
									<button
										key={n}
										onClick={() => setPage(n)}
										className={cn(
											"h-7 w-7 rounded-md text-xs font-medium transition-colors",
											n === page
												? "bg-action-primary text-action-primary-text"
												: "hover:bg-neutral-100 text-text-secondary",
										)}
									>
										{n}
									</button>
								))}
								<button
									onClick={() => setPage(p => Math.min(totalPages, p + 1))}
									disabled={page === totalPages}
									className="rounded-md p-1 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
								>
									<ChevronRight size={14} />
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			{/* ── Sidebar ───────────────────────────────────────────────────── */}
			<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">

				{/* Community Status */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Community Status</h3>
						{data && (
							<span className={cn(
								"inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
								data.communityStatus === "Active" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600",
							)}>
								{data.communityStatus}
							</span>
						)}
					</div>
					<div className="flex flex-col gap-2 text-xs">
						<div className="flex items-center justify-between">
							<span className="text-text-tertiary">Created on</span>
							<span className="font-medium text-text-primary">{data?.createdOn ?? "—"}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-text-tertiary">Visibility</span>
							<span className="font-medium text-text-primary">{data?.visibility ?? "—"}</span>
						</div>
						<div className="mt-1">
							<span className="text-text-tertiary block mb-1">Community URL</span>
							<div className="flex items-center justify-between gap-2 rounded-lg bg-surface-card-muted px-3 py-2">
								<span className="text-[11px] text-blue-500 truncate">{data?.communityUrl ?? "—"}</span>
								<button
									onClick={() => {
										if (data?.communityUrl) {
											void navigator.clipboard.writeText(data.communityUrl)
											toast.success("URL copied")
										}
									}}
									className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
								>
									<ClipboardCopy size={12} />
								</button>
							</div>
						</div>
					</div>
					<Button
						variant="secondary"
						size="sm"
						radius="md"
						leftIcon={<Share2 size={12} />}
						className="mt-3 w-full justify-center"
						onClick={() => toast.info("Share coming soon")}
					>
						Share Community
					</Button>
				</div>

				{/* Managers & Moderators */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Managers &amp; Moderators</h3>
						<button className="text-xs font-medium text-text-brand hover:underline"
							onClick={() => toast.info("View all coming soon")}>
							View All
						</button>
					</div>
					<div className="flex flex-col gap-2.5">
						{(data?.managers ?? []).map(m => (
							<div key={m.id} className="flex items-center gap-2.5">
								<div
									className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
									style={{ backgroundColor: m.avatarColor }}
								>
									{m.initial}
								</div>
								<span className="flex-1 text-xs font-medium text-text-primary truncate">{m.name}</span>
								<span className={cn(
									"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0",
									ROLE_BADGE[m.role] ?? "bg-neutral-100 text-neutral-600",
								)}>
									{m.role}
								</span>
							</div>
						))}
					</div>
					<button
						className="mt-3 w-full rounded-lg border border-border-default bg-surface-card py-2 text-xs font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
						onClick={() => toast.info("Manage roles coming soon")}
					>
						Manage Roles
					</button>
				</div>

				{/* Quick Actions — 2×2 grid */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
					<div className="grid grid-cols-2 gap-2">
						{QUICK_ACTIONS.map(action => (
							<button
								key={action.label}
								onClick={() => toast.info(`${action.label} coming soon`)}
								className="flex flex-col items-center gap-2 rounded-xl border border-border-default bg-surface-card p-3 text-center hover:bg-surface-card-muted transition-colors"
							>
								<div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", action.bg)}>
									<action.icon size={16} className={action.color} />
								</div>
								<span className="text-[11px] font-medium text-text-secondary leading-tight">{action.label}</span>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
