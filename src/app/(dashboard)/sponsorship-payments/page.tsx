"use client"

import { useState, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
	CheckCircle2,
	Clock,
	AlertCircle,
	Receipt,
	Banknote,
	CreditCard,
	RotateCw,
	X,
	Search,
	Building2,
	Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { extractApiErrorMessage } from "@/lib/error-handler"
import { Button } from "@/components/ui/Button"
import PageHeader from "@/components/ui/PageHeader"
import {
	getSponsorshipDealPayments,
	markSponsorshipDealPaidOffline,
	type SponsorshipDealPayment,
} from "@/lib/api/sponsorship-payments"

const POLL_MS = 15000

type DisplayStatus = "ALL" | "PENDING" | "PAID" | "EXPIRED"

function getDisplayStatus(row: SponsorshipDealPayment): "PENDING" | "PAID" | "EXPIRED" {
	if (row.paymentStatus === "PAID") return "PAID"
	if (row.paymentExpiresAt && new Date(row.paymentExpiresAt).getTime() < Date.now()) return "EXPIRED"
	return "PENDING"
}

const STATUS_LABEL: Record<"PENDING" | "PAID" | "EXPIRED", string> = {
	PENDING: "Pending",
	PAID: "Paid",
	EXPIRED: "Expired",
}

const STATUS_BADGE_STYLE: Record<
	"PENDING" | "PAID" | "EXPIRED",
	{ bg: string; text: string; border: string; icon: typeof Clock }
> = {
	PENDING: {
		bg: "bg-amber-50",
		text: "text-amber-700",
		border: "border-amber-200",
		icon: Clock,
	},
	PAID: {
		bg: "bg-emerald-50",
		text: "text-emerald-700",
		border: "border-emerald-200",
		icon: CheckCircle2,
	},
	EXPIRED: {
		bg: "bg-rose-50",
		text: "text-rose-700",
		border: "border-rose-200",
		icon: AlertCircle,
	},
}

function formatAmount(amount: string | number | null) {
	if (amount == null) return "—"
	return `₹${Number(amount).toLocaleString("en-IN")}`
}

function formatDateTime(iso: string | null) {
	if (!iso) return "—"
	return new Date(iso).toLocaleString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	})
}

function formatDateOnly(iso: string | null) {
	if (!iso) return "—"
	return new Date(iso).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

function nowForDateTimeInput() {
	const d = new Date()
	d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
	return d.toISOString().slice(0, 16)
}

function MarkPaidOfflineModal({
	row,
	onClose,
}: {
	row: SponsorshipDealPayment
	onClose: () => void
}) {
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
			toast.success("Deal marked as paid offline.")
			queryClient.invalidateQueries({ queryKey: ["admin-sponsorship-deal-payments"] })
			onClose()
		},
		onError: (err) => toast.error(extractApiErrorMessage(err, "Failed to mark deal as paid")),
	})

	const sponsorshipAmountNum = Number(row.sponsorshipAmount) || 0
	const gstRatePreview = 0.18
	const previewTax = Math.round(sponsorshipAmountNum * gstRatePreview * 100) / 100
	const feeNum = Number(transactionFee) || 0
	const previewTotal = Math.round((sponsorshipAmountNum + previewTax + feeNum) * 100) / 100

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget && !mutation.isPending) onClose()
			}}
		>
			<div className="bg-surface-card rounded-xl border border-border-default shadow-floating w-full max-w-md flex flex-col overflow-hidden">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-5 py-3.5 border-b border-border-default">
					<div className="flex items-center gap-2">
						<div className="size-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
							<Banknote className="size-4" />
						</div>
						<div>
							<p className="text-body-sm font-bold text-text-primary">Record Offline Payment</p>
							<p className="text-[11px] text-text-tertiary">Log settlement and transaction breakdown</p>
						</div>
					</div>
					<button
						onClick={onClose}
						disabled={mutation.isPending}
						className="text-text-tertiary hover:text-text-primary p-1 rounded transition-colors"
						aria-label="Close"
					>
						<X className="size-4" />
					</button>
				</div>

				{/* Modal Body */}
				<div className="px-5 py-4 flex flex-col gap-3 text-xs">
					{/* Deal info card */}
					<div className="rounded-lg bg-neutral-50 border border-border-subtle p-3 flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<span className="font-semibold text-text-primary">{row.brandName}</span>
							<span className="font-bold text-emerald-700">{formatAmount(row.sponsorshipAmount)}</span>
						</div>
						<p className="text-caption text-text-tertiary truncate">
							{row.communityName} · {row.proposalName || row.projectName || "Sponsorship"}
						</p>
					</div>

					{/* Inputs */}
					<label className="flex flex-col gap-1">
						<span className="font-semibold text-text-primary">Transaction Fee (₹)</span>
						<input
							type="number"
							min={0}
							step="0.01"
							value={transactionFee}
							onChange={(e) => setTransactionFee(e.target.value)}
							placeholder="0.00"
							className="border border-border-default rounded-md px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-border-focused transition-colors"
						/>
					</label>

					<label className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<span className="font-semibold text-text-primary">Transaction Date &amp; Time</span>
							<button
								type="button"
								onClick={() => setPaidAt(nowForDateTimeInput())}
								className="text-[11px] font-medium text-text-link hover:underline"
							>
								Now
							</button>
						</div>
						<input
							type="datetime-local"
							value={paidAt}
							onChange={(e) => setPaidAt(e.target.value)}
							className="border border-border-default rounded-md px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-border-focused transition-colors"
						/>
					</label>

					{/* Breakdown Box */}
					<div className="rounded-lg bg-neutral-50 border border-border-subtle px-3 py-2.5 text-caption text-text-secondary flex flex-col gap-1">
						<div className="flex justify-between">
							<span>Sponsorship Base</span>
							<span className="font-medium text-text-primary">{formatAmount(row.sponsorshipAmount)}</span>
						</div>
						<div className="flex justify-between">
							<span>GST (18%)</span>
							<span className="font-medium text-text-primary">{formatAmount(previewTax)}</span>
						</div>
						{feeNum > 0 && (
							<div className="flex justify-between">
								<span>Transaction Fee</span>
								<span className="font-medium text-text-primary">{formatAmount(feeNum)}</span>
							</div>
						)}
						<div className="flex justify-between pt-1.5 border-t border-border-subtle font-semibold text-text-primary">
							<span>Estimated Total</span>
							<span className="text-emerald-700 font-bold">{formatAmount(previewTotal)}</span>
						</div>
						<p className="text-[10px] text-text-tertiary pt-0.5">
							Final total is verified server-side with current GST rates.
						</p>
					</div>
				</div>

				{/* Modal Footer */}
				<div className="px-5 py-3 border-t border-border-default flex items-center justify-end gap-2 bg-neutral-50/50">
					<Button variant="secondary" size="sm" onClick={onClose} disabled={mutation.isPending}>
						Cancel
					</Button>
					<button
						type="button"
						onClick={() => mutation.mutate()}
						disabled={mutation.isPending}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
					>
						{mutation.isPending ? (
							<>
								<Loader2 className="size-3.5 animate-spin" />
								<span>Saving…</span>
							</>
						) : (
							<>
								<CheckCircle2 className="size-3.5" />
								<span>Mark as Paid</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

export default function SponsorshipPaymentsPage() {
	const queryClient = useQueryClient()
	const [statusFilter, setStatusFilter] = useState<DisplayStatus>("ALL")
	const [searchQuery, setSearchQuery] = useState("")
	const [offlineRow, setOfflineRow] = useState<SponsorshipDealPayment | null>(null)

	const paymentsQuery = useQuery({
		queryKey: ["admin-sponsorship-deal-payments"],
		queryFn: getSponsorshipDealPayments,
		refetchInterval: POLL_MS,
	})

	const payments = useMemo(() => paymentsQuery.data ?? [], [paymentsQuery.data])

	// Summary stats
	const stats = useMemo(() => {
		let totalCount = 0
		let paidCount = 0
		let pendingCount = 0
		let expiredCount = 0
		let totalPaidAmount = 0
		let totalPendingAmount = 0

		for (const p of payments) {
			totalCount++
			const st = getDisplayStatus(p)
			const amount = Number(p.totalAmount || p.sponsorshipAmount) || 0

			if (st === "PAID") {
				paidCount++
				totalPaidAmount += amount
			} else if (st === "PENDING") {
				pendingCount++
				totalPendingAmount += amount
			} else if (st === "EXPIRED") {
				expiredCount++
			}
		}

		return {
			totalCount,
			paidCount,
			pendingCount,
			expiredCount,
			totalPaidAmount,
			totalPendingAmount,
		}
	}, [payments])

	// Filter and search
	const filteredPayments = useMemo(() => {
		return payments.filter((row) => {
			const displayStatus = getDisplayStatus(row)
			if (statusFilter !== "ALL" && displayStatus !== statusFilter) {
				return false
			}

			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase()
				const matchBrand = row.brandName?.toLowerCase().includes(q)
				const matchCommunity = row.communityName?.toLowerCase().includes(q)
				const matchProposal = row.proposalName?.toLowerCase().includes(q)
				const matchProject = row.projectName?.toLowerCase().includes(q)
				if (!matchBrand && !matchCommunity && !matchProposal && !matchProject) {
					return false
				}
			}

			return true
		})
	}, [payments, statusFilter, searchQuery])

	return (
		<div className="p-6 space-y-5 w-full max-w-7xl mx-auto">
			<PageHeader
				title="Payments"
				description="Brand payments for locked sponsorship deals — transaction fee + GST breakdown, due 3 days after locking."
				buttons={
					<Button
						variant="secondary"
						size="sm"
						onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-sponsorship-deal-payments"] })}
						disabled={paymentsQuery.isFetching}
						leftIcon={<RotateCw className={cn("size-3.5", paymentsQuery.isFetching && "animate-spin")} />}
					>
						Refresh
					</Button>
				}
			/>

			{/* Top Metric Cards - Clean & Compact */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
				{/* Total Deals */}
				<div className="bg-surface-card rounded-xl border border-border-default p-3.5 flex items-center justify-between shadow-2xs">
					<div className="space-y-0.5">
						<p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Total Deals</p>
						<p className="text-lg font-bold text-text-primary leading-tight">{stats.totalCount}</p>
						<p className="text-[11px] text-text-muted">Locked sponsorships</p>
					</div>
					<div className="size-9 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center shrink-0">
						<Receipt className="size-4.5" />
					</div>
				</div>

				{/* Settled & Paid */}
				<div className="bg-surface-card rounded-xl border border-border-default p-3.5 flex items-center justify-between shadow-2xs">
					<div className="space-y-0.5">
						<p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Settled &amp; Paid</p>
						<p className="text-lg font-bold text-text-primary leading-tight">{formatAmount(stats.totalPaidAmount)}</p>
						<p className="text-[11px] text-emerald-600">{stats.paidCount} completed</p>
					</div>
					<div className="size-9 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-700 flex items-center justify-center shrink-0">
						<CheckCircle2 className="size-4.5" />
					</div>
				</div>

				{/* Pending */}
				<div className="bg-surface-card rounded-xl border border-border-default p-3.5 flex items-center justify-between shadow-2xs">
					<div className="space-y-0.5">
						<p className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Pending</p>
						<p className="text-lg font-bold text-text-primary leading-tight">{formatAmount(stats.totalPendingAmount)}</p>
						<p className="text-[11px] text-amber-600">{stats.pendingCount} awaiting</p>
					</div>
					<div className="size-9 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center shrink-0">
						<Clock className="size-4.5" />
					</div>
				</div>

				{/* Expired */}
				<div className="bg-surface-card rounded-xl border border-border-default p-3.5 flex items-center justify-between shadow-2xs">
					<div className="space-y-0.5">
						<p className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">Overdue / Expired</p>
						<p className="text-lg font-bold text-text-primary leading-tight">{stats.expiredCount}</p>
						<p className="text-[11px] text-rose-600">Past due date</p>
					</div>
					<div className="size-9 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-700 flex items-center justify-center shrink-0">
						<AlertCircle className="size-4.5" />
					</div>
				</div>
			</div>

			{/* Main Table Card */}
			<div className="border border-border-default rounded-action overflow-hidden bg-surface-card w-full">
				{/* Top Controls: Filter Tabs & Search */}
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-border-default bg-neutral-50/60 px-3 py-2 gap-2 w-full">
					{/* Status Tabs */}
					<div className="flex items-center gap-1 flex-wrap">
						{(
							[
								{ key: "ALL", label: "All", count: stats.totalCount },
								{ key: "PENDING", label: "Pending", count: stats.pendingCount },
								{ key: "PAID", label: "Paid", count: stats.paidCount },
								{ key: "EXPIRED", label: "Expired", count: stats.expiredCount },
							] as const
						).map((tab) => {
							const isActive = statusFilter === tab.key
							return (
								<button
									key={tab.key}
									onClick={() => setStatusFilter(tab.key)}
									className={cn(
										"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
										isActive
											? "bg-white text-text-primary shadow-xs border border-border-default"
											: "text-text-tertiary hover:text-text-primary hover:bg-neutral-100/70",
									)}
								>
									<span>{tab.label}</span>
									<span
										className={cn(
											"px-1.5 py-0.2 rounded-full text-[10px]",
											isActive
												? "bg-neutral-100 text-text-primary font-bold"
												: "bg-neutral-200/70 text-text-secondary",
										)}
									>
										{tab.count}
									</span>
								</button>
							)
						})}
					</div>

					{/* Search Box */}
					<div className="relative">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary pointer-events-none" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search brand, community…"
							className="pl-8 pr-7 py-1 text-xs rounded-md border border-border-default bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focused w-full sm:w-60"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
							>
								<X className="size-3" />
							</button>
						)}
					</div>
				</div>

				{/* Table View - Always maintains full width */}
				<div className="overflow-x-auto w-full">
					<table className="w-full min-w-full text-left table-auto">
						<thead>
							<tr className="border-b border-border-default text-caption text-text-tertiary bg-neutral-50/40">
								<th className="px-3.5 py-2.5 font-semibold min-w-[160px]">Brand &amp; Community</th>
								<th className="px-3.5 py-2.5 font-semibold min-w-[160px]">Proposal / Project</th>
								<th className="px-3.5 py-2.5 font-semibold min-w-[120px]">Sponsorship</th>
								<th className="px-3.5 py-2.5 font-semibold min-w-[110px]">Fee + GST</th>
								<th className="px-3.5 py-2.5 font-semibold min-w-[110px]">Total Amount</th>
								<th className="px-3.5 py-2.5 font-semibold min-w-[90px]">Status</th>
								<th className="px-3.5 py-2.5 font-semibold min-w-[110px]">Payment Mode</th>
								<th className="px-3.5 py-2.5 font-semibold min-w-[130px]">Transaction Date</th>
								<th className="px-3.5 py-2.5 font-semibold min-w-[120px] text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border-subtle">
							{paymentsQuery.isLoading ? (
								<tr>
									<td colSpan={9} className="text-center py-12 text-caption text-text-tertiary">
										<div className="flex items-center justify-center gap-2">
											<Loader2 className="size-4 animate-spin text-text-tertiary" />
											<span>Loading payments…</span>
										</div>
									</td>
								</tr>
							) : filteredPayments.length === 0 ? (
								<tr>
									<td colSpan={9} className="text-center py-12 text-caption text-text-tertiary">
										{searchQuery ? "No matching payment records." : "No locked deals in this status."}
									</td>
								</tr>
							) : (
								filteredPayments.map((row) => {
									const displayStatus = getDisplayStatus(row)
									const canMarkPaidOffline = displayStatus === "PENDING" || displayStatus === "EXPIRED"
									const statusStyle = STATUS_BADGE_STYLE[displayStatus]
									const StatusIcon = statusStyle.icon

									return (
										<tr
											key={row.id}
											className="hover:bg-neutral-50/70 transition-colors"
										>
											{/* Brand & Community */}
											<td className="px-3.5 py-2.5 text-xs text-text-primary font-medium">
												<div className="flex flex-col">
													<span className="font-semibold text-text-primary">{row.brandName}</span>
													<span className="text-[11px] text-text-tertiary flex items-center gap-1">
														<Building2 className="size-2.5 text-text-muted shrink-0" />
														{row.communityName}
													</span>
												</div>
											</td>

											{/* Proposal / Project */}
											<td className="px-3.5 py-2.5 text-xs text-text-primary max-w-[200px]">
												<p className="truncate font-medium">{row.proposalName || row.projectName || "—"}</p>
												{row.projectName && row.projectName !== row.proposalName && (
													<p className="text-[11px] text-text-tertiary truncate">{row.projectName}</p>
												)}
											</td>

											{/* Sponsorship Amount */}
											<td className="px-3.5 py-2.5 text-xs text-text-primary font-medium">
												{formatAmount(row.sponsorshipAmount)}
											</td>

											{/* Transaction Fee + GST */}
											<td className="px-3.5 py-2.5 text-[11px] text-text-secondary">
												<div className="flex flex-col">
													<span>Fee: <span className="font-medium text-text-primary">{formatAmount(row.transactionFeeAmount || 0)}</span></span>
													<span>GST: <span className="font-medium text-text-primary">{formatAmount(row.taxAmount || 0)}</span></span>
												</div>
											</td>

											{/* Total Amount */}
											<td className="px-3.5 py-2.5 text-xs font-bold text-text-primary">
												{formatAmount(row.totalAmount || row.sponsorshipAmount)}
											</td>

											{/* Status */}
											<td className="px-3.5 py-2.5">
												<span
													className={cn(
														"inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
														statusStyle.bg,
														statusStyle.text,
														statusStyle.border,
													)}
												>
													<StatusIcon className="size-3" />
													<span>{STATUS_LABEL[displayStatus]}</span>
												</span>
											</td>

											{/* Payment Mode */}
											<td className="px-3.5 py-2.5 text-xs text-text-primary">
												{row.paymentMode ? (
													<span className="inline-flex items-center gap-1 text-[11px] font-medium">
														{row.paymentMode === "ONLINE" ? (
															<>
																<CreditCard className="size-3 text-blue-600" />
																<span>Online</span>
															</>
														) : (
															<>
																<Banknote className="size-3 text-emerald-600" />
																<span>Offline</span>
															</>
														)}
													</span>
												) : (
													<span className="text-text-muted">—</span>
												)}
											</td>

											{/* Transaction Date */}
											<td className="px-3.5 py-2.5 text-[11px] text-text-tertiary">
												{row.paymentStatus === "PAID"
													? formatDateTime(row.paidAt)
													: row.paymentExpiresAt
														? `Due ${formatDateOnly(row.paymentExpiresAt)}`
														: "—"}
											</td>

											{/* Action */}
											<td className="px-3.5 py-2.5 text-right whitespace-nowrap">
												{canMarkPaidOffline ? (
													<button
														type="button"
														onClick={() => setOfflineRow(row)}
														className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300/80 transition-colors cursor-pointer shadow-2xs"
													>
														<Banknote className="size-3.5 text-emerald-600" />
														<span>Mark as Paid</span>
													</button>
												) : (
													<span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
														<CheckCircle2 className="size-3 text-emerald-600" />
														<span>Settled</span>
													</span>
												)}
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Mark Paid Offline Modal */}
			{offlineRow && (
				<MarkPaidOfflineModal
					row={offlineRow}
					onClose={() => setOfflineRow(null)}
				/>
			)}
		</div>
	)
}
