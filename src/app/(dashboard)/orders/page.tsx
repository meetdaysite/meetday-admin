﻿"use client"

import { OrderDetailDrawer } from "@/components/orders/order-detail-drawer"
import { ClearableInput } from "@/components/ui/clearable-input"
import { DataView } from "@/components/ui/data-view"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { PageHeader } from "@/components/ui/page-header"
import { PermissionGuard } from "@/components/ui/permission-guard"
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

	if (!canView) return <PermissionGuard message="You don't have permission to view orders." />

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

					<form onSubmit={handleBookingSearch}>
						<ClearableInput
							value={bookingIdInput}
							onChange={setBookingIdInput}
							showClear={!!bookingIdFilter}
							onClear={() => {
								setBookingIdInput("")
								setBookingIdFilter("")
								setPage(1)
							}}
							placeholder="Booking ID…"
							inputClassName="font-mono"
						/>
					</form>

					<DateRangeFilter
						from={fromDate}
						to={toDate}
						onFromChange={v => {
							setFromDate(v)
							setPage(1)
						}}
						onToChange={v => {
							setToDate(v)
							setPage(1)
						}}
					/>
				</div>
			</div>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No orders match the current filters."
				onRowClick={openDrawer}
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>

			<OrderDetailDrawer open={drawerOpen} onClose={closeDrawer} order={selectedOrder} />
		</div>
	)
}
