"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { usePermission } from "@/lib/hooks/use-permission"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { EventReviewDrawer, type EventAction } from "@/components/events/event-review-drawer"
import {
	getEvents,
	approveEvent,
	rejectEvent,
	forceCancelEvent,
	type GetEventsParams,
} from "@/lib/api/events"
import type { Event, EventStatus } from "@/types"
import { formatDate } from "@/lib/formatters"

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
						{row.original.createdAt ? formatDate(row.original.createdAt) : "â€”"}
					</span>
				),
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) =>
					row.original.status ? <StatusBadge status={row.original.status} /> : "â€”",
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
			<div className="flex items-center gap-3">
				<h1 className="text-base font-semibold text-text-primary">All Events</h1>
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

				{/* Search + city */}
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
							placeholder="Search by title or host…"
							className="w-full rounded-lg border border-border-default bg-surface-canvas pl-8 pr-3 py-2 text-xs placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
						/>
					</div>
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
				<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
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
