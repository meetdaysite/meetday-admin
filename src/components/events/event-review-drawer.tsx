"use client"

import { useState } from "react"
import { Loader2, MapPin, Mail, Calendar, Clock, AlertCircle, Users, Ticket } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { StatusBadge } from "@/components/ui/status-badge"
import type { Event, TicketTier } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventAction = "approve" | "reject" | "request_edit"

export type EventReviewDrawerProps = {
	open: boolean
	onClose: () => void
	event: Event | null
	onAction: (eventId: string, action: EventAction, message?: string) => Promise<void>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
	return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function formatEventDate(date: Date): string {
	return date.toLocaleDateString("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

function getDays(date: Date): number {
	return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function daysAgoLabel(days: number): string {
	if (days === 0) return "Today"
	if (days === 1) return "Yesterday"
	return `${days} days ago`
}

function formatPrice(price: number): string {
	if (price === 0) return "Free"
	return `₹${price.toLocaleString("en-IN")}`
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ElementType
	label: string
	value: string
}) {
	return (
		<div className="flex items-start gap-3">
			<div className="mt-0.5 w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center shrink-0">
				<Icon size={13} className="text-neutral-dark" />
			</div>
			<div>
				<p className="text-[11px] text-neutral-light">{label}</p>
				<p className="text-sm text-foreground">{value}</p>
			</div>
		</div>
	)
}

// ─── Ticket pricing table ─────────────────────────────────────────────────────

function TicketPricingTable({ tiers }: { tiers: TicketTier[] }) {
	if (tiers.length === 0) return null

	const totalCapacity = tiers.reduce((sum, t) => sum + t.capacity, 0)

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-1.5">
				<Ticket size={12} className="text-neutral-dark" />
				<p className="text-xs font-semibold text-foreground">Ticket Tiers</p>
			</div>
			<div className="rounded-xl border border-neutral-100 overflow-hidden">
				<table className="w-full text-xs">
					<thead>
						<tr className="bg-neutral-50 border-b border-neutral-100">
							<th className="px-3 py-2 text-left text-[11px] font-semibold text-neutral-dark">
								Tier
							</th>
							<th className="px-3 py-2 text-right text-[11px] font-semibold text-neutral-dark">
								Price
							</th>
							<th className="px-3 py-2 text-right text-[11px] font-semibold text-neutral-dark">
								Capacity
							</th>
						</tr>
					</thead>
					<tbody>
						{tiers.map((tier, i) => (
							<tr
								key={tier.id}
								className={i < tiers.length - 1 ? "border-b border-neutral-100" : ""}
							>
								<td className="px-3 py-2.5 text-foreground font-medium">{tier.name}</td>
								<td className="px-3 py-2.5 text-right text-foreground">
									{tier.price === 0 ? (
										<span className="text-green-600 font-semibold">Free</span>
									) : (
										formatPrice(tier.price)
									)}
								</td>
								<td className="px-3 py-2.5 text-right text-neutral-dark">
									<span className="flex items-center justify-end gap-1">
										<Users size={10} className="text-neutral-light" />
										{tier.capacity.toLocaleString("en-IN")}
									</span>
								</td>
							</tr>
						))}
					</tbody>
					<tfoot>
						<tr className="bg-neutral-50 border-t border-neutral-100">
							<td
								colSpan={2}
								className="px-3 py-2 text-[11px] font-semibold text-neutral-dark"
							>
								Total capacity
							</td>
							<td className="px-3 py-2 text-right text-[11px] font-semibold text-foreground">
								<span className="flex items-center justify-end gap-1">
									<Users size={10} className="text-neutral-light" />
									{totalCapacity.toLocaleString("en-IN")}
								</span>
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventReviewDrawer({ open, onClose, event, onAction }: EventReviewDrawerProps) {
	const [mode, setMode] = useState<"view" | "request_edit">("view")
	const [editMessage, setEditMessage] = useState("")
	const [isLoading, setIsLoading] = useState<EventAction | null>(null)

	function handleClose() {
		setMode("view")
		setEditMessage("")
		setIsLoading(null)
		onClose()
	}

	async function handleAction(action: EventAction, message?: string) {
		if (!event) return
		setIsLoading(action)
		try {
			await onAction(event.id, action, message)
			handleClose()
		} finally {
			setIsLoading(null)
		}
	}

	const days = event ? getDays(event.submittedAt) : 0
	const canAct = event?.status === "PENDING" || event?.status === "EDIT_REQUESTED"
	const isBusy = isLoading !== null

	return (
		<Drawer
			open={open}
			onClose={handleClose}
			title={event?.title ?? ""}
			description={event ? `${event.hostName} · ${event.hostEmail}` : undefined}
			width="max-w-lg"
		>
			{event && (
				<div className="space-y-6">
					{/* Cover image */}
					{event.coverImage && (
						<div className="rounded-xl overflow-hidden border border-neutral-100">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={event.coverImage}
								alt={`Cover image for ${event.title}`}
								className="w-full h-44 object-cover"
							/>
						</div>
					)}

					{/* Status + age warning */}
					<div className="flex items-center gap-2 flex-wrap">
						<StatusBadge status={event.status} />
						{event.status === "PENDING" && days >= 7 && (
							<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
								<Clock size={10} />
								{daysAgoLabel(days)}
							</span>
						)}
					</div>

					{/* Event details */}
					<div className="space-y-4">
						<DetailRow icon={Mail} label="Host" value={`${event.hostName} · ${event.hostEmail}`} />
						<DetailRow icon={MapPin} label="City" value={event.city} />
						<DetailRow icon={Calendar} label="Event date" value={formatEventDate(event.date)} />
						<DetailRow
							icon={Clock}
							label="Submitted"
							value={`${formatDate(event.submittedAt)} · ${daysAgoLabel(days)}`}
						/>
					</div>

					{/* Ticket pricing */}
					<TicketPricingTable tiers={event.ticketTiers} />

					{/* Request edit form */}
					{mode === "request_edit" && (
						<div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
							<div className="flex items-center gap-1.5">
								<AlertCircle size={13} className="text-amber-600" />
								<p className="text-xs font-semibold text-amber-700">Request edits from host</p>
							</div>
							<div className="space-y-1.5">
								<label className="block text-xs font-medium text-foreground">
									Instructions for host
								</label>
								<textarea
									value={editMessage}
									onChange={(e) => setEditMessage(e.target.value)}
									placeholder="Please update the cover image, correct the event description, or clarify ticket tier details…"
									rows={4}
									className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors resize-none"
								/>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Footer */}
			<DrawerFooter className={canAct ? "justify-between" : "justify-end"}>
				{mode === "view" && canAct && (
					<>
						<button
							onClick={() => setMode("request_edit")}
							disabled={isBusy}
							className="rounded-lg border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors disabled:opacity-50"
						>
							Request Edit
						</button>
						<div className="flex items-center gap-2">
							<button
								onClick={() => handleAction("reject")}
								disabled={isBusy}
								className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
							>
								{isLoading === "reject" && <Loader2 size={12} className="animate-spin" />}
								Reject
							</button>
							<button
								onClick={() => handleAction("approve")}
								disabled={isBusy}
								className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors disabled:opacity-70"
							>
								{isLoading === "approve" && <Loader2 size={12} className="animate-spin" />}
								Approve
							</button>
						</div>
					</>
				)}

				{mode === "request_edit" && (
					<>
						<button
							onClick={() => { setMode("view"); setEditMessage("") }}
							disabled={isBusy}
							className="rounded-lg border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							onClick={() => handleAction("request_edit", editMessage)}
							disabled={isBusy || !editMessage.trim()}
							className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors disabled:opacity-70"
						>
							{isLoading === "request_edit" && <Loader2 size={12} className="animate-spin" />}
							Send Request
						</button>
					</>
				)}

				{!canAct && mode !== "request_edit" && (
					<button
						onClick={handleClose}
						className="rounded-lg border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors"
					>
						Close
					</button>
				)}
			</DrawerFooter>
		</Drawer>
	)
}
