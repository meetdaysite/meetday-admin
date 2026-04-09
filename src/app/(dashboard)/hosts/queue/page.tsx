"use client"

import { useMemo, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Search, UserPlus, Upload } from "lucide-react"
import { usePermission } from "@/lib/hooks/use-permission"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { HostReviewDrawer, type HostAction } from "@/components/hosts/host-review-drawer"
import { InviteSingleDrawer } from "@/components/hosts/invite-single-drawer"
import { InviteBulkDrawer } from "@/components/hosts/invite-bulk-drawer"
import type { Host, HostStatus } from "@/types"

// ─── Mock data ────────────────────────────────────────────────────────────────
// Dates relative to today (2026-04-09) to show age tinting variety

const MOCK_HOSTS: Host[] = [
	{
		id: "1",
		name: "Rahul Sharma",
		email: "rahul@example.com",
		phone: "+91 98765 43210",
		city: "Mumbai",
		status: "PENDING",
		invitedAt: new Date("2026-04-07"), // 2 days — no tint
	},
	{
		id: "2",
		name: "Priya Verma",
		email: "priya@example.com",
		phone: "+91 87654 32109",
		city: "Bangalore",
		status: "PENDING",
		invitedAt: new Date("2026-04-04"), // 5 days — no tint
	},
	{
		id: "3",
		name: "Arjun Mehta",
		email: "arjun@example.com",
		phone: null,
		city: "Pune",
		status: "PENDING",
		invitedAt: new Date("2026-03-30"), // 10 days — amber tint
	},
	{
		id: "4",
		name: "Divya Nair",
		email: "divya@example.com",
		phone: "+91 76543 21098",
		city: "Chennai",
		status: "PENDING",
		invitedAt: new Date("2026-03-22"), // 18 days — orange tint
	},
	{
		id: "5",
		name: "Meera Iyer",
		email: "meera@example.com",
		phone: "+91 43210 98765",
		city: "Bangalore",
		status: "PENDING",
		invitedAt: new Date("2026-04-08"), // 1 day — no tint
	},
	{
		id: "6",
		name: "Vikram Singh",
		email: "vikram@example.com",
		phone: "+91 54321 09876",
		city: "Mumbai",
		status: "INFO_REQUESTED",
		invitedAt: new Date("2026-03-25"), // 15 days — orange tint
	},
	{
		id: "7",
		name: "Sameer Khan",
		email: "sameer@example.com",
		phone: "+91 65432 10987",
		city: "Delhi",
		status: "APPROVED",
		invitedAt: new Date("2026-03-15"),
	},
	{
		id: "8",
		name: "Anita Roy",
		email: "anita@example.com",
		phone: null,
		city: "Hyderabad",
		status: "REJECTED",
		invitedAt: new Date("2026-03-10"),
	},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDays(date: Date): number {
	return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(date: Date): string {
	return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function getRowTint(host: Host): string {
	if (host.status !== "PENDING" && host.status !== "INFO_REQUESTED") return ""
	if (host.status === "INFO_REQUESTED") return "bg-sky-50/60"
	const days = getDays(host.invitedAt)
	if (days >= 14) return "bg-orange-50"
	if (days >= 7) return "bg-amber-50"
	return ""
}

// ─── Filter config ────────────────────────────────────────────────────────────

type StatusFilter = HostStatus | "ALL"

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Pending", value: "PENDING" },
	{ label: "Info Requested", value: "INFO_REQUESTED" },
	{ label: "Approved", value: "APPROVED" },
	{ label: "Rejected", value: "REJECTED" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HostQueuePage() {
	const canApprove = usePermission("host.approve")

	const [hosts, setHosts] = useState<Host[]>(MOCK_HOSTS)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [cityFilter, setCityFilter] = useState("ALL")
	const [search, setSearch] = useState("")

	const [selectedHost, setSelectedHost] = useState<Host | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)

	const canInvite = usePermission("host.invite")
	const [singleOpen, setSingleOpen] = useState(false)
	const [bulkOpen, setBulkOpen] = useState(false)

	// Unique cities for the city filter select
	const cities = useMemo(
		() => Array.from(new Set(hosts.map((h) => h.city))).sort(),
		[hosts],
	)

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		return hosts
			.filter((h) => statusFilter === "ALL" || h.status === statusFilter)
			.filter((h) => cityFilter === "ALL" || h.city === cityFilter)
			.filter(
				(h) =>
					!q ||
					h.name.toLowerCase().includes(q) ||
					h.email.toLowerCase().includes(q),
			)
	}, [hosts, statusFilter, cityFilter, search])

	const pendingCount = hosts.filter(
		(h) => h.status === "PENDING" || h.status === "INFO_REQUESTED",
	).length

	function openDrawer(host: Host) {
		setSelectedHost(host)
		setDrawerOpen(true)
	}

	async function handleAction(hostId: string, action: HostAction) {
		const statusMap: Record<HostAction, HostStatus> = {
			approve: "APPROVED",
			reject: "REJECTED",
			request_info: "INFO_REQUESTED",
		}
		// Optimistic update
		setHosts((prev) =>
			prev.map((h) => (h.id === hostId ? { ...h, status: statusMap[action] } : h)),
		)
		// TODO: replace with real API call
		await new Promise((r) => setTimeout(r, 800))
	}

	const columns = useMemo<ColumnDef<Host>[]>(
		() => [
			{
				id: "host",
				header: "Host",
				cell: ({ row }) => (
					<div>
						<p className="text-xs font-semibold text-foreground leading-none mb-0.5">
							{row.original.name}
						</p>
						<p className="text-[11px] text-neutral-light">{row.original.email}</p>
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
				id: "applied",
				header: "Applied",
				accessorKey: "invitedAt",
				enableSorting: true,
				cell: ({ row }) => {
					const days = getDays(row.original.invitedAt)
					const ageColor =
						days >= 14
							? "text-orange-600"
							: days >= 7
								? "text-amber-600"
								: "text-neutral-light"
					return (
						<div>
							<p className="text-xs text-neutral-dark">
								{formatDate(row.original.invitedAt)}
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
					You don&apos;t have permission to view the host queue.
				</p>
			</div>
		)
	}

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center gap-3">
				<h1 className="text-base font-semibold text-foreground">Host Queue</h1>
				{pendingCount > 0 && (
					<span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
						{pendingCount} pending
					</span>
				)}
				{canInvite && (
					<div className="ml-auto flex items-center gap-2">
						<button
							onClick={() => setSingleOpen(true)}
							className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors"
						>
							<UserPlus size={13} />
							Invite Host
						</button>
						<button
							onClick={() => setBulkOpen(true)}
							className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors"
						>
							<Upload size={13} />
							Bulk Upload
						</button>
					</div>
				)}
			</div>

			{/* Filters */}
			<div className="space-y-3">
				{/* Status tabs */}
				<div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
					{STATUS_TABS.map((tab) => {
						const count =
							tab.value === "ALL"
								? hosts.length
								: hosts.filter((h) => h.status === tab.value).length
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
							placeholder="Search by name or email…"
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
						No hosts match the current filters.
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
					Info requested
				</span>
			</div>

			{/* Review drawer */}
			<HostReviewDrawer
				open={drawerOpen}
				onClose={() => { setDrawerOpen(false); setSelectedHost(null) }}
				host={selectedHost}
				onAction={handleAction}
			/>

			{/* Invite drawers */}
			<InviteSingleDrawer
				open={singleOpen}
				onClose={() => setSingleOpen(false)}
				onOpenBulk={() => { setSingleOpen(false); setBulkOpen(true) }}
			/>
			<InviteBulkDrawer
				open={bulkOpen}
				onClose={() => setBulkOpen(false)}
				onOpenSingle={() => { setBulkOpen(false); setSingleOpen(true) }}
			/>
		</div>
	)
}
