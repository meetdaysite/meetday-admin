"use client"

import { SponsorshipReviewDrawer, type SponsorshipAction } from "@/components/sponsorships/sponsorship-review-drawer"
import { CreateSponsorshipDrawer } from "@/components/sponsorships/create-sponsorship-drawer"
import { DataView } from "@/components/ui/data-view"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/Button"
import { approveSponsorship, getPendingSponsorships, rejectSponsorship, getSponsorshipById } from "@/lib/api/sponsorships"
import { formatDate, formatDateRange, getDaysSince } from "@/lib/formatters"
import { AgeDateCell, ChipCell, TwoLineCell } from "@/components/ui/table-cells"
import { usePermission } from "@/lib/hooks/use-permission"
import type { SponsorshipDetail, SponsorshipProposal } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
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

// Helpers

function getRowTint(proposal: SponsorshipProposal): string {
	if (!proposal.submittedAt) return ""
	const days = getDaysSince(proposal.submittedAt)
	if (days <= 7) return ""
	if (days <= 21) return "border-l-4 border-amber-500"
	if (days <= 35) return "border-l-4 border-orange-500"
	return "border-l-4 border-red-500"
}

// Page

export default function SponsorshipQueuePage() {
	const router = useRouter()
	const canApprove = usePermission("sponsorship.approve")

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [proposals, setProposals] = useState<SponsorshipProposal[]>([])
	const [search, setSearch] = useState("")

	const [selectedProposal, setSelectedProposal] = useState<SponsorshipProposal | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)
	const [createOpen, setCreateOpen] = useState(false)
	const [editingProposal, setEditingProposal] = useState<SponsorshipDetail | null>(null)

	const fetchProposals = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await getPendingSponsorships()
			setProposals(res.proposals)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
			if (status === 403) {
				setError("You don't have permission to view the sponsorship queue.")
			} else {
				toast.error("Failed to load sponsorship proposals")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [router])

	useEffect(() => {
		fetchProposals()
	}, [fetchProposals])

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

	function openDrawer(proposal: SponsorshipProposal) {
		setSelectedProposal(proposal)
		setDrawerOpen(true)
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
		],
		[],
	)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view the sponsorship queue." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="Sponsorship Queue"
				description="Review and approve sponsorship proposals submitted by hosts before they go live."
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
				emptyMessage="No sponsorship proposals pending review."
				onRowClick={openDrawer}
				getRowClassName={getRowTint}
			/>

			<SponsorshipReviewDrawer
				open={drawerOpen}
				onClose={() => {
					setDrawerOpen(false)
					setSelectedProposal(null)
				}}
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
