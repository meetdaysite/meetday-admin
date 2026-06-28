"use client"

import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/Button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataView } from "@/components/ui/data-view"
import { FilterSelect } from "@/components/ui/filter-select"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { StatusBadge } from "@/components/ui/status-badge"
import {
	archiveCommunity,
	deleteCommunity,
	getCommunities,
	getCommunityStats,
	restoreCommunity,
	type CommunityStats,
	type GetCommunitiesParams,
} from "@/lib/api/communities"
import { extractApiErrorMessage } from "@/lib/error-handler"
import { formatCount } from "@/lib/formatters"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import { cn } from "@/lib/utils"
import type { Community, CommunityStatus, CommunityType } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import {
	Archive,
	ArchiveRestore,
	CalendarDays,
	Eye,
	LayoutGrid,
	Pencil,
	Plus,
	RotateCcw,
	Trash2,
	TrendingUp,
	UserCheck,
	Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20

type StatusFilter = CommunityStatus | "ALL"

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
	{ label: "All Status", value: "ALL" },
	{ label: "Draft", value: "DRAFT" },
	{ label: "Published", value: "PUBLISHED" },
	{ label: "Archived", value: "ARCHIVED" },
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

const TYPE_BADGE: Record<CommunityType, { label: string; className: string }> = {
	MEETDAY_MANAGED_PUBLIC: { label: "Managed", className: "bg-blue-50 text-blue-700" },
	HOST_LED: { label: "Host Led", className: "bg-amber-50 text-amber-700" },
	PRIVATE_INVITE_ONLY: { label: "Private", className: "bg-purple-50 text-purple-700" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunitiesPage() {
	const router = useRouter()
	const canManage = usePermission("community.manage")

	const [statsLoading, setStatsLoading] = useState(true)
	const [stats, setStats] = useState<CommunityStats | null>(null)
	const [page, setPage] = useState(1)

	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [search, setSearch] = useState("")
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
	const [deleteTargetName, setDeleteTargetName] = useState("")
	const [isDeleting, setIsDeleting] = useState(false)
	const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null)
	const [archiveTargetName, setArchiveTargetName] = useState("")
	const [isArchiving, setIsArchiving] = useState(false)
	const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null)
	const [restoreTargetName, setRestoreTargetName] = useState("")
	const [isRestoring, setIsRestoring] = useState(false)

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

	const communityFetcher = useCallback(() => {
		const params: GetCommunitiesParams = { page, limit: PAGE_LIMIT }
		if (statusFilter !== "ALL") params.status = statusFilter
		if (search.trim()) params.search = search.trim()
		return getCommunities(params).then(r => ({
			items: r.communities,
			total: r.total ?? r.communities.length,
		}))
	}, [page, statusFilter, search])

	const {
		items: communities,
		total,
		isLoading,
		error,
		refresh: fetchCommunities,
	} = usePaginatedFetch(communityFetcher, "Failed to load communities")

	useEffect(() => {
		fetchStats()
	}, [fetchStats])

	const hasActiveFilters = statusFilter !== "ALL" || search !== ""

	function resetFilters() {
		setStatusFilter("ALL")
		setSearch("")
		setPage(1)
	}

	async function handleArchive() {
		if (!archiveTargetId) return
		setIsArchiving(true)
		try {
			await archiveCommunity(archiveTargetId)
			toast.success("Community archived")
			setArchiveTargetId(null)
			fetchCommunities()
		} catch (err: unknown) {
			toast.error(extractApiErrorMessage(err, "Failed to archive community"))
		} finally {
			setIsArchiving(false)
		}
	}

	async function handleRestore() {
		if (!restoreTargetId) return
		setIsRestoring(true)
		try {
			await restoreCommunity(restoreTargetId)
			toast.success("Community restored")
			setRestoreTargetId(null)
			fetchCommunities()
		} catch (err: unknown) {
			toast.error(extractApiErrorMessage(err, "Failed to restore community"))
		} finally {
			setIsRestoring(false)
		}
	}

	async function handleDelete() {
		if (!deleteTargetId) return
		setIsDeleting(true)
		try {
			await deleteCommunity(deleteTargetId)
			toast.success("Community deleted")
			setDeleteTargetId(null)
			fetchCommunities()
		} catch (err: unknown) {
			toast.error(extractApiErrorMessage(err, "Failed to delete community"))
		} finally {
			setIsDeleting(false)
		}
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
								<p className="mt-0.5 text-[11px] text-text-tertiary">{c.primaryCity}</p>
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
								CATEGORY_COLORS[cat.name] ?? "bg-neutral-100 text-text-secondary",
							)}
						>
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
					<p className="text-xs font-semibold text-text-primary">{row.original.experienceCount}</p>
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
				cell: ({ row }) => {
					const c = row.original
					return (
						<div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
							<button
								className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-neutral-100"
								title="View"
								onClick={() => router.push(`/communities/${c.id}`)}
							>
								<Eye size={14} />
							</button>
							<button
								className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-neutral-100"
								title="Edit"
								onClick={() => router.push(`/communities/${c.id}/edit`)}
							>
								<Pencil size={14} />
							</button>
							{c.status === "PUBLISHED" && (
								<button
									className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-amber-50 hover:text-amber-600"
									title="Archive community"
									onClick={() => {
										setArchiveTargetId(c.id)
										setArchiveTargetName(c.name)
									}}
								>
									<Archive size={14} />
								</button>
							)}
							{c.status === "ARCHIVED" && (
								<button
									className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-green-50 hover:text-green-600"
									title="Restore community"
									onClick={() => {
										setRestoreTargetId(c.id)
										setRestoreTargetName(c.name)
									}}
								>
									<ArchiveRestore size={14} />
								</button>
							)}
							<button
								className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
								title="Delete community"
								onClick={() => {
									setDeleteTargetId(c.id)
									setDeleteTargetName(c.name)
								}}
							>
								<Trash2 size={14} />
							</button>
						</div>
					)
				},
			},
		],
		[router],
	)

	// ─── Permission guard ─────────────────────────────────────────────────────

	if (!canManage) return <PermissionGuard message="You don't have permission to view communities." />

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
				<SearchInput
					value={search}
					onChange={v => {
						setSearch(v)
						setPage(1)
					}}
					placeholder="Search communities by name…"
					className="flex-1 min-w-48 max-w-xs"
				/>

				<FilterSelect
					value={statusFilter}
					onChange={v => {
						setStatusFilter(v as StatusFilter)
						setPage(1)
					}}
					options={STATUS_OPTIONS}
				/>

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

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={communities}
				emptyMessage="No communities match the current filters."
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>

			<ConfirmDialog
				open={archiveTargetId !== null}
				onClose={() => setArchiveTargetId(null)}
				onConfirm={handleArchive}
				title="Archive Community"
				description={`Are you sure you want to archive "${archiveTargetName}"? Only published communities can be archived.`}
				confirmLabel="Archive"
				isLoading={isArchiving}
			/>
			<ConfirmDialog
				open={restoreTargetId !== null}
				onClose={() => setRestoreTargetId(null)}
				onConfirm={handleRestore}
				title="Restore Community"
				description={`Are you sure you want to restore "${restoreTargetName}"? The community will be moved back to Published.`}
				confirmLabel="Restore"
				isLoading={isRestoring}
			/>
			<ConfirmDialog
				open={deleteTargetId !== null}
				onClose={() => setDeleteTargetId(null)}
				onConfirm={handleDelete}
				title="Delete Community"
				description={`Are you sure you want to delete "${deleteTargetName}"? This action cannot be undone.`}
				confirmLabel="Delete"
				destructive
				isLoading={isDeleting}
			/>
		</div>
	)
}
