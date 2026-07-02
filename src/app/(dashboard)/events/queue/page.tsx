﻿"use client"

import { EventReviewDrawer, type EventAction } from "@/components/events/event-review-drawer"
import { DataView } from "@/components/ui/data-view"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { approveEvent, forceCancelEvent, getPendingEvents, rejectEvent } from "@/lib/api/events"
import { formatDate } from "@/lib/formatters"
import { AgeDateCell, ChipCell, DateCell, TwoLineCell } from "@/components/ui/table-cells"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Event } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// Constants

// Helpers

function getDaysSince(iso: string): number {
	return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function getRowTint(event: Event): string {
	if (!event.updatedAt) return ""
	const days = getDaysSince(event.updatedAt)
	if (days <= 7) return ""
	if (days <= 21) return "border-l-4 border-amber-500"
	if (days <= 35) return "border-l-4 border-orange-500"
	return "border-l-4 border-red-500"
}

// Page

export default function EventQueuePage() {
	const router = useRouter()
	const canApprove = usePermission("event.approve")

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [events, setEvents] = useState<Event[]>([])
	const [search, setSearch] = useState("")

	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)

	const fetchEvents = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await getPendingEvents()
			setEvents(res.events)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
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
				id: "submitted",
				header: "Updated",
				cell: ({ row }) => (
					<AgeDateCell iso={row.original.updatedAt ?? undefined} getDaysSince={getDaysSince} format={formatDate} />
				),
			},
		],
		[],
	)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view the event queue." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader
				title="Event Queue"
				description="Review and approve events submitted by hosts before they go live on the platform."
			/>

			{/* Search */}
			<SearchInput
				value={search}
				onChange={setSearch}
				placeholder="Search by title or host…"
				className="max-w-xs"
			/>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No events pending review."
				onRowClick={openDrawer}
				getRowClassName={getRowTint}
			/>

			{/* Age tint legend */}
			{!error && !isLoading && filtered.length > 0 && (
				<div className="flex items-center gap-4 text-[11px] text-text-tertiary">
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
