"use client"

import { TicketDetailDrawer } from "@/components/support-tickets/ticket-detail-drawer"
import { ResolveDialog, CloseDialog } from "@/components/support-tickets/ticket-action-dialogs"
import { DataView } from "@/components/ui/data-view"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { FilterSelect } from "@/components/ui/filter-select"
import { DateCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { getSupportTickets, type GetSupportTicketsParams } from "@/lib/api/support-tickets"
import { formatDate } from "@/lib/formatters"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type {
	SupportTicket,
	TicketStatus,
	TicketPriority,
	TicketCategory,
} from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { CheckCircle, XCircle } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

const PRIORITY_ROW_CLASS: Record<string, string> = {
	URGENT: "border-l-3 border-l-red-500",
	HIGH:   "border-l-3 border-l-orange-500",
	NORMAL: "border-l-3 border-l-blue-500",
	LOW:    "border-l-3 border-l-green-500",
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20

type StatusFilter = TicketStatus | "ALL"
type PriorityFilter = TicketPriority | "ALL"
type CategoryFilter = TicketCategory | "ALL"

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
	{ label: "All Statuses", value: "ALL" },
	{ label: "Open", value: "OPEN" },
	{ label: "In Progress", value: "IN_PROGRESS" },
	{ label: "Resolved", value: "RESOLVED" },
	{ label: "Closed", value: "CLOSED" },
]

const PRIORITY_OPTIONS: { label: string; value: PriorityFilter }[] = [
	{ label: "All Priorities", value: "ALL" },
	{ label: "Urgent", value: "URGENT" },
	{ label: "High", value: "HIGH" },
	{ label: "Normal", value: "NORMAL" },
	{ label: "Low", value: "LOW" },
]

const CATEGORY_OPTIONS: { label: string; value: CategoryFilter }[] = [
	{ label: "All Categories", value: "ALL" },
	{ label: "Refund Request", value: "REFUND_REQUEST" },
	{ label: "Account Issue", value: "ACCOUNT_ISSUE" },
	{ label: "Event Issue", value: "EVENT_ISSUE" },
	{ label: "Payment Issue", value: "PAYMENT_ISSUE" },
	{ label: "Community Issue", value: "COMMUNITY_ISSUE" },
	{ label: "Host Issue", value: "HOST_ISSUE" },
	{ label: "Other", value: "OTHER" },
]

const CATEGORY_LABELS: Record<TicketCategory, string> = {
	REFUND_REQUEST: "Refund Request",
	ACCOUNT_ISSUE: "Account Issue",
	EVENT_ISSUE: "Event Issue",
	PAYMENT_ISSUE: "Payment Issue",
	COMMUNITY_ISSUE: "Community Issue",
	HOST_ISSUE: "Host Issue",
	OTHER: "Other",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportTicketsPage() {
	const canView = usePermission("support.view")

	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL")
	const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL")
	const [fromDate, setFromDate] = useState("")
	const [toDate, setToDate] = useState("")
	const [search, setSearch] = useState("")

	const { item: selectedTicket, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<SupportTicket>()

	const fetcher = useCallback(() => {
		const params: GetSupportTicketsParams = { page, limit: PAGE_LIMIT }
		if (statusFilter !== "ALL") params.status = statusFilter
		if (priorityFilter !== "ALL") params.priority = priorityFilter
		if (categoryFilter !== "ALL") params.category = categoryFilter
		if (fromDate) params.from = fromDate
		if (toDate) params.to = toDate
		return getSupportTickets(params).then(r => ({ items: r.items, total: r.total ?? r.items.length }))
	}, [page, statusFilter, priorityFilter, categoryFilter, fromDate, toDate])

	const { items: tickets, total, isLoading, error, refresh } = usePaginatedFetch(fetcher, "Failed to load support tickets")

	type ActionState = { ticket: SupportTicket; action: "resolve" | "close" } | null
	const [actionState, setActionState] = useState<ActionState>(null)

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return tickets
		return tickets.filter(
			t =>
				t.ticketNumber.toLowerCase().includes(q) ||
				t.subject.toLowerCase().includes(q) ||
				t.reporter.email.toLowerCase().includes(q) ||
				`${t.reporter.firstName} ${t.reporter.lastName}`.toLowerCase().includes(q),
		)
	}, [tickets, search])

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	const columns = useMemo<ColumnDef<SupportTicket>[]>(
		() => [
			{
				id: "ticketNumber",
				header: "Ticket #",
				cell: ({ row }) => (
					<DateCell value={row.original.ticketNumber} format={v => v} />
				),
			},
			{
				id: "subject",
				header: "Subject",
				cell: ({ row }) => (
					<TwoLineCell
						primary={row.original.subject}
						secondary={CATEGORY_LABELS[row.original.category]}
					/>
				),
			},
			{
				id: "reporter",
				header: "Reporter",
				cell: ({ row }) => {
					const r = row.original.reporter
					return (
						<TwoLineCell
							primary={`${r.firstName} ${r.lastName}`}
							secondary={r.email}
						/>
					)
				},
			},
			{
				id: "priority",
				header: "Priority",
				cell: ({ row }) => <StatusCell status={row.original.priority} />,
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => <StatusCell status={row.original.status} />,
			},
			{
				id: "createdAt",
				header: "Created",
				cell: ({ row }) => (
					<DateCell value={row.original.createdAt} format={formatDate} secondary />
				),
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => {
					const t = row.original
					const isTerminal = t.status === "RESOLVED" || t.status === "CLOSED"
					const canClose = t.status !== "CLOSED"
					if (!canClose && isTerminal) return null
					return (
						<div
							className="flex items-center gap-1.5"
							onClick={e => e.stopPropagation()}
						>
							{!isTerminal && (
								<button
									onClick={() => setActionState({ ticket: t, action: "resolve" })}
									className="flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100 transition-colors"
								>
									<CheckCircle size={11} />
									Resolve
								</button>
							)}
							{canClose && (
								<button
									onClick={() => setActionState({ ticket: t, action: "close" })}
									className="flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 transition-colors"
								>
									<XCircle size={11} />
									Close
								</button>
							)}
						</div>
					)
				},
			},
		],
		[],
	)

	if (!canView) return <PermissionGuard message="You don't have permission to view support tickets." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader title="Support Tickets" description="View and manage support tickets raised by users." />

			<div className="flex items-center gap-2 flex-wrap">
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search by ticket #, subject, reporter…"
					className="flex-1 min-w-48 max-w-xs"
				/>

				<FilterSelect
					options={STATUS_OPTIONS}
					value={statusFilter}
					onChange={v => {
						setStatusFilter(v as StatusFilter)
						setPage(1)
					}}
				/>

				<FilterSelect
					options={PRIORITY_OPTIONS}
					value={priorityFilter}
					onChange={v => {
						setPriorityFilter(v as PriorityFilter)
						setPage(1)
					}}
				/>

				<FilterSelect
					options={CATEGORY_OPTIONS}
					value={categoryFilter}
					onChange={v => {
						setCategoryFilter(v as CategoryFilter)
						setPage(1)
					}}
				/>

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

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No support tickets match the current filters."
				onRowClick={openDrawer}
				getRowClassName={row => PRIORITY_ROW_CLASS[row.priority] ?? ""}
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>

			<TicketDetailDrawer open={drawerOpen} onClose={closeDrawer} ticket={selectedTicket} />

			<ResolveDialog
				open={actionState?.action === "resolve"}
				ticket={actionState?.ticket ?? null}
				onClose={() => setActionState(null)}
				onResolved={() => { setActionState(null); refresh() }}
			/>

			<CloseDialog
				open={actionState?.action === "close"}
				ticket={actionState?.ticket ?? null}
				onClose={() => setActionState(null)}
				onClosed={() => { setActionState(null); refresh() }}
			/>
		</div>
	)
}
