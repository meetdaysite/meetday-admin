"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import PageHeader from "@/components/ui/PageHeader"
import { getSpaceDeals, type SpaceDeal, type SpaceDealStatus } from "@/lib/api/space-deals"

const POLL_MS = 15000

const STATUS_LABEL: Record<SpaceDealStatus, string> = {
	PENDING_APPROVAL: "Pending Approval",
	CHANGES_REQUESTED: "Changes Requested",
	APPROVED: "Locked",
}

const STATUS_BADGE_CLASS: Record<SpaceDealStatus, string> = {
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

function formatListField(value: string | string[] | null) {
	if (!value) return "—"
	if (Array.isArray(value)) return value.join(", ")
	return value
}

export default function SpaceDealsPage() {
	const [statusFilter, setStatusFilter] = useState<SpaceDealStatus | undefined>(undefined)
	const [selected, setSelected] = useState<SpaceDeal | null>(null)

	const dealsQuery = useQuery({
		queryKey: ["admin-space-deals", statusFilter],
		queryFn: () => getSpaceDeals(statusFilter),
		refetchInterval: POLL_MS,
	})

	const deals = dealsQuery.data ?? []

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="Space Deals"
				description="Negotiated & locked Community Space ↔ Brand/Community deals — final structured terms, separate from the raw chat."
			/>

			<div className="border border-border-default rounded-action overflow-hidden bg-surface-card">
				<div className="flex border-b border-border-default">
					{([undefined, "PENDING_APPROVAL", "CHANGES_REQUESTED", "APPROVED"] as (SpaceDealStatus | undefined)[]).map(s => (
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
					<p className="text-caption text-text-tertiary text-center py-10">No space deals yet.</p>
				) : (
					<table className="w-full text-left">
						<thead>
							<tr className="border-b border-border-default text-caption text-text-tertiary">
								<th className="px-4 py-2.5 font-semibold">Space</th>
								<th className="px-4 py-2.5 font-semibold">Requester</th>
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
									<td className="px-4 py-3 text-body-sm text-text-primary font-medium">{d.spaceName}</td>
									<td className="px-4 py-3 text-body-sm text-text-primary">
										{d.requesterName} <span className="text-caption text-text-tertiary">({d.requesterType === "BRAND" ? "Brand" : "Community"})</span>
									</td>
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

function DealDetailDrawer({ deal, onClose }: { deal: SpaceDeal; onClose: () => void }) {
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
				<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 text-sm">
					<Row label="Space" value={deal.spaceName} />
					<Row label="Requester" value={`${deal.requesterName} (${deal.requesterType === "BRAND" ? "Brand" : "Community"})`} />
					<div className="grid grid-cols-2 gap-3">
						<Row label="Start Date" value={deal.startDate ? formatDate(deal.startDate) : "—"} />
						<Row label="End Date" value={deal.endDate ? formatDate(deal.endDate) : "—"} />
					</div>
					{deal.time && <Row label="Time" value={deal.time} />}
					<div className="grid grid-cols-2 gap-3">
						<Row label="Sponsorship Amount" value={formatAmount(deal.sponsorshipAmount)} />
						{deal.barterElements && <Row label="Barter Elements" value={deal.barterElements} />}
					</div>
					<Row label="Venue" value={deal.venue} />
					<Row label="Goals" value={formatListField(deal.goals)} multiline />
					<Row label="Target Audience" value={formatListField(deal.targetAudience)} multiline />
					<Row label="Deliverables" value={deal.deliverables} multiline />
					{deal.otherTerms && <Row label="Other Terms" value={deal.otherTerms} multiline />}
					{deal.additionalNotes && <Row label="Additional Notes" value={deal.additionalNotes} multiline />}
					{deal.changeRequestNote && (
						<div className="rounded-xl border border-red-200 bg-red-50 p-3">
							<p className="text-[10px] font-bold uppercase text-red-600 mb-1">Changes Requested</p>
							<p className="text-xs font-semibold text-text-primary">{deal.changeRequestNote}</p>
						</div>
					)}
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
