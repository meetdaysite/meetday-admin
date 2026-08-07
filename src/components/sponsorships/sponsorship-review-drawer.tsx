"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
	Loader2,
	MapPin,
	Mail,
	Calendar,
	AlertTriangle,
	Users,
	Ticket,
	Tag,
	FileText,
	ShieldAlert,
} from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { StatusBadge } from "@/components/ui/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ReasonDialog } from "@/components/events/event-review-drawer"
import { getSponsorshipById } from "@/lib/api/sponsorships"
import { formatDate } from "@/lib/formatters"
import type { SponsorshipDetail, SponsorshipProposal } from "@/types"

// ─── Types ──────────────────────────────────────────────────────────────────

export type SponsorshipAction = "approve" | "reject"

export type SponsorshipReviewDrawerProps = {
	open: boolean
	onClose: () => void
	proposal: SponsorshipProposal | null
	onAction: (proposalId: string, action: SponsorshipAction, message?: string) => Promise<void>
}

// ─── Sub-components ─────────────────────────────────────────────────────────

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

function TagList({ items }: { items: string[] }) {
	if (!items.length) return null
	return (
		<div className="flex flex-wrap gap-1.5">
			{items.map(item => (
				<span
					key={item}
					className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-text-secondary"
				>
					{item}
				</span>
			))}
		</div>
	)
}

function SponsorTiersTable({ tiers }: { tiers: SponsorshipDetail["sponsorTiers"] }) {
	if (!tiers.length) return null
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-1.5">
				<Ticket size={12} className="text-text-secondary" />
				<p className="text-xs font-semibold text-text-primary">Sponsor Tiers</p>
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
						</tr>
					</thead>
					<tbody>
						{tiers.map((tier, i) => (
							<tr key={`${tier.name}-${i}`} className={i < tiers.length - 1 ? "border-b border-border-subtle" : ""}>
								<td className="px-3 py-2.5 text-text-primary font-medium">{tier.name}</td>
								<td className="px-3 py-2.5 text-right text-text-primary">{tier.price}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

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
		</div>
	)
}

function SponsorshipDetailContent({ detail }: { detail: SponsorshipDetail }) {
	return (
		<div className="space-y-6">
			{/* Status row */}
			<div className="flex items-center gap-2 flex-wrap">
				<StatusBadge status={detail.status} />
				{detail.pendingRevision && (
					<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
						Edit pending review
					</span>
				)}
			</div>

			{/* Cover image */}
			{detail.imageUrl && (
				<div className="rounded-xl overflow-hidden border border-border-subtle">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={detail.imageUrl}
						alt={`Cover for ${detail.name ?? "proposal"}`}
						className="w-full h-44 object-cover"
					/>
				</div>
			)}

			{/* Core details */}
			<div>
				<SectionLabel>Proposal Details</SectionLabel>
				<div className="space-y-3.5">
					<DetailRow
						icon={Mail}
						label="Host"
						value={
							<span>
								<span className="block">{detail.hostProfile.displayName}</span>
								<span className="text-[11px] text-text-tertiary">
									{detail.hostProfile.user.firstName} {detail.hostProfile.user.lastName} ·{" "}
									{detail.hostProfile.user.email}
								</span>
							</span>
						}
					/>
					<DetailRow
						icon={MapPin}
						label="Location"
						value={
							<span>
								{detail.venue && <span className="block">{detail.venue}</span>}
								<span className={detail.venue ? "text-[11px] text-text-tertiary" : undefined}>
									{detail.city}
								</span>
							</span>
						}
					/>
					{detail.eventDate && (
						<DetailRow icon={Calendar} label="Event date" value={formatDate(detail.eventDate)} />
					)}
					{detail.ageGroup && <DetailRow icon={Users} label="Age group" value={detail.ageGroup} />}
					{detail.guestCount && <DetailRow icon={Users} label="Guest count" value={detail.guestCount} />}
					{detail.audienceProfile.length > 0 && (
						<DetailRow icon={Tag} label="Audience profile" value={<TagList items={detail.audienceProfile} />} />
					)}
				</div>
			</div>

			{/* About */}
			{detail.about && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>About</SectionLabel>
						<p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">{detail.about}</p>
					</div>
				</>
			)}

			{/* Sponsor tiers */}
			{detail.sponsorTiers.length > 0 && (
				<>
					<div className="border-t border-border-subtle" />
					<SponsorTiersTable tiers={detail.sponsorTiers} />
				</>
			)}

			{/* Pitch document */}
			{detail.docUrl && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Pitch Document</SectionLabel>
						<a
							href={detail.docUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 rounded-xl border border-border-subtle px-3.5 py-3 text-xs text-text-brand hover:bg-neutral-50 transition-colors"
						>
							<FileText size={14} />
							{detail.docName ?? "View document"}
						</a>
					</div>
				</>
			)}

			{/* Rejection remark */}
			{detail.adminRejectionRemark && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Admin Rejection Remark</SectionLabel>
						<div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3.5 py-3">
							<ShieldAlert size={13} className="mt-0.5 text-red-600 shrink-0" />
							<p className="text-xs text-red-800 leading-relaxed">{detail.adminRejectionRemark}</p>
						</div>
					</div>
				</>
			)}
		</div>
	)
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SponsorshipReviewDrawer({ open, onClose, proposal, onAction }: SponsorshipReviewDrawerProps) {
	const router = useRouter()
	const [detail, setDetail] = useState<SponsorshipDetail | null>(null)
	const [fetchState, setFetchState] = useState<"loading" | "error" | "done">("loading")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState<SponsorshipAction | null>(null)
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

	useEffect(() => {
		if (!open || !proposal) return
		let cancelled = false
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)

		getSponsorshipById(proposal.id)
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
				if (status === 403) setErrorMessage("You don't have permission to view this proposal.")
				else if (status === 404) setErrorMessage("Sponsorship proposal not found.")
				else setErrorMessage("Failed to load proposal details. Please try again.")
			})

		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, proposal?.id, router])

	function handleClose() {
		setActionLoading(null)
		setRejectDialogOpen(false)
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)
		onClose()
	}

	async function handleApprove() {
		if (!proposal) return
		setActionLoading("approve")
		try {
			await onAction(proposal.id, "approve")
			handleClose()
		} finally {
			setActionLoading(null)
		}
	}

	async function handleRejectConfirm(remark: string) {
		if (!proposal) return
		await onAction(proposal.id, "reject", remark)
		setRejectDialogOpen(false)
		handleClose()
	}

	const status = detail?.status ?? proposal?.status
	const canReview = status === "UNDER_REVIEW"
	const isBusy = actionLoading !== null

	const hostDisplay = proposal
		? `${proposal.hostProfile.displayName} · ${proposal.hostProfile.user.email}`
		: undefined

	return (
		<>
			<Drawer
				open={open}
				onClose={handleClose}
				title={proposal?.name ?? "Sponsorship Proposal"}
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

				{fetchState === "done" && detail && <SponsorshipDetailContent detail={detail} />}

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
								{actionLoading === "approve" && <Loader2 size={12} className="animate-spin" />}
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
				title="Reject Sponsorship Proposal"
				description="Provide a remark explaining why this proposal is rejected. The host will be notified and can edit and resubmit."
				placeholder="e.g. The pitch document is missing key pricing details. Please revise and resubmit."
				confirmLabel="Reject Proposal"
				confirmClassName="bg-red-600 hover:bg-red-700"
				onClose={() => setRejectDialogOpen(false)}
				onConfirm={handleRejectConfirm}
			/>
		</>
	)
}
