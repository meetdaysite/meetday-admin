"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/ui/PageHeader"
import { getSponsorshipDealPayments, type SponsorshipDealPayment } from "@/lib/api/sponsorship-payments"

const POLL_MS = 15000

type DisplayStatus = "PENDING" | "PAID" | "EXPIRED"

function getDisplayStatus(row: SponsorshipDealPayment): DisplayStatus {
	if (row.paymentStatus === "PAID") return "PAID"
	if (row.paymentExpiresAt && new Date(row.paymentExpiresAt).getTime() < Date.now()) return "EXPIRED"
	return "PENDING"
}

const STATUS_LABEL: Record<DisplayStatus, string> = {
	PENDING: "Pending",
	PAID: "Paid",
	EXPIRED: "Expired",
}

const STATUS_BADGE_CLASS: Record<DisplayStatus, string> = {
	PENDING: "bg-amber-100 text-amber-700",
	PAID: "bg-green-100 text-green-700",
	EXPIRED: "bg-red-100 text-red-700",
}

function formatAmount(amount: string | number | null) {
	if (amount == null) return "—"
	return `₹${Number(amount).toLocaleString("en-IN")}`
}

function formatDateTime(iso: string | null) {
	if (!iso) return "—"
	return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
}

export default function SponsorshipPaymentsPage() {
	const paymentsQuery = useQuery({
		queryKey: ["admin-sponsorship-deal-payments"],
		queryFn: getSponsorshipDealPayments,
		refetchInterval: POLL_MS,
	})

	const payments = paymentsQuery.data ?? []

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="Payments"
				description="Brand payments for locked sponsorship deals — platform fee + GST breakdown, due 3 days after locking."
			/>

			<div className="border border-border-default rounded-action overflow-hidden bg-surface-card">
				{paymentsQuery.isLoading ? (
					<p className="text-caption text-text-tertiary text-center py-10">Loading…</p>
				) : payments.length === 0 ? (
					<p className="text-caption text-text-tertiary text-center py-10">No locked deals yet.</p>
				) : (
					<table className="w-full text-left">
						<thead>
							<tr className="border-b border-border-default text-caption text-text-tertiary">
								<th className="px-4 py-2.5 font-semibold">Brand</th>
								<th className="px-4 py-2.5 font-semibold">Community / Proposal</th>
								<th className="px-4 py-2.5 font-semibold">Sponsorship Amount</th>
								<th className="px-4 py-2.5 font-semibold">Platform Fee</th>
								<th className="px-4 py-2.5 font-semibold">Transaction Fee</th>
								<th className="px-4 py-2.5 font-semibold">GST</th>
								<th className="px-4 py-2.5 font-semibold">Total</th>
								<th className="px-4 py-2.5 font-semibold">Status</th>
								<th className="px-4 py-2.5 font-semibold">Transaction Date</th>
							</tr>
						</thead>
						<tbody>
							{payments.map((row) => {
								const displayStatus = getDisplayStatus(row)
								return (
									<tr key={row.id} className="border-b border-border-subtle hover:bg-neutral-50">
										<td className="px-4 py-3 text-body-sm text-text-primary font-medium">{row.brandName}</td>
										<td className="px-4 py-3 text-body-sm text-text-primary">
											<p className="font-medium">{row.communityName}</p>
											<p className="text-caption text-text-tertiary">{row.proposalName}</p>
										</td>
										<td className="px-4 py-3 text-body-sm text-text-primary">{formatAmount(row.sponsorshipAmount)}</td>
										<td className="px-4 py-3 text-body-sm text-text-primary">{formatAmount(row.platformFeeAmount)}</td>
										<td className="px-4 py-3 text-body-sm text-text-primary">{formatAmount(row.transactionFeeAmount)}</td>
										<td className="px-4 py-3 text-body-sm text-text-primary">{formatAmount(row.taxAmount)}</td>
										<td className="px-4 py-3 text-body-sm text-text-primary font-semibold">{formatAmount(row.totalAmount)}</td>
										<td className="px-4 py-3">
											<span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", STATUS_BADGE_CLASS[displayStatus])}>
												{STATUS_LABEL[displayStatus]}
											</span>
										</td>
										<td className="px-4 py-3 text-caption text-text-tertiary">
											{row.paymentStatus === "PAID" ? formatDateTime(row.paidAt) : "—"}
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				)}
			</div>
		</div>
	)
}
