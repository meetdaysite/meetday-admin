"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import {
	Search, SlidersHorizontal, Upload, UserPlus, Users,
	Clock, Star, Heart, Download, Layers, BarChart2,
	ChevronRight, MessageCircle, MoreHorizontal, ChevronLeft,
	type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/Button"
import {
	getCommunityMembersTab,
	type CommunityMembersTabData,
	type CommunityMemberItem,
} from "@/lib/api/communities"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

type MemberFilter = "ALL" | "Active" | "New" | "Inactive" | "Banned"

const ROLE_BADGE: Record<string, string> = {
	Owner:     "bg-amber-100 text-amber-700",
	Manager:   "bg-blue-100 text-blue-700",
	Moderator: "bg-green-100 text-green-700",
	Member:    "bg-purple-100 text-purple-700",
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
	Active:   { label: "Active",   className: "bg-green-100 text-green-700" },
	Inactive: { label: "Inactive", className: "bg-amber-100 text-amber-700" },
	Banned:   { label: "Banned",   className: "bg-red-100 text-red-700" },
}

const QUICK_ACTIONS: { label: string; description: string; icon: LucideIcon; bg: string; color: string }[] = [
	{ label: "Invite Members",         description: "Send invite links to join the community", icon: UserPlus,  bg: "bg-green-50",  color: "text-green-500" },
	{ label: "Export Members",         description: "Download member list as CSV",              icon: Download,  bg: "bg-sky-50",    color: "text-sky-500" },
	{ label: "Manage Segments",        description: "Create and manage member segments",        icon: Layers,    bg: "bg-purple-50", color: "text-purple-500" },
	{ label: "Member Activity Report", description: "View detailed activity analytics",         icon: BarChart2, bg: "bg-teal-50",   color: "text-teal-500" },
]

const PAGE_SIZE = 10

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEngagementMeta(pct: number): { label: string; textColor: string; barColor: string } {
	if (pct >= 70) return { label: "High",   textColor: "text-green-600", barColor: "#22c55e" }
	if (pct >= 40) return { label: "Medium", textColor: "text-amber-600", barColor: "#f59e0b" }
	return              { label: "Low",    textColor: "text-red-500",   barColor: "#ef4444" }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SelectAllCheckbox({ checked, indeterminate, onChange }: {
	checked: boolean; indeterminate: boolean; onChange: () => void
}) {
	const ref = useRef<HTMLInputElement>(null)
	useEffect(() => {
		if (ref.current) ref.current.indeterminate = indeterminate
	}, [indeterminate])
	return (
		<input
			ref={ref}
			type="checkbox"
			checked={checked}
			onChange={onChange}
			className="h-4 w-4 rounded border-border-default accent-action-primary cursor-pointer"
		/>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MembersTab({ communityId }: { communityId: string }) {
	const [data, setData]               = useState<CommunityMembersTabData | null>(null)
	const [isLoading, setIsLoading]     = useState(true)
	const [error, setError]             = useState<string | null>(null)
	const [activeFilter, setActiveFilter] = useState<MemberFilter>("ALL")
	const [search, setSearch]           = useState("")
	const [sort, setSort]               = useState("recent")
	const [page, setPage]               = useState(1)
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			setData(await getCommunityMembersTab(communityId))
		} catch {
			setError("Failed to load members.")
		} finally {
			setIsLoading(false)
		}
	}, [communityId])

	useEffect(() => { load() }, [load])
	useEffect(() => { setPage(1) }, [activeFilter, search, sort])

	const filtered = (() => {
		if (!data) return []
		let items = data.members
		if (activeFilter === "Active")   items = items.filter(m => m.status === "Active" && !m.isNew)
		else if (activeFilter === "New") items = items.filter(m => m.isNew)
		else if (activeFilter !== "ALL") items = items.filter(m => m.status === activeFilter)
		const q = search.trim().toLowerCase()
		if (q) items = items.filter(m =>
			m.name.toLowerCase().includes(q) || m.handle.toLowerCase().includes(q)
		)
		if (sort === "oldest") items = [...items].reverse()
		return items
	})()

	const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
	const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	const allSelected  = paginated.length > 0 && paginated.every(m => selectedIds.has(m.id))
	const someSelected = !allSelected && paginated.some(m => selectedIds.has(m.id))

	function toggleAll() {
		if (allSelected) setSelectedIds(new Set())
		else setSelectedIds(new Set(paginated.map(m => m.id)))
	}

	function toggleOne(id: string) {
		setSelectedIds(prev => {
			const next = new Set(prev)
			next.has(id) ? next.delete(id) : next.add(id)
			return next
		})
	}

	const stats = data?.stats

	const FILTER_TABS: { id: MemberFilter; label: string; count: number; dot?: string }[] = [
		{ id: "ALL",      label: "All Members", count: stats?.totalMembers    ?? 0 },
		{ id: "Active",   label: "Active",      count: stats?.activeMembers   ?? 0, dot: "bg-green-500" },
		{ id: "New",      label: "New",         count: stats?.newMembers      ?? 0, dot: "bg-blue-500" },
		{ id: "Inactive", label: "Inactive",    count: stats?.inactiveMembers ?? 0, dot: "bg-amber-500" },
		{ id: "Banned",   label: "Banned",      count: stats?.bannedMembers   ?? 0, dot: "bg-red-500" },
	]

	const columns: ColumnDef<CommunityMemberItem>[] = [
		{
			id: "select",
			header: () => (
				<SelectAllCheckbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
			),
			cell: ({ row }) => (
				<input
					type="checkbox"
					checked={selectedIds.has(row.original.id)}
					onChange={() => toggleOne(row.original.id)}
					onClick={e => e.stopPropagation()}
					className="h-4 w-4 rounded border-border-default accent-action-primary cursor-pointer"
				/>
			),
		},
		{
			id: "member",
			header: "Member",
			cell: ({ row }) => {
				const m = row.original
				return (
					<div className="flex items-center gap-3 max-w-52">
						<div
							className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white select-none"
							style={{ backgroundColor: m.avatarColor }}
						>
							{m.avatarInitial}
						</div>
						<div className="min-w-0">
							<p className="text-xs font-semibold text-text-primary truncate">{m.name}</p>
							<p className="text-[11px] text-text-tertiary truncate">{m.handle}</p>
						</div>
					</div>
				)
			},
		},
		{
			id: "joindate",
			header: () => (
				<span className="flex items-center gap-1 whitespace-nowrap">
					Join Date <ChevronRight size={11} className="rotate-90 text-text-tertiary" />
				</span>
			),
			cell: ({ row }) => {
				const m = row.original
				return (
					<div className="min-w-[110px]">
						<p className="text-xs font-medium text-text-primary">{m.joinDate}</p>
						<p className="text-[11px] text-text-tertiary">{m.joinTime}</p>
					</div>
				)
			},
		},
		{
			id: "lastactive",
			header: () => <span className="whitespace-nowrap">Last Active</span>,
			cell: ({ row }) => {
				const m = row.original
				return (
					<div className="min-w-[100px]">
						<p className="text-xs font-medium text-text-primary">{m.lastActive}</p>
						<p className="text-[11px] text-text-tertiary">{m.lastActiveTime}</p>
					</div>
				)
			},
		},
		{
			id: "engagement",
			header: "Engagement",
			cell: ({ row }) => {
				const { engagementPct: pct } = row.original
				const meta = getEngagementMeta(pct)
				return (
					<div className="w-28">
						<div className="flex items-center justify-between text-xs mb-1">
							<span className={cn("font-medium text-[11px]", meta.textColor)}>{meta.label}</span>
							<span className="text-text-tertiary text-[11px]">{pct}%</span>
						</div>
						<div className="h-1.5 rounded-full bg-surface-card-muted overflow-hidden">
							<div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.barColor }} />
						</div>
					</div>
				)
			},
		},
		{
			id: "role",
			header: "Role",
			cell: ({ row }) => (
				<span className={cn(
					"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
					ROLE_BADGE[row.original.role] ?? "bg-neutral-100 text-text-secondary",
				)}>
					{row.original.role}
				</span>
			),
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row }) => {
				const cfg = STATUS_BADGE[row.original.status] ?? { label: row.original.status, className: "bg-neutral-100 text-text-secondary" }
				return (
					<span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", cfg.className)}>
						{cfg.label}
					</span>
				)
			},
		},
		{
			id: "actions",
			header: "Actions",
			cell: () => (
				<div className="flex items-center gap-1">
					<button
						className="rounded-md p-1.5 text-text-secondary hover:bg-neutral-100 transition-colors"
						title="Message"
					>
						<MessageCircle size={14} />
					</button>
					<button
						className="rounded-md p-1.5 text-text-secondary hover:bg-neutral-100 transition-colors"
						title="More"
					>
						<MoreHorizontal size={14} />
					</button>
				</div>
			),
		},
	]

	if (error) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
		)
	}

	return (
		<div className="flex items-start gap-5">

			{/* ── Main ──────────────────────────────────────────────────────── */}
			<div className="flex-1 min-w-0 flex flex-col gap-5">

				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-base font-semibold text-text-primary">Community Members</h2>
						<p className="mt-0.5 text-xs text-text-tertiary">Manage and engage with your community members.</p>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<div className="relative">
							<Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
							<input
								type="text"
								placeholder="Search by name or email..."
								value={search}
								onChange={e => setSearch(e.target.value)}
								className="h-8 w-52 rounded-lg border border-border-default bg-surface-card pl-8 pr-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
							/>
						</div>
						<Button variant="secondary" size="sm" radius="md" leftIcon={<SlidersHorizontal size={13} />} disabled>
							Filters
						</Button>
						<Button variant="secondary" size="sm" radius="md" leftIcon={<Upload size={13} />}
							onClick={() => toast.info("Import members coming soon")}>
							Import Members
						</Button>
						<Button variant="primary" size="sm" radius="md" leftIcon={<UserPlus size={13} />}
							onClick={() => toast.info("Invite members coming soon")}>
							Invite Members
						</Button>
					</div>
				</div>

				{/* Stat cards */}
				{/* TODO: replace hardcoded trend values with getCommunityMembersTab API response */}
				<div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
					<StatCard icon={Users}  label="Total Members"          value={isLoading ? "—" : (stats?.totalMembers ?? 0).toLocaleString("en-IN")} sub="All time"         accent="brand" />
					<StatCard icon={Users}  label="Active Members (30 Days)" value={isLoading ? "—" : (stats?.activeMembers ?? 0)} trend={stats ? { value: stats.activeMembersGrowth, direction: "up", label: "%" } : undefined} sub="vs last 30 days" accent="green" />
					<StatCard icon={Clock}  label="New Members (30 Days)"    value={isLoading ? "—" : (stats?.newMembers ?? 0)}    trend={stats ? { value: stats.newMembersGrowth, direction: "up", label: "%" } : undefined}    sub="vs last 30 days" accent="sky" />
					<StatCard icon={Star}   label="Engagement Rate"          value={isLoading ? "—" : `${stats?.engagementRate ?? 0}%`} trend={stats ? { value: stats.engagementRateGrowth, direction: "up", label: "%" } : undefined} sub="vs last 30 days" accent="amber" />
					<StatCard icon={Heart}  label="Retention Rate"           value={isLoading ? "—" : `${stats?.retentionRate ?? 0}%`} trend={stats ? { value: stats.retentionRateGrowth, direction: "up", label: "%" } : undefined}  sub="vs last 30 days" accent="rose" />
				</div>

				{/* Filter tabs + sort */}
				<div className="flex items-center justify-between gap-3 flex-wrap">
					<div className="flex items-center gap-1.5 flex-wrap">
						{FILTER_TABS.map(tab => (
							<button
								key={tab.id}
								onClick={() => setActiveFilter(tab.id)}
								className={cn(
									"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
									activeFilter === tab.id
										? "bg-action-primary text-action-primary-text"
										: "bg-neutral-100 text-text-secondary hover:bg-neutral-200",
								)}
							>
								{tab.dot && activeFilter !== tab.id && (
									<span className={cn("h-1.5 w-1.5 rounded-full shrink-0", tab.dot)} />
								)}
								{tab.label}
								<span className={cn(
									"rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
									activeFilter === tab.id ? "bg-white/20 text-white" : "bg-white text-text-secondary",
								)}>
									{tab.count.toLocaleString("en-IN")}
								</span>
							</button>
						))}
					</div>
					<select
						value={sort}
						onChange={e => setSort(e.target.value)}
						className="h-8 rounded-lg border border-border-default bg-surface-card px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
					>
						<option value="recent">Sort by: Recently Joined</option>
						<option value="oldest">Sort by: Oldest Members</option>
					</select>
				</div>

				{/* Table */}
				<DataTable
					columns={columns}
					data={paginated}
					isLoading={isLoading}
					emptyState={
						<div className="py-12 text-center text-sm text-text-tertiary">No members found.</div>
					}
				/>

				{/* Pagination */}
				<div className="flex items-center justify-between text-xs text-text-tertiary">
					<span>
						{isLoading
							? "Loading…"
							: `Showing ${filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, filtered.length)} of ${(stats?.totalMembers ?? filtered.length).toLocaleString("en-IN")} members`
						}
					</span>
					{totalPages > 1 && (
						<div className="flex items-center gap-1">
							<button
								onClick={() => setPage(p => Math.max(1, p - 1))}
								disabled={page === 1}
								className="rounded-md p-1 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							>
								<ChevronLeft size={14} />
							</button>
							{Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
								<button
									key={n}
									onClick={() => setPage(n)}
									className={cn(
										"h-7 w-7 rounded-md text-xs font-medium transition-colors",
										n === page
											? "bg-action-primary text-action-primary-text"
											: "hover:bg-neutral-100 text-text-secondary",
									)}
								>
									{n}
								</button>
							))}
							<button
								onClick={() => setPage(p => Math.min(totalPages, p + 1))}
								disabled={page === totalPages}
								className="rounded-md p-1 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							>
								<ChevronRight size={14} />
							</button>
						</div>
					)}
				</div>
			</div>

			{/* ── Sidebar ───────────────────────────────────────────────────── */}
			<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">

				{/* Member Insights */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Member Insights</h3>
						<button className="text-xs font-medium text-text-brand hover:underline">View All</button>
					</div>

					{/* Top Cities */}
					<p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">Top Cities</p>
					<div className="flex flex-col gap-2 mb-4">
						{(data?.topCities ?? []).map(c => (
							<div key={c.city} className="flex items-center gap-2">
								<span className="text-xs text-text-secondary w-20 shrink-0">{c.city}</span>
								<div className="flex-1 h-1.5 rounded-full bg-surface-card-muted overflow-hidden">
									<div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
								</div>
								<span className="text-xs font-semibold text-text-primary w-8 text-right tabular-nums">{c.pct}%</span>
							</div>
						))}
					</div>

					{/* Member Segments */}
					<div className="flex items-center justify-between mb-2">
						<p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Member Segments</p>
						<button className="text-xs font-medium text-text-brand hover:underline">View All</button>
					</div>
					<div className="flex flex-col gap-2">
						{(data?.segments ?? []).map(s => (
							<div key={s.label} className="flex items-center gap-2">
								<span className="text-xs text-text-secondary w-28 shrink-0 truncate">{s.label}</span>
								<div className="flex-1 h-1.5 rounded-full bg-surface-card-muted overflow-hidden">
									<div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
								</div>
								<span className="text-xs font-semibold text-text-primary w-8 text-right tabular-nums">{s.pct}%</span>
							</div>
						))}
					</div>
				</div>

				{/* Quick Actions */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-2">Quick Actions</h3>
					<div className="flex flex-col">
						{QUICK_ACTIONS.map(action => (
							<button
								key={action.label}
								className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-surface-card-muted transition-colors text-left"
								onClick={() => toast.info(`${action.label} coming soon`)}
							>
								<div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", action.bg)}>
									<action.icon size={15} className={action.color} />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-xs font-medium text-text-primary">{action.label}</p>
									<p className="text-[10px] text-text-tertiary leading-tight truncate">{action.description}</p>
								</div>
								<ChevronRight size={13} className="text-text-tertiary shrink-0" />
							</button>
						))}
					</div>
				</div>

				{/* Tips */}
				<div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
					<div className="flex items-center gap-2 mb-2">
						<Star size={13} className="text-amber-500 shrink-0" />
						<h3 className="text-xs font-semibold text-amber-800">Tips</h3>
					</div>
					<p className="text-[11px] text-amber-700 leading-relaxed">
						Engage your top members by pinning their posts, featuring their content, and inviting them to host experiences.
					</p>
					<button
						className="mt-2 text-[11px] font-medium text-text-brand hover:underline"
						onClick={() => toast.info("Learn more coming soon")}
					>
						Learn more →
					</button>
				</div>
			</div>
		</div>
	)
}
