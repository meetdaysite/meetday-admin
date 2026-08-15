"use client"

import { CommunityProfileReviewDrawer, type CommunityProfileAction } from "@/components/community-profiles/community-profile-review-drawer"
import { CreateCommunityProfileDrawer } from "@/components/community-profiles/create-community-profile-drawer"
import { DataView } from "@/components/ui/data-view"
import { FilterSelect } from "@/components/ui/filter-select"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { AgeDateCell, ChipCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
import { approveCommunityProfile, approveCommunityProfileRevision, getCommunityProfiles, rejectCommunityProfile, rejectCommunityProfileRevision } from "@/lib/api/community-profiles"
import { formatDate, getDaysSince } from "@/lib/formatters"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { ApprovalStatus, CommunityProfile } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

// Constants

const PAGE_LIMIT = 20

type StatusFilter = ApprovalStatus | "ALL"

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Pending", value: "PENDING" },
	{ label: "Approved", value: "APPROVED" },
	{ label: "Rejected", value: "REJECTED" },
	{ label: "Suspended", value: "SUSPENDED" },
]

// Page

export default function AllCommunityProfilesPage() {
	const router = useRouter()
	const canApprove = usePermission("communityProfile.approve")

	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [search, setSearch] = useState("")

	const { item: selectedProfile, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<CommunityProfile>()
	const [createOpen, setCreateOpen] = useState(false)

	const fetcher = useCallback(() => {
		const params: { status?: ApprovalStatus; page: number; limit: number } = { page, limit: PAGE_LIMIT }
		if (statusFilter !== "ALL") params.status = statusFilter
		return getCommunityProfiles(params).then(r => ({ items: r.profiles, total: r.total }))
	}, [page, statusFilter])

	const {
		items: profiles,
		total,
		isLoading,
		error,
		refresh: fetchProfiles,
	} = usePaginatedFetch(fetcher, "Failed to load community profiles")

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return profiles
		return profiles.filter(
			p =>
				p.name.toLowerCase().includes(q) ||
				(p.hostProfile.displayName ?? "").toLowerCase().includes(q) ||
				(p.hostProfile.user.email ?? "").toLowerCase().includes(q),
		)
	}, [profiles, search])

	async function handleAction(profileId: string, action: CommunityProfileAction, message?: string, isRevision?: boolean) {
		try {
			if (isRevision) {
				if (action === "approve") await approveCommunityProfileRevision(profileId)
				else if (action === "reject") await rejectCommunityProfileRevision(profileId, message!)
			} else {
				if (action === "approve") await approveCommunityProfile(profileId)
				else if (action === "reject") await rejectCommunityProfile(profileId, message!)
			}

			const labels: Record<CommunityProfileAction, string> = {
				approve: isRevision ? "Changes approved and applied" : "Community profile approved",
				reject: isRevision ? "Changes rejected" : "Community profile rejected",
			}
			toast.success(labels[action])
			fetchProfiles()
		} catch (err: unknown) {
			const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
			const status = axiosErr?.response?.status
			if (status === 401) {
				router.replace("/login")
				throw err
			}
			if (status === 403) {
				toast.error("Permission denied", {
					description: `You don't have permission to ${action} community profiles.`,
				})
			} else if (status === 404) {
				toast.error("Community profile not found")
			} else if (status === 400) {
				const msg = axiosErr?.response?.data?.message
				toast.error(`Cannot ${action} community profile`, {
					description: msg ?? "Profile is not in the required state.",
				})
			} else {
				toast.error(`Failed to ${action} community profile`, {
					description: "Something went wrong. Please try again.",
				})
			}
			throw err
		}
	}

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	const columns = useMemo<ColumnDef<CommunityProfile>[]>(
		() => [
			{
				id: "profile",
				header: "Community",
				cell: ({ row }) => (
					<TwoLineCell primary={row.original.name} secondary={row.original.hostProfile.displayName ?? undefined} />
				),
			},
			{
				id: "size",
				header: "Size",
				cell: ({ row }) => <ChipCell>{row.original.size} members</ChipCell>,
			},
			{
				id: "categories",
				header: "Categories",
				cell: ({ row }) => row.original.categories.map(c => c.name).join(", ") || "—",
			},
			{
				id: "cities",
				header: "Operating cities",
				cell: ({ row }) => row.original.hostProfile.operatingCities.join(", ") || "—",
			},
			{
				id: "updated",
				header: "Last updated",
				cell: ({ row }) => (
					<AgeDateCell iso={row.original.updatedAt} getDaysSince={getDaysSince} format={formatDate} />
				),
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => (
					<div className="flex items-center gap-1.5">
						<StatusCell status={row.original.approvalStatus} />
						{row.original.pendingRevision && (
							<span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
								Edit pending
							</span>
						)}
					</div>
				),
			},
		],
		[],
	)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view community profiles." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="All Community Profiles"
				description="Every host community profile on the platform, regardless of status."
				buttons={
					<button
						onClick={() => setCreateOpen(true)}
						className="flex items-center gap-1.5 rounded-lg bg-action-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors"
					>
						<Plus size={14} /> Add Community Profile
					</button>
				}
			/>

			<div className="flex items-center gap-2 flex-wrap">
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search by name or host…"
					className="flex-1 min-w-48 max-w-xs"
				/>
				<FilterSelect
					options={STATUS_TABS}
					value={statusFilter}
					onChange={v => {
						setStatusFilter(v as StatusFilter)
						setPage(1)
					}}
				/>
			</div>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No community profiles match the current filters."
				onRowClick={openDrawer}
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>

			<CommunityProfileReviewDrawer
				open={drawerOpen}
				onClose={closeDrawer}
				profile={selectedProfile}
				onAction={handleAction}
			/>

			<CreateCommunityProfileDrawer
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				onCreated={() => {
					setCreateOpen(false)
					fetchProfiles()
				}}
			/>
		</div>
	)
}
