﻿"use client"

import { EventReviewDrawer, type EventAction } from "@/components/events/event-review-drawer"
import { ClearableInput } from "@/components/ui/clearable-input"
import { DataView } from "@/components/ui/data-view"
import { FilterSelect } from "@/components/ui/filter-select"
import { ChipCell, DateCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import {
	approveEvent,
	getEvents,
	rejectEvent,
	type GetEventsParams,
} from "@/lib/api/events"
import { formatDate } from "@/lib/formatters"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Event, EventStatus } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

// Constants

const PAGE_LIMIT = 20

type StatusFilter = EventStatus | "ALL"

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Under Review", value: "UNDER_REVIEW" },
	{ label: "Published", value: "PUBLISHED" },
	{ label: "Draft", value: "DRAFT" },
	{ label: "Cancelled", value: "CANCELLED" },
]

// Helpers

// Page

export default function EventsPage() {
	const router = useRouter()
	const canApprove = usePermission("event.approve")

	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [cityInput, setCityInput] = useState("")
	const [cityFilter, setCityFilter] = useState("")
	const [search, setSearch] = useState("")

	const { item: selectedEvent, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<Event>()

	const fetcher = useCallback(() => {
		const params: GetEventsParams = { page, limit: PAGE_LIMIT }
		if (statusFilter !== "ALL") params.status = statusFilter
		if (cityFilter) params.city = cityFilter
		return getEvents(params).then(r => ({ items: r.events, total: r.total ?? r.events.length }))
	}, [page, statusFilter, cityFilter])

	const {
		items: events,
		total,
		isLoading,
		error,
		refresh: fetchEvents,
	} = usePaginatedFetch(fetcher, "Failed to load events")

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return events
		return events.filter(
			e =>
				e.title.toLowerCase().includes(q) ||
				e.hostProfile.displayName.toLowerCase().includes(q) ||
				e.hostProfile.user.email.toLowerCase().includes(q),
		)
	}, [events, search])

	function handleCitySearch(e: React.FormEvent) {
		e.preventDefault()
		setPage(1)
		setCityFilter(cityInput.trim())
	}

	async function handleAction(eventId: string, action: EventAction, message?: string) {
		try {
			if (action === "approve") await approveEvent(eventId)
			else if (action === "reject") await rejectEvent(eventId, message!)

			const labels: Record<EventAction, string> = {
				approve: "Event approved",
				reject: "Event rejected",
			}
			toast.success(labels[action])
			fetchEvents()
		} catch (err: unknown) {
			const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
			const status = axiosErr?.response?.status
			if (status === 401) {
				router.replace("/login")
				throw err
			}
			if (status === 403) {
				toast.error("Permission denied", {
					description: `You don't have permission to ${action} events.`,
				})
			} else if (status === 404) {
				toast.error("Event not found")
			} else if (status === 400) {
				const msg = axiosErr?.response?.data?.message
				toast.error(`Cannot ${action} event`, {
					description: msg ?? "Event is not in the required state.",
				})
			} else {
				toast.error(`Failed to ${action} event`, {
					description: "Something went wrong. Please try again.",
				})
			}
			throw err
		}
	}

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	const columns = useMemo<ColumnDef<Event>[]>(
		() => [
			{
				id: "event",
				header: "Event",
				cell: ({ row }) => (
					<TwoLineCell primary={row.original.title} secondary={row.original.hostProfile.displayName} />
				),
			},
			{
				id: "type",
				header: "Type",
				cell: ({ row }) => <ChipCell>{row.original.eventType}</ChipCell>,
			},
			{
				id: "city",
				header: "City",
				cell: ({ row }) => <DateCell value={row.original.city} format={v => v} />,
			},
			{
				id: "eventDate",
				header: "Event Date",
				cell: ({ row }) => <DateCell value={row.original.eventDate} format={formatDate} />,
			},
			{
				id: "created",
				header: "Created",
				cell: ({ row }) => <DateCell value={row.original.createdAt} format={formatDate} secondary />,
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => <StatusCell status={row.original.status} />,
			},
		],
		[],
	)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view events." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader title="Events" description="Manage and review all events on the platform." />

			{/* Filters */}
			<div className="flex items-center gap-2 flex-wrap">
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search by title or host…"
					className="flex-1 min-w-48 max-w-xs"
				/>
				<FilterSelect
					options={STATUS_TABS}
					value={statusFilter}
					onChange={v => {
						setStatusFilter(v as StatusFilter)
						setPage(1)
					}}
				/>
				<form onSubmit={handleCitySearch}>
					<ClearableInput
						value={cityInput}
						onChange={setCityInput}
						showClear={!!cityFilter}
						onClear={() => {
							setCityInput("")
							setCityFilter("")
							setPage(1)
						}}
						placeholder="Filter by city…"
					/>
				</form>
			</div>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No events match the current filters."
				onRowClick={openDrawer}
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>

			<EventReviewDrawer
				open={drawerOpen}
				onClose={closeDrawer}
				event={selectedEvent}
				onAction={handleAction}
			/>
		</div>
	)
}
