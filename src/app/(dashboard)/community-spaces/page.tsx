"use client"

import { CreateSpaceCommunityProfileDrawer } from "@/components/community-profiles/create-space-community-profile-drawer"
import { SpaceCommunityProfileReviewDrawer, type SpaceCommunityProfileAction } from "@/components/community-profiles/space-community-profile-review-drawer"
import { DataView } from "@/components/ui/data-view"
import { FilterSelect } from "@/components/ui/filter-select"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { AgeDateCell, ChipCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
import {
	approveSpaceCommunityProfile,
	approveSpaceCommunityProfileRevision,
	getSpaceCommunityProfileById,
	getSpaceCommunityProfiles,
	rejectSpaceCommunityProfile,
	rejectSpaceCommunityProfileRevision,
	setSpaceCommunityProfileVisibility,
} from "@/lib/api/space-community-profiles"
import { formatDate, getDaysSince } from "@/lib/formatters"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { ApprovalStatus, SpaceCommunityProfile, SpaceCommunityProfileDetail } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/Button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

const PAGE_LIMIT = 20

type StatusFilter = ApprovalStatus | "ALL"

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Pending", value: "PENDING" },
	{ label: "Approved", value: "APPROVED" },
	{ label: "Rejected", value: "REJECTED" },
	{ label: "Suspended", value: "SUSPENDED" },
]

function LogoCell({ id, name }: { id: string; name: string }) {
	const [logoUrl, setLogoUrl] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let active = true
		getSpaceCommunityProfileById(id)
			.then((data) => {
				if (active && data.logoUrl) setLogoUrl(data.logoUrl)
			})
			.catch(() => {})
			.finally(() => {
				if (active) setLoading(false)
			})
		return () => {
			active = false
		}
	}, [id])

	if (loading) return <div className="size-8 rounded-lg bg-neutral-100 animate-pulse border-2 border-black" />

	return logoUrl ? (
		// eslint-disable-next-line @next/next/no-img-element
		<img src={logoUrl} alt={name} className="size-8 rounded-lg object-cover border-2 border-black" />
	) : (
		<div className="size-8 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-xs border-2 border-black text-neutral-700 select-none">
			{name.slice(0, 2).toUpperCase()}
		</div>
	)
}

export default function AllSpaceCommunityProfilesPage() {
	const router = useRouter()
	const canApprove = usePermission("spaceProfile.approve")

	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("APPROVED")
	const [search, setSearch] = useState("")

	const { item: selectedProfile, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<SpaceCommunityProfile>()
	const [createOpen, setCreateOpen] = useState(false)
	const [editingProfile, setEditingProfile] = useState<SpaceCommunityProfileDetail | null>(null)

	const fetcher = useCallback(() => {
		const params: { status?: ApprovalStatus; page: number; limit: number } = { page, limit: PAGE_LIMIT }
		if (statusFilter !== "ALL") params.status = statusFilter
		return getSpaceCommunityProfiles(params).then((r) => ({ items: r.profiles, total: r.total }))
	}, [page, statusFilter])

	const { items: profiles, total, isLoading, error, refresh: fetchProfiles } = usePaginatedFetch(fetcher, "Failed to load community space profiles")

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return profiles
		return profiles.filter(
			(p) =>
				p.name.toLowerCase().includes(q) ||
				p.spaceProfile.businessName.toLowerCase().includes(q) ||
				(p.spaceProfile.user.email ?? "").toLowerCase().includes(q),
		)
	}, [profiles, search])

	async function handleAction(profileId: string, action: SpaceCommunityProfileAction, message?: string, isRevision?: boolean) {
		try {
			if (isRevision) {
				if (action === "approve") await approveSpaceCommunityProfileRevision(profileId)
				else if (action === "reject") await rejectSpaceCommunityProfileRevision(profileId, message!)
			} else {
				if (action === "approve") await approveSpaceCommunityProfile(profileId)
				else if (action === "reject") await rejectSpaceCommunityProfile(profileId, message!)
			}

			const labels: Record<SpaceCommunityProfileAction, string> = {
				approve: isRevision ? "Changes approved and applied" : "Community space profile approved",
				reject: isRevision ? "Changes rejected" : "Community space profile rejected",
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
				toast.error("Permission denied", { description: `You don't have permission to ${action} community space profiles.` })
			} else if (status === 404) {
				toast.error("Community space profile not found")
			} else if (status === 400) {
				const msg = axiosErr?.response?.data?.message
				toast.error(`Cannot ${action} community space profile`, { description: msg ?? "Profile is not in the required state." })
			} else {
				toast.error(`Failed to ${action} community space profile`, { description: "Something went wrong. Please try again." })
			}
			throw err
		}
	}

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	async function handleToggleVisibility(profileId: string, isHidden: boolean) {
		try {
			await setSpaceCommunityProfileVisibility(profileId, isHidden)
			toast.success(isHidden ? "Space hidden from brands/communities" : "Space is visible again")
			fetchProfiles()
		} catch {
			toast.error(`Failed to ${isHidden ? "hide" : "unhide"} community space profile`)
			throw new Error("visibility toggle failed")
		}
	}

	const columns = useMemo<ColumnDef<SpaceCommunityProfile>[]>(
		() => [
			{ id: "logo", header: "Logo", cell: ({ row }) => <LogoCell id={row.original.id} name={row.original.name} /> },
			{
				id: "name",
				header: "Name",
				cell: ({ row }) => (
					<div className="min-w-[250px]">
						<TwoLineCell primary={row.original.name} secondary={row.original.spaceProfile.businessName} />
					</div>
				),
			},
			{ id: "size", header: "Community size", cell: ({ row }) => <ChipCell>{row.original.communitySize} members</ChipCell> },
			{
				id: "cities",
				header: "Cities",
				cell: ({ row }) => {
					const cities = row.original.spaceProfile.operatingCities
					if (cities.length <= 3) return cities.join(", ") || "—"
					return `${cities.slice(0, 3).join(", ")} +${cities.length - 3}`
				},
			},
			{ id: "updated", header: "Last updated", cell: ({ row }) => <AgeDateCell iso={row.original.updatedAt} getDaysSince={getDaysSince} format={formatDate} /> },
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => (
					<div className="flex items-center gap-1.5">
						<StatusCell status={row.original.approvalStatus} />
						{row.original.pendingRevision && (
							<span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">Edit pending</span>
						)}
						{row.original.isHidden && (
							<span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">Hidden</span>
						)}
					</div>
				),
			},
		],
		[],
	)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view community space profiles." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="All Community Space Profiles"
				description="Every space partner community profile on the platform, regardless of status."
				buttons={
					<Button variant="red" onClick={() => setCreateOpen(true)} leftIcon={<Plus size={14} />}>
						Add Community Space Profile
					</Button>
				}
			/>

			<div className="flex items-center gap-2 flex-wrap">
				<SearchInput value={search} onChange={setSearch} placeholder="Search by name or space partner…" className="flex-1 min-w-48 max-w-xs" />
				<FilterSelect
					options={STATUS_TABS}
					value={statusFilter}
					onChange={(v) => {
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
				emptyMessage="No community space profiles match the current filters."
				onRowClick={openDrawer}
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>

			<SpaceCommunityProfileReviewDrawer
				open={drawerOpen}
				onClose={closeDrawer}
				profile={selectedProfile}
				onAction={handleAction}
				onEdit={setEditingProfile}
				onToggleVisibility={handleToggleVisibility}
			/>

			<CreateSpaceCommunityProfileDrawer
				open={createOpen || !!editingProfile}
				editingProfile={editingProfile}
				onClose={() => {
					setCreateOpen(false)
					setEditingProfile(null)
				}}
				onCreated={() => {
					setCreateOpen(false)
					fetchProfiles()
				}}
				onUpdated={() => {
					setEditingProfile(null)
					fetchProfiles()
				}}
			/>
		</div>
	)
}
