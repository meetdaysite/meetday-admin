"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
	Loader2, MapPin, Mail, Tag, Building2,
	Briefcase, CreditCard, BadgeCheck, AlertTriangle,
	Globe, Link, BookOpen, Languages,
} from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { StatusBadge } from "@/components/ui/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RejectHostDialog } from "@/components/hosts/reject-host-dialog"
import { getHostById } from "@/lib/api/hosts"
import type { Host, HostDetail } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type HostAction = "approve" | "reject"

export type HostReviewDrawerProps = {
	open: boolean
	onClose: () => void
	host: Host | null
	onAction: (hostId: string, action: HostAction, reason?: string) => Promise<void>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
	return (
		<p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-light mb-3">
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
				<Icon size={13} className="text-neutral-dark" />
			</div>
			<div className="min-w-0">
				<p className="text-[11px] text-neutral-light">{label}</p>
				<div className="text-sm text-foreground wrap-break-word">{value}</div>
			</div>
		</div>
	)
}

function VerificationRow({ label, status }: { label: string; status: string }) {
	return (
		<div className="flex items-center justify-between py-1.5">
			<span className="text-xs text-neutral-dark">{label}</span>
			<StatusBadge status={status as Parameters<typeof StatusBadge>[0]["status"]} />
		</div>
	)
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DrawerSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			{/* Status chips */}
			<div className="flex gap-2">
				<Skeleton className="h-5 w-20 rounded-full" />
				<Skeleton className="h-5 w-20 rounded-full" />
			</div>

			{/* Section 1 */}
			<div className="space-y-3">
				<Skeleton className="h-3 w-16" />
				<Skeleton className="h-4 w-48" />
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-4 w-36" />
			</div>

			<div className="border-t border-neutral-100" />

			{/* Section 2 */}
			<div className="space-y-3">
				<Skeleton className="h-3 w-20" />
				<div className="space-y-2.5">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
				</div>
			</div>

			<div className="border-t border-neutral-100" />

			{/* Section 3 */}
			<div className="space-y-3">
				<Skeleton className="h-3 w-24" />
				<Skeleton className="h-4 w-56" />
				<Skeleton className="h-4 w-44" />
			</div>

			<div className="border-t border-neutral-100" />

			{/* Section 4 */}
			<div className="space-y-2">
				<Skeleton className="h-3 w-28" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
		</div>
	)
}

// ─── Detail content ───────────────────────────────────────────────────────────

function HostDetailContent({ detail }: { detail: HostDetail }) {
	const fullName = `${detail.user.firstName} ${detail.user.lastName}`
	const addressParts = [
		detail.address?.street,
		detail.address?.city,
		detail.address?.state,
		detail.address?.pincode,
		detail.address?.country,
	].filter(Boolean)

	return (
		<div className="space-y-6">
			{/* ── Status row ─────────────────────────────────────────────── */}
			<div className="flex items-center gap-2 flex-wrap">
				<div className="flex items-center gap-1.5">
					<span className="text-[11px] text-neutral-light">Approval</span>
					<StatusBadge status={detail.approvalStatus} />
				</div>
				<div className="flex items-center gap-1.5">
					<span className="text-[11px] text-neutral-light">KYC</span>
					<StatusBadge status={detail.kycStatus} />
				</div>
				<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-dark">
					{detail.hostType}
				</span>
				<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-dark">
					{detail.currentPlan}
				</span>
			</div>

			{/* Rejection reason */}
			{detail.rejectionReason && (
				<div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50/50 px-3.5 py-3">
					<AlertTriangle size={13} className="mt-0.5 shrink-0 text-red-500" />
					<div>
						<p className="text-[11px] font-semibold text-red-700">Rejection reason</p>
						<p className="mt-0.5 text-xs text-red-600">{detail.rejectionReason}</p>
					</div>
				</div>
			)}

			{detail.approvedAt && (
				<p className="text-[11px] text-neutral-light">
					Approved on {formatDate(detail.approvedAt)}
				</p>
			)}

			<div className="border-t border-neutral-100" />

			{/* ── Profile ─────────────────────────────────────────────────── */}
			<div>
				<SectionLabel>Profile</SectionLabel>
				<div className="space-y-3.5">
					{detail.legalName && (
						<DetailRow icon={BadgeCheck} label="Legal name" value={detail.legalName} />
					)}
					<DetailRow
						icon={Mail}
						label="Contact"
						value={
							<span className="space-y-0.5">
								<span className="block">{fullName}</span>
								{detail.user.email && (
									<span className="block text-neutral-light">{detail.user.email}</span>
								)}
								{detail.user.phone && (
									<span className="block text-neutral-light">{detail.user.phone}</span>
								)}
							</span>
						}
					/>
					<div className="flex items-center gap-3 pl-10">
						<span className="text-xs text-neutral-light">Account status</span>
						<StatusBadge status={detail.user.isActive ? "ACTIVE" : "DISABLED"} />
					</div>
					{detail.tagline && (
						<DetailRow icon={BookOpen} label="Tagline" value={detail.tagline} />
					)}
					{detail.hostBio && (
						<DetailRow icon={BookOpen} label="Bio" value={detail.hostBio} />
					)}
					{detail.languages.length > 0 && (
						<DetailRow
							icon={Languages}
							label="Languages"
							value={detail.languages.join(", ")}
						/>
					)}
				</div>
			</div>

			{/* ── Links ───────────────────────────────────────────────────── */}
			{(detail.socialLinks?.website || detail.socialLinks?.instagram || detail.portfolioLinks.length > 0) && (
				<>
					<div className="border-t border-neutral-100" />
					<div>
						<SectionLabel>Links</SectionLabel>
						<div className="space-y-3.5">
							{detail.socialLinks?.website && (
								<DetailRow
									icon={Globe}
									label="Website"
									value={
										<a href={detail.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline break-all">
											{detail.socialLinks.website}
										</a>
									}
								/>
							)}
							{detail.socialLinks?.instagram && (
								<DetailRow
									icon={Globe}
									label="Instagram"
									value={
										<a href={detail.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline break-all">
											{detail.socialLinks.instagram}
										</a>
									}
								/>
							)}
							{detail.portfolioLinks.map((link, i) => (
								<DetailRow
									key={i}
									icon={Link}
									label={`Portfolio ${detail.portfolioLinks.length > 1 ? i + 1 : ""}`.trim()}
									value={
										<a href={link} target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline break-all">
											{link}
										</a>
									}
								/>
							))}
						</div>
					</div>
				</>
			)}

			<div className="border-t border-neutral-100" />

			{/* ── Address ─────────────────────────────────────────────────── */}
			{addressParts.length > 0 && (
				<div>
					<SectionLabel>Address</SectionLabel>
					<DetailRow
						icon={MapPin}
						label="Location"
						value={addressParts.join(", ")}
					/>
				</div>
			)}

			{addressParts.length > 0 && <div className="border-t border-neutral-100" />}

			{/* ── Verification ────────────────────────────────────────────── */}
			<div>
				<SectionLabel>Verification</SectionLabel>
				<div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 px-3.5">
					<VerificationRow label="PAN" status={detail.panVerificationStatus} />
					<VerificationRow label="Bank account" status={detail.bankVerificationStatus} />
				</div>
			</div>

			<div className="border-t border-neutral-100" />

			{/* ── Experience & operations ──────────────────────────────────── */}
			<div>
				<SectionLabel>Experience & Operations</SectionLabel>
				<div className="space-y-3.5">
					<DetailRow
						icon={Briefcase}
						label="Experience"
						value={
							detail.yearsOfExperience !== null
								? `${detail.yearsOfExperience} yr${detail.yearsOfExperience !== 1 ? "s" : ""}`
								: "Not specified"
						}
					/>
					<DetailRow
						icon={Briefcase}
						label="Events hosted previously"
						value={
							detail.totalEventsPreviouslyHosted !== null
								? String(detail.totalEventsPreviouslyHosted)
								: "Not specified"
						}
					/>
					{detail.operatingCities.length > 0 && (
						<DetailRow
							icon={MapPin}
							label="Operating cities"
							value={detail.operatingCities.join(", ")}
						/>
					)}
				</div>
			</div>

			{/* ── Categories ──────────────────────────────────────────────── */}
			{detail.categories.length > 0 && (
				<>
					<div className="border-t border-neutral-100" />
					<div>
						<SectionLabel>Categories</SectionLabel>
						<div className="flex flex-wrap gap-1.5">
							{detail.categories.map((cat) => (
								<span
									key={cat.categoryId}
									className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-dark"
								>
									{cat.category.name}
								</span>
							))}
						</div>
					</div>
				</>
			)}

			<div className="border-t border-neutral-100" />

			{/* ── Subscriptions ────────────────────────────────────────────── */}
			<div>
				<SectionLabel>Recent Subscriptions</SectionLabel>
				{detail.subscriptions.length === 0 ? (
					<p className="text-xs text-neutral-light">No subscriptions yet.</p>
				) : (
					<div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
						{detail.subscriptions.slice(0, 5).map((sub, i) => (
							<div key={i} className="flex items-center justify-between px-3.5 py-2.5">
								<div>
									<p className="text-xs font-semibold text-foreground">{sub.plan}</p>
									<p className="text-[11px] text-neutral-light">
										{sub.billingCycle.charAt(0) + sub.billingCycle.slice(1).toLowerCase()}
										{" · "}
										Ends {formatDate(sub.currentPeriodEnd)}
									</p>
								</div>
								<StatusBadge status={sub.status} />
							</div>
						))}
					</div>
				)}
			</div>

			<div className="border-t border-neutral-100" />

			{/* ── Payout account ───────────────────────────────────────────── */}
			<div>
				<SectionLabel>Payout Account</SectionLabel>
				{detail.payoutAccount === null ? (
					<div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3">
						<CreditCard size={13} className="text-neutral-light shrink-0" />
						<p className="text-xs text-neutral-light">No payout account configured.</p>
					</div>
				) : (
					<div className="space-y-3.5">
						<DetailRow
							icon={CreditCard}
							label="Account holder"
							value={detail.payoutAccount.accountHolderName}
						/>
						<DetailRow
							icon={Building2}
							label="Bank"
							value={`${detail.payoutAccount.bankName} · ${detail.payoutAccount.accountType}`}
						/>
						<DetailRow
							icon={CreditCard}
							label="Account number"
							value={detail.payoutAccount.maskedAccountNumber}
						/>
						<div className="flex items-center gap-3 pl-10">
							<span className="text-xs text-neutral-light">Verification</span>
							<StatusBadge status={detail.payoutAccount.isVerified ? "VERIFIED" : detail.payoutAccount.status} />
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HostReviewDrawer({ open, onClose, host, onAction }: HostReviewDrawerProps) {
	const router = useRouter()
	const [detail, setDetail] = useState<HostDetail | null>(null)
	const [fetchState, setFetchState] = useState<"loading" | "error" | "done">("loading")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState<HostAction | null>(null)
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

	// Fetch full detail whenever the drawer opens
	useEffect(() => {
		if (!open || !host) return

		let cancelled = false
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)

		getHostById(host.id)
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
				if (status === 403) {
					setErrorMessage("You don't have permission to view this host.")
				} else if (status === 404) {
					setErrorMessage("Host not found.")
				} else {
					setErrorMessage("Failed to load host details. Please try again.")
				}
			})

		return () => { cancelled = true }
	}, [open, host?.id, router])

	function handleClose() {
		setActionLoading(null)
		setRejectDialogOpen(false)
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)
		onClose()
	}

	async function handleApprove() {
		if (!host) return
		setActionLoading("approve")
		try {
			await onAction(host.id, "approve")
			handleClose()
		} finally {
			setActionLoading(null)
		}
	}

	async function handleRejectConfirm(reason: string) {
		if (!host) return
		await onAction(host.id, "reject", reason)
		setRejectDialogOpen(false)
		handleClose()
	}

	const isPending = (detail?.approvalStatus ?? host?.approvalStatus) === "PENDING"
	const canApprove = isPending && (detail?.kycStatus ?? host?.kycStatus) === "VERIFIED"
	const isBusy = actionLoading !== null

	return (
		<Drawer
			open={open}
			onClose={handleClose}
			title={host?.displayName ?? ""}
			description={host?.user.email ?? host?.user.firstName + " " + host?.user.lastName}
			width="max-w-lg"
		>
			{/* Body */}
			{fetchState === "loading" && <DrawerSkeleton />}

			{fetchState === "error" && (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<AlertTriangle size={28} className="mb-3 text-neutral-300" />
					<p className="text-sm font-medium text-foreground">Something went wrong</p>
					<p className="mt-1 text-xs text-neutral-light max-w-xs">{errorMessage}</p>
				</div>
			)}

			{fetchState === "done" && detail && <HostDetailContent detail={detail} />}

			{/* Footer */}
			<DrawerFooter className={isPending ? "justify-between" : "justify-end"}>
				{isPending && (
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
							disabled={isBusy || fetchState !== "done" || !canApprove}
							title={!canApprove ? "KYC must be verified before approving" : undefined}
							className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							{actionLoading === "approve" && <Loader2 size={12} className="animate-spin" />}
							Approve
						</button>
					</>
				)}
				{!isPending && (
					<button
						onClick={handleClose}
						className="rounded-lg border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors"
					>
						Close
					</button>
				)}
			</DrawerFooter>

			<RejectHostDialog
				open={rejectDialogOpen}
				onClose={() => setRejectDialogOpen(false)}
				onConfirm={handleRejectConfirm}
				hostName={host?.displayName ?? ""}
			/>
		</Drawer>
	)
}
