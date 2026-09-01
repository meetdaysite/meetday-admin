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
	// Opens the full edit form for this profile, pre-filled with every field — available
	// regardless of approvalStatus or who created it.
	onEdit?: (detail: CommunityProfileDetail) => void
	// Toggles brand-visibility — available regardless of approvalStatus, unlike approve/reject.
	onToggleVisibility?: (profileId: string, isHidden: boolean) => Promise<void>
}

function formatExternalUrl(url?: string | null) {
	if (!url) return null
	const trimmed = url.trim()
	if (!trimmed) return null
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
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

	// The form always resubmits every field (not just a diff), so a field's presence in the
	// revision doesn't mean it changed — compare against the current live value instead.
	const hasNewLogo = !!revision.logoUrl && (revision.logoKey as string | undefined) !== detail.logoKey
	const hasNewSecondaryImage =
		!!revision.secondaryImageUrl && (revision.secondaryImageKey as string | undefined) !== (detail.secondaryImageKey ?? undefined)

	const revisionCategoryIds = revision.categoryIds as string[] | undefined
	const currentCategoryIds = detail.categories.map((c) => c.id)
	const hasCategoryChange =
		Array.isArray(revisionCategoryIds) &&
		JSON.stringify([...revisionCategoryIds].sort()) !== JSON.stringify([...currentCategoryIds].sort())

	// imageUrls are freshly-signed on every fetch (different query string each time), so compare
	// on name/description/imageKeys only — otherwise this would always look "changed". Past events
	// have no stable id, so identity = exact content match; only genuinely new/removed entries show.
	type PastEventLike = { name?: string | null; description?: string | null; imageKeys?: string[]; imageUrls?: string[] }
	const identityOf = (e: PastEventLike) =>
		JSON.stringify({ name: e.name ?? null, description: e.description ?? null, imageKeys: e.imageKeys ?? [] })
	const revisionPastEvents = (revision.pastEvents as PastEventLike[] | undefined) ?? []
	const currentPastEvents = (detail.pastEvents as PastEventLike[] | undefined) ?? []
	const currentIdentities = new Set(currentPastEvents.map(identityOf))
	const revisionIdentities = new Set(revisionPastEvents.map(identityOf))
	const addedPastEvents = revision.pastEvents ? revisionPastEvents.filter((e) => !currentIdentities.has(identityOf(e))) : []
	const removedPastEventsCount = revision.pastEvents
		? currentPastEvents.filter((e) => !revisionIdentities.has(identityOf(e))).length
		: 0
	const hasPastEventsChange = addedPastEvents.length > 0 || removedPastEventsCount > 0;

	type BrandWorkedWithLike = { brandName?: string | null; logoKey?: string | null; logoUrl?: string | null; url?: string | null }
	const brandIdentityOf = (b: BrandWorkedWithLike) =>
		JSON.stringify({ brandName: b.brandName ?? null, logoKey: b.logoKey ?? null, url: b.url ?? null })
	const revisionBrands = (revision.brandsWorkedWith as BrandWorkedWithLike[] | undefined) ?? []
	const currentBrands = (detail.brandsWorkedWith as BrandWorkedWithLike[] | undefined) ?? []
	const currentBrandIdentities = new Set(currentBrands.map(brandIdentityOf))
	const revisionBrandIdentities = new Set(revisionBrands.map(brandIdentityOf))
	const addedBrands = revision.brandsWorkedWith ? revisionBrands.filter((b) => !currentBrandIdentities.has(brandIdentityOf(b))) : []
	const removedBrandsCount = revision.brandsWorkedWith
		? currentBrands.filter((b) => !revisionBrandIdentities.has(brandIdentityOf(b))).length
		: 0
	const hasBrandsChange = addedBrands.length > 0 || removedBrandsCount > 0;

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

			{hasPastEventsChange && (
				<div className="rounded-lg bg-blue-50/60 border border-blue-100 px-3 py-2.5 space-y-2">
					<p className="text-[11px] font-semibold text-blue-700">
						{addedPastEvents.length > 0 ? `New past event${addedPastEvents.length > 1 ? "s" : ""} (proposed)` : "Past events changed"}
					</p>
					{addedPastEvents.length > 0 && (
						<div className="space-y-2">
							{addedPastEvents.map((event, i) => (
								<div key={i} className="rounded-md bg-white border border-border-subtle p-2 space-y-1">
									{event.name && <p className="text-xs font-semibold text-text-primary">{event.name}</p>}
									{event.description && <p className="text-xs text-text-secondary whitespace-pre-wrap">{event.description}</p>}
									{!!event.imageUrls?.length && (
										<div className="flex gap-1.5 pt-1">
											{event.imageUrls.map((url, j) => (
												// eslint-disable-next-line @next/next/no-img-element
												<img key={j} src={url} alt={event.name || "Past event"} className="size-14 rounded-md object-cover border border-border-subtle" />
											))}
										</div>
									)}
								</div>
							))}
						</div>
					)}
					{removedPastEventsCount > 0 && (
						<p className="text-xs text-text-tertiary">
							{removedPastEventsCount} past event{removedPastEventsCount > 1 ? "s" : ""} removed.
						</p>
					)}
				</div>
			)}

			{hasBrandsChange && (
				<div className="rounded-lg bg-blue-50/60 border border-blue-100 px-3 py-2.5 space-y-2">
					<p className="text-[11px] font-semibold text-blue-700">
						{addedBrands.length > 0 ? `Associated brands (${addedBrands.length} proposed)` : "Associated brands changed"}
					</p>
					{addedBrands.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{addedBrands.map((brand, i) => {
								const href = formatExternalUrl(brand.url)
								const content = (
									<div className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-border-subtle hover:border-text-primary transition-all duration-200 cursor-pointer">
										{brand.logoUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img src={brand.logoUrl} alt={brand.brandName || "Brand logo"} className="size-5 rounded-md object-cover border border-border-subtle shrink-0 group-hover:scale-115 transition-transform duration-200" />
										) : (
											<span className="size-5 rounded-md bg-neutral-100 flex items-center justify-center text-[9px] font-bold text-neutral-600 shrink-0 group-hover:scale-115 transition-transform duration-200">
												{(brand.brandName || "B").charAt(0).toUpperCase()}
											</span>
										)}
										<span className="text-xs font-medium text-text-primary">{brand.brandName || (href ? brand.url : "Unnamed Brand")}</span>
										{(brand.brandName || brand.url) && (
											<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
												<span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-md">
													{brand.brandName || brand.url}
												</span>
												<div className="w-1.5 h-1.5 bg-black rotate-45 -mt-0.5" />
											</div>
										)}
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
					)}
					{removedBrandsCount > 0 && (
						<p className="text-xs text-text-tertiary">
							{removedBrandsCount} brand{removedBrandsCount > 1 ? "s" : ""} removed.
						</p>
					)}
				</div>
			)}

			{changedText.length === 0 && !hasNewLogo && !hasNewSecondaryImage && !hasCategoryChange && !hasPastEventsChange && !hasBrandsChange && (
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

			{detail.isHidden && (
				<div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
					<p className="text-xs font-semibold text-amber-800">Hidden from brands — not discoverable in browse/search, sponsorships hidden too. The host&apos;s own access is unaffected.</p>
				</div>
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
											<img src={brand.logoUrl} alt={brand.brandName || "Brand logo"} className="size-6 rounded-md object-cover border border-border-subtle shrink-0 group-hover:scale-115 transition-transform duration-200" />
										) : (
											<span className="size-6 rounded-md bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-700 shrink-0 group-hover:scale-115 transition-transform duration-200">
												{(brand.brandName || "B").charAt(0).toUpperCase()}
											</span>
										)}
										<span className="text-xs font-semibold text-text-primary">
											{brand.brandName || (href ? brand.url : "Unnamed Brand")}
										</span>
										{(brand.brandName || brand.url) && (
											<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
												<span className="px-2.5 py-1 bg-black text-white text-[11px] font-bold rounded-lg whitespace-nowrap shadow-md">
													{brand.brandName || brand.url}
												</span>
												<div className="w-2 h-2 bg-black rotate-45 -mt-1" />
											</div>
										)}
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

export function CommunityProfileReviewDrawer({ open, onClose, profile, onAction, onEdit, onToggleVisibility }: CommunityProfileReviewDrawerProps) {
	const router = useRouter()
	const [detail, setDetail] = useState<CommunityProfileDetail | null>(null)
	const [fetchState, setFetchState] = useState<"loading" | "error" | "done">("loading")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState<CommunityProfileAction | null>(null)
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
	const [visibilityLoading, setVisibilityLoading] = useState(false)

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
								{detail.isHidden ? "Unhide from brands" : "Hide from brands"}
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
