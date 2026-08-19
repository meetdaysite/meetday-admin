"use client"

import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { DataView } from "@/components/ui/data-view"
import { FilterSelect } from "@/components/ui/filter-select"
import { ChipCell, DateCell, TwoLineCell } from "@/components/ui/table-cells"
import { SearchInput } from "@/components/ui/search-input"
import { getBrands } from "@/lib/api/brands"
import { formatDate } from "@/lib/formatters"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Brand, BrandProfileStatus } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useCallback, useMemo, useState } from "react"
import { StatusBadge } from "@/components/ui/status-badge"
import { BrandReviewDrawer } from "@/components/brands/brand-review-drawer"

const PAGE_LIMIT = 20

type ProfileFilter = BrandProfileStatus | "ALL"

const STATUS_TABS: { label: string; value: ProfileFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Complete Profile", value: "COMPLETE" },
	{ label: "Incomplete Profile", value: "INCOMPLETE" },
]

function CompletenessBadge({ isProfileComplete }: { isProfileComplete: boolean }) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
				isProfileComplete ? "bg-status-success-bg text-status-success-text" : "bg-surface-warning-soft text-text-warning"
			}`}
		>
			{isProfileComplete ? "Complete" : "Incomplete"}
		</span>
	)
}

export default function BrandsPage() {
	const canView = usePermission("sponsorship.approve")

	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<ProfileFilter>("ALL")
	const [search, setSearch] = useState("")

	const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)

	const fetcher = useCallback(
		() =>
			getBrands({
				page,
				limit: PAGE_LIMIT,
				...(statusFilter !== "ALL" && { profileStatus: statusFilter }),
			}).then((r) => ({ items: r.brands, total: r.total })),
		[page, statusFilter],
	)

	const { items: brands, total, isLoading, error, refresh } = usePaginatedFetch(fetcher, "Failed to load brands")

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return brands
		return brands.filter(
			(b) =>
				b.brandName.toLowerCase().includes(q) ||
				(b.user.email ?? "").toLowerCase().includes(q) ||
				`${b.user.firstName} ${b.user.lastName}`.toLowerCase().includes(q),
		)
	}, [brands, search])

	const columns = useMemo<ColumnDef<Brand>[]>(
		() => [
			{
				id: "logo",
				header: "Logo",
				cell: ({ row }) => {
					const b = row.original
					return b.logoUrl ? (
						<img
							src={b.logoUrl}
							alt={b.brandName}
							className="size-8 rounded-lg object-cover border-2 border-black"
						/>
					) : (
						<div className="size-8 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-xs border-2 border-black text-neutral-700 select-none">
							{b.brandName.slice(0, 2).toUpperCase()}
						</div>
					)
				},
			},
			{
				id: "brand",
				header: "Brand",
				cell: ({ row }) => {
					const b = row.original
					return (
						<TwoLineCell
							primary={b.brandName}
							secondary={`${b.user.firstName} ${b.user.lastName} · ${b.user.email ?? b.user.phone ?? "—"}`}
						/>
					)
				},
			},
			{
				id: "categories",
				header: "Categories",
				cell: ({ row }) => {
					const cats = row.original.categories
					if (!cats.length) return <span className="text-[11px] text-text-tertiary">—</span>
					return (
						<span className="text-xs text-text-primary">
							{cats.slice(0, 2).map((c) => c.name).join(", ")}
							{cats.length > 2 && <span className="text-text-tertiary"> +{cats.length - 2}</span>}
						</span>
					)
				},
			},
			{
				id: "social",
				header: "Social Links",
				cell: ({ row }) => {
					const links = row.original.socialLinks ?? {}
					const count = Object.values(links).filter(Boolean).length
					if (!count) return <span className="text-[11px] text-text-tertiary">—</span>
					return <ChipCell>{count} link{count > 1 ? "s" : ""}</ChipCell>
				},
			},
			{
				id: "profileStatus",
				header: "Profile",
				cell: ({ row }) => <CompletenessBadge isProfileComplete={row.original.isProfileComplete} />,
			},
			{
				id: "approvalStatus",
				header: "Approval",
				cell: ({ row }) => <StatusBadge status={row.original.approvalStatus} />,
			},
			{
				id: "joined",
				header: "Joined",
				cell: ({ row }) => <DateCell value={row.original.createdAt} format={formatDate} secondary />,
			},
		],
		[],
	)

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	if (!canView) return <PermissionGuard message="You don't have permission to view brands." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader title="All Brands" description="Every brand account signed up on the platform." />

			<div className="flex items-center gap-2 flex-wrap">
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search by name or email…"
					className="flex-1 min-w-48 max-w-xs"
				/>
				<FilterSelect
					value={statusFilter}
					onChange={(v) => {
						setStatusFilter(v as ProfileFilter)
						setPage(1)
					}}
					options={STATUS_TABS}
				/>
			</div>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No brands found."
				onRowClick={(brand) => {
					setSelectedBrand(brand)
					setDrawerOpen(true)
				}}
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>

			<BrandReviewDrawer
				open={drawerOpen}
				onClose={() => {
					setDrawerOpen(false)
					setSelectedBrand(null)
				}}
				brand={selectedBrand}
				onRefresh={refresh}
			/>
		</div>
	)
}
