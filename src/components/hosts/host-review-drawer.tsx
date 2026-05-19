"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
	Loader2, MapPin, Mail, Tag, Building2,
	Briefcase, CreditCard, BadgeCheck, AlertTriangle,
	Globe, Link, BookOpen, Languages,
} from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { StatusBadge } from "@/components/ui/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RejectHostDialog } from "@/components/hosts/reject-host-dialog"
import { getHostById } from "@/lib/api/hosts"
import type { Host, HostDetail } from "@/types"

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type HostAction = "approve" | "reject" | "suspend" | "restore"

export type HostReviewDrawerProps = {
	open: boolean
	onClose: () => void
	host: Host | null
	onAction: (hostId: string, action: HostAction, reason?: string) => Promise<void>
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
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
				<div className="text-sm text-text-primary wrap-break-word">{value}</div>
			</div>
		</div>
	)
}

function VerificationRow({ label, status }: { label: string; status: string }) {
	return (
		<div className="flex items-center justify-between py-1.5">
			<span className="text-xs text-text-secondary">{label}</span>
			<StatusBadge status={status as Parameters<typeof StatusBadge>[0]["status"]} />
		</div>
	)
}

// â”€â”€â”€ Loading skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

			<div className="border-t border-border-subtle" />

			{/* Section 2 */}
			<div className="space-y-3">
				<Skeleton className="h-3 w-20" />
				<div className="space-y-2.5">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
				</div>
			</div>

			<div className="border-t border-border-subtle" />

			{/* Section 3 */}
			<div className="space-y-3">
				<Skeleton className="h-3 w-24" />
				<Skeleton className="h-4 w-56" />
				<Skeleton className="h-4 w-44" />
			</div>

			<div className="border-t border-border-subtle" />

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

// â”€â”€â”€ Detail content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
			{/* â”€â”€ Status row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
			<div className="flex items-center gap-2 flex-wrap">
				<div className="flex items-center gap-1.5">
					<span className="text-[11px] text-text-tertiary">Approval</span>
					<StatusBadge status={detail.approvalStatus} />
				</div>
				<div className="flex items-center gap-1.5">
					<span className="text-[11px] text-text-tertiary">KYC</span>
					<StatusBadge status={detail.kycStatus} />
				</div>
				<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
					{detail.hostType}
				</span>
				<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
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
				<p className="text-[11px] text-text-tertiary">
					Approved on {formatDate(detail.approvedAt)}
				</p>
			)}

			<div className="border-t border-border-subtle" />

			{/* â”€â”€ Profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
									<span className="block text-text-tertiary">{detail.user.email}</span>
								)}
								{detail.user.phone && (
									<span className="block text-text-tertiary">{detail.user.phone}</span>
								)}
							</span>
						}
					/>
					<div className="flex items-center gap-3 pl-10">
						<span className="text-xs text-text-tertiary">Account status</span>
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

			{/* â”€â”€ Links â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
			{(detail.socialLinks?.website || detail.socialLinks?.instagram || detail.portfolioLinks.length > 0) && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Links</SectionLabel>
						<div className="space-y-3.5">
							{detail.socialLinks?.website && (
								<DetailRow
									icon={Globe}
									label="Website"
									value={
										<a href={detail.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-text-brand hover:underline break-all">
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
										<a href={detail.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-text-brand hover:underline break-all">
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
										<a href={link} target="_blank" rel="noopener noreferrer" className="text-text-brand hover:underline break-all">
											{link}
										</a>
									}
								/>
							))}
						</div>
					</div>
				</>
			)}

			<div className="border-t border-border-subtle" />

			{/* â”€â”€ Address â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

			{addressParts.length > 0 && <div className="border-t border-border-subtle" />}

			{/* â”€â”€ Verification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
			<div>
				<SectionLabel>Verification</SectionLabel>
				<div className="rounded-xl border border-border-default divide-y divide-border-subtle px-3.5">
					<VerificationRow label="PAN" status={detail.panVerificationStatus} />
					<VerificationRow label="Bank account" status={detail.bankVerificationStatus} />
				</div>
			</div>

			<div className="border-t border-border-subtle" />

			{/* â”€â”€ Experience & operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

			{/* â”€â”€ Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
			{detail.categories.length > 0 && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Categories</SectionLabel>
						<div className="flex flex-wrap gap-1.5">
							{detail.categories.map((cat) => (
								<span
									key={cat.categoryId}
									className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-text-secondary"
								>
									{cat.category.name}
								</span>
							))}
						</div>
					</div>
				</>
			)}

			<div className="border-t border-border-subtle" />

			{/* â”€â”€ Subscriptions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
			<div>
				<SectionLabel>Recent Subscriptions</SectionLabel>
				{detail.subscriptions.length === 0 ? (
					<p className="text-xs text-text-tertiary">No subscriptions yet.</p>
				) : (
					<div className="rounded-xl border border-border-default divide-y divide-border-subtle overflow-hidden">
						{detail.subscriptions.slice(0, 5).map((sub, i) => (
							<div key={i} className="flex items-center justify-between px-3.5 py-2.5">
								<div>
									<p className="text-xs font-semibold text-text-primary">{sub.plan}</p>
									<p className="text-[11px] text-text-tertiary">
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

			<div className="border-t border-border-subtle" />

			{/* â”€â”€ Payout account â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
			<div>
				<SectionLabel>Payout Account</SectionLabel>
				{detail.payoutAccount === null ? (
					<div className="flex items-center gap-2 rounded-xl border border-border-default bg-neutral-50 px-3.5 py-3">
						<CreditCard size={13} className="text-text-tertiary shrink-0" />
						<p className="text-xs text-text-tertiary">No payout account configured.</p>
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
							<span className="text-xs text-text-tertiary">Verification</span>
							<StatusBadge status={detail.payoutAccount.isVerified ? "VERIFIED" : detail.payoutAccount.status} />
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

// â”€â”€â”€ Suspend dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SuspendHostDialog({
	open,
	onClose,
	onConfirm,
	hostName,
}: {
	open: boolean
	onClose: () => void
	onConfirm: (reason: string) => Promise<void>
	hostName: string
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
		<Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-60 bg-black/40" />
				<Dialog.Content className="fixed left-1/2 top-1/2 z-60 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface-canvas p-6 shadow-xl focus:outline-none">
					<Dialog.Title className="text-sm font-semibold text-text-primary">
						Suspend Host
					</Dialog.Title>
					<Dialog.Description className="mt-1.5 text-xs text-text-secondary leading-relaxed">
						Provide a reason for suspending{" "}
						<span className="font-medium text-text-primary">{hostName}</span>. The host will be
						notified and can no longer submit or accept new orders.
					</Dialog.Description>

					<form onSubmit={handleSubmit} className="mt-4 space-y-4">
						<div>
							<label className="block text-[11px] font-semibold text-text-secondary mb-1.5">
								Suspension reason{" "}
								<span className="text-red-500" aria-hidden>*</span>
							</label>
							<textarea
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="e.g. Multiple reports of fraudulent event listings."
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
								className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading && <Loader2 size={13} className="animate-spin" />}
								Suspend Host
							</button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function HostReviewDrawer({ open, onClose, host, onAction }: HostReviewDrawerProps) {
	const router = useRouter()
	const [detail, setDetail] = useState<HostDetail | null>(null)
	const [fetchState, setFetchState] = useState<"loading" | "error" | "done">("loading")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [actionLoading, setActionLoading] = useState<HostAction | null>(null)
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
	const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)

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
		setSuspendDialogOpen(false)
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

	async function handleSuspendConfirm(reason: string) {
		if (!host) return
		setActionLoading("suspend")
		try {
			await onAction(host.id, "suspend", reason)
			setSuspendDialogOpen(false)
			handleClose()
		} finally {
			setActionLoading(null)
		}
	}

	async function handleRestore() {
		if (!host) return
		setActionLoading("restore")
		try {
			await onAction(host.id, "restore")
			handleClose()
		} finally {
			setActionLoading(null)
		}
	}

	const approvalStatus = detail?.approvalStatus ?? host?.approvalStatus
	const isPending = approvalStatus === "PENDING"
	const isApproved = approvalStatus === "APPROVED"
	const isSuspended = approvalStatus === "SUSPENDED"
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
					<p className="text-sm font-medium text-text-primary">Something went wrong</p>
					<p className="mt-1 text-xs text-text-tertiary max-w-xs">{errorMessage}</p>
				</div>
			)}

			{fetchState === "done" && detail && <HostDetailContent detail={detail} />}

			{/* Footer */}
			<DrawerFooter className={isPending || isApproved || isSuspended ? "justify-between" : "justify-end"}>
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
							className="flex items-center gap-1.5 rounded-lg bg-action-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							{actionLoading === "approve" && <Loader2 size={12} className="animate-spin" />}
							Approve
						</button>
					</>
				)}
				{isApproved && (
					<>
						<button
							onClick={handleClose}
							className="rounded-lg border border-border-default px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors"
						>
							Close
						</button>
						<button
							onClick={() => setSuspendDialogOpen(true)}
							disabled={isBusy || fetchState !== "done"}
							className="flex items-center gap-1.5 rounded-lg border border-orange-200 px-3.5 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 transition-colors disabled:opacity-50"
						>
							Suspend
						</button>
					</>
				)}
				{isSuspended && (
					<>
						<button
							onClick={handleClose}
							className="rounded-lg border border-border-default px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors"
						>
							Close
						</button>
						<button
							onClick={handleRestore}
							disabled={isBusy || fetchState !== "done"}
							className="flex items-center gap-1.5 rounded-lg bg-action-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors disabled:opacity-50"
						>
							{actionLoading === "restore" && <Loader2 size={12} className="animate-spin" />}
							Restore
						</button>
					</>
				)}
				{!isPending && !isApproved && !isSuspended && (
					<button
						onClick={handleClose}
						className="rounded-lg border border-border-default px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors"
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

			<SuspendHostDialog
				open={suspendDialogOpen}
				onClose={() => setSuspendDialogOpen(false)}
				onConfirm={handleSuspendConfirm}
				hostName={host?.displayName ?? ""}
			/>
		</Drawer>
	)
}
