﻿"use client"

import { EventReviewDrawer, type EventAction } from "@/components/events/event-review-drawer"
import { DataTable } from "@/components/ui/data-table"
import { ErrorBanner } from "@/components/ui/error-banner"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"
import { SearchInput } from "@/components/ui/search-input"
import { StatusBadge } from "@/components/ui/status-badge"
import {
	approveEvent,
	forceCancelEvent,
	getEvents,
	rejectEvent,
	type GetEventsParams,
} from "@/lib/api/events"
import { formatDate } from "@/lib/formatters"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Event, EventStatus } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
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

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [events, setEvents] = useState<Event[]>([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)

	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [cityInput, setCityInput] = useState("")
	const [cityFilter, setCityFilter] = useState("")
	const [search, setSearch] = useState("")

	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)

	const fetchEvents = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const params: GetEventsParams = { page, limit: PAGE_LIMIT }
			if (statusFilter !== "ALL") params.status = statusFilter
			if (cityFilter) params.city = cityFilter
			const res = await getEvents(params)
			setEvents(res.events)
			setTotal(res.total ?? res.events.length)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
			if (status === 403) {
				setError("You don't have permission to view events.")
			} else {
				toast.error("Failed to load events")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [page, statusFilter, cityFilter, router])

	useEffect(() => {
		fetchEvents()
	}, [fetchEvents])

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

	function openDrawer(event: Event) {
		setSelectedEvent(event)
		setDrawerOpen(true)
	}

	function handleCitySearch(e: React.FormEvent) {
		e.preventDefault()
		setPage(1)
		setCityFilter(cityInput.trim())
	}

	async function handleAction(eventId: string, action: EventAction, message?: string) {
		try {
			if (action === "approve") await approveEvent(eventId)
			else if (action === "reject") await rejectEvent(eventId, message!)
			else if (action === "force_cancel") await forceCancelEvent(eventId, message!)

			const labels: Record<EventAction, string> = {
				approve: "Event approved",
				reject: "Event rejected",
				force_cancel: "Event force-cancelled",
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
				cell: ({ row }) => {
					const e = row.original
					return (
						<div>
							<p className="text-xs font-semibold text-text-primary leading-none mb-0.5">
								{e.title}
							</p>
							<p className="text-[11px] text-text-tertiary">{e.hostProfile.displayName}</p>
						</div>
					)
				},
			},
			{
				id: "type",
				header: "Type",
				cell: ({ row }) => (
					<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
						{row.original.eventType}
					</span>
				),
			},
			{
				id: "city",
				header: "City",
				cell: ({ row }) => <span className="text-xs text-text-primary">{row.original.city}</span>,
			},
			{
				id: "eventDate",
				header: "Event Date",
				cell: ({ row }) => (
					<span className="text-xs text-text-primary">{formatDate(row.original.eventDate)}</span>
				),
			},
			{
				id: "created",
				header: "Created",
				cell: ({ row }) => (
					<span className="text-xs text-text-secondary">
						{row.original.createdAt ? formatDate(row.original.createdAt) : "-"}
					</span>
				),
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => (row.original.status ? <StatusBadge status={row.original.status} /> : "-"),
			},
		],
		[],
	)

	if (!canApprove) {
		return (
			<div className="p-6 max-w-7xl mx-auto">
				<p className="text-sm text-text-tertiary">You don&apos;t have permission to view events.</p>
			</div>
		)
	}

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader title="All Events" count={total} />

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

				{/* Search + city */}
				<div className="flex items-center gap-2 flex-wrap">
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search by title or host…"
						className="flex-1 min-w-48 max-w-xs"
					/>
					<form onSubmit={handleCitySearch} className="flex items-center gap-1.5">
						<input
							type="text"
							value={cityInput}
							onChange={e => setCityInput(e.target.value)}
							placeholder="Filter by city…"
							className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors w-36"
						/>
						{cityFilter && (
							<button
								type="button"
								onClick={() => {
									setCityInput("")
									setCityFilter("")
									setPage(1)
								}}
								className="rounded-lg border border-border-default px-2.5 py-2 text-xs text-text-secondary hover:bg-neutral-50 transition-colors"
							>
								Clear
							</button>
						)}
					</form>
				</div>
			</div>

			{/* Error state */}
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
								No events match the current filters.
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

			<EventReviewDrawer
				open={drawerOpen}
				onClose={() => {
					setDrawerOpen(false)
					setSelectedEvent(null)
				}}
				event={selectedEvent}
				onAction={handleAction}
			/>
		</div>
	)
}
