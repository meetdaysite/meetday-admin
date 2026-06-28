"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { usePermission } from "@/lib/hooks/use-permission"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { OrderDetailDrawer } from "@/components/orders/order-detail-drawer"
import { getOrders, type GetOrdersParams } from "@/lib/api/orders"
import type { Order, OrderStatus } from "@/types"
import { formatDate } from "@/lib/formatters"

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
	const router = useRouter()
	const canView = usePermission("order.view")

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [orders, setOrders] = useState<Order[]>([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)

	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [search, setSearch] = useState("")
	const [bookingIdFilter, setBookingIdFilter] = useState("")
	const [bookingIdInput, setBookingIdInput] = useState("")
	const [fromDate, setFromDate] = useState("")
	const [toDate, setToDate] = useState("")

	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)

	const fetchOrders = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const params: GetOrdersParams = { page, limit: PAGE_LIMIT }
			if (statusFilter !== "ALL") params.status = statusFilter
			if (bookingIdFilter) params.bookingId = bookingIdFilter
			if (fromDate) params.from = fromDate
			if (toDate) params.to = toDate
			const res = await getOrders(params)
			setOrders(res.orders)
			setTotal(res.total ?? res.orders.length)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
			if (status === 403) {
				setError("You don't have permission to view orders.")
			} else {
				toast.error("Failed to load orders")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [page, statusFilter, bookingIdFilter, fromDate, toDate, router])

	useEffect(() => {
		fetchOrders()
	}, [fetchOrders])

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
			<div className="flex items-center gap-3">
				<h1 className="text-base font-semibold text-text-primary">Orders</h1>
				<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
					{total}
				</span>
			</div>

			{/* Filters */}
			<div className="space-y-3">
				{/* Status tabs */}
				<div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
					{STATUS_TABS.map(tab => {
						const active = statusFilter === tab.value
						return (
							<button
								key={tab.value}
								onClick={() => {
									setStatusFilter(tab.value)
									setPage(1)
								}}
								className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
									active
										? "bg-action-primary text-white"
										: "bg-neutral-100 text-text-secondary hover:bg-neutral-200"
								}`}
							>
								{tab.label}
							</button>
						)
					})}
				</div>

				{/* Search + booking ID + date range */}
				<div className="flex items-center gap-2 flex-wrap">
					<div className="relative flex-1 min-w-48 max-w-xs">
						<Search
							size={13}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
						/>
						<input
							type="text"
							value={search}
							onChange={e => setSearch(e.target.value)}
							placeholder="Search by event, attendee…"
							className="w-full rounded-lg border border-border-default bg-surface-canvas pl-8 pr-3 py-2 text-xs placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
						/>
					</div>

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
				<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			) : (
				<>
					<DataTable
						columns={columns}
						data={filtered}
						isLoading={isLoading}
						onRowClick={order => {
							setSelectedOrder(order)
							setDrawerOpen(true)
						}}
						emptyState={
							<div className="py-12 text-center text-sm text-text-tertiary">
								No orders match the current filters.
							</div>
						}
					/>

					{totalPages > 1 && (
						<div className="flex items-center justify-between text-xs text-text-tertiary">
							<span>
								Showing {(page - 1) * PAGE_LIMIT + 1}â€“{Math.min(page * PAGE_LIMIT, total)}{" "}
								of {total}
							</span>
							<div className="flex items-center gap-2">
								<button
									disabled={page === 1}
									onClick={() => setPage(p => p - 1)}
									className="rounded-md px-2.5 py-1 text-xs font-medium border border-border-default hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
								>
									Previous
								</button>
								<span className="font-medium text-text-primary">
									{page} / {totalPages}
								</span>
								<button
									disabled={page >= totalPages}
									onClick={() => setPage(p => p + 1)}
									className="rounded-md px-2.5 py-1 text-xs font-medium border border-border-default hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
								>
									Next
								</button>
							</div>
						</div>
					)}
				</>
			)}

			<OrderDetailDrawer
				open={drawerOpen}
				onClose={() => {
					setDrawerOpen(false)
					setSelectedOrder(null)
				}}
				order={selectedOrder}
			/>
		</div>
	)
}
