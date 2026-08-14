"use client"

import { useState } from "react"
import {
	Loader2,
	Mail,
	Building2,
	Globe,
	Phone,
	User,
} from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { StatusBadge } from "@/components/ui/status-badge"
import { approveBrand, rejectBrand } from "@/lib/api/brands"
import type { Brand } from "@/types"
import { toast } from "sonner"

export type BrandReviewDrawerProps = {
	open: boolean
	onClose: () => void
	brand: Brand | null
	onRefresh: () => void
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
				<div className="text-sm text-text-primary wrap-break-word">{value}</div>
			</div>
		</div>
	)
}

export function BrandReviewDrawer({
	open,
	onClose,
	brand,
	onRefresh,
}: BrandReviewDrawerProps) {
	const [actionLoading, setActionLoading] = useState(false)
	const [showRejectDialog, setShowRejectDialog] = useState(false)
	const [rejectReason, setRejectReason] = useState("")

	if (!brand) return null

	async function handleApprove() {
		if (!brand) return
		setActionLoading(true)
		try {
			await approveBrand(brand.id)
			toast.success("Brand profile approved successfully!")
			onRefresh()
			onClose()
		} catch (err: any) {
			toast.error(err?.message || "Failed to approve brand profile")
		} finally {
			setActionLoading(false)
		}
	}

	async function handleReject(e: React.FormEvent) {
		e.preventDefault()
		if (!brand || !rejectReason.trim()) return
		setActionLoading(true)
		try {
			await rejectBrand(brand.id, rejectReason.trim())
			toast.success("Brand profile rejected.")
			setShowRejectDialog(false)
			setRejectReason("")
			onRefresh()
			onClose()
		} catch (err: any) {
			toast.error(err?.message || "Failed to reject brand profile")
		} finally {
			setActionLoading(false)
		}
	}

	const links = brand.socialLinks ?? {}
	const categoriesText = brand.categories.map((c) => c.name).join(", ") || "—"

	return (
		<>
			<Drawer
				open={open}
				onClose={onClose}
				title={brand.brandName || "Brand Profile"}
				description="Verify brand credentials and identity"
			>
				<div className="space-y-6">
					{/* Status badge */}
					<div className="flex items-center gap-2">
						<span className="text-[11px] text-text-tertiary">Status</span>
						<StatusBadge status={brand.approvalStatus} />
					</div>

					{/* Brand Logo & Name */}
					<div className="flex items-center gap-4">
						<div className="size-16 rounded-xl border border-border-subtle bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
							{brand.logoUrl ? (
								<img src={brand.logoUrl} alt={brand.brandName} className="size-full object-cover" />
							) : (
								<Building2 size={24} className="text-text-tertiary" />
							)}
						</div>
						<div>
							<h3 className="text-base font-semibold text-text-primary leading-tight">
								{brand.brandName}
							</h3>
							<p className="text-xs text-text-secondary mt-1">
								{brand.companyType === "AGENCY" ? "Agency" : "Brand"} · {brand.industry || "No industry"}
							</p>
						</div>
					</div>

					<div className="border-t border-border-subtle" />

					{/* About Company */}
					{brand.aboutCompany && (
						<div className="space-y-1.5">
							<SectionLabel>About the Company</SectionLabel>
							<p className="text-xs text-text-secondary leading-relaxed bg-neutral-50 p-3 rounded-lg border border-neutral-100 whitespace-pre-wrap">
								{brand.aboutCompany}
							</p>
							<div className="border-t border-border-subtle pt-4" />
						</div>
					)}

					{/* Categories */}
					<div className="space-y-1.5">
						<SectionLabel>Experience Categories</SectionLabel>
						<p className="text-xs text-text-primary font-medium">{categoriesText}</p>
					</div>

					<div className="border-t border-border-subtle" />

					{/* User / Owner Info */}
					<div className="space-y-4">
						<SectionLabel>Account Owner Details</SectionLabel>
						<div className="grid grid-cols-1 gap-3.5">
							<DetailRow
								icon={User}
								label="Full Name"
								value={`${brand.user.firstName} ${brand.user.lastName}`}
							/>
							<DetailRow
								icon={Mail}
								label="Owner Email"
								value={brand.user.email || "—"}
							/>
							<DetailRow
								icon={Phone}
								label="Owner Phone"
								value={brand.user.phone || "—"}
							/>
						</div>
					</div>

					<div className="border-t border-border-subtle" />

					{/* Contact / Work Info */}
					<div className="space-y-4">
						<SectionLabel>Brand Contact Details</SectionLabel>
						<div className="grid grid-cols-1 gap-3.5">
							<DetailRow
								icon={Mail}
								label="Work Email"
								value={brand.workEmail || "—"}
							/>
							<DetailRow
								icon={Phone}
								label="Contact Phone"
								value={brand.contactPhone || "—"}
							/>
						</div>
					</div>

					<div className="border-t border-border-subtle" />

					{/* Social / Digital Links */}
					<div className="space-y-4">
						<SectionLabel>Digital Presence</SectionLabel>
						<div className="grid grid-cols-1 gap-3.5">
							{links.website && (
								<DetailRow
									icon={Globe}
									label="Website"
									value={
										<a
											href={links.website.startsWith("http") ? links.website : `https://${links.website}`}
											target="_blank"
											rel="noreferrer"
											className="text-text-brand hover:underline font-semibold"
										>
											{links.website}
										</a>
									}
								/>
							)}
							{links.instagram && (
								<DetailRow
									icon={Globe}
									label="Instagram"
									value={
										<a
											href={links.instagram.startsWith("http") ? links.instagram : `https://${links.instagram}`}
											target="_blank"
											rel="noreferrer"
											className="text-text-brand hover:underline font-semibold"
										>
											{links.instagram}
										</a>
									}
								/>
							)}
							{links.linkedin && (
								<DetailRow
									icon={Globe}
									label="LinkedIn"
									value={
										<a
											href={links.linkedin.startsWith("http") ? links.linkedin : `https://${links.linkedin}`}
											target="_blank"
											rel="noreferrer"
											className="text-text-brand hover:underline font-semibold"
										>
											{links.linkedin}
										</a>
									}
								/>
							)}
						</div>
					</div>
				</div>

				{brand.approvalStatus === "PENDING" && (
					<DrawerFooter>
						<button
							type="button"
							onClick={() => setShowRejectDialog(true)}
							disabled={actionLoading}
							className="rounded-lg border border-border-default px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
						>
							Reject
						</button>
						<button
							type="button"
							onClick={handleApprove}
							disabled={actionLoading}
							className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
						>
							{actionLoading && <Loader2 size={13} className="animate-spin" />}
							Approve Brand
						</button>
					</DrawerFooter>
				)}
			</Drawer>

			{/* Reject Dialog */}
			<Dialog.Root open={showRejectDialog} onOpenChange={(v) => !v && setShowRejectDialog(false)}>
				<Dialog.Portal>
					<Dialog.Overlay className="fixed inset-0 z-60 bg-black/40" />
					<Dialog.Content className="fixed left-1/2 top-1/2 z-60 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface-card p-6 shadow-xl focus:outline-none">
						<Dialog.Title className="text-sm font-semibold text-text-primary">
							Reject Brand Profile
						</Dialog.Title>
						<Dialog.Description className="mt-1.5 text-xs text-text-secondary leading-relaxed">
							Provide a reason for rejecting{" "}
							<span className="font-medium text-text-primary">{brand.brandName}</span>.
						</Dialog.Description>

						<form onSubmit={handleReject} className="mt-4 space-y-4">
							<div>
								<label className="block text-[11px] font-semibold text-text-secondary mb-1.5">
									Rejection reason{" "}
									<span className="text-red-500" aria-hidden>*</span>
								</label>
								<textarea
									value={rejectReason}
									onChange={(e) => setRejectReason(e.target.value)}
									placeholder="e.g. Website URL is invalid or social links do not match the brand..."
									rows={4}
									disabled={actionLoading}
									autoFocus
									className="w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors resize-none disabled:opacity-50"
								/>
							</div>

							<div className="flex items-center justify-end gap-3">
								<button
									type="button"
									onClick={() => setShowRejectDialog(false)}
									disabled={actionLoading}
									className="rounded-lg border border-border-default px-4 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors disabled:opacity-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={actionLoading || !rejectReason.trim()}
									className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{actionLoading && <Loader2 size={13} className="animate-spin" />}
									Reject Brand
								</button>
							</div>
						</form>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</>
	)
}
