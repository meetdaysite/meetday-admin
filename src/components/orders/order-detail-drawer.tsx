"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
	AlertTriangle, User, Calendar, Hash, Ticket,
	CreditCard, Tag, Users,
} from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { StatusBadge } from "@/components/ui/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getOrderById } from "@/lib/api/orders"
import type { Order, OrderDetail } from "@/types"

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type OrderDetailDrawerProps = {
	open: boolean
	onClose: () => void
	order: Order | null
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", {
		day: "numeric", month: "short", year: "numeric",
		hour: "2-digit", minute: "2-digit",
	})
}

function formatCurrency(amount: number): string {
	return `â‚¹${amount.toLocaleString("en-IN")}`
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SectionLabel({ children }: { children: string }) {
	return (
		<p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">
			{children}
		</p>
	)
}

function DetailRow({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ElementType
	label: string
	value: React.ReactNode
}) {
	return (
		<div className="flex items-start gap-3">
			<div className="mt-0.5 w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center shrink-0">
				<Icon size={13} className="text-text-secondary" />
			</div>
			<div className="min-w-0">
				<p className="text-[11px] text-text-tertiary">{label}</p>
				<div className="text-sm text-text-primary">{value}</div>
			</div>
		</div>
	)
}

// â”€â”€â”€ Skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DrawerSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="flex gap-2">
				<Skeleton className="h-5 w-24 rounded-full" />
				<Skeleton className="h-5 w-16 rounded-full" />
			</div>
			<div className="space-y-3">
				<Skeleton className="h-3 w-16" />
				<Skeleton className="h-4 w-56" />
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-4 w-48" />
			</div>
			<div className="border-t border-border-subtle" />
			<div className="space-y-3">
				<Skeleton className="h-3 w-20" />
				<Skeleton className="h-16 w-full rounded-xl" />
			</div>
			<div className="border-t border-border-subtle" />
			<div className="space-y-2">
				<Skeleton className="h-3 w-24" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
		</div>
	)
}

// â”€â”€â”€ Detail content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function OrderDetailContent({ detail }: { detail: OrderDetail }) {
	const attendeeName = `${detail.user.firstName} ${detail.user.lastName}`

	return (
		<div className="space-y-6">
			{/* Status */}
			<div className="flex items-center gap-2 flex-wrap">
				<StatusBadge status={detail.status} />
				<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary font-mono">
					{detail.bookingId}
				</span>
			</div>

			{/* Order info */}
			<div>
				<SectionLabel>Order Info</SectionLabel>
				<div className="space-y-3.5">
					<DetailRow
						icon={User}
						label="Attendee"
						value={
							<span>
								<span className="block">{attendeeName}</span>
								<span className="text-[11px] text-text-tertiary">{detail.user.email}</span>
							</span>
						}
					/>
					<DetailRow
						icon={Tag}
						label="Event"
						value={
							<span>
								<span className="block">{detail.event.title}</span>
								<span className="text-[11px] text-text-tertiary">{detail.event.city}</span>
							</span>
						}
					/>
					<DetailRow icon={Calendar} label="Ordered" value={formatDate(detail.createdAt)} />
					<DetailRow icon={Hash} label="Order ID" value={
						<span className="font-mono text-xs">{detail.id}</span>
					} />
				</div>
			</div>

			{/* Financials */}
			<div className="border-t border-border-subtle" />
			<div>
				<SectionLabel>Financials</SectionLabel>
				<div className="rounded-xl border border-border-default divide-y divide-border-subtle overflow-hidden">
					<div className="flex items-center justify-between px-3.5 py-2.5">
						<span className="text-xs text-text-secondary">Total amount</span>
						<span className="text-xs font-semibold text-text-primary">
							{detail.totalAmount !== undefined ? formatCurrency(detail.totalAmount) : "â€”"}
						</span>
					</div>
					{detail.couponCode && (
						<div className="flex items-center justify-between px-3.5 py-2.5">
							<span className="text-xs text-text-secondary flex items-center gap-1.5">
								<Tag size={11} className="text-text-tertiary" />
								Coupon ({detail.couponCode})
							</span>
							<span className="text-xs font-semibold text-green-600">
								-{detail.discountAmount !== undefined ? formatCurrency(detail.discountAmount) : "â€”"}
							</span>
						</div>
					)}
					{detail.platformFee !== undefined && (
						<div className="flex items-center justify-between px-3.5 py-2.5">
							<span className="text-xs text-text-secondary">Platform fee</span>
							<span className="text-xs text-text-primary">{formatCurrency(detail.platformFee)}</span>
						</div>
					)}
					{detail.hostPayout !== undefined && (
						<div className="flex items-center justify-between px-3.5 py-2.5">
							<span className="text-xs text-text-secondary">Host payout</span>
							<span className="text-xs text-text-primary">{formatCurrency(detail.hostPayout)}</span>
						</div>
					)}
				</div>
			</div>

			{/* Attendees / tickets */}
			{detail.attendees && detail.attendees.length > 0 && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>{`Tickets (${detail.attendees.length})`}</SectionLabel>
						<div className="rounded-xl border border-border-default overflow-hidden">
							<table className="w-full text-xs">
								<thead>
									<tr className="bg-neutral-50 border-b border-border-subtle">
										<th className="px-3 py-2 text-left text-[11px] font-semibold text-text-secondary">
											<span className="flex items-center gap-1">
												<Users size={11} />Attendee
											</span>
										</th>
										<th className="px-3 py-2 text-left text-[11px] font-semibold text-text-secondary">Tier</th>
										<th className="px-3 py-2 text-left text-[11px] font-semibold text-text-secondary">
											<span className="flex items-center gap-1">
												<Ticket size={11} />Code
											</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{detail.attendees.map((a, i) => (
										<tr key={a.id} className={i < detail.attendees.length - 1 ? "border-b border-border-subtle" : ""}>
											<td className="px-3 py-2.5">
												<p className="font-medium text-text-primary">{a.firstName} {a.lastName}</p>
												<p className="text-[11px] text-text-tertiary">{a.email}</p>
											</td>
											<td className="px-3 py-2.5 text-text-secondary">{a.tierName}</td>
											<td className="px-3 py-2.5 font-mono text-text-secondary text-[11px]">{a.ticketCode}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</>
			)}
		</div>
	)
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function OrderDetailDrawer({ open, onClose, order }: OrderDetailDrawerProps) {
	const router = useRouter()
	const [detail, setDetail]       = useState<OrderDetail | null>(null)
	const [fetchState, setFetchState] = useState<"loading" | "error" | "done">("loading")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	useEffect(() => {
		if (!open || !order) return
		let cancelled = false
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)

		getOrderById(order.id)
			.then((data) => {
				if (!cancelled) { setDetail(data); setFetchState("done") }
			})
			.catch((err: unknown) => {
				if (cancelled) return
				const status = (err as { response?: { status?: number } })?.response?.status
				if (status === 401) { router.replace("/login"); return }
				setFetchState("error")
				if (status === 404) setErrorMessage("Order not found.")
				else setErrorMessage("Failed to load order details. Please try again.")
			})

		return () => { cancelled = true }
	}, [open, order?.id, router])

	function handleClose() {
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)
		onClose()
	}

	return (
		<Drawer
			open={open}
			onClose={handleClose}
			title={order ? `Order ${order.bookingId}` : "Order Detail"}
			description={order ? `${order.event.title} · ${order.event.city}` : undefined}
			width="max-w-lg"
		>
			{fetchState === "loading" && <DrawerSkeleton />}

			{fetchState === "error" && (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<AlertTriangle size={28} className="mb-3 text-neutral-300" />
					<p className="text-sm font-medium text-text-primary">Something went wrong</p>
					<p className="mt-1 text-xs text-text-tertiary max-w-xs">{errorMessage}</p>
				</div>
			)}

			{fetchState === "done" && detail && <OrderDetailContent detail={detail} />}

			<DrawerFooter className="justify-end">
				<button
					onClick={handleClose}
					className="rounded-lg border border-border-default px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors"
				>
					Close
				</button>
			</DrawerFooter>
		</Drawer>
	)
}
