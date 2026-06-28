﻿"use client"

import { CouponUsageDrawer } from "@/components/coupons/coupon-usage-drawer"
import { CreateCouponDrawer } from "@/components/coupons/create-coupon-drawer"
import { Button } from "@/components/ui/Button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
import PageHeader from "@/components/ui/PageHeader"
import { Pagination } from "@/components/ui/pagination"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { disableCoupon, getCoupons } from "@/lib/api/coupons"
import { extractApiErrorMessage } from "@/lib/error-handler"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Coupon, CouponTarget } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// Constants

const PAGE_LIMIT = 20

// Helpers

function discountLabel(c: Coupon): string {
	return c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `â‚¹${c.discountValue}`
}

// Filter

type ActiveFilter = "ALL" | "true" | "false"
type TargetFilter = CouponTarget | "ALL"

const ACTIVE_TABS: { label: string; value: ActiveFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Active", value: "true" },
	{ label: "Inactive", value: "false" },
]

const TARGET_OPTIONS: { label: string; value: TargetFilter }[] = [
	{ label: "All targets", value: "ALL" },
	{ label: "Host", value: "HOST" },
	{ label: "Attendee", value: "ATTENDEE" },
]

// Page

export default function CouponsPage() {
	const canView = usePermission("coupon.view")
	const canCreate = usePermission("coupon.create")

	// â"€â"€ List state â"€â"€
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [coupons, setCoupons] = useState<Coupon[]>([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)

	// â"€â"€ Filter state â"€â"€
	const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL")
	const [targetFilter, setTargetFilter] = useState<TargetFilter>("ALL")
	const [search, setSearch] = useState("")

	// â"€â"€ Drawer state â"€â"€
	const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)

	// â"€â"€ Create drawer state â"€â"€
	const [createDrawerOpen, setCreateDrawerOpen] = useState(false)

	// â"€â"€ Disable state â"€â"€
	const [disableTarget, setDisableTarget] = useState<Coupon | null>(null)
	const [isDisabling, setIsDisabling] = useState(false)

	// â"€â"€ Fetch â"€â"€
	const fetchCoupons = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await getCoupons({
				page,
				limit: PAGE_LIMIT,
				...(targetFilter !== "ALL" && { target: targetFilter }),
				...(activeFilter !== "ALL" && { isActive: activeFilter === "true" }),
			})
			setCoupons(res.coupons)
			setTotal(res.total)
		} catch {
			setError("Failed to load coupons")
			toast.error("Failed to load coupons")
		} finally {
			setIsLoading(false)
		}
	}, [page, activeFilter, targetFilter])

	useEffect(() => {
		fetchCoupons()
	}, [fetchCoupons])

	// Reset to page 1 when filters change
	useEffect(() => {
		setPage(1)
	}, [activeFilter, targetFilter])

	// â"€â"€ Disable handler â"€â"€
	async function handleDisable() {
		if (!disableTarget) return
		setIsDisabling(true)
		try {
			await disableCoupon(disableTarget.id)
			setCoupons(prev => prev.map(c => (c.id === disableTarget.id ? { ...c, isActive: false } : c)))
			// If the drawer is showing the same coupon, update its state too
			if (selectedCoupon?.id === disableTarget.id) {
				setSelectedCoupon(prev => (prev ? { ...prev, isActive: false } : prev))
			}
			setDisableTarget(null)
			toast.success("Coupon disabled", {
				description: `${disableTarget.code} has been disabled and can no longer be redeemed.`,
			})
		} catch (err) {
			const message = extractApiErrorMessage(err)
			toast.error("Failed to disable coupon", { description: message })
		} finally {
			setIsDisabling(false)
		}
	}

	// â"€â"€ Client-side search (code filter) â"€â"€
	const filtered = useMemo(() => {
		if (!search.trim()) return coupons
		const q = search.toLowerCase()
		return coupons.filter(c => c.code.toLowerCase().includes(q))
	}, [coupons, search])

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	// â"€â"€ Columns â"€â"€
	const columns = useMemo<ColumnDef<Coupon>[]>(
		() => [
			{
				id: "code",
				header: "Code",
				cell: ({ row }) => (
					<div>
						<p className="text-xs font-mono font-semibold text-text-primary tracking-wide">
							{row.original.code}
						</p>
						{row.original.description && (
							<p className="text-[11px] text-text-tertiary mt-0.5 truncate max-w-50">
								{row.original.description}
							</p>
						)}
					</div>
				),
			},
			{
				id: "target",
				header: "Target",
				cell: ({ row }) => {
					const t = row.original.target
					return (
						<span
							className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
								t === "HOST" ? "bg-purple-50 text-purple-700" : "bg-sky-50 text-sky-700"
							}`}
						>
							{t === "HOST" ? "Host" : "Attendee"}
						</span>
					)
				},
			},
			{
				id: "discount",
				header: "Discount",
				cell: ({ row }) => (
					<span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-text-primary">
						{discountLabel(row.original)}
					</span>
				),
			},
			{
				id: "uses",
				header: "Uses",
				cell: ({ row }) => {
					const c = row.original
					const used = c.usageCount ?? c.redemptions?.length ?? 0
					const pct = c.maxUsages != null ? Math.round((used / c.maxUsages) * 100) : null
					return (
						<div className="space-y-1 min-w-24">
							<p className="text-xs text-text-primary">
								{used}
								<span className="text-text-tertiary">
									{c.maxUsages != null ? ` / ${c.maxUsages}` : " / âˆž"}
								</span>
							</p>
							{pct !== null && (
								<div className="h-1 w-16 rounded-full bg-neutral-100 overflow-hidden">
									<div
										className="h-full rounded-full bg-action-primary/70 transition-all"
										style={{ width: `${Math.min(pct, 100)}%` }}
									/>
								</div>
							)}
						</div>
					)
				},
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => {
					const active = row.original.isActive
					return (
						<span
							className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
								active ? "bg-green-50 text-green-700" : "bg-neutral-100 text-text-secondary"
							}`}
						>
							{active ? "Active" : "Inactive"}
						</span>
					)
				},
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => {
					const c = row.original
					if (!c.isActive) return null
					return (
						<button
							onClick={e => {
								e.stopPropagation()
								setDisableTarget(c)
							}}
							className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-text-secondary border border-border-default hover:bg-neutral-50 hover:border-border-strong transition-colors"
						>
							Disable
						</button>
					)
				},
			},
		],
		[],
	)

	// ── Permission guard ──
	if (!canView) return <PermissionGuard message="Coupons are accessible to Super Admins only." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader
				title="Coupons"
				description="Manage the coupons for your transactions."
				buttons={
					canCreate && (
						<Button leftIcon={<Plus size={13} />} onClick={() => setCreateDrawerOpen(true)}>
							Add Coupon
						</Button>
					)
				}
			/>

			{/* Filters */}
			<div className="space-y-3">
				{/* Active status tabs + target select */}
				<div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
					{ACTIVE_TABS.map(tab => (
						<button
							key={tab.value}
							onClick={() => setActiveFilter(tab.value)}
							className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
								activeFilter === tab.value
									? "bg-action-primary text-white"
									: "bg-neutral-100 text-text-secondary hover:bg-neutral-200"
							}`}
						>
							{tab.label}
						</button>
					))}

					<div className="w-px h-4 bg-neutral-200 mx-1 shrink-0" />

					{/* Target filter */}
					<select
						value={targetFilter}
						onChange={e => setTargetFilter(e.target.value as TargetFilter)}
						className="rounded-full border border-border-default bg-surface-canvas px-3 py-1.5 text-xs font-semibold text-text-secondary focus:border-border-focus focus:outline-none transition-colors"
					>
						{TARGET_OPTIONS.map(o => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				</div>

				{/* Search */}
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search by code…"
					className="max-w-xs"
				/>
			</div>

			{/* Error state */}
			{error && !isLoading && (
				<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center justify-between">
					<span>{error}</span>
					<button
						onClick={fetchCoupons}
						className="text-xs font-semibold underline underline-offset-2"
					>
						Retry
					</button>
				</div>
			)}

			{/* Table */}
			<DataTable
				columns={columns}
				data={filtered}
				isLoading={isLoading}
				onRowClick={c => {
					setSelectedCoupon(c)
					setDrawerOpen(true)
				}}
				emptyState={
					<div className="py-12 text-center text-sm text-text-tertiary">
						No coupons match the current filters.
					</div>
				}
			/>

			{/* Pagination */}
			<Pagination
				page={page}
				totalPages={totalPages}
				total={total}
				pageSize={PAGE_LIMIT}
				onPageChange={setPage}
			/>

			{/* Create coupon drawer */}
			<CreateCouponDrawer
				open={createDrawerOpen}
				onClose={() => setCreateDrawerOpen(false)}
				onSuccess={() => {
					if (page === 1) {
						fetchCoupons()
					} else {
						setPage(1)
					}
				}}
			/>

			{/* Usage / details drawer */}
			<CouponUsageDrawer
				open={drawerOpen}
				onClose={() => {
					setDrawerOpen(false)
					setSelectedCoupon(null)
				}}
				coupon={selectedCoupon}
				onDisableSuccess={id => {
					setCoupons(prev => prev.map(c => (c.id === id ? { ...c, isActive: false } : c)))
				}}
			/>

			{/* Disable confirmation */}
			<ConfirmDialog
				open={!!disableTarget}
				onClose={() => setDisableTarget(null)}
				onConfirm={handleDisable}
				title="Disable coupon"
				description={
					disableTarget
						? `Disable ${disableTarget.code}? It will immediately stop being accepted at checkout and cannot be re-enabled from this panel.`
						: ""
				}
				confirmLabel="Disable"
				destructive
				isLoading={isDisabling}
			/>
		</div>
	)
}
