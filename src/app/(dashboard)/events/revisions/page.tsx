"use client"

import { RevisionReviewDrawer, type RevisionAction } from "@/components/events/revision-review-drawer"
import { DataView } from "@/components/ui/data-view"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { ChipCell, DateCell, TwoLineCell } from "@/components/ui/table-cells"
import { approveRevision, getPendingRevisions, rejectRevision } from "@/lib/api/events"
import { formatDate } from "@/lib/formatters"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { RevisionListItem } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

// Constants

const PAGE_LIMIT = 20

// Page

export default function EventRevisionsPage() {
	const router = useRouter()
	const canReview = usePermission("event.revision.review")

	const [page, setPage] = useState(1)
	const [search, setSearch] = useState("")

	const { item: selectedRevision, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<RevisionListItem>()

	const fetcher = useCallback(
		() => getPendingRevisions({ page, limit: PAGE_LIMIT }).then(r => ({ items: r.revisions, total: r.total })),
		[page],
	)

	const {
		items: revisions,
		total,
		isLoading,
		error,
		refresh: fetchRevisions,
	} = usePaginatedFetch(fetcher, "Failed to load pending revisions")

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return revisions
		return revisions.filter(
			r =>
				r.event.title.toLowerCase().includes(q) ||
				r.event.hostProfile.displayName.toLowerCase().includes(q) ||
				r.event.hostProfile.user.email.toLowerCase().includes(q),
		)
	}, [revisions, search])

	async function handleAction(eventId: string, action: RevisionAction, message?: string) {
		try {
			if (action === "approve") await approveRevision(eventId)
			else if (action === "reject") await rejectRevision(eventId, message!)

			const labels: Record<RevisionAction, string> = {
				approve: "Revision approved",
				reject: "Revision rejected",
			}
			toast.success(labels[action])
			fetchRevisions()
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
					description: msg ?? "Event is not in the required state.",
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

	const columns = useMemo<ColumnDef<RevisionListItem>[]>(
		() => [
			{
				id: "event",
				header: "Event",
				cell: ({ row }) => (
					<TwoLineCell
						primary={row.original.event.title}
						secondary={row.original.event.hostProfile.displayName}
					/>
				),
			},
			{
				id: "venue",
				header: "Venue",
				cell: ({ row }) =>
					row.original.touchesVenue ? (
						<ChipCell className="bg-amber-50 text-amber-700 border-amber-200">
							Venue change
						</ChipCell>
					) : (
						<span className="text-xs text-text-tertiary">Content only</span>
					),
			},
			{
				id: "city",
				header: "City",
				cell: ({ row }) => <DateCell value={row.original.event.city} format={v => v} />,
			},
			{
				id: "eventDate",
				header: "Event Date",
				cell: ({ row }) => <DateCell value={row.original.event.eventDate} format={formatDate} />,
			},
			{
				id: "submitted",
				header: "Submitted",
				cell: ({ row }) => <DateCell value={row.original.createdAt} format={formatDate} secondary />,
			},
		],
		[],
	)

	if (!canReview) return <PermissionGuard message="You don't have permission to review event revisions." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader
				title="Revisions"
				description="Review edits submitted against already-published events before they go live."
			/>

			{/* Search */}
			<SearchInput
				value={search}
				onChange={setSearch}
				placeholder="Search by title or host…"
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

			<RevisionReviewDrawer
				open={drawerOpen}
				onClose={closeDrawer}
				revision={selectedRevision}
				onAction={handleAction}
			/>
		</div>
	)
}
