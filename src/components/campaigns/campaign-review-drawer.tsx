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
	Tag,
	ShieldAlert,
	Building,
} from "lucide-react"
import { toast } from "sonner"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { StatusBadge } from "@/components/ui/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ReasonDialog } from "@/components/events/event-review-drawer"
import { getCampaignById } from "@/lib/api/campaigns"
import { formatDate } from "@/lib/formatters"
import type { Campaign } from "@/types"

export type CampaignAction = "approve" | "reject"

export type CampaignReviewDrawerProps = {
	open: boolean
	onClose: () => void
	campaign: Campaign | null
	onAction: (campaignId: string, action: CampaignAction, message?: string) => Promise<void>
}

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
		</div>
	)
}

function CampaignDetailContent({
	detail,
}: {
	detail: Campaign
}) {
	return (
		<div className="space-y-6">
			{/* Status row */}
			<div className="flex items-center gap-2 flex-wrap">
				<StatusBadge status={detail.status} />
			</div>

			{/* Core details */}
			<div>
				<SectionLabel>Campaign Details</SectionLabel>
				<div className="space-y-3.5">
					<DetailRow
						icon={Building}
						label="Brand"
						value={
							<span>
								<span className="block font-semibold">{detail.brandProfile.brandName}</span>
								<span className="text-[11px] text-text-tertiary">
									{detail.brandProfile.user.firstName} {detail.brandProfile.user.lastName} ·{" "}
									{detail.brandProfile.user.email}
								</span>
							</span>
						}
					/>
					<DetailRow
						icon={MapPin}
						label="Target Locations"
						value={
							<div className="flex flex-wrap gap-1 mt-1">
								{detail.locations.map((loc, idx) => (
									<span key={idx} className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-text-secondary">
										{loc}
									</span>
								))}
							</div>
						}
					/>
					{detail.startDate && (
						<DetailRow
							icon={Calendar}
							label="Run Dates"
							value={
								<span>
									{formatDate(detail.startDate)} - {formatDate(detail.endDate)}
								</span>
							}
						/>
					)}
					<DetailRow
						icon={Tag}
						label="Campaign Goal"
						value={<span className="text-sm font-semibold">{detail.goal}</span>}
					/>
					{detail.audience.length > 0 && (
						<DetailRow icon={Users} label="Target Audience" value={<TagList items={detail.audience} />} />
					)}
					<DetailRow
						icon={Tag}
						label="Offer & Budget"
						value={
							<span className="text-sm font-semibold text-red-600">
								{detail.budgetCurrency} {Number(detail.budgetAmount).toLocaleString()} ({detail.offerType})
							</span>
						}
					/>
					{detail.barterElements && (
						<DetailRow
							icon={Tag}
							label="Barter Details"
							value={<p className="text-xs text-text-secondary whitespace-pre-wrap">{detail.barterElements}</p>}
						/>
					)}
				</div>
			</div>

			{/* Description */}
			{detail.description && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Tell us more</SectionLabel>
						<p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">{detail.description}</p>
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

export function CampaignReviewDrawer({ open, onClose, campaign, onAction }: CampaignReviewDrawerProps) {
	const router = useRouter()
	const [detail, setDetail] = useState<Campaign | null>(null)
	const [fetchState, setFetchState] = useState<"loading" | "error" | "done">("loading")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState<CampaignAction | null>(null)
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

	useEffect(() => {
		if (!open || !campaign) return
		let cancelled = false
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)

		getCampaignById(campaign.id)
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
				if (status === 403) setErrorMessage("You don't have permission to view this campaign.")
				else if (status === 404) setErrorMessage("Campaign not found.")
				else setErrorMessage("Failed to load campaign details. Please try again.")
			})

		return () => {
			cancelled = true
		}
	}, [open, campaign?.id, router])

	function handleClose() {
		setActionLoading(null)
		setRejectDialogOpen(false)
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)
		onClose()
	}

	async function handleApprove() {
		if (!campaign) return
		setActionLoading("approve")
		try {
			await onAction(campaign.id, "approve")
			handleClose()
		} finally {
			setActionLoading(null)
		}
	}

	async function handleRejectConfirm(remark: string) {
		if (!campaign) return
		await onAction(campaign.id, "reject", remark)
		setRejectDialogOpen(false)
		handleClose()
	}

	const status = detail?.status ?? campaign?.status
	const canReview = status === "UNDER_REVIEW"
	const isBusy = actionLoading !== null

	const brandDisplay = campaign
		? `${campaign.brandProfile.brandName} · ${campaign.brandProfile.user.email}`
		: undefined

	return (
		<>
			<Drawer
				open={open}
				onClose={handleClose}
				title={campaign?.name ?? "Campaign Brief"}
				description={brandDisplay}
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

				{fetchState === "done" && detail && <CampaignDetailContent detail={detail} />}

				<DrawerFooter className="justify-between">
					<div className="flex items-center gap-2">
						{!canReview && (
							<button
								onClick={handleClose}
								className="rounded-lg border border-border-default px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors"
							>
								Close
							</button>
						)}
					</div>
					{canReview && (
						<div className="flex items-center gap-2">
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
						</div>
					)}
				</DrawerFooter>
			</Drawer>

			<ReasonDialog
				open={rejectDialogOpen}
				title="Reject Campaign Brief"
				description="Provide a remark explaining why this campaign brief is rejected. The brand will be notified and can edit and resubmit."
				placeholder="e.g. Please target specific cities instead of general regions, or clarify barter elements. Please revise and resubmit."
				confirmLabel="Reject Campaign"
				confirmClassName="bg-red-600 hover:bg-red-700"
				onClose={() => setRejectDialogOpen(false)}
				onConfirm={handleRejectConfirm}
			/>
		</>
	)
}
