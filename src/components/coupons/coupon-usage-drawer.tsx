"use client"

import { useMemo } from "react"
import { Tag, Percent, IndianRupee, Calendar, Users, Clock, ShoppingBag } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { StatusBadge } from "@/components/ui/status-badge"
import type { Coupon, CouponUsage } from "@/types"

// ─── Mock usage data ──────────────────────────────────────────────────────────

export const MOCK_USAGE: CouponUsage[] = [
	{
		id: "u1",
		couponId: "c1",
		userName: "Priya Verma",
		userEmail: "priya@example.com",
		eventTitle: "Sunday Brunch Social",
		city: "Mumbai",
		usedAt: new Date("2026-04-08T11:30:00"),
		orderAmount: 1200,
		discountAmount: 240,
	},
	{
		id: "u2",
		couponId: "c1",
		userName: "Arjun Mehta",
		userEmail: "arjun@example.com",
		eventTitle: "Rooftop Networking Night",
		city: "Mumbai",
		usedAt: new Date("2026-04-07T19:00:00"),
		orderAmount: 800,
		discountAmount: 160,
	},
	{
		id: "u3",
		couponId: "c1",
		userName: "Divya Nair",
		userEmail: "divya@example.com",
		eventTitle: "Sunday Brunch Social",
		city: "Mumbai",
		usedAt: new Date("2026-04-06T10:15:00"),
		orderAmount: 1200,
		discountAmount: 240,
	},
	{
		id: "u4",
		couponId: "c2",
		userName: "Rahul Sharma",
		userEmail: "rahul@example.com",
		eventTitle: "Startup Mixer Pune",
		city: "Pune",
		usedAt: new Date("2026-04-05T18:00:00"),
		orderAmount: 500,
		discountAmount: 50,
	},
	{
		id: "u5",
		couponId: "c3",
		userName: "Meera Iyer",
		userEmail: "meera@example.com",
		eventTitle: "Comedy Night Bangalore",
		city: "Bangalore",
		usedAt: new Date("2026-03-30T20:00:00"),
		orderAmount: 600,
		discountAmount: 300,
	},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
	return date.toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

function formatTime(date: Date): string {
	return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

function formatAmount(n: number): string {
	return `₹${n.toLocaleString("en-IN")}`
}

function applicabilityLabel(coupon: Coupon): string {
	if (coupon.applicability === "ALL") return "All cities & events"
	if (coupon.applicability === "CITY") return coupon.cities.join(", ") || "—"
	return `${coupon.eventIds.length} event(s)`
}

// ─── Summary stat ─────────────────────────────────────────────────────────────

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
	return (
		<div className="flex items-start gap-2.5">
			<div className="mt-0.5 w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center shrink-0">
				<Icon size={13} className="text-neutral-dark" />
			</div>
			<div>
				<p className="text-[11px] text-neutral-light">{label}</p>
				<p className="text-sm font-medium text-foreground">{value}</p>
			</div>
		</div>
	)
}

// ─── Timeline event ───────────────────────────────────────────────────────────

function TimelineItem({ usage, isLast }: { usage: CouponUsage; isLast: boolean }) {
	return (
		<div className="flex gap-3">
			{/* Dot + line */}
			<div className="flex flex-col items-center">
				<div className="w-2 h-2 rounded-full bg-brand-red mt-1.5 shrink-0" />
				{!isLast && <div className="w-px flex-1 bg-neutral-200 mt-1" />}
			</div>

			{/* Content */}
			<div className={`pb-5 flex-1 min-w-0 ${isLast ? "" : ""}`}>
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<p className="text-xs font-semibold text-foreground truncate">{usage.userName}</p>
						<p className="text-[11px] text-neutral-light truncate">{usage.userEmail}</p>
					</div>
					<div className="text-right shrink-0">
						<p className="text-xs font-semibold text-green-700">
							−{formatAmount(usage.discountAmount)}
						</p>
						<p className="text-[11px] text-neutral-light">
							on {formatAmount(usage.orderAmount)}
						</p>
					</div>
				</div>

				<div className="mt-1.5 flex items-center gap-3 text-[11px] text-neutral-light">
					<span className="flex items-center gap-1">
						<ShoppingBag size={10} />
						{usage.eventTitle}
					</span>
					<span className="flex items-center gap-1">
						<Clock size={10} />
						{formatDate(usage.usedAt)} · {formatTime(usage.usedAt)}
					</span>
				</div>
			</div>
		</div>
	)
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type CouponUsageDrawerProps = {
	open: boolean
	onClose: () => void
	coupon: Coupon | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CouponUsageDrawer({ open, onClose, coupon }: CouponUsageDrawerProps) {
	const usage = useMemo(
		() => MOCK_USAGE.filter((u) => u.couponId === coupon?.id),
		[coupon?.id],
	)

	const totalSaved = useMemo(
		() => usage.reduce((sum, u) => sum + u.discountAmount, 0),
		[usage],
	)

	return (
		<Drawer
			open={open}
			onClose={onClose}
			title={coupon?.code ?? ""}
			description={coupon?.description ?? "Coupon details & usage history"}
			width="max-w-lg"
		>
			{coupon && (
				<div className="space-y-6">
					{/* Status */}
					<StatusBadge status={coupon.status} />

					{/* Summary grid */}
					<div className="grid grid-cols-2 gap-4">
						<Stat
							icon={coupon.discountType === "PERCENTAGE" ? Percent : IndianRupee}
							label="Discount"
							value={
								coupon.discountType === "PERCENTAGE"
									? `${coupon.discountValue}% off`
									: `₹${coupon.discountValue} flat`
							}
						/>
						<Stat
							icon={Tag}
							label="Applicability"
							value={applicabilityLabel(coupon)}
						/>
						<Stat
							icon={Users}
							label="Uses"
							value={
								coupon.maxUses === null
									? `${coupon.usedCount} (unlimited)`
									: `${coupon.usedCount} / ${coupon.maxUses}`
							}
						/>
						<Stat
							icon={Calendar}
							label="Expires"
							value={coupon.expiresAt ? formatDate(coupon.expiresAt) : "Never"}
						/>
					</div>

					{/* Total saved */}
					{usage.length > 0 && (
						<div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 flex items-center justify-between">
							<p className="text-xs font-medium text-green-800">Total discount given</p>
							<p className="text-sm font-semibold text-green-700">{formatAmount(totalSaved)}</p>
						</div>
					)}

					{/* Timeline */}
					<div>
						<p className="text-[11px] font-semibold tracking-wider uppercase text-neutral-light mb-3">
							Usage History
						</p>

						{usage.length === 0 ? (
							<p className="text-xs text-neutral-light py-4 text-center">
								No usage recorded yet.
							</p>
						) : (
							<div>
								{usage.map((u, i) => (
									<TimelineItem key={u.id} usage={u} isLast={i === usage.length - 1} />
								))}
							</div>
						)}
					</div>
				</div>
			)}

			<DrawerFooter>
				<button
					onClick={onClose}
					className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors"
				>
					Close
				</button>
			</DrawerFooter>
		</Drawer>
	)
}
