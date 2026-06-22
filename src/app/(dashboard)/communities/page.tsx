"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import {
	Search,
	LayoutGrid,
	UserCheck,
	Users,
	CalendarDays,
	TrendingUp,
	Eye,
	Pencil,
	MoreHorizontal,
	Download,
	Plus,
	RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import { usePermission } from "@/lib/hooks/use-permission"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/Button"
import {
	getCommunities,
	getCommunityStats,
	type CommunityStats,
	type GetCommunitiesParams,
} from "@/lib/api/communities"
import type { Community, CommunityStatus, CommunityType } from "@/types"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20

type StatusFilter = CommunityStatus | "ALL"

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
	{ label: "All Status", value: "ALL" },
	{ label: "Draft",      value: "DRAFT" },
	{ label: "Published",  value: "PUBLISHED" },
	{ label: "Archived",   value: "ARCHIVED" },
]

const CATEGORY_COLORS: Record<string, string> = {
	"Music":           "bg-purple-100 text-purple-700",
	"Networking":      "bg-blue-100 text-blue-700",
	"Wellness":        "bg-green-100 text-green-700",
	"Creative":        "bg-orange-100 text-orange-700",
	"Tech":            "bg-indigo-100 text-indigo-700",
	"Personal Growth": "bg-pink-100 text-pink-700",
	"Travel":          "bg-teal-100 text-teal-700",
	"Business":        "bg-sky-100 text-sky-700",
	"Arts":            "bg-rose-100 text-rose-700",
	"Lifestyle":       "bg-amber-100 text-amber-700",
}

const TYPE_BADGE: Record<CommunityType, { label: string; className: string }> = {
	MEETDAY_MANAGED_PUBLIC: { label: "Managed",  className: "bg-blue-50 text-blue-700" },
	HOST_LED:               { label: "Host Led", className: "bg-amber-50 text-amber-700" },
	PRIVATE_INVITE_ONLY:    { label: "Private",  className: "bg-purple-50 text-purple-700" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
	if (n >= 1000) {
		const v = n / 1000
		return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`
	}
	return String(n)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunitiesPage() {
	const router     = useRouter()
	const canManage  = usePermission("community.manage")

	const [isLoading,    setIsLoading]    = useState(true)
	const [statsLoading, setStatsLoading] = useState(true)
	const [error,        setError]        = useState<string | null>(null)
	const [communities,  setCommunities]  = useState<Community[]>([])
	const [stats,        setStats]        = useState<CommunityStats | null>(null)
	const [total,        setTotal]        = useState(0)
	const [page,         setPage]         = useState(1)

	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [search,       setSearch]       = useState("")

	// ─── Fetch ────────────────────────────────────────────────────────────────

	const fetchStats = useCallback(async () => {
		setStatsLoading(true)
		try {
			const data = await getCommunityStats()
			setStats(data)
		} catch {
			// Non-critical — stats failure doesn't block the table
		} finally {
			setStatsLoading(false)
		}
	}, [])

	const fetchCommunities = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const params: GetCommunitiesParams = { page, limit: PAGE_LIMIT }
			if (statusFilter !== "ALL") params.status = statusFilter
			if (search.trim())          params.search = search.trim()
			const res = await getCommunities(params)
			setCommunities(res.communities)
			setTotal(res.total ?? res.communities.length)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) { router.replace("/login"); return }
			if (status === 403) {
				setError("You don't have permission to view communities.")
			} else {
				toast.error("Failed to load communities")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [page, statusFilter, search, router])

	useEffect(() => { fetchStats() },       [fetchStats])
	useEffect(() => { fetchCommunities() }, [fetchCommunities])

	const hasActiveFilters = statusFilter !== "ALL" || search !== ""

	function resetFilters() {
		setStatusFilter("ALL")
		setSearch("")
		setPage(1)
	}

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	// ─── Columns ──────────────────────────────────────────────────────────────

	const columns = useMemo<ColumnDef<Community>[]>(
		() => [
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
									{c.primaryCity}
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
						<span className={cn(
							"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
							CATEGORY_COLORS[cat.name] ?? "bg-neutral-100 text-text-secondary",
						)}>
							{cat.name}
						</span>
					)
				},
			},
			{
				id: "type",
				header: "Type",
				cell: ({ row }) => {
					const cfg = TYPE_BADGE[row.original.type]
					return (
						<span className={cn(
							"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
							cfg.className,
						)}>
							{cfg.label}
						</span>
					)
				},
			},
			{
				id: "members",
				header: "Members",
				cell: ({ row }) => (
					<p className="text-xs font-semibold text-text-primary">
						{formatCount(row.original.memberCount)}
					</p>
				),
			},
			{
				id: "experiences",
				header: "Experiences",
				cell: ({ row }) => (
					<p className="text-xs font-semibold text-text-primary">
						{row.original.experienceCount}
					</p>
				),
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => <StatusBadge status={row.original.status} />,
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => (
					<div
						className="flex items-center gap-0.5"
						onClick={e => e.stopPropagation()}
					>
						<button
							className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-neutral-100"
							title="View"
							onClick={() => router.push(`/communities/${row.original.id}`)}
						>
							<Eye size={14} />
						</button>
						<button
							className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-neutral-100"
							title="Edit"
							onClick={() => router.push(`/communities/${row.original.id}/edit`)}
						>
							<Pencil size={14} />
						</button>
						<button
							className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-neutral-100"
							title="More options"
						>
							<MoreHorizontal size={14} />
						</button>
					</div>
				),
			},
		],
		[router],
	)

	// ─── Permission guard ─────────────────────────────────────────────────────

	if (!canManage) {
		return (
			<div className="p-6 max-w-7xl mx-auto">
				<p className="text-sm text-text-tertiary">
					You don&apos;t have permission to view communities.
				</p>
			</div>
		)
	}

	// ─── Render ───────────────────────────────────────────────────────────────

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-base font-semibold text-text-primary">All Communities</h1>
						<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
							{total}
						</span>
					</div>
					<p className="mt-0.5 text-xs text-text-tertiary">
						Manage all communities created by Meetday.
					</p>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					{/* TODO: implement CSV export */}
					<Button
						variant="secondary"
						size="sm"
						radius="md"
						leftIcon={<Download size={13} />}
						disabled
					>
						Export
					</Button>
					<Button
						variant="primary"
						size="sm"
						radius="md"
						leftIcon={<Plus size={13} />}
						onClick={() => router.push("/communities/create")}
					>
						Create Community
					</Button>
				</div>
			</div>

			{/* Stat cards */}
			{/* TODO: replace hardcoded trend percentages with values from getCommunityStats API */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
				<StatCard
					icon={LayoutGrid}
					label="Total Communities"
					value={statsLoading ? "—" : (stats?.totalCommunities ?? 0)}
					trend={stats ? { value: 12, direction: "up", label: "%" } : undefined}
					sub="vs last month"
					accent="brand"
				/>
				<StatCard
					icon={UserCheck}
					label="Active Communities"
					value={statsLoading ? "—" : (stats?.activeCommunities ?? 0)}
					trend={stats ? { value: 8, direction: "up", label: "%" } : undefined}
					sub="vs last month"
					accent="green"
				/>
				<StatCard
					icon={Users}
					label="Total Members"
					value={statsLoading ? "—" : formatCount(stats?.totalMembers ?? 0)}
					trend={stats ? { value: 15, direction: "up", label: "%" } : undefined}
					sub="vs last month"
					accent="amber"
				/>
				<StatCard
					icon={CalendarDays}
					label="Upcoming Events"
					value={statsLoading ? "—" : (stats?.upcomingEvents ?? 0)}
					trend={stats ? { value: 10, direction: "up", label: "%" } : undefined}
					sub="vs last month"
					accent="sky"
				/>
				<StatCard
					icon={TrendingUp}
					label="Avg. Engagement"
					value={statsLoading ? "—" : `${stats?.avgEngagementRate ?? 0}%`}
					trend={stats ? { value: 6, direction: "up", label: "%" } : undefined}
					sub="vs last month"
					accent="purple"
				/>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-2 flex-wrap">
				<div className="relative flex-1 min-w-48 max-w-xs">
					<Search
						size={13}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
					/>
					<input
						type="text"
						value={search}
						onChange={e => { setSearch(e.target.value); setPage(1) }}
						placeholder="Search communities by name…"
						className="w-full rounded-lg border border-border-default bg-surface-canvas pl-8 pr-3 py-2 text-xs placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
					/>
				</div>

				<select
					value={statusFilter}
					onChange={e => { setStatusFilter(e.target.value as StatusFilter); setPage(1) }}
					className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
				>
					{STATUS_OPTIONS.map(o => (
						<option key={o.value} value={o.value}>{o.label}</option>
					))}
				</select>

				{hasActiveFilters && (
					<button
						onClick={resetFilters}
						className="flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-neutral-50"
					>
						<RotateCcw size={11} />
						Reset
					</button>
				)}
			</div>

			{/* Error */}
			{error ? (
				<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			) : (
				<>
					<DataTable
						columns={columns}
						data={communities}
						isLoading={isLoading}
						emptyState={
							<div className="py-12 text-center text-sm text-text-tertiary">
								No communities match the current filters.
							</div>
						}
					/>

					{totalPages > 1 && (
						<div className="flex items-center justify-between text-xs text-text-tertiary">
							<span>
								Showing {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)} of {total}
							</span>
							<div className="flex items-center gap-2">
								<button
									disabled={page === 1}
									onClick={() => setPage(p => p - 1)}
									className="rounded-md px-2.5 py-1 text-xs font-medium border border-border-default hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
								>
									Previous
								</button>
								<span className="font-medium text-text-primary">{page} / {totalPages}</span>
								<button
									disabled={page >= totalPages}
									onClick={() => setPage(p => p + 1)}
									className="rounded-md px-2.5 py-1 text-xs font-medium border border-border-default hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
								>
									Next
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	)
}
