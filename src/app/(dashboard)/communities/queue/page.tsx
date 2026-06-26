"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import {
	Search,
	Clock,
	CheckCircle,
	XCircle,
	AlarmClock,
	Download,
	Check,
	X,
	UserCog,
	MoreHorizontal,
	ShieldAlert,
	RotateCcw,
} from "lucide-react"
import { PieChart, Pie, Cell } from "recharts"
import { toast } from "sonner"
import { usePermission } from "@/lib/hooks/use-permission"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/Button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
	getCommunityQueue,
	getCommunityQueueStats,
	approveCommunity,
	rejectCommunity,
	bulkApproveCommunities,
	bulkRejectCommunities,
	MOCK_QUEUE_INSIGHTS,
	MOCK_QUEUE_REVIEWERS,
	MOCK_QUEUE_ACTIVITY,
	type CommunityQueueStats,
	type GetCommunityQueueParams,
} from "@/lib/api/communities"
import type { CommunityQueueItem, CommunityStatus, CommunityVisibility } from "@/types"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50] as const
type PageSize = (typeof PAGE_SIZES)[number]

type StatusFilter = CommunityStatus | "ALL"
type VisibilityFilter = CommunityVisibility | "ALL"

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
	{ label: "All Status", value: "ALL" },
	{ label: "Pending Review", value: "PENDING_ADMIN_REVIEW" },
	{ label: "Under Review", value: "DRAFT" }, // TODO: add UNDER_REVIEW status
	{ label: "Approved", value: "ACTIVE" },
	{ label: "Rejected", value: "REJECTED" },
]

const VISIBILITY_OPTIONS: { label: string; value: VisibilityFilter }[] = [
	{ label: "All Visibility", value: "ALL" },
	{ label: "Public", value: "PUBLIC" },
	{ label: "Private", value: "PRIVATE" },
	{ label: "Invite Only", value: "INVITE_ONLY" },
]

const CATEGORY_COLORS: Record<string, string> = {
	Music: "bg-purple-100 text-purple-700",
	Networking: "bg-blue-100 text-blue-700",
	Wellness: "bg-green-100 text-green-700",
	Creative: "bg-orange-100 text-orange-700",
	Tech: "bg-indigo-100 text-indigo-700",
	"Personal Growth": "bg-pink-100 text-pink-700",
	Travel: "bg-teal-100 text-teal-700",
	Business: "bg-sky-100 text-sky-700",
	Arts: "bg-rose-100 text-rose-700",
	Lifestyle: "bg-amber-100 text-amber-700",
}

const VISIBILITY_BADGE: Record<CommunityVisibility, { label: string; className: string }> = {
	PUBLIC: { label: "Public", className: "bg-green-50 text-green-700" },
	PRIVATE: { label: "Private", className: "bg-sky-50 text-sky-700" },
	INVITE_ONLY: { label: "Invite Only", className: "bg-purple-50 text-purple-700" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
	if (n >= 1000) {
		const v = n / 1000
		return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k`
	}
	return String(n)
}

function formatRelativeTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime()
	const mins = Math.floor(diff / 60_000)
	if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`
	const days = Math.floor(hours / 24)
	return `${days} day${days !== 1 ? "s" : ""} ago`
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function getCategoryClassName(name: string): string {
	return CATEGORY_COLORS[name] ?? "bg-neutral-100 text-text-secondary"
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SelectAllCheckbox({
	checked,
	indeterminate,
	onChange,
}: {
	checked: boolean
	indeterminate: boolean
	onChange: () => void
}) {
	const ref = useRef<HTMLInputElement>(null)
	useEffect(() => {
		if (ref.current) ref.current.indeterminate = indeterminate
	}, [indeterminate])

	return (
		<input
			ref={ref}
			type="checkbox"
			checked={checked}
			onChange={onChange}
			className="cursor-pointer rounded border-border-default accent-action-primary"
		/>
	)
}

function DonutChart({ segments }: { segments: { label: string; pct: number; color: string }[] }) {
	return (
		<PieChart width={112} height={112}>
			<Pie
				data={segments}
				cx={56}
				cy={56}
				innerRadius={34}
				outerRadius={50}
				dataKey="pct"
				paddingAngle={2}
				startAngle={90}
				endAngle={-270}
				strokeWidth={0}
			>
				{segments.map((seg, i) => (
					<Cell key={i} fill={seg.color} />
				))}
			</Pie>
		</PieChart>
	)
}

function SidebarCard({
	title,
	action,
	children,
}: {
	title: string
	action?: React.ReactNode
	children: React.ReactNode
}) {
	return (
		<div className="rounded-xl border border-border-default bg-surface-card p-4">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-xs font-semibold text-text-primary">{title}</h3>
				{action}
			</div>
			{children}
		</div>
	)
}

function NumberedPagination({
	page,
	totalPages,
	onPageChange,
}: {
	page: number
	totalPages: number
	onPageChange: (p: number) => void
}) {
	const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)
	return (
		<div className="flex items-center gap-1">
			<button
				disabled={page === 1}
				onClick={() => onPageChange(page - 1)}
				className="rounded-md border border-border-default px-2.5 py-1 text-xs text-text-secondary hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
			>
				‹
			</button>
			{pages.map(p => (
				<button
					key={p}
					onClick={() => onPageChange(p)}
					className={cn(
						"flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
						p === page
							? "bg-action-primary text-action-primary-text"
							: "border border-border-default text-text-primary hover:bg-neutral-50",
					)}
				>
					{p}
				</button>
			))}
			<button
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
				className="rounded-md border border-border-default px-2.5 py-1 text-xs text-text-secondary hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
			>
				›
			</button>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ConfirmAction = { type: "approve" | "reject"; ids: string[] }

export default function CommunityQueuePage() {
	const router = useRouter()
	const canManage = usePermission("community.manage")

	// Data
	const [isLoading, setIsLoading] = useState(true)
	const [statsLoading, setStatsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [items, setItems] = useState<CommunityQueueItem[]>([])
	const [stats, setStats] = useState<CommunityQueueStats | null>(null)
	const [total, setTotal] = useState(0)

	// Pagination
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)

	// Filters
	const [search, setSearch] = useState("")
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING_ADMIN_REVIEW")
	const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("ALL")
	// TODO: add categoryId, city, createdBy, dateSubmitted filters

	// Selection
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

	// Actions
	const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)

	// ─── Fetch ──────────────────────────────────────────────────────────────────

	const fetchStats = useCallback(async () => {
		setStatsLoading(true)
		try {
			setStats(await getCommunityQueueStats())
		} catch {
			// Non-critical
		} finally {
			setStatsLoading(false)
		}
	}, [])

	const fetchQueue = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const params: GetCommunityQueueParams = { page, limit: pageSize }
			if (statusFilter !== "ALL") params.status = statusFilter
			if (visibilityFilter !== "ALL") params.visibility = visibilityFilter
			const res = await getCommunityQueue(params)
			setItems(res.items)
			setTotal(res.total ?? res.items.length)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
			if (status === 403) {
				setError("You don't have permission to view the community queue.")
			} else {
				toast.error("Failed to load queue")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [page, pageSize, statusFilter, visibilityFilter, router])

	useEffect(() => {
		fetchStats()
	}, [fetchStats])
	useEffect(() => {
		fetchQueue()
	}, [fetchQueue])

	// ─── Client-side search ──────────────────────────────────────────────────────

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim()
		if (!q) return items
		return items.filter(
			c =>
				c.name.toLowerCase().includes(q) ||
				c.submittedBy.name.toLowerCase().includes(q) ||
				(c.category?.name ?? "").toLowerCase().includes(q),
		)
	}, [items, search])

	// ─── Selection helpers ───────────────────────────────────────────────────────

	function toggleSelect(id: string) {
		setSelectedIds(prev => {
			const next = new Set(prev)
			if (next.has(id)) { next.delete(id) } else { next.add(id) }
			return next
		})
	}

	function toggleAll() {
		if (selectedIds.size === filtered.length && filtered.length > 0) {
			setSelectedIds(new Set())
		} else {
			setSelectedIds(new Set(filtered.map(c => c.id)))
		}
	}

	const allSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id))
	const someSelected = filtered.some(c => selectedIds.has(c.id)) && !allSelected

	// ─── Actions ─────────────────────────────────────────────────────────────────

	async function executeAction(action: ConfirmAction) {
		setIsProcessing(true)
		try {
			if (action.type === "approve") {
				if (action.ids.length === 1) await approveCommunity(action.ids[0])
				else await bulkApproveCommunities(action.ids)
				toast.success(
					action.ids.length === 1
						? "Community approved"
						: `${action.ids.length} communities approved`,
				)
			} else {
				// TODO: collect rejection reason via a proper modal with text input
				const reason = "Does not meet community guidelines."
				if (action.ids.length === 1) await rejectCommunity(action.ids[0], reason)
				else await bulkRejectCommunities(action.ids, reason)
				toast.success(
					action.ids.length === 1
						? "Community rejected"
						: `${action.ids.length} communities rejected`,
				)
			}
			setSelectedIds(new Set())
			fetchQueue()
			fetchStats()
		} catch {
			toast.error(`Failed to ${action.type} community. Please try again.`)
		} finally {
			setIsProcessing(false)
			setConfirmAction(null)
		}
	}

	const hasActiveFilters =
		statusFilter !== "PENDING_ADMIN_REVIEW" || visibilityFilter !== "ALL" || search !== ""

	function resetFilters() {
		setStatusFilter("PENDING_ADMIN_REVIEW")
		setVisibilityFilter("ALL")
		setSearch("")
		setPage(1)
	}

	const totalPages = Math.ceil(total / pageSize)
	const selectedCount = selectedIds.size

	// ─── Columns ─────────────────────────────────────────────────────────────────

	const columns = useMemo<ColumnDef<CommunityQueueItem>[]>(
		() => [
			{
				id: "select",
				header: () => (
					<SelectAllCheckbox
						checked={allSelected}
						indeterminate={someSelected}
						onChange={toggleAll}
					/>
				),
				cell: ({ row }) => (
					<input
						type="checkbox"
						checked={selectedIds.has(row.original.id)}
						onChange={() => toggleSelect(row.original.id)}
						onClick={e => e.stopPropagation()}
						className="cursor-pointer rounded border-border-default accent-action-primary"
					/>
				),
			},
			{
				id: "community",
				header: "Community",
				cell: ({ row }) => {
					const c = row.original
					return (
						<div className="flex items-center gap-3 min-w-0">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-brand-soft text-xs font-bold text-text-brand">
								{c.name.charAt(0)}
							</div>
							<div className="min-w-0">
								<p className="text-xs font-semibold text-text-primary leading-none truncate">
									{c.name}
								</p>
								<p className="mt-0.5 text-[11px] text-text-tertiary">
									by {c.submittedBy.name}
								</p>
							</div>
						</div>
					)
				},
			},
			{
				id: "category",
				header: "Category",
				cell: ({ row }) => {
					const cat = row.original.category
					if (!cat) return <span className="text-xs text-text-tertiary">—</span>
					return (
						<span
							className={cn(
								"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
								getCategoryClassName(cat.name),
							)}
						>
							{cat.name}
						</span>
					)
				},
			},
			{
				id: "members",
				header: "Members",
				cell: ({ row }) => (
					<span className="text-xs font-medium text-text-primary tabular-nums">
						{formatCount(row.original.memberCount)}
					</span>
				),
			},
			{
				id: "type",
				header: "Type",
				cell: ({ row }) => {
					const cfg = VISIBILITY_BADGE[row.original.visibility]
					return (
						<span
							className={cn(
								"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
								cfg.className,
							)}
						>
							{cfg.label}
						</span>
					)
				},
			},
			{
				id: "submitted",
				header: "Submitted",
				cell: ({ row }) => {
					const iso = row.original.submittedAt
					return (
						<div>
							<p className="text-xs text-text-secondary">{formatRelativeTime(iso)}</p>
							<p className="mt-0.5 text-[11px] text-text-tertiary">{formatDate(iso)}</p>
						</div>
					)
				},
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => <StatusBadge status={row.original.status} />,
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => {
					const id = row.original.id
					return (
						<div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
							<button
								className="shrink-0 rounded-md border border-border-default px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
								onClick={() => router.push(`/communities/${id}`)}
							>
								Preview
							</button>
							<button
								onClick={() => setConfirmAction({ type: "approve", ids: [id] })}
								className="shrink-0 rounded-md border border-green-400 px-2.5 py-1 text-[11px] font-medium text-green-600 hover:bg-green-50 transition-colors"
							>
								Approve
							</button>
							<button
								onClick={() => setConfirmAction({ type: "reject", ids: [id] })}
								className="shrink-0 rounded-md border border-red-400 px-2.5 py-1 text-[11px] font-medium text-red-500 hover:bg-red-50 transition-colors"
							>
								Reject
							</button>
							{/* TODO: open context menu (request changes, assign reviewer, etc.) */}
							<button className="rounded-md p-1.5 text-text-secondary hover:bg-neutral-100 transition-colors">
								<MoreHorizontal size={14} />
							</button>
						</div>
					)
				},
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[selectedIds, allSelected, someSelected, filtered],
	)

	// ─── Permission guard ─────────────────────────────────────────────────────

	if (!canManage) {
		return (
			<div className="p-6 max-w-7xl mx-auto">
				<p className="text-sm text-text-tertiary">
					You don&apos;t have permission to view the community queue.
				</p>
			</div>
		)
	}

	// ─── Render ───────────────────────────────────────────────────────────────

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-5">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-base font-semibold text-text-primary">Community Queue</h1>
					<p className="mt-0.5 text-xs text-text-tertiary">
						Review and approve communities before they go live.
					</p>
				</div>
				<div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
					<Button
						variant="primary"
						size="sm"
						radius="md"
						leftIcon={<Check size={13} />}
						disabled={selectedCount === 0}
						onClick={() => setConfirmAction({ type: "approve", ids: [...selectedIds] })}
					>
						{selectedCount > 0 ? `Approve Selected (${selectedCount})` : "Approve Selected"}
					</Button>
					<Button
						variant="primary"
						size="sm"
						radius="md"
						leftIcon={<X size={13} />}
						disabled={selectedCount === 0}
						onClick={() => setConfirmAction({ type: "reject", ids: [...selectedIds] })}
					>
						{selectedCount > 0 ? `Reject Selected (${selectedCount})` : "Reject Selected"}
					</Button>
					{/* TODO: assign reviewer modal */}
					<Button variant="primary" size="sm" radius="md" leftIcon={<UserCog size={13} />} disabled>
						Assign Reviewer
					</Button>
					{/* TODO: implement queue export */}
					<Button
						variant="primary"
						size="sm"
						radius="md"
						leftIcon={<Download size={13} />}
						disabled
					>
						Export Queue
					</Button>
				</div>
			</div>

			{/* Two-column layout */}
			<div className="flex items-start gap-5">
				{/* ── Main content ── */}
				<div className="flex-1 min-w-0 space-y-4">
					{/* Stat cards */}
					{/* TODO: replace hardcoded trend values with fields from getCommunityQueueStats API */}
					<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
						<StatCard
							icon={Clock}
							label="Pending Review"
							value={statsLoading ? "—" : (stats?.pendingReview ?? 0)}
							trend={stats ? { value: 3, direction: "up" } : undefined}
							sub="from yesterday"
							accent="amber"
						/>
						<StatCard
							icon={CheckCircle}
							label="Approved Today"
							value={statsLoading ? "—" : (stats?.approvedToday ?? 0)}
							trend={stats ? { value: 2, direction: "up" } : undefined}
							sub="from yesterday"
							accent="green"
						/>
						<StatCard
							icon={XCircle}
							label="Rejected Today"
							value={statsLoading ? "—" : (stats?.rejectedToday ?? 0)}
							trend={stats ? { value: 1, direction: "up" } : undefined}
							sub="from yesterday"
							accent="rose"
						/>
						<StatCard
							icon={AlarmClock}
							label="Avg. Review Time"
							value={statsLoading ? "—" : `${stats?.avgReviewTimeHours ?? 0}h`}
							trend={stats ? { value: 2, direction: "down", label: "h faster" } : undefined}
							sub="vs yesterday"
							accent="sky"
						/>
					</div>

					{/* Filters */}
					<div className="space-y-2">
						<div className="flex items-center gap-2 flex-wrap">
							<div className="relative flex-1 min-w-48 max-w-xs">
								<Search
									size={13}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
								/>
								<input
									type="text"
									value={search}
									onChange={e => {
										setSearch(e.target.value)
										setPage(1)
									}}
									placeholder="Search community name…"
									className="w-full rounded-lg border border-border-default bg-surface-canvas pl-8 pr-3 py-2 text-xs placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
								/>
							</div>
							<select
								value={statusFilter}
								onChange={e => {
									setStatusFilter(e.target.value as StatusFilter)
									setPage(1)
								}}
								className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
							>
								{STATUS_OPTIONS.map(o => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
							<select
								value={visibilityFilter}
								onChange={e => {
									setVisibilityFilter(e.target.value as VisibilityFilter)
									setPage(1)
								}}
								className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
							>
								{VISIBILITY_OPTIONS.map(o => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
							{/* TODO: category, city, createdBy, dateSubmitted filters */}
							{hasActiveFilters && (
								<button
									onClick={resetFilters}
									className="flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-2 text-xs text-text-secondary hover:bg-neutral-50 transition-colors"
								>
									<RotateCcw size={11} />
									Reset
								</button>
							)}
						</div>
					</div>

					{/* Error or Table */}
					{error ? (
						<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
							{error}
						</div>
					) : (
						<DataTable
							columns={columns}
							data={filtered}
							isLoading={isLoading}
							emptyState={
								<div className="py-12 text-center text-sm text-text-tertiary">
									No communities pending review.
								</div>
							}
						/>
					)}

					{/* Footer: pagination + rows per page */}
					{!error && total > 0 && (
						<div className="flex items-center justify-between gap-4 text-xs text-text-tertiary">
							<span>
								Showing {Math.min((page - 1) * pageSize + 1, total)}–
								{Math.min(page * pageSize, total)} of {total} communities
							</span>
							<div className="flex items-center gap-4">
								{totalPages > 1 && (
									<NumberedPagination
										page={page}
										totalPages={totalPages}
										onPageChange={p => {
											setPage(p)
											setSelectedIds(new Set())
										}}
									/>
								)}
								<div className="flex items-center gap-2">
									<span>Rows per page</span>
									<select
										value={pageSize}
										onChange={e => {
											setPageSize(Number(e.target.value) as PageSize)
											setPage(1)
											setSelectedIds(new Set())
										}}
										className="rounded-md border border-border-default bg-surface-canvas px-2 py-1 text-xs text-text-primary focus:border-border-focus focus:outline-none transition-colors"
									>
										{PAGE_SIZES.map(s => (
											<option key={s} value={s}>
												{s}
											</option>
										))}
									</select>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* ── Sidebar ── */}
				<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">
					{/* Queue Insights */}
					<SidebarCard
						title="Queue Insights"
						action={
							// TODO: link to /communities/reports
							<button className="text-[11px] font-medium text-text-brand hover:underline">
								View all insights →
							</button>
						}
					>
						<div className="flex items-center gap-3">
							<DonutChart segments={MOCK_QUEUE_INSIGHTS} />
							<div className="space-y-1.5 flex-1 min-w-0">
								{MOCK_QUEUE_INSIGHTS.map(seg => (
									<div key={seg.label} className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-1.5 min-w-0">
											<span
												className="h-2 w-2 shrink-0 rounded-full"
												style={{ backgroundColor: seg.color }}
											/>
											<span className="text-[11px] text-text-secondary truncate">
												{seg.label}
											</span>
										</div>
										<span className="text-[11px] font-semibold text-text-primary shrink-0">
											{seg.pct}%
										</span>
									</div>
								))}
							</div>
						</div>
					</SidebarCard>

					{/* Reviewers */}
					<SidebarCard
						title="Reviewers"
						action={
							// TODO: link to reviewer management
							<button className="text-[11px] font-medium text-text-brand hover:underline">
								View all
							</button>
						}
					>
						<div className="space-y-3">
							{MOCK_QUEUE_REVIEWERS.map(reviewer => (
								<div key={reviewer.id}>
									<div className="flex items-center gap-2 mb-1">
										<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-brand-soft text-[10px] font-bold text-text-brand">
											{reviewer.initial}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-[11px] font-semibold text-text-primary leading-none truncate">
												{reviewer.name}
											</p>
											<p className="text-[10px] text-text-tertiary">{reviewer.role}</p>
										</div>
										<span className="text-[11px] font-medium text-text-secondary shrink-0">
											{reviewer.reviewed} / {reviewer.quota}
										</span>
									</div>
									<div className="h-1 rounded-full bg-neutral-100 overflow-hidden">
										<div
											className="h-full rounded-full bg-rose-500 transition-all"
											style={{
												width: `${(reviewer.reviewed / reviewer.quota) * 100}%`,
											}}
										/>
									</div>
								</div>
							))}
						</div>
					</SidebarCard>

					{/* Recent Activity */}
					<SidebarCard
						title="Recent Activity"
						action={
							// TODO: link to /audit-logs filtered by community actions
							<button className="text-[11px] font-medium text-text-brand hover:underline">
								View all activity →
							</button>
						}
					>
						<div className="space-y-3">
							{MOCK_QUEUE_ACTIVITY.map(act => (
								<div key={act.id} className="flex items-start gap-2">
									<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-brand-soft text-[10px] font-bold text-text-brand">
										{act.actorInitial}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-[11px] text-text-primary leading-snug">
											<span className="font-semibold">{act.actorName}</span>{" "}
											{act.action} <span className="font-medium">{act.targetName}</span>
										</p>
										<p className="text-[10px] text-text-tertiary mt-0.5">{act.timeAgo}</p>
									</div>
									<div className="shrink-0 mt-0.5">
										{act.type === "approve" && (
											<CheckCircle size={14} className="text-green-500" />
										)}
										{act.type === "reject" && (
											<XCircle size={14} className="text-red-500" />
										)}
										{act.type === "changes" && (
											<UserCog size={14} className="text-amber-500" />
										)}
									</div>
								</div>
							))}
						</div>
					</SidebarCard>

					{/* Need Help */}
					<div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
						<div className="flex items-start gap-3">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100">
								<ShieldAlert size={15} className="text-rose-500" />
							</div>
							<div>
								<p className="text-xs font-semibold text-text-primary">Need Help?</p>
								<p className="mt-0.5 text-[11px] text-text-secondary leading-relaxed">
									Check our community review guidelines and moderation policies.
								</p>
								{/* TODO: link to actual guidelines page */}
								<button className="mt-2 text-[11px] font-semibold text-rose-600 hover:underline">
									View Guidelines →
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Confirm dialog */}
			<ConfirmDialog
				open={confirmAction !== null}
				onClose={() => !isProcessing && setConfirmAction(null)}
				onConfirm={() => confirmAction && executeAction(confirmAction)}
				isLoading={isProcessing}
				title={confirmAction?.type === "approve" ? "Approve community?" : "Reject community?"}
				description={
					confirmAction?.type === "approve"
						? `This will approve ${confirmAction.ids.length === 1 ? "this community" : `${confirmAction.ids.length} communities`} and make ${confirmAction.ids.length === 1 ? "it" : "them"} visible to users.`
						: `This will reject ${confirmAction?.ids.length === 1 ? "this community" : `${confirmAction?.ids.length} communities`}. The creator(s) will be notified.`
				}
				confirmLabel={confirmAction?.type === "approve" ? "Approve" : "Reject"}
				destructive={confirmAction?.type === "reject"}
			/>
		</div>
	)
}
