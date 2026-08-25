"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import PageHeader from "@/components/ui/PageHeader"
import { getCampaignDeals, type SponsorshipDeal, type SponsorshipDealStatus } from "@/lib/api/sponsorship-deals"

const POLL_MS = 15000

const STATUS_LABEL: Record<SponsorshipDealStatus, string> = {
	PENDING_APPROVAL: "Pending Approval",
	CHANGES_REQUESTED: "Changes Requested",
	APPROVED: "Locked",
}

const STATUS_BADGE_CLASS: Record<SponsorshipDealStatus, string> = {
	PENDING_APPROVAL: "bg-amber-100 text-amber-700",
	CHANGES_REQUESTED: "bg-red-100 text-red-700",
	APPROVED: "bg-green-100 text-green-700",
}

function formatAmount(amount: string | number) {
	return `₹${Number(amount).toLocaleString("en-IN")}`
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export default function CampaignDealsPage() {
	const [statusFilter, setStatusFilter] = useState<SponsorshipDealStatus | undefined>(undefined)
	const [selected, setSelected] = useState<SponsorshipDeal | null>(null)

	const dealsQuery = useQuery({
		queryKey: ["admin-campaign-deals", statusFilter],
		queryFn: () => getCampaignDeals(statusFilter),
		refetchInterval: POLL_MS,
	})

	const deals = dealsQuery.data ?? []

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="Campaign Deals"
				description="Negotiated & locked Host ↔ Brand campaign deals — final structured terms, separate from the raw chat."
			/>

			<div className="border border-border-default rounded-action overflow-hidden bg-surface-card">
				<div className="flex border-b border-border-default">
					{([undefined, "PENDING_APPROVAL", "CHANGES_REQUESTED", "APPROVED"] as (SponsorshipDealStatus | undefined)[]).map(s => (
						<button
							key={s ?? "ALL"}
							onClick={() => setStatusFilter(s)}
							className={cn(
								"flex-1 py-2.5 text-xs font-semibold transition-colors",
								statusFilter === s ? "bg-action-primary text-white" : "text-text-tertiary hover:bg-neutral-50",
							)}
						>
							{s ? STATUS_LABEL[s] : "All"}
						</button>
					))}
				</div>

				{dealsQuery.isLoading ? (
					<p className="text-caption text-text-tertiary text-center py-10">Loading…</p>
				) : deals.length === 0 ? (
					<p className="text-caption text-text-tertiary text-center py-10">No campaign deals yet.</p>
				) : (
					<table className="w-full text-left">
						<thead>
							<tr className="border-b border-border-default text-caption text-text-tertiary">
								<th className="px-4 py-2.5 font-semibold">Community</th>
								<th className="px-4 py-2.5 font-semibold">Brand</th>
								<th className="px-4 py-2.5 font-semibold">Project Name</th>
								<th className="px-4 py-2.5 font-semibold">Amount</th>
								<th className="px-4 py-2.5 font-semibold">Status</th>
								<th className="px-4 py-2.5 font-semibold">Updated</th>
							</tr>
						</thead>
						<tbody>
							{deals.map(d => (
								<tr
									key={d.id}
									onClick={() => setSelected(d)}
									className="border-b border-border-subtle hover:bg-neutral-50 cursor-pointer"
								>
									<td className="px-4 py-3 text-body-sm text-text-primary font-medium">{d.communityName}</td>
									<td className="px-4 py-3 text-body-sm text-text-primary">{d.brandName}</td>
									<td className="px-4 py-3 text-body-sm text-text-primary">{d.projectName}</td>
									<td className="px-4 py-3 text-body-sm text-text-primary">{formatAmount(d.sponsorshipAmount)}</td>
									<td className="px-4 py-3">
										<span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", STATUS_BADGE_CLASS[d.status])}>
											{STATUS_LABEL[d.status]}
										</span>
									</td>
									<td className="px-4 py-3 text-caption text-text-tertiary">{formatDate(d.updatedAt)}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{selected && <DealDetailDrawer deal={selected} onClose={() => setSelected(null)} />}
		</div>
	)
}

function DealDetailDrawer({ deal, onClose }: { deal: SponsorshipDeal; onClose: () => void }) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
			<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-lg flex flex-col max-h-[90vh]">
				<div className="flex items-center justify-between px-6 py-4 border-b border-border-default shrink-0">
					<div className="flex items-center gap-2">
						<p className="text-body-lg font-bold text-text-primary">{deal.projectName}</p>
						<span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", STATUS_BADGE_CLASS[deal.status])}>
							{STATUS_LABEL[deal.status]}
						</span>
					</div>
					<Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
				</div>
				<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
					<Row label="Community" value={deal.communityName} />
					<Row label="Brand" value={deal.brandName} />
					<Row label="Campaign Name" value={deal.proposalName || "—"} />
					<Row label="Project Name" value={deal.projectName} />
					<div className="grid grid-cols-2 gap-3">
						<Row label="Start Date" value={deal.startDate ? formatDate(deal.startDate) : "—"} />
						<Row label="End Date" value={deal.endDate ? (deal.endDate.includes("-") ? formatDate(deal.endDate) : deal.endDate) : "—"} />
					</div>
					<div className="grid grid-cols-2 gap-3">
						{deal.time && <Row label="Time" value={deal.time} />}
						{deal.sponsorshipCategory && <Row label="Sponsorship Category" value={deal.sponsorshipCategory} />}
					</div>
					<div className="grid grid-cols-2 gap-3">
						<Row label="Sponsorship Amount" value={formatAmount(deal.sponsorshipAmount)} />
						{deal.barterElements && <Row label="Barter Elements" value={deal.barterElements} />}
					</div>
					<Row label="Venue" value={deal.venue} />
					<Row label="Deliverables" value={deal.deliverables} multiline />
					{deal.otherTerms && <Row label="Other Terms / Conditions" value={deal.otherTerms} multiline />}
					{deal.additionalNotes && <Row label="Additional Notes" value={deal.additionalNotes} multiline />}
					{deal.changeRequestNote && <Row label="Latest Change Request" value={deal.changeRequestNote} multiline />}
					{deal.approvedAt && <Row label="Locked On" value={formatDate(deal.approvedAt)} />}
					<p className="text-caption text-text-tertiary">Version {deal.version}</p>
				</div>
			</div>
		</div>
	)
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
	return (
		<div>
			<p className="text-caption text-text-tertiary font-semibold">{label}</p>
			<p className={cn("text-body-sm text-text-primary", multiline && "whitespace-pre-wrap")}>{value}</p>
		</div>
	)
}
