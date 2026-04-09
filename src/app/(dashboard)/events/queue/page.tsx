"use client"

import { useMemo, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Search } from "lucide-react"
import { usePermission } from "@/lib/hooks/use-permission"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { EventReviewDrawer, type EventAction } from "@/components/events/event-review-drawer"
import type { Event, EventStatus } from "@/types"

// ─── Mock data ────────────────────────────────────────────────────────────────
// Dates relative to today (2026-04-09)

const MOCK_EVENTS: Event[] = [
	{
		id: "1",
		title: "Mumbai Salsa Night Vol. 3",
		hostName: "Rahul Sharma",
		hostEmail: "rahul@example.com",
		city: "Mumbai",
		date: new Date("2026-05-10"),
		coverImage: "https://images.unsplash.com/photo-1504609813442-a9924e2d7f47?w=800&q=80",
		status: "PENDING",
		ticketTiers: [
			{ id: "t1a", name: "Early Bird", price: 499, capacity: 50 },
			{ id: "t1b", name: "Regular", price: 799, capacity: 100 },
			{ id: "t1c", name: "VIP", price: 1499, capacity: 20 },
		],
		submittedAt: new Date("2026-04-07"), // 2 days ago
	},
	{
		id: "2",
		title: "Bangalore Indie Brunch",
		hostName: "Priya Verma",
		hostEmail: "priya@example.com",
		city: "Bangalore",
		date: new Date("2026-05-18"),
		coverImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
		status: "PENDING",
		ticketTiers: [
			{ id: "t2a", name: "Standard", price: 650, capacity: 80 },
		],
		submittedAt: new Date("2026-04-04"), // 5 days ago
	},
	{
		id: "3",
		title: "Pune Startup Demo Day",
		hostName: "Arjun Mehta",
		hostEmail: "arjun@example.com",
		city: "Pune",
		date: new Date("2026-05-25"),
		coverImage: null,
		status: "PENDING",
		ticketTiers: [
			{ id: "t3a", name: "Attendee", price: 0, capacity: 200 },
			{ id: "t3b", name: "Exhibitor", price: 2000, capacity: 30 },
		],
		submittedAt: new Date("2026-03-30"), // 10 days ago — amber tint
	},
	{
		id: "4",
		title: "Chennai Jazz Evening",
		hostName: "Divya Nair",
		hostEmail: "divya@example.com",
		city: "Chennai",
		date: new Date("2026-06-01"),
		coverImage: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80",
		status: "PENDING",
		ticketTiers: [
			{ id: "t4a", name: "General", price: 399, capacity: 150 },
			{ id: "t4b", name: "Premium", price: 899, capacity: 40 },
		],
		submittedAt: new Date("2026-03-22"), // 18 days ago — orange tint
	},
	{
		id: "5",
		title: "Delhi Tech & Chill",
		hostName: "Sameer Khan",
		hostEmail: "sameer@example.com",
		city: "Delhi",
		date: new Date("2026-05-30"),
		coverImage: null,
		status: "EDIT_REQUESTED",
		ticketTiers: [
			{ id: "t5a", name: "Free Entry", price: 0, capacity: 120 },
		],
		submittedAt: new Date("2026-03-25"), // 15 days ago
	},
	{
		id: "6",
		title: "Hyderabad Foodie Walk",
		hostName: "Anita Roy",
		hostEmail: "anita@example.com",
		city: "Hyderabad",
		date: new Date("2026-05-14"),
		coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
		status: "APPROVED",
		ticketTiers: [
			{ id: "t6a", name: "Walker", price: 299, capacity: 60 },
		],
		submittedAt: new Date("2026-03-15"),
	},
	{
		id: "7",
		title: "Mumbai Rooftop Rave",
		hostName: "Vikram Singh",
		hostEmail: "vikram@example.com",
		city: "Mumbai",
		date: new Date("2026-05-20"),
		coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
		status: "REJECTED",
		ticketTiers: [
			{ id: "t7a", name: "General", price: 999, capacity: 200 },
		],
		submittedAt: new Date("2026-03-10"),
	},
	{
		id: "8",
		title: "Bangalore Pottery Workshop",
		hostName: "Meera Iyer",
		hostEmail: "meera@example.com",
		city: "Bangalore",
		date: new Date("2026-05-08"),
		coverImage: null,
		status: "PENDING",
		ticketTiers: [
			{ id: "t8a", name: "Beginner", price: 1200, capacity: 15 },
			{ id: "t8b", name: "Advanced", price: 1800, capacity: 10 },
		],
		submittedAt: new Date("2026-04-08"), // 1 day ago
	},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDays(date: Date): number {
	return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(date: Date): string {
	return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function getRowTint(event: Event): string {
	if (event.status !== "PENDING" && event.status !== "EDIT_REQUESTED") return ""
	if (event.status === "EDIT_REQUESTED") return "bg-sky-50/60"
	const days = getDays(event.submittedAt)
	if (days >= 14) return "bg-orange-50"
	if (days >= 7) return "bg-amber-50"
	return ""
}

// ─── Filter config ────────────────────────────────────────────────────────────

type StatusFilter = EventStatus | "ALL"

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Pending", value: "PENDING" },
	{ label: "Edit Requested", value: "EDIT_REQUESTED" },
	{ label: "Approved", value: "APPROVED" },
	{ label: "Rejected", value: "REJECTED" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventQueuePage() {
	const canApprove = usePermission("event.approve")

	const [events, setEvents] = useState<Event[]>(MOCK_EVENTS)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [cityFilter, setCityFilter] = useState("ALL")
	const [search, setSearch] = useState("")

	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)

	const cities = useMemo(
		() => Array.from(new Set(events.map((e) => e.city))).sort(),
		[events],
	)

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		return events
			.filter((e) => statusFilter === "ALL" || e.status === statusFilter)
			.filter((e) => cityFilter === "ALL" || e.city === cityFilter)
			.filter(
				(e) =>
					!q ||
					e.title.toLowerCase().includes(q) ||
					e.hostName.toLowerCase().includes(q) ||
					e.hostEmail.toLowerCase().includes(q),
			)
	}, [events, statusFilter, cityFilter, search])

	const pendingCount = events.filter(
		(e) => e.status === "PENDING" || e.status === "EDIT_REQUESTED",
	).length

	function openDrawer(event: Event) {
		setSelectedEvent(event)
		setDrawerOpen(true)
	}

	async function handleAction(eventId: string, action: EventAction) {
		const statusMap: Record<EventAction, EventStatus> = {
			approve: "APPROVED",
			reject: "REJECTED",
			request_edit: "EDIT_REQUESTED",
		}
		// Optimistic update
		setEvents((prev) =>
			prev.map((e) => (e.id === eventId ? { ...e, status: statusMap[action] } : e)),
		)
		// TODO: replace with real API call
		await new Promise((r) => setTimeout(r, 800))
	}

	const columns = useMemo<ColumnDef<Event>[]>(
		() => [
			{
				id: "event",
				header: "Event",
				cell: ({ row }) => (
					<div>
						<p className="text-xs font-semibold text-foreground leading-none mb-0.5">
							{row.original.title}
						</p>
						<p className="text-[11px] text-neutral-light">{row.original.hostName}</p>
					</div>
				),
			},
			{
				id: "city",
				header: "City",
				accessorKey: "city",
				enableSorting: true,
				cell: ({ row }) => (
					<span className="text-xs text-foreground">{row.original.city}</span>
				),
			},
			{
				id: "eventDate",
				header: "Event Date",
				accessorKey: "date",
				enableSorting: true,
				cell: ({ row }) => (
					<span className="text-xs text-foreground">{formatDate(row.original.date)}</span>
				),
			},
			{
				id: "submitted",
				header: "Submitted",
				accessorKey: "submittedAt",
				enableSorting: true,
				cell: ({ row }) => {
					const days = getDays(row.original.submittedAt)
					const ageColor =
						days >= 14
							? "text-orange-600"
							: days >= 7
								? "text-amber-600"
								: "text-neutral-light"
					return (
						<div>
							<p className="text-xs text-neutral-dark">
								{formatDate(row.original.submittedAt)}
							</p>
							<p className={`text-[11px] font-medium ${ageColor}`}>
								{days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`}
							</p>
						</div>
					)
				},
			},
			{
				id: "status",
				header: "Status",
				accessorKey: "status",
				enableSorting: true,
				cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
				{pendingCount > 0 && (
					<span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
						{pendingCount} pending
					</span>
				)}
			</div>

			{/* Filters */}
			<div className="space-y-3">
				{/* Status tabs */}
				<div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
					{STATUS_TABS.map((tab) => {
						const count =
							tab.value === "ALL"
								? events.length
								: events.filter((e) => e.status === tab.value).length
						const active = statusFilter === tab.value
						return (
							<button
								key={tab.value}
								onClick={() => setStatusFilter(tab.value)}
								className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
									active
										? "bg-brand-red text-white"
										: "bg-neutral-100 text-neutral-dark hover:bg-neutral-200"
								}`}
							>
								{tab.label}
								<span
									className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
										active ? "bg-white/20 text-white" : "bg-white text-neutral-dark"
									}`}
								>
									{count}
								</span>
							</button>
						)
					})}
				</div>

				{/* Search + city filter */}
				<div className="flex items-center gap-3">
					<div className="relative flex-1 max-w-xs">
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
					<select
						value={cityFilter}
						onChange={(e) => setCityFilter(e.target.value)}
						className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-foreground focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
					>
						<option value="ALL">All cities</option>
						{cities.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Table */}
			<DataTable
				columns={columns}
				data={filtered}
				onRowClick={openDrawer}
				getRowClassName={getRowTint}
				emptyState={
					<div className="py-12 text-center text-sm text-neutral-light">
						No events match the current filters.
					</div>
				}
			/>

			{/* Age tint legend */}
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
				<span className="flex items-center gap-1.5">
					<span className="w-3 h-3 rounded-sm bg-sky-100 border border-sky-200" />
					Edit requested
				</span>
			</div>

			{/* Review drawer */}
			<EventReviewDrawer
				open={drawerOpen}
				onClose={() => { setDrawerOpen(false); setSelectedEvent(null) }}
				event={selectedEvent}
				onAction={handleAction}
			/>
		</div>
	)
}
