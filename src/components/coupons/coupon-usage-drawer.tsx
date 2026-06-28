"use client"

import { useEffect, useState } from "react"
import { Tag, Percent, IndianRupee, Users, Clock, AlertCircle, Loader2 } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { getCouponById, disableCoupon } from "@/lib/api/coupons"
import type { Coupon, CouponRedemption } from "@/types"
import axios from "axios"
import { toast } from "sonner"
import { StatusBadge } from "../ui/status-badge"

//  Helpers

function formatDateTime(iso: string): string {
	const d = new Date(iso)
	return (
		d.toLocaleDateString("en-IN", {
			day: "numeric",
			month: "short",
			year: "numeric",
		}) +
		" · " +
		d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
	)
}

function fmtRate(rate: number): string {
	// Rates may be fractional (e.g. 0.15 = 15%) or whole numbers
	if (rate > 0 && rate <= 1) return `${(rate * 100).toFixed(1)}%`
	return `${rate}%`
}

function getApiErrorMessage(err: unknown): string {
	if (axios.isAxiosError(err)) {
		return err.response?.data?.message ?? err.message
	}
	return err instanceof Error ? err.message : "Something went wrong"
}

//  Summary stat”€

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
	return (
		<div className="flex items-start gap-2.5">
			<div className="mt-0.5 w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center shrink-0">
				<Icon size={13} className="text-text-secondary" />
			</div>
			<div>
				<p className="text-[11px] text-text-tertiary">{label}</p>
				<p className="text-sm font-medium text-text-primary">{value}</p>
			</div>
		</div>
	)
}

//  Redemption timeline item

function RedemptionItem({ redemption, isLast }: { redemption: CouponRedemption; isLast: boolean }) {
	const userName = redemption.user
		? `${redemption.user.firstName} ${redemption.user.lastName}`
		: "Unknown user"
	const userEmail = redemption.user?.email ?? "â€”"

	return (
		<div className="flex gap-3">
			{/* Dot + line */}
			<div className="flex flex-col items-center">
				<div className="w-2 h-2 rounded-full bg-action-primary mt-1.5 shrink-0" />
				{!isLast && <div className="w-px flex-1 bg-border-default mt-1" />}
			</div>

			{/* Content */}
			<div className="pb-5 flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<p className="text-xs font-semibold text-text-primary truncate">{userName}</p>
						<p className="text-[11px] text-text-tertiary truncate">{userEmail}</p>
					</div>
					<div className="text-right shrink-0">
						<p className="text-xs font-semibold text-green-700">
							{fmtRate(redemption.discountedFeeRate)}
						</p>
						<p className="text-[11px] text-text-tertiary">
							from {fmtRate(redemption.originalFeeRate)}
						</p>
					</div>
				</div>

				<div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-text-tertiary">
					<Clock size={10} />
					{formatDateTime(redemption.createdAt)}
				</div>
			</div>
		</div>
	)
}

//  Props

export type CouponUsageDrawerProps = {
	open: boolean
	onClose: () => void
	coupon: Coupon | null
	onDisableSuccess?: (id: string) => void
}

//  Component

export function CouponUsageDrawer({ open, onClose, coupon, onDisableSuccess }: CouponUsageDrawerProps) {
	const [detail, setDetail] = useState<Coupon | null>(null)
	const [isLoadingDetail, setLoadingDetail] = useState(false)
	const [detailError, setDetailError] = useState<string | null>(null)

	const [confirmDisable, setConfirmDisable] = useState(false)
	const [isDisabling, setIsDisabling] = useState(false)

	// Fetch full detail whenever a coupon is opened
	useEffect(() => {
		if (!open || !coupon?.id) {
			setDetail(null)
			setDetailError(null)
			return
		}

		let cancelled = false
		setLoadingDetail(true)
		setDetailError(null)

		getCouponById(coupon.id)
			.then(data => {
				if (!cancelled) setDetail(data)
			})
			.catch(err => {
				if (cancelled) return
				if (axios.isAxiosError(err) && err.response?.status === 404) {
					setDetailError("This coupon no longer exists.")
				} else {
					setDetailError("Failed to load coupon details.")
				}
			})
			.finally(() => {
				if (!cancelled) setLoadingDetail(false)
			})

		return () => {
			cancelled = true
		}
	}, [open, coupon?.id])

	async function handleDisable() {
		if (!detail) return
		setIsDisabling(true)
		try {
			await disableCoupon(detail.id)
			const updated = { ...detail, isActive: false }
			setDetail(updated)
			setConfirmDisable(false)
			toast.success("Coupon disabled", {
				description: `${detail.code} has been disabled and can no longer be redeemed.`,
			})
			onDisableSuccess?.(detail.id)
		} catch (err) {
			const message = getApiErrorMessage(err)
			toast.error("Failed to disable coupon", { description: message })
		} finally {
			setIsDisabling(false)
		}
	}

	const displayCoupon = detail ?? coupon
	const usageCount = detail?.usageCount ?? detail?.redemptions?.length ?? coupon?.usageCount ?? 0
	const redemptions = detail?.redemptions ?? []

	return (
		<>
			<Drawer
				open={open}
				onClose={onClose}
				title={displayCoupon?.code ?? ""}
				description={displayCoupon?.description ?? "Coupon details & usage history"}
				width="max-w-lg"
			>
				{/* Loading state */}
				{isLoadingDetail && (
					<div className="flex items-center justify-center py-12">
						<Loader2 size={20} className="animate-spin text-text-tertiary" />
					</div>
				)}

				{/* Error state */}
				{detailError && !isLoadingDetail && (
					<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 flex items-center gap-2.5">
						<AlertCircle size={14} className="text-red-600 shrink-0" />
						<p className="text-xs text-red-700">{detailError}</p>
					</div>
				)}

				{/* Content */}
				{!isLoadingDetail && !detailError && displayCoupon && (
					<div className="space-y-6">
						{/* Status badge */}
						<StatusBadge
							status={
								displayCoupon.isActive ? "Active".toUpperCase() : "Inactive".toUpperCase()
							}
						/>

						{/* Summary grid */}
						<div className="grid grid-cols-2 gap-4">
							<Stat
								icon={displayCoupon.discountType === "PERCENTAGE" ? Percent : IndianRupee}
								label="Discount"
								value={
									displayCoupon.discountType === "PERCENTAGE"
										? `${displayCoupon.discountValue}% off`
										: `र ${displayCoupon.discountValue} flat`
								}
							/>
							<Stat
								icon={Tag}
								label="Target"
								value={displayCoupon.target === "HOST" ? "Host" : "Attendee"}
							/>
							<Stat
								icon={Users}
								label="Total Uses"
								value={
									displayCoupon.maxUsages != null
										? `${usageCount} / ${displayCoupon.maxUsages}`
										: `${usageCount} / âˆž`
								}
							/>
							{displayCoupon.maxUsagesPerUser != null && (
								<Stat
									icon={Users}
									label="Per-User Limit"
									value={String(displayCoupon.maxUsagesPerUser)}
								/>
							)}
						</div>

						{/* Redemptions */}
						<div>
							<p className="text-[11px] font-semibold tracking-wider uppercase text-text-tertiary mb-3">
								Redemption History
							</p>

							{redemptions.length === 0 ? (
								<p className="text-xs text-text-tertiary py-4 text-center">
									No redemptions recorded yet.
								</p>
							) : (
								<div>
									{redemptions.map((r, i) => (
										<RedemptionItem
											key={r.id}
											redemption={r}
											isLast={i === redemptions.length - 1}
										/>
									))}
								</div>
							)}
						</div>
					</div>
				)}

				<DrawerFooter>
					{!isLoadingDetail && !detailError && displayCoupon?.isActive && (
						<button
							onClick={() => setConfirmDisable(true)}
							className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
						>
							Disable Coupon
						</button>
					)}
					<button
						onClick={onClose}
						className="rounded-lg border border-border-default px-4 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors"
					>
						Close
					</button>
				</DrawerFooter>
			</Drawer>

			<ConfirmDialog
				open={confirmDisable}
				onClose={() => setConfirmDisable(false)}
				onConfirm={handleDisable}
				title="Disable coupon"
				description={
					detail
						? `Disable ${detail.code}? It will immediately stop being accepted at checkout and cannot be re-enabled from this panel.`
						: ""
				}
				confirmLabel="Disable"
				destructive
				isLoading={isDisabling}
			/>
		</>
	)
}
