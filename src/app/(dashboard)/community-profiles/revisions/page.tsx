"use client"

import { CommunityProfileReviewDrawer, type CommunityProfileAction } from "@/components/community-profiles/community-profile-review-drawer"
import { DataView } from "@/components/ui/data-view"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { AgeDateCell, ChipCell, TwoLineCell } from "@/components/ui/table-cells"
import {
	approveCommunityProfileRevision,
	getPendingCommunityProfileRevisions,
	rejectCommunityProfileRevision,
} from "@/lib/api/community-profiles"
import { formatDate, getDaysSince } from "@/lib/formatters"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { CommunityProfile } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

const PAGE_LIMIT = 20

export default function CommunityProfileRevisionsPage() {
	const router = useRouter()
	const canApprove = usePermission("communityProfile.approve")

	const [page, setPage] = useState(1)
	const [search, setSearch] = useState("")

	const { item: selectedProfile, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<CommunityProfile>()

	const fetcher = useCallback(
		() => getPendingCommunityProfileRevisions({ page, limit: PAGE_LIMIT }).then(r => ({ items: r.profiles, total: r.total })),
		[page],
	)

	const {
		items: profiles,
		total,
		isLoading,
		error,
		refresh: fetchProfiles,
	} = usePaginatedFetch(fetcher, "Failed to load pending revisions")

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

	async function handleAction(profileId: string, action: CommunityProfileAction, message?: string) {
		try {
			if (action === "approve") await approveCommunityProfileRevision(profileId)
			else if (action === "reject") await rejectCommunityProfileRevision(profileId, message!)

			const labels: Record<CommunityProfileAction, string> = {
				approve: "Changes approved and applied",
				reject: "Changes rejected",
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
					description: `You don't have permission to ${action} revisions.`,
				})
			} else if (status === 404) {
				toast.error("Revision not found", {
					description: "It may have already been reviewed.",
				})
			} else if (status === 400) {
				const msg = axiosErr?.response?.data?.message
				toast.error(`Cannot ${action} revision`, {
					description: msg ?? "Profile is not in the required state.",
				})
			} else {
				toast.error(`Failed to ${action} revision`, {
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
				id: "cities",
				header: "Operating cities",
				cell: ({ row }) => row.original.hostProfile.operatingCities.join(", ") || "—",
			},
			{
				id: "updated",
				header: "Last edited",
				cell: ({ row }) => (
					<AgeDateCell iso={row.original.updatedAt} getDaysSince={getDaysSince} format={formatDate} />
				),
			},
		],
		[],
	)

	if (!canApprove) return <PermissionGuard message="You don't have permission to review community profile revisions." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="Community Profile Revisions"
				description="Review edits submitted against already-approved community profiles before they go live to brands."
			/>

			<SearchInput
				value={search}
				onChange={setSearch}
				placeholder="Search by name or host…"
				className="max-w-xs"
			/>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No revisions pending review."
				onRowClick={openDrawer}
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>

			<CommunityProfileReviewDrawer
				open={drawerOpen}
				onClose={closeDrawer}
				profile={selectedProfile}
				onAction={handleAction}
			/>
		</div>
	)
}
