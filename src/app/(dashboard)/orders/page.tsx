﻿"use client"

import { OrderDetailDrawer } from "@/components/orders/order-detail-drawer"
import { DataTable } from "@/components/ui/data-table"
import { ErrorBanner } from "@/components/ui/error-banner"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"
import { SearchInput } from "@/components/ui/search-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { getOrders, type GetOrdersParams } from "@/lib/api/orders"
import { formatDate } from "@/lib/formatters"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Order, OrderStatus } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useCallback, useMemo, useState } from "react"

// Constants

const PAGE_LIMIT = 20

type StatusFilter = OrderStatus | "ALL"

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Confirmed", value: "CONFIRMED" },
	{ label: "Pending Payment", value: "PENDING_PAYMENT" },
	{ label: "Cancelled", value: "CANCELLED" },
	{ label: "Refunded", value: "REFUNDED" },
]

// Helpers

// Page

export default function OrdersPage() {
	const canView = usePermission("order.view")

	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [search, setSearch] = useState("")
	const [bookingIdFilter, setBookingIdFilter] = useState("")
	const [bookingIdInput, setBookingIdInput] = useState("")
	const [fromDate, setFromDate] = useState("")
	const [toDate, setToDate] = useState("")

	const { item: selectedOrder, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<Order>()

	const fetcher = useCallback(() => {
		const params: GetOrdersParams = { page, limit: PAGE_LIMIT }
		if (statusFilter !== "ALL") params.status = statusFilter
		if (bookingIdFilter) params.bookingId = bookingIdFilter
		if (fromDate) params.from = fromDate
		if (toDate) params.to = toDate
		return getOrders(params).then(r => ({ items: r.orders, total: r.total ?? r.orders.length }))
	}, [page, statusFilter, bookingIdFilter, fromDate, toDate])

	const { items: orders, total, isLoading, error } = usePaginatedFetch(fetcher, "Failed to load orders")

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return orders
		return orders.filter(
			o =>
				o.bookingId.toLowerCase().includes(q) ||
				o.event.title.toLowerCase().includes(q) ||
				`${o.user.firstName} ${o.user.lastName}`.toLowerCase().includes(q) ||
				o.user.email.toLowerCase().includes(q),
		)
	}, [orders, search])

	function handleBookingSearch(e: React.FormEvent) {
		e.preventDefault()
		setPage(1)
		setBookingIdFilter(bookingIdInput.trim())
	}

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	const columns = useMemo<ColumnDef<Order>[]>(
		() => [
			{
				id: "booking",
				header: "Booking ID",
				cell: ({ row }) => (
					<span className="font-mono text-xs font-semibold text-text-primary">
						{row.original.bookingId}
					</span>
				),
			},
			{
				id: "event",
				header: "Event",
				cell: ({ row }) => (
					<div>
						<p className="text-xs font-semibold text-text-primary leading-none mb-0.5">
							{row.original.event.title}
						</p>
						<p className="text-[11px] text-text-tertiary">{row.original.event.city}</p>
					</div>
				),
			},
			{
				id: "attendee",
				header: "Attendee",
				cell: ({ row }) => {
					const u = row.original.user
					return (
						<div>
							<p className="text-xs font-semibold text-text-primary leading-none mb-0.5">
								{u.firstName} {u.lastName}
							</p>
							<p className="text-[11px] text-text-tertiary">{u.email}</p>
						</div>
					)
				},
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => <StatusBadge status={row.original.status} />,
			},
			{
				id: "createdAt",
				header: "Date",
				cell: ({ row }) => (
					<span className="text-xs text-text-secondary">{formatDate(row.original.createdAt)}</span>
				),
			},
		],
		[],
	)

	if (!canView) {
		return (
			<div className="p-6 max-w-7xl mx-auto">
				<p className="text-sm text-text-tertiary">You don&apos;t have permission to view orders.</p>
			</div>
		)
	}

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader title="Orders" count={total} />

			{/* Filters */}
			<div className="space-y-3">
				{/* Status tabs */}
				<FilterTabs
					options={STATUS_TABS}
					value={statusFilter}
					onChange={v => {
						setStatusFilter(v)
						setPage(1)
					}}
				/>

				{/* Search + booking ID + date range */}
				<div className="flex items-center gap-2 flex-wrap">
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search by event, attendee…"
						className="flex-1 min-w-48 max-w-xs"
					/>

					<form onSubmit={handleBookingSearch} className="flex items-center gap-1.5">
						<input
							type="text"
							value={bookingIdInput}
							onChange={e => setBookingIdInput(e.target.value)}
							placeholder="Booking ID…"
							className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors w-36 font-mono"
						/>
						{bookingIdFilter && (
							<button
								type="button"
								onClick={() => {
									setBookingIdInput("")
									setBookingIdFilter("")
									setPage(1)
								}}
								className="rounded-lg border border-border-default px-2.5 py-2 text-xs text-text-secondary hover:bg-neutral-50 transition-colors"
							>
								Clear
							</button>
						)}
					</form>

					<input
						type="date"
						value={fromDate}
						onChange={e => {
							setFromDate(e.target.value)
							setPage(1)
						}}
						className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
					/>
					<span className="text-xs text-text-tertiary">to</span>
					<input
						type="date"
						value={toDate}
						onChange={e => {
							setToDate(e.target.value)
							setPage(1)
						}}
						className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
					/>
				</div>
			</div>

			{/* Error */}
			{error ? (
				<ErrorBanner>{error}</ErrorBanner>
			) : (
				<>
					<DataTable
						columns={columns}
						data={filtered}
						isLoading={isLoading}
						onRowClick={openDrawer}
						emptyState={
							<div className="py-12 text-center text-sm text-text-tertiary">
								No orders match the current filters.
							</div>
						}
					/>

					<Pagination
						page={page}
						totalPages={totalPages}
						total={total}
						pageSize={PAGE_LIMIT}
						onPageChange={setPage}
					/>
				</>
			)}

			<OrderDetailDrawer open={drawerOpen} onClose={closeDrawer} order={selectedOrder} />
		</div>
	)
}
