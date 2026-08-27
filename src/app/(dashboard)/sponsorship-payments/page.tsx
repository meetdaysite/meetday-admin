"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { extractApiErrorMessage } from "@/lib/error-handler"
import PageHeader from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import {
	getSponsorshipDealPayments,
	markSponsorshipDealPaidOffline,
	type SponsorshipDealPayment,
} from "@/lib/api/sponsorship-payments"

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

const PAYMENT_MODE_LABEL: Record<"ONLINE" | "OFFLINE", string> = {
	ONLINE: "Online",
	OFFLINE: "Offline",
}

function formatAmount(amount: string | number | null) {
	if (amount == null) return "—"
	return `₹${Number(amount).toLocaleString("en-IN")}`
}

function formatDateTime(iso: string | null) {
	if (!iso) return "—"
	return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
}

// yyyy-MM-ddThh:mm for a <input type="datetime-local"> default value, in local time.
function nowForDateTimeInput() {
	const d = new Date()
	d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
	return d.toISOString().slice(0, 16)
}

function MarkPaidOfflineModal({ row, onClose }: { row: SponsorshipDealPayment; onClose: () => void }) {
	const queryClient = useQueryClient()
	const [transactionFee, setTransactionFee] = useState("0")
	const [paidAt, setPaidAt] = useState(nowForDateTimeInput())

	const mutation = useMutation({
		mutationFn: () =>
			markSponsorshipDealPaidOffline(row.id, {
				transactionFeeAmount: Number(transactionFee) || 0,
				paidAt: new Date(paidAt).toISOString(),
			}),
		onSuccess: () => {
			toast.success("Deal marked as paid.")
			queryClient.invalidateQueries({ queryKey: ["admin-sponsorship-deal-payments"] })
			onClose()
		},
		onError: (err) => toast.error(extractApiErrorMessage(err, "Failed to mark deal as paid")),
	})

	const gstRatePreview = 0.18
	const previewTax = Math.round(Number(row.sponsorshipAmount) * gstRatePreview * 100) / 100
	const previewTotal = Math.round((Number(row.sponsorshipAmount) + previewTax) * 100) / 100

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
			<div className="bg-surface-card rounded-action border border-border-default shadow-floating w-full max-w-md flex flex-col">
				<div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
					<p className="text-body-lg font-bold text-text-primary">Mark as Paid (Offline)</p>
					<button onClick={onClose} className="text-text-tertiary hover:text-text-primary" aria-label="Close">×</button>
				</div>
				<div className="px-6 py-4 flex flex-col gap-4">
					<p className="text-caption text-text-tertiary">
						{row.brandName} · {row.communityName} — {formatAmount(row.sponsorshipAmount)}
					</p>
					<label className="flex flex-col gap-1.5">
						<span className="text-body-sm font-semibold text-text-primary">Transaction Fee (₹)</span>
						<input
							type="number"
							min={0}
							step="0.01"
							value={transactionFee}
							onChange={(e) => setTransactionFee(e.target.value)}
							className="border border-border-default rounded-action px-3 py-2 text-body-sm"
						/>
					</label>
					<label className="flex flex-col gap-1.5">
						<span className="text-body-sm font-semibold text-text-primary">Transaction Date &amp; Time</span>
						<input
							type="datetime-local"
							value={paidAt}
							onChange={(e) => setPaidAt(e.target.value)}
							className="border border-border-default rounded-action px-3 py-2 text-body-sm"
						/>
					</label>
					<div className="rounded-action bg-neutral-50 border border-border-subtle px-3 py-2.5 text-body-sm text-text-tertiary flex flex-col gap-1">
						<div className="flex justify-between"><span>GST (18% on sponsorship amount)</span><span className="font-semibold text-text-primary">{formatAmount(previewTax)}</span></div>
						<div className="flex justify-between"><span>Total Amount</span><span className="font-semibold text-text-primary">{formatAmount(previewTotal)}</span></div>
						<p className="text-[11px] text-text-tertiary/80">Final values are recalculated server-side using the live GST rate when you save.</p>
					</div>
				</div>
				<div className="px-6 py-4 border-t border-border-default flex justify-end gap-2">
					<Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
					<Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
						{mutation.isPending ? "Saving…" : "Mark as Paid"}
					</Button>
				</div>
			</div>
		</div>
	)
}

export default function SponsorshipPaymentsPage() {
	const [offlineRow, setOfflineRow] = useState<SponsorshipDealPayment | null>(null)

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
				description="Brand payments for locked sponsorship deals — transaction fee + GST breakdown, due 3 days after locking."
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
								<th className="px-4 py-2.5 font-semibold">Transaction Fee</th>
								<th className="px-4 py-2.5 font-semibold">GST</th>
								<th className="px-4 py-2.5 font-semibold">Total Amount</th>
								<th className="px-4 py-2.5 font-semibold">Status</th>
								<th className="px-4 py-2.5 font-semibold">Payment Mode</th>
								<th className="px-4 py-2.5 font-semibold">Transaction Date &amp; Time</th>
								<th className="px-4 py-2.5 font-semibold"></th>
							</tr>
						</thead>
						<tbody>
							{payments.map((row) => {
								const displayStatus = getDisplayStatus(row)
								const canMarkPaidOffline = displayStatus === "PENDING" || displayStatus === "EXPIRED"
								return (
									<tr key={row.id} className="border-b border-border-subtle hover:bg-neutral-50">
										<td className="px-4 py-3 text-body-sm text-text-primary font-medium">{row.brandName}</td>
										<td className="px-4 py-3 text-body-sm text-text-primary">
											<p className="font-medium">{row.communityName}</p>
											<p className="text-caption text-text-tertiary">{row.proposalName}</p>
										</td>
										<td className="px-4 py-3 text-body-sm text-text-primary">{formatAmount(row.sponsorshipAmount)}</td>
										<td className="px-4 py-3 text-body-sm text-text-primary">{formatAmount(row.transactionFeeAmount)}</td>
										<td className="px-4 py-3 text-body-sm text-text-primary">{formatAmount(row.taxAmount)}</td>
										<td className="px-4 py-3 text-body-sm text-text-primary font-semibold">{formatAmount(row.totalAmount)}</td>
										<td className="px-4 py-3">
											<span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", STATUS_BADGE_CLASS[displayStatus])}>
												{STATUS_LABEL[displayStatus]}
											</span>
										</td>
										<td className="px-4 py-3 text-body-sm text-text-primary">
											{row.paymentMode ? PAYMENT_MODE_LABEL[row.paymentMode] : "—"}
										</td>
										<td className="px-4 py-3 text-caption text-text-tertiary">
											{row.paymentStatus === "PAID" ? formatDateTime(row.paidAt) : "—"}
										</td>
										<td className="px-4 py-3 text-right">
											{canMarkPaidOffline && (
												<Button size="sm" variant="secondary" onClick={() => setOfflineRow(row)}>
													Mark as Paid
												</Button>
											)}
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				)}
			</div>

			{offlineRow && <MarkPaidOfflineModal row={offlineRow} onClose={() => setOfflineRow(null)} />}
		</div>
	)
}
