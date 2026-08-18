"use client"

import { SponsorshipReviewDrawer, type SponsorshipAction } from "@/components/sponsorships/sponsorship-review-drawer"
import { DataView } from "@/components/ui/data-view"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { AgeDateCell, ChipCell, TwoLineCell } from "@/components/ui/table-cells"
import {
	approveSponsorshipRevision,
	getPendingSponsorshipRevisions,
	rejectSponsorshipRevision,
	getSponsorshipById,
} from "@/lib/api/sponsorships"
import { formatDate, formatDateRange, getDaysSince } from "@/lib/formatters"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { SponsorshipDetail, SponsorshipProposal } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// Logo Cell Component for Sponsorship cover image
function SponsorshipLogoCell({ id, name }: { id: string; name: string }) {
	const [imageUrl, setImageUrl] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let active = true
		getSponsorshipById(id)
			.then((data: SponsorshipDetail) => {
				if (active && data.imageUrl) {
					setImageUrl(data.imageUrl)
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

	return imageUrl ? (
		<img
			src={imageUrl}
			alt={name}
			className="size-8 rounded-lg object-cover border-2 border-black"
		/>
	) : (
		<div className="size-8 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-xs border-2 border-black text-neutral-700 select-none">
			{name.slice(0, 2).toUpperCase()}
		</div>
	)
}

// Constants

const PAGE_LIMIT = 20

// Page

export default function SponsorshipRevisionsPage() {
	const router = useRouter()
	const canApprove = usePermission("sponsorship.approve")

	const [page, setPage] = useState(1)
	const [search, setSearch] = useState("")

	const { item: selectedProposal, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<SponsorshipProposal>()

	const fetcher = useCallback(
		() => getPendingSponsorshipRevisions({ page, limit: PAGE_LIMIT }).then(r => ({ items: r.proposals, total: r.total })),
		[page],
	)

	const {
		items: proposals,
		total,
		isLoading,
		error,
		refresh: fetchProposals,
	} = usePaginatedFetch(fetcher, "Failed to load pending revisions")

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return proposals
		return proposals.filter(
			p =>
				(p.name ?? "").toLowerCase().includes(q) ||
				p.hostProfile.displayName.toLowerCase().includes(q) ||
				p.hostProfile.user.email.toLowerCase().includes(q),
		)
	}, [proposals, search])

	async function handleAction(proposalId: string, action: SponsorshipAction, message?: string) {
		try {
			if (action === "approve") await approveSponsorshipRevision(proposalId)
			else if (action === "reject") await rejectSponsorshipRevision(proposalId, message!)

			const labels: Record<SponsorshipAction, string> = {
				approve: "Revision approved",
				reject: "Revision rejected",
			}
			toast.success(labels[action])
			fetchProposals()
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
					description: msg ?? "Proposal is not in the required state.",
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

	const columns = useMemo<ColumnDef<SponsorshipProposal>[]>(
		() => [
			{
				id: "logo",
				header: "Logo",
				cell: ({ row }) => <SponsorshipLogoCell id={row.original.id} name={row.original.name ?? "Sponsorship"} />,
			},
			{
				id: "proposal",
				header: "Proposal",
				cell: ({ row }) => (
					<div className="min-w-[250px]">
						<TwoLineCell primary={row.original.name ?? "—"} secondary={row.original.hostProfile.displayName} />
					</div>
				),
			},
			{
				id: "city",
				header: "City",
				cell: ({ row }) => <ChipCell>{row.original.city ?? "—"}</ChipCell>,
			},
			{
				id: "eventDate",
				header: "Event Date",
				cell: ({ row }) =>
					row.original.eventDate
						? row.original.eventEndDate && row.original.eventEndDate !== row.original.eventDate
							? formatDateRange(row.original.eventDate, row.original.eventEndDate)
							: formatDate(row.original.eventDate)
						: "—",
			},
			{
				id: "submitted",
				header: "Last edited",
				cell: ({ row }) => (
					<AgeDateCell iso={row.original.submittedAt ?? undefined} getDaysSince={getDaysSince} format={formatDate} />
				),
			},
		],
		[],
	)

	if (!canApprove) return <PermissionGuard message="You don't have permission to review sponsorship revisions." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="Sponsorship Revisions"
				description="Review edits submitted against already-approved or published sponsorship proposals before they go live."
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

			<SponsorshipReviewDrawer
				open={drawerOpen}
				onClose={closeDrawer}
				proposal={selectedProposal}
				onAction={handleAction}
				mode="revision"
			/>
		</div>
	)
}
