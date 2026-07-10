"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import * as Dialog from "@radix-ui/react-dialog"
import {
	Search,
	Eye,
	Users,
	Calendar,
	CheckCircle,
	LayoutGrid,
	Banknote,
	ChevronLeft,
	ChevronRight,
	Unlink,
	X,
} from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { StatCard } from "@/components/dashboard/stat-card"
import {
	getCommunityExperiencesTab,
	detachCommunityEvent,
	type CommunityExperienceTabData,
	type CommunityExperienceItem,
} from "@/lib/api/communities"
import { cn } from "@/lib/utils"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { StatusCell } from "@/components/ui/table-cells"

// ─── Constants ────────────────────────────────────────────────────────────────

type StatusFilter = "ALL" | "UPCOMING" | "LIVE" | "COMPLETED" | "DRAFT" | "CANCELLED"


const BOOKING_BAR_COLOR: Record<string, string> = {
	UPCOMING: "#3b82f6", LIVE: "#9333ea", COMPLETED: "#22c55e",
	DRAFT: "#d1d5db", CANCELLED: "#d1d5db",
}

const SORT_OPTIONS = [
	{ value: "NEWEST_FIRST",  label: "Sort by: Newest First" },
	{ value: "OLDEST",        label: "Sort by: Oldest First" },
	{ value: "MOST_BOOKINGS", label: "Sort by: Most Bookings" },
	{ value: "REVENUE",       label: "Sort by: Revenue" },
]

const PAGE_SIZE = 10

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRevenue(n: number): string {
	if (n === 0) return "₹0"
	if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
	if (n >= 1_000)   return `₹${(n / 1_000).toFixed(0)}K`
	return `₹${n.toLocaleString("en-IN")}`
}

function TrendBadge({ pct }: { pct: number }) {
	if (pct === 0) return <span className="text-[10px] text-text-tertiary">No change</span>
	const up = pct > 0
	return (
		<span className={cn(
			"inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
			up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600",
		)}>
			{up ? "↑" : "↓"} {Math.abs(pct)}%
		</span>
	)
}

// ─── Experience Detail Modal ──────────────────────────────────────────────────

const STATUS_BADGE_MODAL: Record<string, { label: string; className: string }> = {
	UPCOMING:  { label: "Upcoming",  className: "bg-blue-100 text-blue-700" },
	LIVE:      { label: "Live",      className: "bg-purple-100 text-purple-700" },
	COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700" },
	DRAFT:     { label: "Draft",     className: "bg-neutral-100 text-text-secondary" },
	CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-600" },
}

function ExperienceDetailModal({
	exp,
	onClose,
	onDetach,
	isDetaching,
}: {
	exp: CommunityExperienceItem | null
	onClose: () => void
	onDetach: (id: string) => void
	isDetaching: boolean
}) {
	if (!exp) return null
	const bookingPct = exp.bookingsTotal > 0
		? Math.round((exp.bookingsSold / exp.bookingsTotal) * 100)
		: 0
	const statusCfg = STATUS_BADGE_MODAL[exp.status] ?? { label: exp.status, className: "bg-neutral-100 text-text-secondary" }

	return (
		<Dialog.Root open={!!exp} onOpenChange={(v) => !v && onClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
				<Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-card shadow-2xl focus:outline-none overflow-hidden">
					{/* Cover */}
					<div className="relative aspect-video w-full bg-surface-card-muted overflow-hidden">
						{exp.coverUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={exp.coverUrl} alt={exp.name} className="h-full w-full object-cover" />
						) : (
							<div
								className="h-full w-full flex items-center justify-center text-4xl font-bold text-white/30 select-none"
								style={{ backgroundColor: exp.coverColor }}
							>
								{exp.coverInitial}
							</div>
						)}
						<div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
						<Dialog.Close asChild>
							<button
								className="absolute top-3 right-3 rounded-lg bg-black/30 p-1.5 text-white/80 hover:bg-black/50 transition-colors"
								aria-label="Close"
							>
								<X size={14} />
							</button>
						</Dialog.Close>
						<div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
							<Dialog.Title className="text-sm font-bold text-white leading-snug line-clamp-2 flex-1">
								{exp.name}
							</Dialog.Title>
							<span className={cn("shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", statusCfg.className)}>
								{statusCfg.label}
							</span>
						</div>
					</div>

					{/* Body */}
					<div className="px-5 py-4 flex flex-col gap-4">
						{/* Tags */}
						{exp.tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{exp.tags.map(tag => (
									<span key={tag} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-text-secondary">
										{tag}
									</span>
								))}
							</div>
						)}

						{/* Details */}
						<dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
							<div>
								<dt className="text-text-tertiary mb-0.5">Date</dt>
								<dd className="font-semibold text-text-primary">{exp.date}</dd>
							</div>
							<div>
								<dt className="text-text-tertiary mb-0.5">Time</dt>
								<dd className="font-semibold text-text-primary">{exp.time}</dd>
							</div>
							<div>
								<dt className="text-text-tertiary mb-0.5">Visibility</dt>
								<dd className="flex items-center gap-1.5 font-semibold text-text-primary">
									<span className={cn(
										"h-1.5 w-1.5 rounded-full shrink-0",
										exp.visibility === "PUBLIC" ? "bg-green-500" : exp.visibility === "PRIVATE" ? "bg-amber-500" : "bg-neutral-400",
									)} />
									{exp.visibility === "PUBLIC" ? "Public" : exp.visibility === "PRIVATE" ? "Private" : "Draft"}
								</dd>
							</div>
							<div>
								<dt className="text-text-tertiary mb-0.5">Revenue</dt>
								<dd className="font-semibold text-text-primary tabular-nums">{fmtRevenue(exp.revenue)}</dd>
							</div>
						</dl>

						{/* Bookings */}
						<div>
							<div className="flex items-center justify-between text-xs mb-1.5">
								<span className="text-text-tertiary">Bookings</span>
								<span className="font-semibold text-text-primary tabular-nums">
									{exp.bookingsSold} / {exp.bookingsTotal}
									{bookingPct > 0 && (
										<span className="text-text-tertiary font-normal ml-1">({bookingPct}%)</span>
									)}
								</span>
							</div>
							<div className="h-2 rounded-full bg-surface-card-muted overflow-hidden">
								<div
									className="h-full rounded-full bg-action-primary transition-all"
									style={{ width: `${bookingPct}%` }}
								/>
							</div>
							<p className="mt-1 text-[10px] text-text-tertiary">
								{exp.bookingsTotal - exp.bookingsSold} seats remaining
							</p>
						</div>

						{/* Detach */}
						<div className="border-t border-border-subtle pt-3">
							<button
								disabled={isDetaching}
								onClick={() => onDetach(exp.id)}
								className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<Unlink size={13} />
								{isDetaching ? "Detaching…" : "Detach from Community"}
							</button>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExperiencesTab({ communityId }: { communityId: string }) {
	const [data, setData]             = useState<CommunityExperienceTabData | null>(null)
	const [isLoading, setIsLoading]   = useState(true)
	const [error, setError]           = useState<string | null>(null)
	const [activeFilter, setActiveFilter] = useState<StatusFilter>("ALL")
	const [searchInput, setSearchInput]   = useState("")
	const [committedSearch, setCommittedSearch] = useState("")
	const [sort, setSort]             = useState("NEWEST_FIRST")
	const [page, setPage]             = useState(1)
	const [detachingId, setDetachingId] = useState<string | null>(null)
	const [selectedExp, setSelectedExp] = useState<CommunityExperienceItem | null>(null)
	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	function handleSearchChange(v: string) {
		setSearchInput(v)
		clearTimeout(searchTimerRef.current)
		searchTimerRef.current = setTimeout(() => {
			setCommittedSearch(v)
			setPage(1)
		}, 350)
	}

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			setData(await getCommunityExperiencesTab(communityId, {
				status: activeFilter !== "ALL" ? activeFilter : undefined,
				search: committedSearch || undefined,
				sort,
				page,
				limit: PAGE_SIZE,
			}))
		} catch {
			setError("Failed to load experiences.")
		} finally {
			setIsLoading(false)
		}
	}, [communityId, activeFilter, committedSearch, sort, page])

	useEffect(() => { void load() }, [load])

	const handleDetach = useCallback(
		async (eventId: string) => {
			setDetachingId(eventId)
			try {
				await detachCommunityEvent(communityId, eventId)
				toast.success("Experience detached from community")
				setSelectedExp(null)
				void load()
			} catch {
				toast.error("Failed to detach experience")
			} finally {
				setDetachingId(null)
			}
		},
		[communityId, load],
	)

	const columns = useMemo<ColumnDef<CommunityExperienceItem>[]>(
		() => [
			{
				id: "experience",
				header: "Experience",
				cell: ({ row }) => {
					const e = row.original
					return (
						<div className="flex items-center gap-3 max-w-55">
							{e.coverUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={e.coverUrl}
									alt={e.name}
									className="h-10 w-10 shrink-0 rounded-md object-cover"
								/>
							) : (
								<div
									className="h-10 w-10 shrink-0 rounded-md flex items-center justify-center text-sm font-bold text-white/40 select-none"
									style={{ backgroundColor: e.coverColor }}
								>
									{e.coverInitial}
								</div>
							)}
							<div className="min-w-0">
								<p className="text-xs font-semibold text-text-primary truncate">{e.name}</p>
							</div>
						</div>
					)
				},
			},
			{
				id: "datetime",
				header: () => <span className="whitespace-nowrap">Date &amp; Time</span>,
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
				cell: ({ row }) => <StatusCell status={row.original.status} />,
			},
			{
				id: "bookings",
				header: "Bookings",
				cell: ({ row }) => {
					const e = row.original
					const pct = e.bookingsTotal > 0 ? Math.round((e.bookingsSold / e.bookingsTotal) * 100) : 0
					const bar = BOOKING_BAR_COLOR[e.status] ?? "#d1d5db"
					return (
						<div className="w-32">
							<div className="flex items-center justify-between text-xs">
								<span className="font-medium text-text-primary tabular-nums">
									{e.bookingsSold} / {e.bookingsTotal}
								</span>
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
					const v = row.original.visibility
					const dot   = v === "PUBLIC" ? "bg-green-500" : v === "PRIVATE" ? "bg-amber-500" : "bg-neutral-400"
					const label = v === "PUBLIC" ? "Public"       : v === "PRIVATE" ? "Private"      : "Draft"
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
							<button
								onClick={() => setSelectedExp(e)}
								className="rounded-md p-1.5 text-text-secondary hover:bg-neutral-100 transition-colors"
								title="View details"
							>
								<Eye size={14} />
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
		],
		[detachingId, handleDetach, setSelectedExp],
	)

	if (error) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error}
			</div>
		)
	}

	const counts    = data?.tabCounts
	const stats     = data?.stats
	const perf      = data?.performance30d
	const total     = data?.total ?? 0
	const totalPages = Math.ceil(total / PAGE_SIZE)

	const FILTER_TABS: { id: StatusFilter; label: string; count: number }[] = [
		{ id: "ALL",       label: "All Experiences", count: counts?.all ?? 0 },
		{ id: "UPCOMING",  label: "Upcoming",        count: counts?.upcoming ?? 0 },
		{ id: "LIVE",      label: "Live",             count: counts?.live ?? 0 },
		{ id: "COMPLETED", label: "Completed",        count: counts?.completed ?? 0 },
		{ id: "DRAFT",     label: "Drafts",           count: counts?.drafts ?? 0 },
		{ id: "CANCELLED", label: "Cancelled",        count: counts?.cancelled ?? 0 },
	]

	return (
		<>
		<div className="flex items-start gap-5">
			{/* ── Main ──────────────────────────────────────────────────────── */}
			<div className="flex-1 min-w-0 flex flex-col gap-5">
				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-base font-semibold text-text-primary">Community Experiences</h2>
						<p className="mt-0.5 text-xs text-text-tertiary">
							View and manage experiences linked to this community.
						</p>
					</div>
					<div className="relative shrink-0">
						<Search
							size={13}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
						/>
						<input
							type="text"
							placeholder="Search experiences..."
							value={searchInput}
							onChange={e => handleSearchChange(e.target.value)}
							className="h-8 w-48 rounded-lg border border-border-default bg-surface-card pl-8 pr-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
						/>
					</div>
				</div>

				{/* Stat cards */}
				<div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
					<StatCard
						icon={LayoutGrid}
						label="Total"
						value={isLoading ? "—" : (counts?.all ?? 0)}
						sub="All time"
						accent="purple"
					/>
					<StatCard
						icon={Calendar}
						label="Upcoming"
						value={isLoading ? "—" : (counts?.upcoming ?? 0)}
						sub="Next 30 days"
						accent="sky"
					/>
					<StatCard
						icon={CheckCircle}
						label="Completed"
						value={isLoading ? "—" : (counts?.completed ?? 0)}
						sub="All time"
						accent="amber"
					/>
					<StatCard
						icon={Users}
						label="Bookings"
						value={isLoading ? "—" : (stats?.totalBookings ?? 0).toLocaleString("en-IN")}
						sub="All time"
						accent="brand"
					/>
					<StatCard
						icon={Banknote}
						label="Revenue"
						value={isLoading ? "—" : fmtRevenue(stats?.totalRevenue ?? 0)}
						sub="All time"
						accent="green"
					/>
				</div>

				{/* Filter + sort */}
				<div className="flex items-center justify-between gap-3 flex-wrap">
					<FilterTabs
						value={activeFilter}
						onChange={v => { setActiveFilter(v); setPage(1) }}
						options={FILTER_TABS.map(t => ({ value: t.id, label: t.count > 0 ? `${t.label} (${t.count})` : t.label }))}
					/>
					<select
						value={sort}
						onChange={e => { setSort(e.target.value); setPage(1) }}
						className="h-8 rounded-lg border border-border-default bg-surface-card px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
					>
						{SORT_OPTIONS.map(o => (
							<option key={o.value} value={o.value}>{o.label}</option>
						))}
					</select>
				</div>

				{/* Table */}
				<DataTable
					columns={columns}
					data={data?.experiences ?? []}
					isLoading={isLoading}
					emptyState={
						<div className="py-12 text-center text-sm text-text-tertiary">
							No experiences found.
						</div>
					}
				/>

				{/* Pagination */}
				<div className="flex items-center justify-between text-xs text-text-tertiary">
					<span>
						{isLoading
							? "Loading…"
							: total === 0
								? "No experiences found"
								: `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} experiences`}
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
				{/* Experience Performance (30 Days) */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-1">
						Experience Performance{" "}
						<span className="font-normal text-text-tertiary text-xs">(30 Days)</span>
					</h3>
					<div className="flex flex-col divide-y divide-border-subtle">
						<div className="flex items-center justify-between gap-2 py-3">
							<div>
								<p className="text-[11px] text-text-tertiary">Bookings</p>
								<p className="text-sm font-bold text-text-primary tabular-nums mt-0.5">
									{isLoading ? "—" : (perf?.bookings.value ?? 0).toLocaleString("en-IN")}
								</p>
							</div>
							{!isLoading && <TrendBadge pct={perf?.bookings.deltaPct ?? 0} />}
						</div>
						<div className="flex items-center justify-between gap-2 py-3">
							<div>
								<p className="text-[11px] text-text-tertiary">Revenue</p>
								<p className="text-sm font-bold text-text-primary tabular-nums mt-0.5">
									{isLoading ? "—" : fmtRevenue(perf?.revenue.value ?? 0)}
								</p>
							</div>
							{!isLoading && <TrendBadge pct={perf?.revenue.deltaPct ?? 0} />}
						</div>
						<div className="flex items-center justify-between gap-2 py-3">
							<div>
								<p className="text-[11px] text-text-tertiary">Attendance Rate</p>
								<p className="text-sm font-bold text-text-primary tabular-nums mt-0.5">
									{isLoading
										? "—"
										: perf?.attendanceRate.value == null
											? "—"
											: `${perf.attendanceRate.value}%`}
								</p>
							</div>
							{!isLoading && <TrendBadge pct={perf?.attendanceRate.deltaPct ?? 0} />}
						</div>
					</div>
				</div>

				{/* Top Performing Experiences */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-3">
						Top Performing Experiences
					</h3>
					{(data?.topPerforming ?? []).length === 0 ? (
						<div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border-default">
							<p className="text-xs text-text-tertiary">Top experiences — coming soon</p>
						</div>
					) : (
						<div className="flex flex-col gap-3">
							{data!.topPerforming.map((item, i) => (
								<div key={item.id} className="flex items-center gap-2.5">
									<span className="text-xs font-semibold text-text-tertiary w-4 shrink-0">
										{i + 1}
									</span>
									{item.coverUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={item.coverUrl}
											alt={item.name}
											className="h-9 w-9 shrink-0 rounded-md object-cover"
										/>
									) : (
										<div
											className="h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-xs font-bold text-white/40 select-none"
											style={{ backgroundColor: item.coverColor }}
										>
											{item.coverInitial}
										</div>
									)}
									<div className="flex-1 min-w-0">
										<p className="text-xs font-medium text-text-primary truncate">{item.name}</p>
										<p className="text-[11px] text-text-tertiary">{item.bookings} bookings</p>
									</div>
									<span className="text-xs font-semibold text-text-primary tabular-nums shrink-0">
										{fmtRevenue(item.revenue)}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>

		<ExperienceDetailModal
			exp={selectedExp}
			onClose={() => setSelectedExp(null)}
			onDetach={handleDetach}
			isDetaching={!!detachingId}
		/>
		</>
	)
}
