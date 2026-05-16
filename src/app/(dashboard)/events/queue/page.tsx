"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { usePermission } from "@/lib/hooks/use-permission"
import { DataTable } from "@/components/ui/data-table"
import { EventReviewDrawer, type EventAction } from "@/components/events/event-review-drawer"
import { getPendingEvents, approveEvent, rejectEvent, forceCancelEvent } from "@/lib/api/events"
import type { Event } from "@/types"

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysSince(iso: string): number {
	return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function formatEventDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function getRowTint(event: Event): string {
	if (!event.updatedAt) return ""
	const days = getDaysSince(event.updatedAt)
	if (days >= 14) return "bg-orange-50"
	if (days >= 7) return "bg-amber-50"
	return ""
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventQueuePage() {
	const router = useRouter()
	const canApprove = usePermission("event.approve")

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [events, setEvents] = useState<Event[]>([])
	const [total, setTotal] = useState(0)
	const [search, setSearch] = useState("")

	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)

	const fetchEvents = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await getPendingEvents()
			setEvents(res.events)
			setTotal(res.total ?? res.events.length)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) { router.replace("/login"); return }
			if (status === 403) {
				setError("You don't have permission to view the event queue.")
			} else {
				toast.error("Failed to load events")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [router])

	useEffect(() => {
		fetchEvents()
	}, [fetchEvents])

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return events
		return events.filter(
			(e) =>
				e.title.toLowerCase().includes(q) ||
				e.hostProfile.displayName.toLowerCase().includes(q) ||
				e.hostProfile.user.email.toLowerCase().includes(q),
		)
	}, [events, search])

	function openDrawer(event: Event) {
		setSelectedEvent(event)
		setDrawerOpen(true)
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
			if (status === 401) { router.replace("/login"); throw err }
			if (status === 403) {
				toast.error("Permission denied", { description: `You don't have permission to ${action} events.` })
			} else if (status === 404) {
				toast.error("Event not found")
			} else if (status === 400) {
				const msg = axiosErr?.response?.data?.message
				toast.error(`Cannot ${action} event`, { description: msg ?? "Event is not in the required state." })
			} else {
				toast.error(`Failed to ${action} event`, { description: "Something went wrong. Please try again." })
			}
			throw err
		}
	}

	const columns = useMemo<ColumnDef<Event>[]>(
		() => [
			{
				id: "event",
				header: "Event",
				cell: ({ row }) => {
					const e = row.original
					return (
						<div>
							<p className="text-xs font-semibold text-foreground leading-none mb-0.5">{e.title}</p>
							<p className="text-[11px] text-neutral-light">{e.hostProfile.displayName}</p>
						</div>
					)
				},
			},
			{
				id: "type",
				header: "Type",
				cell: ({ row }) => (
					<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-dark">
						{row.original.eventType}
					</span>
				),
			},
			{
				id: "city",
				header: "City",
				cell: ({ row }) => (
					<span className="text-xs text-foreground">{row.original.city}</span>
				),
			},
			{
				id: "eventDate",
				header: "Event Date",
				cell: ({ row }) => (
					<span className="text-xs text-foreground">{formatEventDate(row.original.eventDate)}</span>
				),
			},
			{
				id: "submitted",
				header: "Updated",
				cell: ({ row }) => {
					const days = getDaysSince(row.original.updatedAt)
					const ageColor =
						days >= 14 ? "text-orange-600" : days >= 7 ? "text-amber-600" : "text-neutral-light"
					return (
						<div>
							<p className="text-xs text-neutral-dark">{formatDate(row.original.updatedAt)}</p>
							<p className={`text-[11px] font-medium ${ageColor}`}>
								{days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`}
							</p>
						</div>
					)
				},
			},
		],
		[],
	)

	if (!canApprove) {
		return (
			<div className="p-6 max-w-7xl mx-auto">
				<p className="text-sm text-neutral-light">
					You don&apos;t have permission to view the event queue.
				</p>
			</div>
		)
	}

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center gap-3">
				<h1 className="text-base font-semibold text-foreground">Event Queue</h1>
				{total > 0 && (
					<span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
						{total} pending
					</span>
				)}
			</div>

			{/* Search */}
			<div className="relative max-w-xs">
				<Search
					size={13}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light pointer-events-none"
				/>
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search by title or host…"
					className="w-full rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-2 text-xs placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
				/>
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
						getRowClassName={getRowTint}
						emptyState={
							<div className="py-12 text-center text-sm text-neutral-light">
								No events pending review.
							</div>
						}
					/>

					{/* Age tint legend */}
					{!isLoading && filtered.length > 0 && (
						<div className="flex items-center gap-4 text-[11px] text-neutral-light">
							<span className="font-medium">Row colour:</span>
							<span className="flex items-center gap-1.5">
								<span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-200" />
								7–13 days pending
							</span>
							<span className="flex items-center gap-1.5">
								<span className="w-3 h-3 rounded-sm bg-orange-100 border border-orange-200" />
								14+ days pending
							</span>
						</div>
					)}
				</>
			)}

			<EventReviewDrawer
				open={drawerOpen}
				onClose={() => { setDrawerOpen(false); setSelectedEvent(null) }}
				event={selectedEvent}
				onAction={handleAction}
			/>
		</div>
	)
}
