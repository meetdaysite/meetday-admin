"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Users, Calendar, AlertTriangle, ShieldAlert, Tag, MapPin, Link2, Globe } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { ReasonDialog } from "@/components/events/event-review-drawer"
import { getCommunityProfileById } from "@/lib/api/community-profiles"
import { formatDate } from "@/lib/formatters"
import type { CommunityProfile, CommunityProfileDetail } from "@/types"

export type CommunityProfileAction = "approve" | "reject"

export type CommunityProfileReviewDrawerProps = {
	open: boolean
	onClose: () => void
	profile: CommunityProfile | null
	onAction: (profileId: string, action: CommunityProfileAction, message?: string, isRevision?: boolean) => Promise<void>
}

function SectionLabel({ children }: { children: string }) {
	return (
		<p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">{children}</p>
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

function DrawerSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			<Skeleton className="h-32 w-32 rounded-full" />
			<div className="space-y-3">
				<Skeleton className="h-3 w-16" />
				<Skeleton className="h-4 w-56" />
				<Skeleton className="h-4 w-40" />
			</div>
		</div>
	)
}

function ChangeRow({ label, before, after }: { label: string; before: React.ReactNode; after: React.ReactNode }) {
	return (
		<div className="rounded-lg bg-blue-50/60 border border-blue-100 px-3 py-2.5">
			<p className="text-[11px] font-semibold text-blue-700 mb-1">{label}</p>
			<div className="flex items-start gap-2 text-xs">
				<span className="text-text-tertiary line-through decoration-red-300 flex-1 min-w-0 break-words">{before || "—"}</span>
				<span className="text-blue-700 shrink-0">→</span>
				<span className="text-text-primary font-medium flex-1 min-w-0 break-words">{after || "—"}</span>
			</div>
		</div>
	)
}

function ProposedChangesSection({ detail }: { detail: CommunityProfileDetail }) {
	const revision = detail.pendingRevision
	if (!revision) return null

	const textFields: { key: string; label: string }[] = [
		{ key: "name", label: "Name" },
		{ key: "about", label: "About" },
		{ key: "size", label: "Community size" },
		{ key: "avgGuestCount", label: "Avg. guest count" },
		{ key: "experiencesPerYear", label: "Experiences/year" },
	]

	const changedText = textFields.filter((f) => revision[f.key] !== undefined && revision[f.key] !== (detail as any)[f.key])
	const hasNewLogo = !!revision.logoUrl
	const hasNewSecondaryImage = !!revision.secondaryImageUrl
	const hasCategoryChange = Array.isArray((revision as any).categoryIds)

	return (
		<div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-4 space-y-3">
			<p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Proposed changes — awaiting review</p>
			<p className="text-[11px] text-text-tertiary -mt-2">
				This profile is already live. Brands still see the current (approved) version below until this edit is approved.
			</p>

			{(hasNewLogo || hasNewSecondaryImage) && (
				<div className="flex gap-3">
					{hasNewLogo && (
						<div className="flex flex-col gap-1">
							<span className="text-[10px] font-semibold text-blue-700">New logo</span>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={revision.logoUrl as string} alt="Proposed logo" className="w-16 h-16 rounded-full object-cover border border-border-subtle" />
						</div>
					)}
					{hasNewSecondaryImage && (
						<div className="flex flex-col gap-1">
							<span className="text-[10px] font-semibold text-blue-700">New poster/banner</span>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={revision.secondaryImageUrl as string} alt="Proposed poster" className="w-28 h-16 rounded-lg object-cover border border-border-subtle" />
						</div>
					)}
				</div>
			)}

			{changedText.map((f) => (
				<ChangeRow key={f.key} label={f.label} before={(detail as any)[f.key]} after={revision[f.key] as string} />
			))}

			{hasCategoryChange && (
				<p className="text-[11px] text-text-tertiary">Categories were also changed as part of this edit.</p>
			)}

			{changedText.length === 0 && !hasNewLogo && !hasNewSecondaryImage && !hasCategoryChange && (
				<p className="text-[11px] text-text-tertiary">No visible field changes detected.</p>
			)}
		</div>
	)
}

function CommunityProfileDetailContent({ detail }: { detail: CommunityProfileDetail }) {
	return (
		<div className="space-y-6">
			<ProposedChangesSection detail={detail} />

			{detail.pendingRevision && (
				<p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Current (live) version</p>
			)}

			{detail.logoUrl && (
				<div className="w-20 h-20 rounded-full overflow-hidden border border-border-subtle">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={detail.logoUrl} alt={detail.name} className="w-full h-full object-cover" />
				</div>
			)}

			{detail.secondaryImageUrl && (
				<div className="rounded-xl overflow-hidden border border-border-subtle">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={detail.secondaryImageUrl} alt={`${detail.name} poster`} className="w-full h-auto object-cover" />
				</div>
			)}

			<div>
				<SectionLabel>Community Details</SectionLabel>
				<div className="space-y-3.5">
					<DetailRow
						icon={Mail}
						label="Host"
						value={
							<span>
								<span className="block">{detail.hostProfile.displayName ?? "—"}</span>
								<span className="text-[11px] text-text-tertiary">
									{detail.hostProfile.user.firstName} {detail.hostProfile.user.lastName} · {detail.hostProfile.user.email}
								</span>
							</span>
						}
					/>
					<DetailRow icon={Users} label="Community size" value={`${detail.size} members`} />
					<DetailRow icon={Users} label="Avg. guest count" value={detail.avgGuestCount} />
					<DetailRow icon={Calendar} label="Experiences/year" value={detail.experiencesPerYear} />
					{detail.categories.length > 0 && (
						<DetailRow
							icon={Tag}
							label="Categories"
							value={
								<div className="flex flex-wrap gap-1.5 mt-1">
									{detail.categories.map(c => (
										<span key={c.id} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-text-secondary">
											{c.name}
										</span>
									))}
								</div>
							}
						/>
					)}
					{detail.hostProfile.operatingCities.length > 0 && (
						<DetailRow
							icon={MapPin}
							label="Operating cities"
							value={
								<div className="flex flex-wrap gap-1.5 mt-1">
									{detail.hostProfile.operatingCities.map(city => (
										<span key={city} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-text-secondary">
											{city}
										</span>
									))}
								</div>
							}
						/>
					)}
				</div>
			</div>

			{detail.hostProfile.socialLinks && Object.values(detail.hostProfile.socialLinks).some(Boolean) && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Social Links</SectionLabel>
						<div className="space-y-3.5">
							{detail.hostProfile.socialLinks.instagram && (
								<DetailRow icon={Link2} label="Instagram" value={detail.hostProfile.socialLinks.instagram} />
							)}
							{detail.hostProfile.socialLinks.linkedin && (
								<DetailRow icon={Link2} label="LinkedIn" value={detail.hostProfile.socialLinks.linkedin} />
							)}
							{detail.hostProfile.socialLinks.youtube && (
								<DetailRow icon={Link2} label="YouTube" value={detail.hostProfile.socialLinks.youtube} />
							)}
							{detail.hostProfile.socialLinks.website && (
								<DetailRow icon={Globe} label="Website" value={detail.hostProfile.socialLinks.website} />
							)}
						</div>
					</div>
				</>
			)}

			{detail.about && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>About</SectionLabel>
						<p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">{detail.about}</p>
					</div>
				</>
			)}

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

export function CommunityProfileReviewDrawer({ open, onClose, profile, onAction }: CommunityProfileReviewDrawerProps) {
	const router = useRouter()
	const [detail, setDetail] = useState<CommunityProfileDetail | null>(null)
	const [fetchState, setFetchState] = useState<"loading" | "error" | "done">("loading")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState<CommunityProfileAction | null>(null)
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

	useEffect(() => {
		if (!open || !profile) return
		let cancelled = false
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)

		getCommunityProfileById(profile.id)
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
				if (status === 403) setErrorMessage("You don't have permission to view this community profile.")
				else if (status === 404) setErrorMessage("Community profile not found.")
				else setErrorMessage("Failed to load community profile details. Please try again.")
			})

		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, profile?.id, router])

	function handleClose() {
		setActionLoading(null)
		setRejectDialogOpen(false)
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)
		onClose()
	}

	async function handleApprove() {
		if (!profile) return
		setActionLoading("approve")
		try {
			await onAction(profile.id, "approve", undefined, isRevisionReview)
			handleClose()
		} finally {
			setActionLoading(null)
		}
	}

	async function handleRejectConfirm(remark: string) {
		if (!profile) return
		await onAction(profile.id, "reject", remark, isRevisionReview)
		setRejectDialogOpen(false)
		handleClose()
	}

	const isRevisionReview = !!detail?.pendingRevision
	const status = detail?.approvalStatus ?? profile?.approvalStatus
	const canReview = isRevisionReview || status === "PENDING"
	const isBusy = actionLoading !== null

	const hostDisplay = profile
		? `${profile.hostProfile.displayName ?? "—"} · ${profile.hostProfile.user.email ?? ""}`
		: undefined

	return (
		<>
			<Drawer open={open} onClose={handleClose} title={profile?.name ?? "Community Profile"} description={hostDisplay} width="max-w-lg">
				{fetchState === "loading" && <DrawerSkeleton />}

				{fetchState === "error" && (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<AlertTriangle size={28} className="mb-3 text-neutral-300" />
						<p className="text-sm font-medium text-text-primary">Something went wrong</p>
						<p className="mt-1 text-xs text-text-tertiary max-w-xs">{errorMessage}</p>
					</div>
				)}

				{fetchState === "done" && detail && <CommunityProfileDetailContent detail={detail} />}

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
								{isRevisionReview ? "Approve Changes" : "Approve"}
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
				title={isRevisionReview ? "Reject Changes" : "Reject Community Profile"}
				description={
					isRevisionReview
						? "Provide a remark explaining why this edit is rejected. The profile stays live as-is; the host will be notified and can revise and resubmit."
						: "Provide a remark explaining why this community profile is rejected. The host will be notified and can edit and resubmit."
				}
				placeholder="e.g. The community size and guest count seem inconsistent. Please clarify and resubmit."
				confirmLabel={isRevisionReview ? "Reject Changes" : "Reject Profile"}
				confirmClassName="bg-red-600 hover:bg-red-700"
				onClose={() => setRejectDialogOpen(false)}
				onConfirm={handleRejectConfirm}
			/>
		</>
	)
}
