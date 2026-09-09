"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Users, Calendar, AlertTriangle, ShieldAlert, Tag, MapPin, Link2, Globe, Building2, Video } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { ReasonDialog } from "@/components/events/event-review-drawer"
import { getSpaceCommunityProfileById } from "@/lib/api/space-community-profiles"
import type { SpaceCommunityProfile, SpaceCommunityProfileDetail } from "@/types"

export type SpaceCommunityProfileAction = "approve" | "reject"

export type SpaceCommunityProfileReviewDrawerProps = {
	open: boolean
	onClose: () => void
	profile: SpaceCommunityProfile | null
	onAction: (profileId: string, action: SpaceCommunityProfileAction, message?: string, isRevision?: boolean) => Promise<void>
	// Opens the full edit form for this profile, pre-filled with every field — available
	// regardless of approvalStatus or who created it.
	onEdit?: (detail: SpaceCommunityProfileDetail) => void
	// Toggles brand/community-visibility — available regardless of approvalStatus.
	onToggleVisibility?: (profileId: string, isHidden: boolean) => Promise<void>
}

function formatExternalUrl(url?: string | null) {
	if (!url) return null
	const trimmed = url.trim()
	if (!trimmed) return null
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function SectionLabel({ children }: { children: string }) {
	return <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">{children}</p>
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
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

function ProposedChangesSection({ detail }: { detail: SpaceCommunityProfileDetail }) {
	const revision = detail.pendingRevision
	if (!revision) return null

	const textFields: { key: string; label: string }[] = [
		{ key: "name", label: "Name" },
		{ key: "about", label: "About" },
		{ key: "numberOfVenues", label: "Number of venues" },
		{ key: "venueCapacity", label: "Venue capacity" },
		{ key: "communitySize", label: "Community size" },
		{ key: "experiencesPerYear", label: "Experiences/year" },
		{ key: "videoLink", label: "Video link" },
	]

	const changedText = textFields.filter((f) => revision[f.key] !== undefined && revision[f.key] !== (detail as unknown as Record<string, unknown>)[f.key])

	const hasNewLogo = !!revision.logoUrl && (revision.logoKey as string | undefined) !== detail.logoKey
	const hasNewPoster = !!revision.posterUrl && (revision.posterKey as string | undefined) !== (detail.posterKey ?? undefined)

	const revisionCategoryIds = revision.categoryIds as string[] | undefined
	const currentCategoryIds = detail.categories.map((c) => c.id)
	const hasCategoryChange =
		Array.isArray(revisionCategoryIds) &&
		JSON.stringify([...revisionCategoryIds].sort()) !== JSON.stringify([...currentCategoryIds].sort())

	return (
		<div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-4 space-y-3">
			<p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Proposed changes — awaiting review</p>
			<p className="text-[11px] text-text-tertiary -mt-2">
				This profile is already live. Brands/communities still see the current (approved) version below until this edit is approved.
			</p>

			{(hasNewLogo || hasNewPoster) && (
				<div className="flex gap-3">
					{hasNewLogo && (
						<div className="flex flex-col gap-1">
							<span className="text-[10px] font-semibold text-blue-700">New logo</span>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={revision.logoUrl as string} alt="Proposed logo" className="w-16 h-16 rounded-full object-cover border border-border-subtle" />
						</div>
					)}
					{hasNewPoster && (
						<div className="flex flex-col gap-1">
							<span className="text-[10px] font-semibold text-blue-700">New poster</span>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={revision.posterUrl as string} alt="Proposed poster" className="w-28 h-16 rounded-lg object-cover border border-border-subtle" />
						</div>
					)}
				</div>
			)}

			{changedText.map((f) => (
				<ChangeRow key={f.key} label={f.label} before={(detail as unknown as Record<string, unknown>)[f.key] as React.ReactNode} after={revision[f.key] as string} />
			))}

			{hasCategoryChange && <p className="text-[11px] text-text-tertiary">Categories were also changed as part of this edit.</p>}

			{changedText.length === 0 && !hasNewLogo && !hasNewPoster && !hasCategoryChange && (
				<p className="text-[11px] text-text-tertiary">No visible field changes detected.</p>
			)}
		</div>
	)
}

function SpaceCommunityProfileDetailContent({ detail }: { detail: SpaceCommunityProfileDetail }) {
	return (
		<div className="space-y-6">
			<ProposedChangesSection detail={detail} />

			{detail.pendingRevision && (
				<p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Current (live) version</p>
			)}

			{detail.isHidden && (
				<div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
					<p className="text-xs font-semibold text-amber-800">
						Hidden from brands/communities — not discoverable in browse/search. The partner&apos;s own access is unaffected.
					</p>
				</div>
			)}

			{detail.logoUrl && (
				<div className="w-20 h-20 rounded-full overflow-hidden border border-border-subtle">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={detail.logoUrl} alt={detail.name} className="w-full h-full object-cover" />
				</div>
			)}

			{detail.posterUrl && (
				<div className="rounded-xl overflow-hidden border border-border-subtle">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={detail.posterUrl} alt={`${detail.name} poster`} className="w-full h-auto object-cover" />
				</div>
			)}

			<div>
				<SectionLabel>Space Details</SectionLabel>
				<div className="space-y-3.5">
					<DetailRow
						icon={Mail}
						label="Space partner"
						value={
							<span>
								<span className="block">{detail.spaceProfile.businessName}</span>
								<span className="text-[11px] text-text-tertiary">
									{detail.spaceProfile.user.firstName} {detail.spaceProfile.user.lastName} · {detail.spaceProfile.user.email}
								</span>
							</span>
						}
					/>
					<DetailRow icon={Building2} label="Venues / event spaces" value={detail.numberOfVenues} />
					<DetailRow icon={Users} label="Venue capacity" value={detail.venueCapacity} />
					<DetailRow icon={Users} label="Community size" value={detail.communitySize} />
					<DetailRow icon={Calendar} label="Experiences/year" value={detail.experiencesPerYear} />
					{detail.videoLink && <DetailRow icon={Video} label="Video" value={detail.videoLink} />}
					{detail.categories.length > 0 && (
						<DetailRow
							icon={Tag}
							label="Categories"
							value={
								<div className="flex flex-wrap gap-1.5 mt-1">
									{detail.categories.map((c) => (
										<span key={c.id} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-text-secondary">
											{c.name}
										</span>
									))}
								</div>
							}
						/>
					)}
					{detail.activeLocations.length > 0 && (
						<DetailRow
							icon={MapPin}
							label="Active locations"
							value={
								<div className="flex flex-wrap gap-1.5 mt-1">
									{detail.activeLocations.map((loc) => (
										<span key={loc} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-text-secondary">
											{loc}
										</span>
									))}
								</div>
							}
						/>
					)}
				</div>
			</div>

			{detail.spaceProfile.socialLinks && Object.values(detail.spaceProfile.socialLinks).some(Boolean) && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Social Links</SectionLabel>
						<div className="space-y-3.5">
							{detail.spaceProfile.socialLinks.instagram && (
								<DetailRow icon={Link2} label="Instagram" value={detail.spaceProfile.socialLinks.instagram} />
							)}
							{detail.spaceProfile.socialLinks.linkedin && (
								<DetailRow icon={Link2} label="LinkedIn" value={detail.spaceProfile.socialLinks.linkedin} />
							)}
							{detail.spaceProfile.socialLinks.youtube && (
								<DetailRow icon={Link2} label="YouTube" value={detail.spaceProfile.socialLinks.youtube} />
							)}
							{detail.spaceProfile.socialLinks.website && (
								<DetailRow icon={Globe} label="Website" value={detail.spaceProfile.socialLinks.website} />
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

			{detail.centreShowcaseUrls.length > 0 && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Centre Showcase</SectionLabel>
						<div className="flex flex-wrap gap-2">
							{detail.centreShowcaseUrls.map((url, i) => (
								// eslint-disable-next-line @next/next/no-img-element
								<img key={i} src={url} alt={`${detail.name} showcase ${i + 1}`} className="size-20 rounded-md object-cover border border-border-subtle" />
							))}
						</div>
					</div>
				</>
			)}

			{detail.brandsWorkedWith && detail.brandsWorkedWith.length > 0 && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Associated Brands</SectionLabel>
						<div className="flex flex-wrap gap-2.5">
							{detail.brandsWorkedWith.map((brand, i) => {
								const href = formatExternalUrl(brand.url)
								const content = (
									<div className="group relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-50 border border-border-subtle hover:border-text-primary transition-all duration-200 cursor-pointer">
										{brand.logoUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={brand.logoUrl} alt={brand.brandName || "Brand logo"} className="size-6 rounded-md object-cover border border-border-subtle shrink-0" />
										) : (
											<span className="size-6 rounded-md bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-700 shrink-0">
												{(brand.brandName || "B").charAt(0).toUpperCase()}
											</span>
										)}
										<span className="text-xs font-semibold text-text-primary">{brand.brandName || (href ? brand.url : "Unnamed Brand")}</span>
									</div>
								)
								return href ? (
									<a key={i} href={href} target="_blank" rel="noopener noreferrer">
										{content}
									</a>
								) : (
									<div key={i}>{content}</div>
								)
							})}
						</div>
					</div>
				</>
			)}

			{detail.pastEvents && detail.pastEvents.length > 0 && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Past Events</SectionLabel>
						<div className="space-y-3">
							{detail.pastEvents.map((event, i) => (
								<div key={i} className="rounded-lg bg-neutral-50 border border-border-subtle p-3 space-y-1.5">
									{event.name && <p className="text-xs font-semibold text-text-primary">{event.name}</p>}
									{event.description && <p className="text-xs text-text-secondary whitespace-pre-wrap">{event.description}</p>}
									{event.imageUrls.length > 0 && (
										<div className="flex gap-2 pt-1">
											{event.imageUrls.map((url, j) => (
												// eslint-disable-next-line @next/next/no-img-element
												<img key={j} src={url} alt={event.name || "Past event"} className="size-16 rounded-md object-cover border border-border-subtle" />
											))}
										</div>
									)}
								</div>
							))}
						</div>
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

export function SpaceCommunityProfileReviewDrawer({ open, onClose, profile, onAction, onEdit, onToggleVisibility }: SpaceCommunityProfileReviewDrawerProps) {
	const router = useRouter()
	const [detail, setDetail] = useState<SpaceCommunityProfileDetail | null>(null)
	const [fetchState, setFetchState] = useState<"loading" | "error" | "done">("loading")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState<SpaceCommunityProfileAction | null>(null)
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
	const [visibilityLoading, setVisibilityLoading] = useState(false)

	useEffect(() => {
		if (!open || !profile) return
		let cancelled = false
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)

		getSpaceCommunityProfileById(profile.id)
			.then((data) => {
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
				if (status === 403) setErrorMessage("You don't have permission to view this community space profile.")
				else if (status === 404) setErrorMessage("Community space profile not found.")
				else setErrorMessage("Failed to load community space profile details. Please try again.")
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

	function handleEdit() {
		if (!detail) return
		onEdit?.(detail)
		handleClose()
	}

	async function handleToggleVisibility() {
		if (!detail || !onToggleVisibility) return
		setVisibilityLoading(true)
		try {
			await onToggleVisibility(detail.id, !detail.isHidden)
			setDetail({ ...detail, isHidden: !detail.isHidden })
		} finally {
			setVisibilityLoading(false)
		}
	}

	const isRevisionReview = !!detail?.pendingRevision
	const status = detail?.approvalStatus ?? profile?.approvalStatus
	const canReview = isRevisionReview || status === "PENDING"
	const isBusy = actionLoading !== null

	const partnerDisplay = profile ? `${profile.spaceProfile.businessName} · ${profile.spaceProfile.user.email ?? ""}` : undefined

	return (
		<>
			<Drawer open={open} onClose={handleClose} title={profile?.name ?? "Community Space Profile"} description={partnerDisplay} width="max-w-lg">
				{fetchState === "loading" && <DrawerSkeleton />}

				{fetchState === "error" && (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<AlertTriangle size={28} className="mb-3 text-neutral-300" />
						<p className="text-sm font-medium text-text-primary">Something went wrong</p>
						<p className="mt-1 text-xs text-text-tertiary max-w-xs">{errorMessage}</p>
					</div>
				)}

				{fetchState === "done" && detail && <SpaceCommunityProfileDetailContent detail={detail} />}

				<DrawerFooter className="justify-between">
					<div className="flex items-center gap-2">
						{onEdit && (
							<button
								onClick={handleEdit}
								disabled={isBusy || fetchState !== "done"}
								className="rounded-lg border border-border-default px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors disabled:opacity-50"
							>
								Edit
							</button>
						)}
						{onToggleVisibility && detail && (
							<button
								onClick={handleToggleVisibility}
								disabled={visibilityLoading || fetchState !== "done"}
								className="flex items-center gap-1.5 rounded-lg border border-border-default px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors disabled:opacity-50"
							>
								{visibilityLoading && <Loader2 size={12} className="animate-spin" />}
								{detail.isHidden ? "Unhide" : "Hide"}
							</button>
						)}
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
								{isRevisionReview ? "Approve Changes" : "Approve"}
							</button>
						</div>
					)}
				</DrawerFooter>
			</Drawer>

			<ReasonDialog
				open={rejectDialogOpen}
				title={isRevisionReview ? "Reject Changes" : "Reject Community Space Profile"}
				description={
					isRevisionReview
						? "Provide a remark explaining why this edit is rejected. The profile stays live as-is; the partner will be notified and can revise and resubmit."
						: "Provide a remark explaining why this community space profile is rejected. The partner will be notified and can edit and resubmit."
				}
				placeholder="e.g. The venue capacity and community size seem inconsistent. Please clarify and resubmit."
				confirmLabel={isRevisionReview ? "Reject Changes" : "Reject Profile"}
				confirmClassName="bg-red-600 hover:bg-red-700"
				onClose={() => setRejectDialogOpen(false)}
				onConfirm={handleRejectConfirm}
			/>
		</>
	)
}
