"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import {
	Search, SlidersHorizontal, Plus, Eye, Pencil,
	Users, Calendar, CheckCircle, LayoutGrid, Banknote,
	PlusCircle, Copy, Tag, Settings, Lightbulb,
	ChevronLeft, ChevronRight, Unlink,
	type LucideIcon,
} from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/Button"
import {
	getCommunityExperiencesTab,
	detachCommunityEvent,
	type CommunityExperienceTabData,
	type CommunityExperienceItem,
} from "@/lib/api/communities"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

type StatusFilter = "ALL" | "UPCOMING" | "LIVE" | "COMPLETED" | "DRAFT" | "CANCELLED"

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
	UPCOMING:  { label: "Upcoming",  className: "bg-blue-100 text-blue-700" },
	LIVE:      { label: "Live",      className: "bg-purple-100 text-purple-700" },
	COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700" },
	DRAFT:     { label: "Draft",     className: "bg-neutral-100 text-text-secondary" },
	CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-600" },
}

const BOOKING_BAR_COLOR: Record<string, string> = {
	UPCOMING:  "#3b82f6",
	LIVE:      "#9333ea",
	COMPLETED: "#22c55e",
	DRAFT:     "#d1d5db",
	CANCELLED: "#d1d5db",
}

const QUICK_ACTIONS: { label: string; description: string; icon: LucideIcon; bg: string; color: string }[] = [
	{ label: "Create New Experience",  description: "Set up a new experience",               icon: PlusCircle, bg: "bg-purple-50", color: "text-purple-500" },
	{ label: "Duplicate Experience",   description: "Copy and reuse an existing experience", icon: Copy,       bg: "bg-amber-50",  color: "text-amber-500" },
	{ label: "Manage Categories",      description: "Organize experience categories",        icon: Tag,        bg: "bg-sky-50",    color: "text-sky-500" },
	{ label: "Experience Settings",    description: "Configure booking & visibility",        icon: Settings,   bg: "bg-indigo-50", color: "text-indigo-500" },
]

const PAGE_SIZE = 10

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRevenue(n: number): string {
	if (n === 0) return "₹0"
	return `₹${n.toLocaleString("en-IN")}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExperiencesTab({ communityId }: { communityId: string }) {
	const [data, setData]               = useState<CommunityExperienceTabData | null>(null)
	const [isLoading, setIsLoading]     = useState(true)
	const [error, setError]             = useState<string | null>(null)
	const [activeFilter, setActiveFilter] = useState<StatusFilter>("ALL")
	const [search, setSearch]           = useState("")
	const [sort, setSort]               = useState("newest")
	const [page, setPage]               = useState(1)
	const [detachingId, setDetachingId] = useState<string | null>(null)

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			setData(await getCommunityExperiencesTab(communityId))
		} catch {
			setError("Failed to load experiences.")
		} finally {
			setIsLoading(false)
		}
	}, [communityId])

	useEffect(() => { load() }, [load])
	useEffect(() => { setPage(1) }, [activeFilter, search, sort])

	const handleDetach = useCallback(async (eventId: string) => {
		setDetachingId(eventId)
		try {
			await detachCommunityEvent(communityId, eventId)
			toast.success("Experience detached from community")
			setData(prev => prev
				? { ...prev, experiences: prev.experiences.filter(e => e.id !== eventId) }
				: prev,
			)
		} catch {
			toast.error("Failed to detach experience")
		} finally {
			setDetachingId(null)
		}
	}, [communityId])

	const filtered = useMemo(() => {
		if (!data) return []
		let items = data.experiences
		if (activeFilter !== "ALL") items = items.filter(e => e.status === activeFilter)
		const q = search.trim().toLowerCase()
		if (q) items = items.filter(e => e.name.toLowerCase().includes(q))
		if (sort === "oldest") items = [...items].reverse()
		return items
	}, [data, activeFilter, search, sort])

	const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
	const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	const columns = useMemo<ColumnDef<CommunityExperienceItem>[]>(() => [
		{
			id: "experience",
			header: "Experience",
			cell: ({ row }) => {
				const e = row.original
				return (
					<div className="flex items-center gap-3 max-w-55">
						<div
							className="h-10 w-10 shrink-0 rounded-md flex items-center justify-center text-sm font-bold text-white/20 select-none"
							style={{ backgroundColor: e.coverColor }}
						>
							{e.coverInitial}
						</div>
						<div className="min-w-0">
							<p className="text-xs font-semibold text-text-primary truncate">{e.name}</p>
							<div className="flex items-center gap-1 mt-1 flex-wrap">
								{e.tags.map(tag => (
									<span key={tag} className="text-[10px] bg-neutral-100 text-text-secondary rounded px-1.5 py-0.5 font-medium">
										{tag}
									</span>
								))}
							</div>
						</div>
					</div>
				)
			},
		},
		{
			id: "datetime",
			header: () => <span className="whitespace-nowrap">Date & Time</span>,
			cell: ({ row }) => (
				<div>
					<p className="text-xs font-medium text-text-primary">{row.original.date}</p>
					<p className="text-[11px] text-text-tertiary">{row.original.time}</p>
				</div>
			),
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row }) => {
				const cfg = STATUS_BADGE[row.original.status] ?? { label: row.original.status, className: "bg-neutral-100 text-text-secondary" }
				return (
					<span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", cfg.className)}>
						{cfg.label}
					</span>
				)
			},
		},
		{
			id: "bookings",
			header: "Bookings",
			cell: ({ row }) => {
				const e   = row.original
				const pct = e.bookingsTotal > 0 ? Math.round((e.bookingsSold / e.bookingsTotal) * 100) : 0
				const bar = BOOKING_BAR_COLOR[e.status] ?? "#d1d5db"
				return (
					<div className="w-32">
						<div className="flex items-center justify-between text-xs">
							<span className="font-medium text-text-primary tabular-nums">{e.bookingsSold} / {e.bookingsTotal}</span>
							{pct > 0 && pct < 100 && (
								<span className="text-[11px] text-text-tertiary">{pct}%</span>
							)}
						</div>
						<div className="mt-1 h-1.5 rounded-full bg-surface-card-muted overflow-hidden">
							<div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: bar }} />
						</div>
					</div>
				)
			},
		},
		{
			id: "revenue",
			header: "Revenue",
			cell: ({ row }) => (
				<span className="text-xs font-medium text-text-primary tabular-nums">
					{fmtRevenue(row.original.revenue)}
				</span>
			),
		},
		{
			id: "visibility",
			header: "Visibility",
			cell: ({ row }) => {
				const v     = row.original.visibility
				const dot   = v === "PUBLIC" ? "bg-green-500" : v === "PRIVATE" ? "bg-amber-500" : "bg-neutral-400"
				const label = v === "PUBLIC" ? "Public"       : v === "PRIVATE" ? "Private"       : "Draft"
				return (
					<div className="flex items-center gap-1.5">
						<span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
						<span className="text-xs text-text-secondary">{label}</span>
					</div>
				)
			},
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const e = row.original
				return (
					<div className="flex items-center gap-1" onClick={ev => ev.stopPropagation()}>
						<button className="rounded-md p-1.5 text-text-secondary hover:bg-neutral-100 transition-colors" title="View">
							<Eye size={14} />
						</button>
						<button className="rounded-md p-1.5 text-text-secondary hover:bg-neutral-100 transition-colors" title="Edit">
							<Pencil size={14} />
						</button>
						<button
							disabled={detachingId === e.id}
							onClick={() => handleDetach(e.id)}
							className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
							title="Detach from community"
						>
							<Unlink size={14} />
						</button>
					</div>
				)
			},
		},
	], [detachingId, handleDetach])

	if (error) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
		)
	}

	const stats = data?.stats

	const FILTER_TABS: { id: StatusFilter; label: string; count: number }[] = [
		{ id: "ALL",       label: "All Experiences", count: stats?.totalExperiences ?? 0 },
		{ id: "UPCOMING",  label: "Upcoming",         count: stats?.upcoming ?? 0 },
		{ id: "LIVE",      label: "Live",             count: stats?.live ?? 0 },
		{ id: "COMPLETED", label: "Completed",        count: stats?.completed ?? 0 },
		{ id: "DRAFT",     label: "Drafts",           count: stats?.drafts ?? 0 },
		{ id: "CANCELLED", label: "Cancelled",        count: stats?.cancelled ?? 0 },
	]

	return (
		<div className="flex items-start gap-5">

			{/* ── Main ──────────────────────────────────────────────────────── */}
			<div className="flex-1 min-w-0 flex flex-col gap-5">

				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-base font-semibold text-text-primary">Community Experiences</h2>
						<p className="mt-0.5 text-xs text-text-tertiary">Create, manage and track experiences for your community.</p>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<div className="relative">
							<Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
							<input
								type="text"
								placeholder="Search experiences..."
								value={search}
								onChange={e => setSearch(e.target.value)}
								className="h-8 w-48 rounded-lg border border-border-default bg-surface-card pl-8 pr-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
							/>
						</div>
						<Button variant="secondary" size="sm" radius="md" leftIcon={<SlidersHorizontal size={13} />} disabled>
							Filters
						</Button>
						<Button
							variant="primary" size="sm" radius="md"
							leftIcon={<Plus size={13} />}
							onClick={() => toast.info("Create experience coming soon")}
						>
							Create Experience
						</Button>
					</div>
				</div>

				{/* Stat cards */}
				{/* TODO: replace hardcoded values with stats from getCommunityExperiencesTab API */}
				<div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
					<StatCard icon={LayoutGrid}   label="Total Experiences" value={isLoading ? "—" : (stats?.totalExperiences ?? 0)} sub="All time"      accent="purple" />
					<StatCard icon={Calendar}     label="Upcoming"          value={isLoading ? "—" : (stats?.upcoming ?? 0)}          sub="Next 30 days" accent="sky" />
					<StatCard icon={CheckCircle}  label="Completed"         value={isLoading ? "—" : (stats?.completed ?? 0)}         sub="All time"      accent="amber" />
					<StatCard icon={Users}        label="Total Bookings"    value={isLoading ? "—" : (stats?.totalBookings ?? 0).toLocaleString("en-IN")} sub="All time" accent="brand" />
					<StatCard icon={Banknote}     label="Total Revenue"     value={isLoading ? "—" : (stats?.totalRevenue ?? "—")}    sub="All time"      accent="green" />
				</div>

				{/* Filter tabs + sort */}
				<div className="flex items-center justify-between gap-3 flex-wrap">
					<div className="flex items-center gap-1.5 flex-wrap">
						{FILTER_TABS.map(tab => (
							<button
								key={tab.id}
								onClick={() => setActiveFilter(tab.id)}
								className={cn(
									"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
									activeFilter === tab.id
										? "bg-action-primary text-action-primary-text"
										: "bg-neutral-100 text-text-secondary hover:bg-neutral-200",
								)}
							>
								{tab.label}
								<span className={cn(
									"rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
									activeFilter === tab.id ? "bg-white/20 text-white" : "bg-white text-text-secondary",
								)}>
									{tab.count}
								</span>
							</button>
						))}
					</div>
					<select
						value={sort}
						onChange={e => setSort(e.target.value)}
						className="h-8 rounded-lg border border-border-default bg-surface-card px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
					>
						<option value="newest">Sort by: Newest First</option>
						<option value="oldest">Sort by: Oldest First</option>
					</select>
				</div>

				{/* Table */}
				<DataTable
					columns={columns}
					data={paginated}
					isLoading={isLoading}
					emptyState={
						<div className="py-12 text-center text-sm text-text-tertiary">No experiences found.</div>
					}
				/>

				{/* Pagination */}
				<div className="flex items-center justify-between text-xs text-text-tertiary">
					<span>
						{isLoading ? "Loading…" : `Showing ${filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} experiences`}
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
			</div>

			{/* ── Sidebar ───────────────────────────────────────────────────── */}
			<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">

				{/* Experience Performance */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-sm font-semibold text-text-primary">
							Experience Performance{" "}
							<span className="font-normal text-text-tertiary text-xs">(30 Days)</span>
						</h3>
						<button
							className="text-xs font-medium text-text-brand hover:underline shrink-0"
							onClick={() => toast.info("Analytics coming soon")}
						>
							View Analytics
						</button>
					</div>
					<div className="flex flex-col divide-y divide-border-subtle">
						{(data?.performance ?? []).map(metric => (
							<div key={metric.label} className="flex items-center justify-between gap-2 py-3">
								<div>
									<p className="text-[11px] text-text-tertiary">{metric.label}</p>
									<div className="flex items-center gap-1.5 mt-0.5">
										<span className="text-sm font-bold text-text-primary tabular-nums">{metric.value}</span>
										<span className={cn(
											"inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
											metric.trend.direction === "up" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600",
										)}>
											↑ +{metric.trend.value}{metric.trend.label ?? ""}
										</span>
									</div>
								</div>
								<div className="w-20 h-8 shrink-0">
									<ResponsiveContainer width="100%" height={32}>
										<LineChart data={metric.spark}>
											<Line type="monotone" dataKey="v" stroke={metric.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
										</LineChart>
									</ResponsiveContainer>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Top Performing Experiences */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Top Performing Experiences</h3>
						<button className="text-xs font-medium text-text-brand hover:underline">View All</button>
					</div>
					<div className="flex flex-col gap-3">
						{(data?.topPerforming ?? []).map(item => (
							<div key={item.id} className="flex items-center gap-2.5">
								<span className="text-xs font-semibold text-text-tertiary w-4 shrink-0">{item.rank}</span>
								<div
									className="h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-xs font-bold text-white/20 select-none"
									style={{ backgroundColor: item.coverColor }}
								>
									{item.coverInitial}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-xs font-medium text-text-primary truncate">{item.name}</p>
									<p className="text-[11px] text-text-tertiary">{item.bookings} bookings</p>
								</div>
								<span className="text-xs font-semibold text-text-primary tabular-nums shrink-0">{item.revenue}</span>
							</div>
						))}
					</div>
				</div>

				{/* Quick Actions */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
					<div className="flex flex-col gap-1">
						{QUICK_ACTIONS.map(action => (
							<button
								key={action.label}
								className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-surface-card-muted transition-colors text-left"
								onClick={() => toast.info(`${action.label} coming soon`)}
							>
								<div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", action.bg)}>
									<action.icon size={15} className={action.color} />
								</div>
								<div>
									<p className="text-xs font-medium text-text-primary">{action.label}</p>
									<p className="text-[10px] text-text-tertiary leading-tight">{action.description}</p>
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Tips */}
				<div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
					<div className="flex items-center gap-2 mb-2">
						<Lightbulb size={13} className="text-amber-500 shrink-0" />
						<h3 className="text-xs font-semibold text-amber-800">Tips</h3>
					</div>
					<p className="text-[11px] text-amber-700 leading-relaxed">
						Promote your upcoming experiences in Announcements and Community Feed to increase visibility and bookings.
					</p>
					<button
						className="mt-2 text-[11px] font-medium text-text-brand hover:underline"
						onClick={() => toast.info("Learn more coming soon")}
					>
						Learn more →
					</button>
				</div>
			</div>
		</div>
	)
}
