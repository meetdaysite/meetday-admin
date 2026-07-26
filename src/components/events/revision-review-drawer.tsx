"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertTriangle } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { ReasonDialog } from "@/components/events/event-review-drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { getRevisionForReview } from "@/lib/api/events"
import type { RevisionCurrent, RevisionListItem, RevisionProposed, RevisionReviewDetail } from "@/types"

//  Types

export type RevisionAction = "approve" | "reject"

export type RevisionReviewDrawerProps = {
	open: boolean
	onClose: () => void
	revision: RevisionListItem | null
	onAction: (eventId: string, action: RevisionAction, message?: string) => Promise<void>
}

//  Field metadata

const FIELD_LABELS: Record<string, string> = {
	categoryId: "Category",
	title: "Title",
	description: "Description",
	eventType: "Event Type",
	languages: "Languages",
	tags: "Tags",
	whatToExpect: "What to Expect",
	whoShouldAttend: "Who Should Attend",
	specialInstructions: "Special Instructions",
	venueName: "Venue Name",
	fullAddress: "Full Address",
	city: "City",
	latitude: "Latitude",
	longitude: "Longitude",
	media: "Media",
}

const ARRAY_FIELDS = new Set(["languages", "tags", "whatToExpect", "whoShouldAttend"])

function formatCoord(v: string | number): string {
	return Number(v).toFixed(6)
}

//  Skeleton

function DrawerSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			<Skeleton className="h-14 w-full rounded-xl" />
			{Array.from({ length: 3 }).map((_, i) => (
				<div key={i} className="space-y-3">
					<Skeleton className="h-3 w-24" />
					<div className="grid grid-cols-2 gap-4">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
					</div>
				</div>
			))}
		</div>
	)
}

//  Diff rendering

function ChipList({ items }: { items: string[] }) {
	if (!items.length) return <span className="text-xs text-text-tertiary">—</span>
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

function MediaGrid({ media }: { media: { url: string }[] }) {
	if (!media.length) return <span className="text-xs text-text-tertiary">—</span>
	return (
		<div className="grid grid-cols-3 gap-2">
			{media.map((m, i) => (
				<div
					key={i}
					className="rounded-lg overflow-hidden border border-border-subtle aspect-square bg-neutral-50"
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={m.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
				</div>
			))}
		</div>
	)
}

function DiffValue({ fieldKey, value }: { fieldKey: string; value: unknown }) {
	if (value == null) return <span className="text-xs text-text-tertiary">—</span>
	if (fieldKey === "media") return <MediaGrid media={value as { url: string }[]} />
	if (ARRAY_FIELDS.has(fieldKey)) return <ChipList items={value as string[]} />
	if (fieldKey === "latitude" || fieldKey === "longitude") {
		return <span className="text-xs text-text-primary">{formatCoord(value as string | number)}</span>
	}
	return <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">{String(value)}</p>
}

function DiffField({
	fieldKey,
	current,
	proposed,
}: {
	fieldKey: string
	current: unknown
	proposed: unknown
}) {
	return (
		<div>
			<p className="text-xs font-semibold text-text-primary mb-3">{FIELD_LABELS[fieldKey] ?? fieldKey}</p>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
						Current (live)
					</p>
					<DiffValue fieldKey={fieldKey} value={current} />
				</div>
				<div>
					<p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
						Proposed
					</p>
					<DiffValue fieldKey={fieldKey} value={proposed} />
				</div>
			</div>
		</div>
	)
}

function RevisionDiffContent({ detail }: { detail: RevisionReviewDetail }) {
	// `proposed` holds exactly the fields in the pending revision — the diff is
	// driven by its keys. `current` carries the live value for the same keys
	// (plus media, which is only diffed when the revision itself touches it).
	const diffKeys = Object.keys(detail.proposed) as (keyof RevisionProposed & keyof RevisionCurrent)[]

	return (
		<div className="space-y-6">
			{detail.touchesVenue && (
				<div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3">
					<p className="text-xs text-amber-800 leading-relaxed">
						This revision changes the venue. Approving it notifies confirmed attendees — a different
						city or a move over 1km also sends an email.
					</p>
				</div>
			)}

			{diffKeys.map((key, i) => (
				<div key={key}>
					{i > 0 && <div className="border-t border-border-subtle mb-6" />}
					<DiffField fieldKey={key} current={detail.current[key]} proposed={detail.proposed[key]} />
				</div>
			))}
		</div>
	)
}

//  Component

export function RevisionReviewDrawer({ open, onClose, revision, onAction }: RevisionReviewDrawerProps) {
	const router = useRouter()
	const [detail, setDetail] = useState<RevisionReviewDetail | null>(null)
	const [fetchState, setFetchState] = useState<"loading" | "error" | "done">("loading")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState<RevisionAction | null>(null)
	const [approveDialogOpen, setApproveDialogOpen] = useState(false)
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

	useEffect(() => {
		if (!open || !revision) return
		let cancelled = false
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)

		getRevisionForReview(revision.eventId)
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
				if (status === 403) setErrorMessage("You don't have permission to view this revision.")
				else if (status === 404) setErrorMessage("No pending revision found for this event.")
				else setErrorMessage("Failed to load revision details. Please try again.")
			})

		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, revision?.eventId, router])

	function handleClose() {
		setActionLoading(null)
		setApproveDialogOpen(false)
		setRejectDialogOpen(false)
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)
		onClose()
	}

	async function handleApproveConfirm() {
		if (!revision) return
		setActionLoading("approve")
		try {
			await onAction(revision.eventId, "approve")
			handleClose()
		} finally {
			setActionLoading(null)
			setApproveDialogOpen(false)
		}
	}

	async function handleRejectConfirm(remark: string) {
		if (!revision) return
		await onAction(revision.eventId, "reject", remark)
		setRejectDialogOpen(false)
		handleClose()
	}

	const isBusy = actionLoading !== null
	const hostDisplay = revision
		? `${revision.event.hostProfile.displayName} · ${revision.event.hostProfile.user.email}`
		: undefined

	return (
		<>
			<Drawer
				open={open}
				onClose={handleClose}
				title={revision?.event.title ?? ""}
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

				{fetchState === "done" && detail && <RevisionDiffContent detail={detail} />}

				<DrawerFooter className="justify-between">
					<button
						onClick={() => setRejectDialogOpen(true)}
						disabled={isBusy || fetchState !== "done"}
						className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
					>
						Reject
					</button>
					<button
						onClick={() => setApproveDialogOpen(true)}
						disabled={isBusy || fetchState !== "done"}
						className="flex items-center gap-1.5 rounded-lg bg-action-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors disabled:opacity-70"
					>
						{actionLoading === "approve" && <Loader2 size={12} className="animate-spin" />}
						Approve
					</button>
				</DrawerFooter>
			</Drawer>

			<ConfirmDialog
				open={approveDialogOpen}
				onClose={() => setApproveDialogOpen(false)}
				onConfirm={handleApproveConfirm}
				title="Approve revision"
				description={
					detail?.touchesVenue
						? "This merges the proposed changes into the live event and notifies confirmed attendees of the venue change."
						: "This merges the proposed changes into the live event."
				}
				confirmLabel="Approve"
				isLoading={actionLoading === "approve"}
			/>

			<ReasonDialog
				open={rejectDialogOpen}
				title="Reject Revision"
				description="Provide a remark explaining why this revision is rejected. The host will be notified and the live event stays unchanged."
				placeholder="e.g. The proposed cover image is low-resolution. Please upload a sharper one."
				confirmLabel="Reject Revision"
				confirmClassName="bg-red-600 hover:bg-red-700"
				onClose={() => setRejectDialogOpen(false)}
				onConfirm={handleRejectConfirm}
			/>
		</>
	)
}
