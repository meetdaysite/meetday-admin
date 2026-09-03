"use client"

import { SponsorshipReviewDrawer, type SponsorshipAction } from "@/components/sponsorships/sponsorship-review-drawer"
import { CreateSponsorshipDrawer } from "@/components/sponsorships/create-sponsorship-drawer"
import { ClearableInput } from "@/components/ui/clearable-input"
import { DataView } from "@/components/ui/data-view"
import { FilterSelect } from "@/components/ui/filter-select"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { AgeDateCell, ChipCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
import {
	approveSponsorship,
	getSponsorshipById,
	getSponsorships,
	rejectSponsorship,
	type GetSponsorshipsParams,
} from "@/lib/api/sponsorships"
import { formatDate, formatDateRange, getDaysSince } from "@/lib/formatters"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { SponsorshipDetail, SponsorshipProposal, SponsorshipStatus } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/Button"
import { Plus, Download } from "lucide-react"
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

// Lazily fetches the proposal's pitch document (PDF or other file uploaded by the community)
// and renders a one-click download button — the URL is signed with a forced Content-Disposition
// so it saves to disk instead of opening an inline preview tab.
function SponsorshipDocCell({ id }: { id: string }) {
	const [docUrl, setDocUrl] = useState<string | null>(null)
	const [docName, setDocName] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let active = true
		getSponsorshipById(id)
			.then((data: SponsorshipDetail) => {
				if (active) {
					setDocUrl(data.docUrl)
					setDocName(data.docName)
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

	if (loading) return <div className="h-6 w-6 rounded-md bg-neutral-100 animate-pulse" />
	if (!docUrl) return <span className="text-neutral-300">—</span>

	return (
		<button
			type="button"
			onClick={e => {
				e.stopPropagation()
				window.open(docUrl, "_blank")
			}}
			title={docName ? `Download ${docName}` : "Download pitch document"}
			className="flex items-center justify-center size-7 rounded-lg border-2 border-black bg-white hover:bg-[#FFC940]/20 transition-colors shrink-0"
		>
			<Download size={13} className="text-black" />
		</button>
	)
}

// Constants

const PAGE_LIMIT = 20

type StatusFilter = SponsorshipStatus | "ALL"

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Under Review", value: "UNDER_REVIEW" },
	{ label: "Published", value: "PUBLISHED" },
	{ label: "Draft", value: "DRAFT" },
	{ label: "Rejected", value: "REJECTED" },
]

// Page

export default function SponsorshipsPage() {
	const router = useRouter()
	const canApprove = usePermission("sponsorship.approve")

	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [cityInput, setCityInput] = useState("")
	const [cityFilter, setCityFilter] = useState("")
	const [search, setSearch] = useState("")
	const [createOpen, setCreateOpen] = useState(false)
	const [editingProposal, setEditingProposal] = useState<SponsorshipDetail | null>(null)

	const { item: selectedProposal, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<SponsorshipProposal>()

	const fetcher = useCallback(() => {
		const params: GetSponsorshipsParams = { page, limit: PAGE_LIMIT }
		if (statusFilter !== "ALL") params.status = statusFilter
		if (cityFilter) params.city = cityFilter
		return getSponsorships(params).then(r => ({ items: r.proposals, total: r.total }))
	}, [page, statusFilter, cityFilter])

	const {
		items: proposals,
		total,
		isLoading,
		error,
		refresh: fetchProposals,
	} = usePaginatedFetch(fetcher, "Failed to load sponsorship proposals")

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

	function handleCitySearch(e: React.FormEvent) {
		e.preventDefault()
		setPage(1)
		setCityFilter(cityInput.trim())
	}

	async function handleAction(proposalId: string, action: SponsorshipAction, message?: string) {
		try {
			if (action === "approve") await approveSponsorship(proposalId)
			else if (action === "reject") await rejectSponsorship(proposalId, message!)

			const labels: Record<SponsorshipAction, string> = {
				approve: "Sponsorship proposal approved",
				reject: "Sponsorship proposal rejected",
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
					description: `You don't have permission to ${action} sponsorship proposals.`,
				})
			} else if (status === 404) {
				toast.error("Proposal not found")
			} else if (status === 400) {
				const msg = axiosErr?.response?.data?.message
				toast.error(`Cannot ${action} proposal`, {
					description: msg ?? "Proposal is not in the required state.",
				})
			} else {
				toast.error(`Failed to ${action} proposal`, {
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
				header: "Submitted",
				cell: ({ row }) => (
					<AgeDateCell iso={row.original.submittedAt ?? undefined} getDaysSince={getDaysSince} format={formatDate} />
				),
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => (
					<div className="flex items-center gap-1.5">
						<StatusCell status={row.original.status} />
						{row.original.pendingRevision && (
							<span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
								Edit pending
							</span>
						)}
					</div>
				),
			},
			{
				id: "document",
				header: "Document",
				cell: ({ row }) => <SponsorshipDocCell id={row.original.id} />,
			},
		],
		[],
	)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view sponsorships." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="All Sponsorships"
				description="Every sponsorship proposal on the platform, regardless of status."
				buttons={
					<Button
						variant="red"
						onClick={() => setCreateOpen(true)}
						leftIcon={<Plus size={14} />}
					>
						Create Sponsorship
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
				<form onSubmit={handleCitySearch}>
					<ClearableInput
						value={cityInput}
						onChange={setCityInput}
						showClear={!!cityFilter}
						onClear={() => {
							setCityInput("")
							setCityFilter("")
							setPage(1)
						}}
						placeholder="Filter by city…"
					/>
				</form>
			</div>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No sponsorship proposals match the current filters."
				onRowClick={openDrawer}
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>

			<SponsorshipReviewDrawer
				open={drawerOpen}
				onClose={closeDrawer}
				proposal={selectedProposal}
				onAction={handleAction}
				onEdit={setEditingProposal}
			/>

			<CreateSponsorshipDrawer
				open={createOpen || !!editingProposal}
				editingProposal={editingProposal}
				onClose={() => {
					setCreateOpen(false)
					setEditingProposal(null)
				}}
				onCreated={() => {
					setCreateOpen(false)
					fetchProposals()
				}}
				onUpdated={() => {
					setEditingProposal(null)
					fetchProposals()
				}}
			/>
		</div>
	)
}
