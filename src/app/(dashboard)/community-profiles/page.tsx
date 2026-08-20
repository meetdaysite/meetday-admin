"use client"

import { CommunityProfileReviewDrawer, type CommunityProfileAction } from "@/components/community-profiles/community-profile-review-drawer"
import { CreateCommunityProfileDrawer } from "@/components/community-profiles/create-community-profile-drawer"
import { DataView } from "@/components/ui/data-view"
import { FilterSelect } from "@/components/ui/filter-select"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { AgeDateCell, ChipCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
import { approveCommunityProfile, approveCommunityProfileRevision, getCommunityProfileById, getCommunityProfiles, rejectCommunityProfile, rejectCommunityProfileRevision, setCommunityProfileVisibility } from "@/lib/api/community-profiles"
import { formatDate, getDaysSince } from "@/lib/formatters"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { ApprovalStatus, CommunityProfile, CommunityProfileDetail } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/Button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
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

// Logo Cell Component to fetch detail image
function LogoCell({ id, name }: { id: string; name: string }) {
	const [logoUrl, setLogoUrl] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let active = true
		getCommunityProfileById(id)
			.then((data: CommunityProfileDetail) => {
				if (active && data.logoUrl) {
					setLogoUrl(data.logoUrl)
				}
			})
			.catch(() => {})
			.finally(() => {
				if (active) setLoading(false)
			})
		return () => {
			active = false
		}
	}, [id])

	if (loading) {
		return <div className="size-8 rounded-lg bg-neutral-100 animate-pulse border-2 border-black" />
	}

	return logoUrl ? (
		<img
			src={logoUrl}
			alt={name}
			className="size-8 rounded-lg object-cover border-2 border-black"
		/>
	) : (
		<div className="size-8 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-xs border-2 border-black text-neutral-700 select-none">
			{name.slice(0, 2).toUpperCase()}
		</div>
	)
}

// Page

export default function AllCommunityProfilesPage() {
	const router = useRouter()
	const canApprove = usePermission("communityProfile.approve")

	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [search, setSearch] = useState("")

	const { item: selectedProfile, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<CommunityProfile>()
	const [createOpen, setCreateOpen] = useState(false)
	const [editingProfile, setEditingProfile] = useState<CommunityProfileDetail | null>(null)

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

	async function handleToggleVisibility(profileId: string, isHidden: boolean) {
		try {
			await setCommunityProfileVisibility(profileId, isHidden)
			toast.success(isHidden ? "Community hidden from brands" : "Community is visible to brands again")
			fetchProfiles()
		} catch {
			toast.error(`Failed to ${isHidden ? "hide" : "unhide"} community profile`)
			throw new Error("visibility toggle failed")
		}
	}

	const columns = useMemo<ColumnDef<CommunityProfile>[]>(
		() => [
			{
				id: "logo",
				header: "Logo",
				cell: ({ row }) => <LogoCell id={row.original.id} name={row.original.name} />,
			},
			{
				id: "name",
				header: "Name",
				cell: ({ row }) => (
					<div className="min-w-[250px]">
						<TwoLineCell primary={row.original.name} secondary={row.original.hostProfile.displayName ?? undefined} />
					</div>
				),
			},
			{
				id: "size",
				header: "Size",
				cell: ({ row }) => <ChipCell>{row.original.size} members</ChipCell>,
			},
			{
				id: "cities",
				header: "Cities",
				cell: ({ row }) => {
					const cities = row.original.hostProfile.operatingCities
					if (cities.length <= 3) {
						return cities.join(", ") || "—"
					}
					return `${cities.slice(0, 3).join(", ")} +${cities.length - 3}`
				},
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
						{row.original.isHidden && (
							<span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
								Hidden
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
					<Button
						variant="red"
						onClick={() => setCreateOpen(true)}
						leftIcon={<Plus size={14} />}
					>
						Add Community Profile
					</Button>
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
				onEdit={setEditingProfile}
				onToggleVisibility={handleToggleVisibility}
			/>

			<CreateCommunityProfileDrawer
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
