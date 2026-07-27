"use client"

import { useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { useRouter } from "next/navigation"
import {
	Loader2,
	MapPin,
	Mail,
	Calendar,
	Clock,
	AlertTriangle,
	Users,
	Ticket,
	Image as ImageIcon,
	Tag,
	Globe,
	Languages,
	Info,
	ShieldAlert,
	RotateCcw,
	Star,
} from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { StatusBadge } from "@/components/ui/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getEventById } from "@/lib/api/events"
import { getDaysSince, formatDateRange } from "@/lib/formatters"
import type { Event, EventDetail, EventTicket } from "@/types"

//  Types

export type EventAction = "approve" | "reject"

export type EventReviewDrawerProps = {
	open: boolean
	onClose: () => void
	event: Event | null
	onAction: (eventId: string, action: EventAction, message?: string) => Promise<void>
}

//  Helpers

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function formatEventDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

function daysAgoLabel(days: number): string {
	if (days === 0) return "Today"
	if (days === 1) return "Yesterday"
	return `${days} days ago`
}

//  Sub-components

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

function TicketPricingTable({ tickets }: { tickets: EventTicket[] }) {
	if (tickets.length === 0) return null
	const totalCapacity = tickets.reduce((sum, t) => sum + t.totalCapacity, 0)
	const totalSold = tickets.reduce((sum, t) => sum + t.soldCount, 0)
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-1.5">
				<Ticket size={12} className="text-text-secondary" />
				<p className="text-xs font-semibold text-text-primary">Ticket Tiers</p>
			</div>
			<div className="rounded-xl border border-border-subtle overflow-hidden">
				<table className="w-full text-xs">
					<thead>
						<tr className="bg-neutral-50 border-b border-border-subtle">
							<th className="px-3 py-2 text-left text-[11px] font-semibold text-text-secondary">
								Tier
							</th>
							<th className="px-3 py-2 text-right text-[11px] font-semibold text-text-secondary">
								Price
							</th>
							<th className="px-3 py-2 text-right text-[11px] font-semibold text-text-secondary">
								Sold / Cap
							</th>
						</tr>
					</thead>
					<tbody>
						{tickets.map((ticket, i) => {
							const price = parseFloat(ticket.price)
							return (
								<tr
									key={ticket.id}
									className={i < tickets.length - 1 ? "border-b border-border-subtle" : ""}
								>
									<td className="px-3 py-2.5 text-text-primary font-medium">
										{ticket.name}
										{ticket.maxPerPerson > 1 && (
											<span className="ml-1.5 text-[10px] text-text-tertiary">
												(max {ticket.maxPerPerson}/person)
											</span>
										)}
									</td>
									<td className="px-3 py-2.5 text-right text-text-primary">
										{price === 0 ? (
											<span className="text-green-600 font-semibold">Free</span>
										) : (
											`र ${price.toLocaleString("en-IN")}`
										)}
									</td>
									<td className="px-3 py-2.5 text-right text-text-secondary">
										<span className="flex items-center justify-end gap-1">
											<Users size={10} className="text-text-tertiary" />
											{ticket.soldCount} /{" "}
											{ticket.totalCapacity.toLocaleString("en-IN")}
										</span>
									</td>
								</tr>
							)
						})}
					</tbody>
					<tfoot>
						<tr className="bg-neutral-50 border-t border-border-subtle">
							<td
								colSpan={2}
								className="px-3 py-2 text-[11px] font-semibold text-text-secondary"
							>
								Total
							</td>
							<td className="px-3 py-2 text-right text-[11px] font-semibold text-text-primary">
								<span className="flex items-center justify-end gap-1">
									<Users size={10} className="text-text-tertiary" />
									{totalSold} / {totalCapacity.toLocaleString("en-IN")}
								</span>
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	)
}

function TagList({
	items,
	colorClass = "bg-neutral-100 text-text-secondary",
}: {
	items: string[]
	colorClass?: string
}) {
	if (!items.length) return null
	return (
		<div className="flex flex-wrap gap-1.5">
			{items.map(item => (
				<span key={item} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${colorClass}`}>
					{item}
				</span>
			))}
		</div>
	)
}

//  Skeleton

function DrawerSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="flex gap-2">
				<Skeleton className="h-5 w-24 rounded-full" />
				<Skeleton className="h-5 w-16 rounded-full" />
			</div>
			<Skeleton className="h-44 w-full rounded-xl" />
			<div className="space-y-3">
				<Skeleton className="h-3 w-16" />
				<Skeleton className="h-4 w-56" />
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-4 w-48" />
			</div>
			<div className="border-t border-border-subtle" />
			<div className="space-y-3">
				<Skeleton className="h-3 w-20" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
		</div>
	)
}

//  Detail content

function RefundPolicyBadge({ type }: { type: string }) {
	if (type === "NO_REFUND") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-700 border border-red-200">
				<ShieldAlert size={10} />
				No Refund
			</span>
		)
	}
	if (type === "FULL") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-semibold text-green-700 border border-green-200">
				<RotateCcw size={10} />
				Full Refund
			</span>
		)
	}
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
			<RotateCcw size={10} />
			Partial Refund
		</span>
	)
}

function EventDetailContent({ detail }: { detail: EventDetail }) {
	const days = getDaysSince(detail.updatedAt)
	const hostFullName = `${detail.hostProfile.user.firstName} ${detail.hostProfile.user.lastName}`
	const coverImage = detail.media.find(m => m.type === "COVER")?.url
	const galleryImages = detail.media.filter(m => m.type === "GALLERY")

	return (
		<div className="space-y-6">
			{/* Status row */}
			<div className="flex items-center gap-2 flex-wrap">
				<StatusBadge status={detail.status} />
				{detail.status === "UNDER_REVIEW" && days >= 7 && (
					<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
						<Clock size={10} />
						{daysAgoLabel(days)}
					</span>
				)}
				<span className="rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-semibold text-text-secondary border border-neutral-200">
					{detail.eventType}
				</span>
				{detail.visibility && detail.visibility !== "PUBLIC" && (
					<span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-semibold text-text-secondary border border-border-subtle">
						<Globe size={10} />
						{detail.visibility}
					</span>
				)}
				{detail.isFree && (
					<span className="rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-semibold text-green-700 border border-green-200">
						Free
					</span>
				)}
				{detail.platformFeeWaived && (
					<span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
						Fee Waived
					</span>
				)}
			</div>

			{/* Cover image */}
			{coverImage && (
				<div className="rounded-xl overflow-hidden border border-border-subtle">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={coverImage}
						alt={`Cover for ${detail.title}`}
						className="w-full h-44 object-cover"
					/>
				</div>
			)}

			{/* Core details */}
			<div>
				<SectionLabel>Event Details</SectionLabel>
				<div className="space-y-3.5">
					<DetailRow
						icon={Mail}
						label="Host"
						value={
							<span>
								<span className="block">{detail.hostProfile.displayName}</span>
								<span className="text-[11px] text-text-tertiary">
									{hostFullName} · {detail.hostProfile.user.email}
								</span>
							</span>
						}
					/>
					<DetailRow
						icon={MapPin}
						label="Location"
						value={
							<span>
								{detail.venueName && <span className="block">{detail.venueName}</span>}
								{detail.fullAddress && (
									<span
										className={
											detail.venueName ? "text-[11px] text-text-tertiary" : undefined
										}
									>
										{detail.fullAddress}
									</span>
								)}
								{!detail.venueName && !detail.fullAddress && (
									<span className="text-text-tertiary">{detail.city}</span>
								)}
							</span>
						}
					/>
					<DetailRow
						icon={Calendar}
						label="Event date"
						value={
							detail.endDate
								? formatDateRange(detail.eventDate, detail.endDate)
								: formatEventDate(detail.eventDate)
						}
					/>
					{(detail.startTime || detail.endTime) && (
						<DetailRow
							icon={Clock}
							label="Time"
							value={[detail.startTime, detail.endTime].filter(Boolean).join(" - ")}
						/>
					)}
					{detail.category && (
						<DetailRow
							icon={Tag}
							label="Category"
							value={
								<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-text-primary border border-neutral-200">
									{detail.category.name}
								</span>
							}
						/>
					)}
					{detail.ageRestriction && (
						<DetailRow icon={Users} label="Age restriction" value={detail.ageRestriction} />
					)}
					{detail.languages.length > 0 && (
						<DetailRow
							icon={Languages}
							label="Languages"
							value={<TagList items={detail.languages} />}
						/>
					)}
					{detail.tags.length > 0 && (
						<DetailRow
							icon={Tag}
							label="Tags"
							value={
								<TagList
									items={detail.tags}
									colorClass="bg-neutral-100 text-text-secondary"
								/>
							}
						/>
					)}
					<DetailRow
						icon={Clock}
						label="Last updated"
						value={`${formatDate(detail.updatedAt)} · ${daysAgoLabel(days)}`}
					/>
				</div>
			</div>

			{/* Description */}
			{detail.description && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Description</SectionLabel>
						<p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
							{detail.description}
						</p>
					</div>
				</>
			)}

			{/* What to Expect / Who Should Attend */}
			{(detail.whatToExpect.length > 0 || detail.whoShouldAttend.length > 0) && (
				<>
					<div className="border-t border-border-subtle" />
					<div className="grid grid-cols-2 gap-4">
						{detail.whatToExpect.length > 0 && (
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
									What to Expect
								</p>
								<ul className="space-y-1">
									{detail.whatToExpect.map((item, i) => (
										<li
											key={i}
											className="flex items-start gap-1.5 text-xs text-text-primary"
										>
											<Star size={9} className="mt-0.5 text-text-brand shrink-0" />
											{item}
										</li>
									))}
								</ul>
							</div>
						)}
						{detail.whoShouldAttend.length > 0 && (
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
									Who Should Attend
								</p>
								<ul className="space-y-1">
									{detail.whoShouldAttend.map((item, i) => (
										<li
											key={i}
											className="flex items-start gap-1.5 text-xs text-text-primary"
										>
											<Users size={9} className="mt-0.5 text-text-tertiary shrink-0" />
											{item}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</>
			)}

			{/* Special instructions */}
			{detail.specialInstructions && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Special Instructions</SectionLabel>
						<div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3">
							<Info size={13} className="mt-0.5 text-amber-600 shrink-0" />
							<p className="text-xs text-amber-800 leading-relaxed">
								{detail.specialInstructions}
							</p>
						</div>
					</div>
				</>
			)}

			{/* Rejection remark (if any) */}
			{detail.adminRejectionRemark && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Admin Rejection Remark</SectionLabel>
						<div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3.5 py-3">
							<ShieldAlert size={13} className="mt-0.5 text-red-600 shrink-0" />
							<p className="text-xs text-red-800 leading-relaxed">
								{detail.adminRejectionRemark}
							</p>
						</div>
					</div>
				</>
			)}

			{/* Cancellation reason (if any) */}
			{detail.cancellationReason && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Cancellation Reason</SectionLabel>
						<p className="text-xs text-text-primary leading-relaxed">
							{detail.cancellationReason}
						</p>
					</div>
				</>
			)}

			{/* Gallery media */}
			{galleryImages.length > 0 && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>{`Gallery (${galleryImages.length})`}</SectionLabel>
						<div className="grid grid-cols-3 gap-2">
							{galleryImages.slice(0, 6).map(m => (
								<div
									key={m.id}
									className="rounded-lg overflow-hidden border border-border-subtle aspect-square bg-neutral-50"
								>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={m.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
								</div>
							))}
							{galleryImages.length > 6 && (
								<div className="rounded-lg border border-border-subtle aspect-square bg-neutral-50 flex items-center justify-center">
									<span className="text-xs text-text-tertiary font-medium flex items-center gap-1">
										+{galleryImages.length - 6}
										<ImageIcon size={12} />
									</span>
								</div>
							)}
						</div>
					</div>
				</>
			)}

			{/* Tickets */}
			{detail.tickets.length > 0 && (
				<>
					<div className="border-t border-border-subtle" />
					<TicketPricingTable tickets={detail.tickets} />
				</>
			)}

			{/* Refund policy */}
			{detail.refundPolicy && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Refund Policy</SectionLabel>
						<div className="flex items-center gap-3">
							<RefundPolicyBadge type={detail.refundPolicy.type} />
							{detail.refundPolicy.cutoffHours != null && (
								<span className="text-xs text-text-secondary">
									within {detail.refundPolicy.cutoffHours}h of event
								</span>
							)}
							{detail.refundPolicy.refundPercent != null && (
								<span className="text-xs text-text-secondary">
									{detail.refundPolicy.refundPercent}% refunded
								</span>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	)
}

//  Reason dialog (shared for reject / force-cancel)

export function ReasonDialog({
	open,
	title,
	description,
	placeholder,
	confirmLabel,
	confirmClassName,
	onClose,
	onConfirm,
}: {
	open: boolean
	title: string
	description: string
	placeholder: string
	confirmLabel: string
	confirmClassName: string
	onClose: () => void
	onConfirm: (reason: string) => Promise<void>
}) {
	const [reason, setReason] = useState("")
	const [isLoading, setIsLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!reason.trim()) return
		setIsLoading(true)
		try {
			await onConfirm(reason.trim())
			setReason("")
		} finally {
			setIsLoading(false)
		}
	}

	function handleClose() {
		if (isLoading) return
		setReason("")
		onClose()
	}

	return (
		<Dialog.Root open={open} onOpenChange={v => !v && handleClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-60 bg-black/40" />
				<Dialog.Content className="fixed left-1/2 top-1/2 z-60 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface-canvas p-6 shadow-xl focus:outline-none">
					<Dialog.Title className="text-sm font-semibold text-text-primary">{title}</Dialog.Title>
					<Dialog.Description className="mt-1.5 text-xs text-text-secondary leading-relaxed">
						{description}
					</Dialog.Description>
					<form onSubmit={handleSubmit} className="mt-4 space-y-4">
						<div>
							<label className="block text-[11px] font-semibold text-text-secondary mb-1.5">
								Reason{" "}
								<span className="text-red-500" aria-hidden>
									*
								</span>
							</label>
							<textarea
								value={reason}
								onChange={e => setReason(e.target.value)}
								placeholder={placeholder}
								rows={4}
								disabled={isLoading}
								autoFocus
								className="w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors resize-none disabled:opacity-50"
							/>
						</div>
						<div className="flex items-center justify-end gap-3">
							<button
								type="button"
								onClick={handleClose}
								disabled={isLoading}
								className="rounded-lg border border-border-default px-4 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isLoading || !reason.trim()}
								className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmClassName}`}
							>
								{isLoading && <Loader2 size={13} className="animate-spin" />}
								{confirmLabel}
							</button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}

//  Component

export function EventReviewDrawer({ open, onClose, event, onAction }: EventReviewDrawerProps) {
	const router = useRouter()
	const [detail, setDetail] = useState<EventDetail | null>(null)
	const [fetchState, setFetchState] = useState<"loading" | "error" | "done">("loading")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState<EventAction | null>(null)
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

	useEffect(() => {
		if (!open || !event) return
		let cancelled = false
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)

		getEventById(event.id)
			.then(data => {
				if (!cancelled) {
					setDetail(data)
					setFetchState("done")
				}
			})
			.catch((err: unknown) => {
				if (cancelled) return
				const status = (err as { response?: { status?: number } })?.response?.status
				if (status === 401) {
					router.replace("/login")
					return
				}
				setFetchState("error")
				if (status === 403) setErrorMessage("You don't have permission to view this event.")
				else if (status === 404) setErrorMessage("Event not found.")
				else setErrorMessage("Failed to load event details. Please try again.")
			})

		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, event?.id, router])

	function handleClose() {
		setActionLoading(null)
		setRejectDialogOpen(false)
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)
		onClose()
	}

	async function handleApprove() {
		if (!event) return
		setActionLoading("approve")
		try {
			await onAction(event.id, "approve")
			handleClose()
		} finally {
			setActionLoading(null)
		}
	}

	async function handleRejectConfirm(remark: string) {
		if (!event) return
		await onAction(event.id, "reject", remark)
		setRejectDialogOpen(false)
		handleClose()
	}

	const status = detail?.status ?? event?.status
	const canReview = status === "UNDER_REVIEW"
	const isBusy = actionLoading !== null

	const hostDisplay = event
		? `${event.hostProfile.displayName} · ${event.hostProfile.user.email}`
		: undefined

	return (
		<>
			<Drawer
				open={open}
				onClose={handleClose}
				title={event?.title ?? ""}
				description={hostDisplay}
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

				{fetchState === "done" && detail && <EventDetailContent detail={detail} />}

				<DrawerFooter className={canReview ? "justify-between" : "justify-end"}>
					{canReview ? (
						<>
							<button
								onClick={() => setRejectDialogOpen(true)}
								disabled={isBusy || fetchState !== "done"}
								className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
							>
								Reject
							</button>
							<button
								onClick={handleApprove}
								disabled={isBusy || fetchState !== "done"}
								className="flex items-center gap-1.5 rounded-lg bg-action-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors disabled:opacity-70"
							>
								{actionLoading === "approve" && (
									<Loader2 size={12} className="animate-spin" />
								)}
								Approve
							</button>
						</>
					) : (
						<button
							onClick={handleClose}
							className="rounded-lg border border-border-default px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors"
						>
							Close
						</button>
					)}
				</DrawerFooter>
			</Drawer>

			<ReasonDialog
				open={rejectDialogOpen}
				title="Reject Event"
				description="Provide a remark explaining why this event is rejected. The host will be notified and the event moved back to Draft so they can resubmit."
				placeholder="e.g. The event description does not meet our content guidelines. Please revise and resubmit."
				confirmLabel="Reject Event"
				confirmClassName="bg-red-600 hover:bg-red-700"
				onClose={() => setRejectDialogOpen(false)}
				onConfirm={handleRejectConfirm}
			/>
		</>
	)
}
