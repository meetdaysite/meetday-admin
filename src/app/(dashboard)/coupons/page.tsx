"use client"

import { CouponUsageDrawer } from "@/components/coupons/coupon-usage-drawer"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Coupon, CouponStatus } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_COUPONS: Coupon[] = [
	{
		id: "c1",
		code: "MEET20",
		description: "20% off for Mumbai launch",
		discountType: "PERCENTAGE",
		discountValue: 20,
		applicability: "CITY",
		cities: ["Mumbai"],
		eventIds: [],
		maxUses: 100,
		usedCount: 3,
		expiresAt: new Date("2026-05-31"),
		status: "ACTIVE",
		createdAt: new Date("2026-04-01"),
		createdBy: "Aniket C.",
	},
	{
		id: "c2",
		code: "FLAT50",
		description: "₹50 flat off — Pune pilot",
		discountType: "FLAT",
		discountValue: 50,
		applicability: "CITY",
		cities: ["Pune"],
		eventIds: [],
		maxUses: 200,
		usedCount: 1,
		expiresAt: new Date("2026-06-30"),
		status: "ACTIVE",
		createdAt: new Date("2026-04-03"),
		createdBy: "Aniket C.",
	},
	{
		id: "c3",
		code: "BLROPEN",
		description: "Bangalore open beta — ₹300 flat",
		discountType: "FLAT",
		discountValue: 300,
		applicability: "CITY",
		cities: ["Bangalore"],
		eventIds: [],
		maxUses: 50,
		usedCount: 50,
		expiresAt: new Date("2026-03-31"),
		status: "EXPIRED",
		createdAt: new Date("2026-03-01"),
		createdBy: "Aniket C.",
	},
	{
		id: "c4",
		code: "ALLCITIES10",
		description: "10% off sitewide — trial",
		discountType: "PERCENTAGE",
		discountValue: 10,
		applicability: "ALL",
		cities: [],
		eventIds: [],
		maxUses: null,
		usedCount: 0,
		expiresAt: null,
		status: "DISABLED",
		createdAt: new Date("2026-03-15"),
		createdBy: "Aniket C.",
	},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
	return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function discountLabel(c: Coupon): string {
	return c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `₹${c.discountValue}`
}

function applicabilityLabel(c: Coupon): string {
	if (c.applicability === "ALL") return "All"
	if (c.applicability === "CITY") return c.cities.join(", ")
	return `${c.eventIds.length} event(s)`
}

// ─── Filter config ────────────────────────────────────────────────────────────

type StatusFilter = CouponStatus | "ALL"

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Active", value: "ACTIVE" },
	{ label: "Expired", value: "EXPIRED" },
	{ label: "Disabled", value: "DISABLED" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CouponsPage() {
	const canView   = usePermission("coupon.view")
	const canCreate = usePermission("coupon.create")

	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [search, setSearch] = useState("")
	const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		return MOCK_COUPONS
			.filter((c) => statusFilter === "ALL" || c.status === statusFilter)
			.filter(
				(c) =>
					!q ||
					c.code.toLowerCase().includes(q) ||
					(c.description ?? "").toLowerCase().includes(q),
			)
	}, [statusFilter, search])

	const activeCount = MOCK_COUPONS.filter((c) => c.status === "ACTIVE").length

	const columns = useMemo<ColumnDef<Coupon>[]>(
		() => [
			{
				id: "code",
				header: "Code",
				cell: ({ row }) => (
					<div>
						<p className="text-xs font-mono font-semibold text-foreground tracking-wide">
							{row.original.code}
						</p>
						{row.original.description && (
							<p className="text-[11px] text-neutral-light mt-0.5 truncate max-w-50">
								{row.original.description}
							</p>
						)}
					</div>
				),
			},
			{
				id: "discount",
				header: "Discount",
				cell: ({ row }) => {
					const c = row.original
					// const Icon = c.discountType === "PERCENTAGE" ? Percent : IndianRupee
					return (
						<span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
							{/* <Icon size={10} /> */}
							{discountLabel(c)}
						</span>
					)
				},
			},
			{
				id: "applicability",
				header: "Applies to",
				cell: ({ row }) => (
					<span className="text-xs text-foreground">{applicabilityLabel(row.original)}</span>
				),
			},
			{
				id: "uses",
				header: "Uses",
				accessorKey: "usedCount",
				enableSorting: true,
				cell: ({ row }) => {
					const c = row.original
					const pct = c.maxUses ? Math.round((c.usedCount / c.maxUses) * 100) : null
					return (
						<div className="space-y-1 min-w-20">
							<p className="text-xs text-foreground">
								{c.usedCount}
								{c.maxUses !== null && (
									<span className="text-neutral-light"> / {c.maxUses}</span>
								)}
							</p>
							{pct !== null && (
								<div className="h-1 w-16 rounded-full bg-neutral-100 overflow-hidden">
									<div
										className="h-full rounded-full bg-brand-red/70 transition-all"
										style={{ width: `${Math.min(pct, 100)}%` }}
									/>
								</div>
							)}
						</div>
					)
				},
			},
			{
				id: "expires",
				header: "Expires",
				accessorKey: "expiresAt",
				enableSorting: true,
				cell: ({ row }) => (
					<span className="text-xs text-neutral-dark">
						{row.original.expiresAt ? formatDate(row.original.expiresAt) : "Never"}
					</span>
				),
			},
			{
				id: "status",
				header: "Status",
				accessorKey: "status",
				enableSorting: true,
				cell: ({ row }) => <StatusBadge status={row.original.status} />,
			},
		],
		[],
	)

	if (!canView) {
		return (
			<div className="p-6 max-w-7xl mx-auto">
				<p className="text-sm text-neutral-light">
					Coupons are accessible to Super Admins only.
				</p>
			</div>
		)
	}

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<h1 className="text-base font-semibold text-foreground">Coupons</h1>
					{activeCount > 0 && (
						<span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
							{activeCount} active
						</span>
					)}
				</div>

				{canCreate && (
					<Link
						href="/coupons/new"
						className="inline-flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors"
					>
						<Plus size={13} />
						New Coupon
					</Link>
				)}
			</div>

			{/* Filters */}
			<div className="space-y-3">
				{/* Status tabs */}
				<div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
					{STATUS_TABS.map((tab) => {
						const count =
							tab.value === "ALL"
								? MOCK_COUPONS.length
								: MOCK_COUPONS.filter((c) => c.status === tab.value).length
						const active = statusFilter === tab.value
						return (
							<button
								key={tab.value}
								onClick={() => setStatusFilter(tab.value)}
								className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
									active
										? "bg-brand-red text-white"
										: "bg-neutral-100 text-neutral-dark hover:bg-neutral-200"
								}`}
							>
								{tab.label}
								<span
									className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
										active ? "bg-white/20 text-white" : "bg-white text-neutral-dark"
									}`}
								>
									{count}
								</span>
							</button>
						)
					})}
				</div>

				{/* Search */}
				<div className="relative max-w-xs">
					<Search
						size={13}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light pointer-events-none"
					/>
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by code or description…"
						className="w-full rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-2 text-xs placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
					/>
				</div>
			</div>

			{/* Table */}
			<DataTable
				columns={columns}
				data={filtered}
				onRowClick={(c) => { setSelectedCoupon(c); setDrawerOpen(true) }}
				emptyState={
					<div className="py-12 text-center text-sm text-neutral-light">
						No coupons match the current filters.
					</div>
				}
			/>

			{/* Usage history drawer */}
			<CouponUsageDrawer
				open={drawerOpen}
				onClose={() => { setDrawerOpen(false); setSelectedCoupon(null) }}
				coupon={selectedCoupon}
			/>
		</div>
	)
}
