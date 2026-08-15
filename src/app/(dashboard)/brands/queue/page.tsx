"use client"

import { BrandReviewDrawer } from "@/components/brands/brand-review-drawer"
import { DataView } from "@/components/ui/data-view"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { getPendingBrands } from "@/lib/api/brands"
import { formatDate, getDaysSince } from "@/lib/formatters"
import { AgeDateCell, ChipCell, TwoLineCell } from "@/components/ui/table-cells"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Brand } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useCallback, useMemo, useState } from "react"

const PAGE_LIMIT = 20

export default function BrandQueuePage() {
	const canApprove = usePermission("sponsorship.approve")

	const [page, setPage] = useState(1)
	const [search, setSearch] = useState("")

	const { item: selectedBrand, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<Brand>()

	const fetcher = useCallback(
		() => getPendingBrands({ page, limit: PAGE_LIMIT }).then((r) => ({ items: r.brands, total: r.total })),
		[page],
	)

	const {
		items: brands,
		total,
		isLoading,
		error,
		refresh: fetchBrands,
	} = usePaginatedFetch(fetcher, "Failed to load pending brands")

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
				id: "submitted",
				header: "Submitted",
				cell: ({ row }) => (
					<AgeDateCell iso={row.original.createdAt} getDaysSince={getDaysSince} format={formatDate} />
				),
			},
		],
		[],
	)

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view the brand queue." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="Brand Queue"
				description="Review and approve brand profiles submitted for approval, oldest first."
			/>

			<SearchInput
				value={search}
				onChange={setSearch}
				placeholder="Search by name or email…"
				className="max-w-xs"
			/>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No brands are awaiting approval."
				onRowClick={openDrawer}
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>

			<BrandReviewDrawer open={drawerOpen} onClose={closeDrawer} brand={selectedBrand} onRefresh={fetchBrands} />
		</div>
	)
}
