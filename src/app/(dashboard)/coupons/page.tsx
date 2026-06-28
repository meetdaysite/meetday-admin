﻿"use client"

import { CouponUsageDrawer } from "@/components/coupons/coupon-usage-drawer"
import { CreateCouponDrawer } from "@/components/coupons/create-coupon-drawer"
import { Button } from "@/components/ui/Button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
import PageHeader from "@/components/ui/PageHeader"
import { Pagination } from "@/components/ui/pagination"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { FilterSelect } from "@/components/ui/filter-select"
import { SearchInput } from "@/components/ui/search-input"
import { ChipCell, ProgressCell, TwoLineCell } from "@/components/ui/table-cells"
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
	return c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `र ${c.discountValue}`
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
					<TwoLineCell primary={row.original.code} secondary={row.original.description} />
				),
			},
			{
				id: "target",
				header: "Target",
				cell: ({ row }) => {
					const t = row.original.target
					return (
						<ChipCell
							className={
								t === "HOST"
									? "bg-violet-50 text-violet-700 border border-violet-200"
									: "bg-sky-50 text-sky-700 border border-sky-200"
							}
						>
							{t === "HOST" ? "Host" : "Attendee"}
						</ChipCell>
					)
				},
			},
			{
				id: "discount",
				header: "Discount",
				cell: ({ row }) => (
					<ChipCell className="bg-surface-info-soft text-blue-700 border border-blue-200">
						{discountLabel(row.original)}
					</ChipCell>
				),
			},
			{
				id: "uses",
				header: "Uses",
				cell: ({ row }) => {
					const c = row.original
					const used = c.usageCount ?? c.redemptions?.length ?? 0
					return <ProgressCell used={used} max={c.maxUsages} />
				},
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => {
					const active = row.original.isActive
					return (
						<ChipCell
							className={
								active
									? "bg-green-50 text-green-700 border border-green-200"
									: "bg-neutral-50 text-neutral-700 border border-neutral-200"
							}
						>
							{active ? "Active" : "Inactive"}
						</ChipCell>
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
						<Button
							variant="secondary"
							size="sm"
							onClick={e => {
								e.stopPropagation()
								setDisableTarget(c)
							}}
						>
							Disable
						</Button>
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
			<div className="flex flex-wrap items-center gap-3">
				{/* Search */}
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search by code…"
					className="max-w-xs"
				/>

				<FilterSelect
					value={activeFilter}
					onChange={v => setActiveFilter(v as ActiveFilter)}
					options={ACTIVE_TABS}
				/>
				<FilterSelect
					value={targetFilter}
					onChange={v => setTargetFilter(v as TargetFilter)}
					options={TARGET_OPTIONS}
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
