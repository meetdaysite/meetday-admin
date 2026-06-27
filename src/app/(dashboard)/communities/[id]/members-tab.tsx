"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import {
	Search,
	Upload,
	UserPlus,
	Users,
	Clock,
	Star,
	Heart,
	Download,
	ChevronRight,
	MessageCircle,
	MoreHorizontal,
	ChevronLeft,
	Copy,
	Check,
	X,
	type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/Button"
import {
	getCommunityMembersTab,
	getCommunityMembers,
	getCommunityMember,
	banCommunityMember,
	unbanCommunityMember,
	kickCommunityMember,
	exportCommunityMembers,
	importCommunityMembers,
	inviteCommunityMembers,
	type ImportMembersResult,
	type InviteMembersResult,
	type CommunityMembersTabData,
	type CommunityMemberItem,
	type CommunityMemberDetail,
} from "@/lib/api/communities"
import { Drawer } from "@/components/ui/drawer"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

type MemberFilter = "ALL" | "Active" | "New" | "Inactive" | "Banned"

const MEMBERS_LIMIT = 20

const FILTER_STATUS_MAP: Record<MemberFilter, string | undefined> = {
	ALL:      undefined,
	Active:   "ACTIVE",
	New:      "NEW",
	Inactive: "INACTIVE",
	Banned:   "BANNED",
}

const ROLE_BADGE: Record<string, string> = {
	Owner:     "bg-amber-100 text-amber-700",
	Manager:   "bg-blue-100 text-blue-700",
	Host:      "bg-teal-100 text-teal-700",
	Moderator: "bg-green-100 text-green-700",
	Member:    "bg-purple-100 text-purple-700",
}

function paginationWindow(current: number, total: number): (number | "…")[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
	const pages: (number | "…")[] = [1]
	if (current > 3) pages.push("…")
	for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
	if (current < total - 2) pages.push("…")
	pages.push(total)
	return pages
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
	Active: { label: "Active", className: "bg-green-100 text-green-700" },
	Inactive: { label: "Inactive", className: "bg-amber-100 text-amber-700" },
	Banned: { label: "Banned", className: "bg-red-100 text-red-700" },
}

const QUICK_ACTIONS: { label: string; description: string; icon: LucideIcon; bg: string; color: string }[] = [
	{
		label: "Invite Members",
		description: "Send invite links to join the community",
		icon: UserPlus,
		bg: "bg-green-50",
		color: "text-green-500",
	},
	{
		label: "Export Members",
		description: "Download member list as CSV",
		icon: Download,
		bg: "bg-sky-50",
		color: "text-sky-500",
	},
	{
		label: "Import Members",
		description: "Upload a CSV to add members",
		icon: Upload,
		bg: "bg-purple-50",
		color: "text-purple-500",
	},
]


// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEngagementMeta(pct: number): { label: string; textColor: string; barColor: string } {
	if (pct >= 70) return { label: "High", textColor: "text-green-600", barColor: "#22c55e" }
	if (pct >= 40) return { label: "Medium", textColor: "text-amber-600", barColor: "#f59e0b" }
	return { label: "Low", textColor: "text-red-500", barColor: "#ef4444" }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SelectAllCheckbox({
	checked,
	indeterminate,
	onChange,
}: {
	checked: boolean
	indeterminate: boolean
	onChange: () => void
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
	const [data, setData] = useState<CommunityMembersTabData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [activeFilter, setActiveFilter] = useState<MemberFilter>("ALL")
	const [search, setSearch] = useState("")
	const [debouncedSearch, setDebouncedSearch] = useState("")
	const [sort, setSort] = useState("RECENTLY_JOINED")
	const [page, setPage] = useState(1)
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
	const [members, setMembers] = useState<CommunityMemberItem[]>([])
	const [membersLoading, setMembersLoading] = useState(true)
	const [membersTotal, setMembersTotal] = useState(0)
	const [membersTotalPages, setMembersTotalPages] = useState(0)
	const [isExporting, setIsExporting] = useState(false)
	const [isImporting, setIsImporting] = useState(false)
	const importInputRef = useRef<HTMLInputElement>(null)

	const [detailUserId,  setDetailUserId]  = useState<string | null>(null)
	const [detailData,    setDetailData]    = useState<CommunityMemberDetail | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [detailError,   setDetailError]   = useState<string | null>(null)
	const [banConfirmOpen,   setBanConfirmOpen]   = useState(false)
	const [isBanning,        setIsBanning]        = useState(false)
	const [unbanConfirmOpen, setUnbanConfirmOpen] = useState(false)
	const [isUnbanning,      setIsUnbanning]      = useState(false)
	const [kickConfirmOpen,  setKickConfirmOpen]  = useState(false)
	const [isKicking,        setIsKicking]        = useState(false)

	const [inviteOpen,        setInviteOpen]        = useState(false)
	const [inviteExpiresInDays, setInviteExpiresInDays] = useState(7)
	const [inviteMaxUses,     setInviteMaxUses]     = useState(50)
	const [isInviting,        setIsInviting]        = useState(false)
	const [inviteResult,      setInviteResult]      = useState<InviteMembersResult | null>(null)
	const [inviteCopied,      setInviteCopied]      = useState(false)

	function openInviteModal() {
		setInviteResult(null)
		setInviteExpiresInDays(7)
		setInviteMaxUses(50)
		setInviteOpen(true)
	}

	async function handleInvite() {
		setIsInviting(true)
		try {
			const result = await inviteCommunityMembers(communityId, inviteExpiresInDays, inviteMaxUses)
			setInviteResult(result)
		} catch {
			toast.error("Failed to generate invite link")
		} finally {
			setIsInviting(false)
		}
	}

	async function handleCopyInviteUrl(url: string) {
		await navigator.clipboard.writeText(url)
		setInviteCopied(true)
		setTimeout(() => setInviteCopied(false), 2000)
	}

	async function handleImportFile(file: File) {
		setIsImporting(true)
		try {
			const result: ImportMembersResult = await importCommunityMembers(communityId, file)
			const parts = [`${result.imported} imported`]
			if (result.skipped  > 0) parts.push(`${result.skipped} skipped`)
			if (result.notFound > 0) parts.push(`${result.notFound} not found`)
			toast.success(parts.join(" · "))
			if (result.errors.length > 0) {
				result.errors.forEach(e => toast.error(e))
			}
			loadMembers()
		} catch {
			toast.error("Failed to import members")
		} finally {
			setIsImporting(false)
			if (importInputRef.current) importInputRef.current.value = ""
		}
	}

	async function handleExport() {
		setIsExporting(true)
		try {
			await exportCommunityMembers(communityId)
			toast.success("Members exported successfully")
		} catch {
			toast.error("Failed to export members")
		} finally {
			setIsExporting(false)
		}
	}

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			setData(await getCommunityMembersTab(communityId))
		} catch {
			setError("Failed to load member statistics and insights.")
		} finally {
			setIsLoading(false)
		}
	}, [communityId])

	const loadMembers = useCallback(async () => {
		setMembersLoading(true)
		setSelectedIds(new Set())
		try {
			const result = await getCommunityMembers(communityId, {
				page,
				limit:  MEMBERS_LIMIT,
				status: FILTER_STATUS_MAP[activeFilter],
				sort,
				search: debouncedSearch || undefined,
			})
			setMembers(result.items)
			setMembersTotal(result.total)
			setMembersTotalPages(result.totalPages)
		} catch {
			toast.error("Failed to load members")
		} finally {
			setMembersLoading(false)
		}
	}, [communityId, page, activeFilter, sort, debouncedSearch])

	useEffect(() => { load() }, [load])
	useEffect(() => { loadMembers() }, [loadMembers])

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search), 300)
		return () => clearTimeout(t)
	}, [search])

	useEffect(() => { setPage(1) }, [activeFilter, debouncedSearch, sort])

	function fetchDetail(userId: string) {
		setDetailLoading(true)
		setDetailError(null)
		setDetailData(null)
		getCommunityMember(communityId, userId)
			.then(setDetailData)
			.catch(() => setDetailError("Failed to load member details"))
			.finally(() => setDetailLoading(false))
	}

	useEffect(() => {
		if (!detailUserId) return
		fetchDetail(detailUserId)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [communityId, detailUserId])

	async function handleBan() {
		if (!detailUserId) return
		setIsBanning(true)
		try {
			await banCommunityMember(communityId, detailUserId)
			toast.success("Member banned")
			setBanConfirmOpen(false)
			setMembers(prev => prev.map(m => m.id === detailUserId ? { ...m, status: "Banned" as const } : m))
			fetchDetail(detailUserId)
		} catch {
			toast.error("Failed to ban member")
		} finally {
			setIsBanning(false)
		}
	}

	async function handleUnban() {
		if (!detailUserId) return
		setIsUnbanning(true)
		try {
			await unbanCommunityMember(communityId, detailUserId)
			toast.success("Member unbanned")
			setUnbanConfirmOpen(false)
			setMembers(prev => prev.map(m => m.id === detailUserId ? { ...m, status: "Active" as const } : m))
			fetchDetail(detailUserId)
		} catch {
			toast.error("Failed to unban member")
		} finally {
			setIsUnbanning(false)
		}
	}

	async function handleKick() {
		if (!detailUserId) return
		setIsKicking(true)
		try {
			await kickCommunityMember(communityId, detailUserId)
			toast.success("Member removed from community")
			setKickConfirmOpen(false)
			setMembers(prev => prev.filter(m => m.id !== detailUserId))
			setDetailUserId(null)
		} catch {
			toast.error("Failed to kick member")
		} finally {
			setIsKicking(false)
		}
	}

	const allSelected  = members.length > 0 && members.every(m => selectedIds.has(m.id))
	const someSelected = !allSelected && members.some(m => selectedIds.has(m.id))

	function toggleAll() {
		if (allSelected) setSelectedIds(new Set())
		else setSelectedIds(new Set(members.map(m => m.id)))
	}

	function toggleOne(id: string) {
		setSelectedIds(prev => {
			const next = new Set(prev)
			if (next.has(id)) { next.delete(id) } else { next.add(id) }
			return next
		})
	}

	const stats = data?.stats

	const FILTER_TABS: { id: MemberFilter; label: string; count: number; dot?: string }[] = [
		{ id: "ALL", label: "All Members", count: stats?.totalMembers ?? 0 },
		{ id: "Active", label: "Active", count: stats?.activeMembers ?? 0, dot: "bg-green-500" },
		{ id: "New", label: "New", count: stats?.newMembers ?? 0, dot: "bg-blue-500" },
		{ id: "Inactive", label: "Inactive", count: stats?.inactiveMembers ?? 0, dot: "bg-amber-500" },
		{ id: "Banned", label: "Banned", count: stats?.bannedMembers ?? 0, dot: "bg-red-500" },
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
					<div className="min-w-27.5">
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
					<div className="min-w-25">
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
							<span className={cn("font-medium text-[11px]", meta.textColor)}>
								{meta.label}
							</span>
							<span className="text-text-tertiary text-[11px]">{pct}%</span>
						</div>
						<div className="h-1.5 rounded-full bg-surface-card-muted overflow-hidden">
							<div
								className="h-full rounded-full"
								style={{ width: `${pct}%`, backgroundColor: meta.barColor }}
							/>
						</div>
					</div>
				)
			},
		},
		{
			id: "role",
			header: "Role",
			cell: ({ row }) => (
				<span
					className={cn(
						"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
						ROLE_BADGE[row.original.role] ?? "bg-neutral-100 text-text-secondary",
					)}
				>
					{row.original.role}
				</span>
			),
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row }) => {
				const cfg = STATUS_BADGE[row.original.status] ?? {
					label: row.original.status,
					className: "bg-neutral-100 text-text-secondary",
				}
				return (
					<span
						className={cn(
							"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
							cfg.className,
						)}
					>
						{cfg.label}
					</span>
				)
			},
		},
		{
			id: "actions",
			header: "Actions",
			cell: ({ row }) => (
				<div className="flex items-center gap-1">
					<button
						className="rounded-md p-1.5 text-text-secondary hover:bg-neutral-100 transition-colors"
						title="Message"
						onClick={e => { e.stopPropagation(); toast.info("Messaging coming soon") }}
					>
						<MessageCircle size={14} />
					</button>
					<button
						className="rounded-md p-1.5 text-text-secondary hover:bg-neutral-100 transition-colors"
						title="View details"
						onClick={() => setDetailUserId(row.original.id)}
					>
						<MoreHorizontal size={14} />
					</button>
				</div>
			),
		},
	]

	if (error) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error}
			</div>
		)
	}

	return (
		<>
		<div className="flex items-start gap-5">
			{/* ── Main ──────────────────────────────────────────────────────── */}
			<div className="flex-1 min-w-0 flex flex-col gap-5">
				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-base font-semibold text-text-primary">Community Members</h2>
						<p className="mt-0.5 text-xs text-text-tertiary">
							Manage and engage with your community members.
						</p>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<div className="relative">
							<Search
								size={13}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
							/>
							<input
								type="text"
								placeholder="Search by name or email..."
								value={search}
								onChange={e => setSearch(e.target.value)}
								className="h-8 w-52 rounded-lg border border-border-default bg-surface-card pl-8 pr-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
							/>
						</div>
						<input
							ref={importInputRef}
							type="file"
							accept=".csv"
							className="hidden"
							onChange={e => {
								const file = e.target.files?.[0]
								if (file) handleImportFile(file)
							}}
						/>
						<Button
							variant="primary"
							size="sm"
							radius="md"
							leftIcon={<UserPlus size={13} />}
							onClick={openInviteModal}
						>
							Invite Members
						</Button>
					</div>
				</div>

				{/* Stat cards */}
				<div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
					<StatCard
						icon={Users}
						label="Total Members"
						value={isLoading ? "—" : (stats?.totalMembers ?? 0).toLocaleString("en-IN")}
						sub="All time"
						accent="brand"
					/>
					<StatCard
						icon={Users}
						label="Active Members (30 Days)"
						value={isLoading ? "—" : (stats?.activeMembers ?? 0)}
						trend={stats ? { value: Math.abs(stats.activeMembersGrowth), direction: stats.activeMembersGrowth >= 0 ? "up" : "down", label: "%" } : undefined}
						sub="vs last 30 days"
						accent="green"
					/>
					<StatCard
						icon={Clock}
						label="New Members (30 Days)"
						value={isLoading ? "—" : (stats?.newMembers ?? 0)}
						trend={stats ? { value: Math.abs(stats.newMembersGrowth), direction: stats.newMembersGrowth >= 0 ? "up" : "down", label: "%" } : undefined}
						sub="vs last 30 days"
						accent="sky"
					/>
					<StatCard
						icon={Star}
						label="Engagement Rate"
						value={isLoading ? "—" : `${stats?.engagementRate ?? 0}%`}
						trend={stats ? { value: Math.abs(stats.engagementRateGrowth), direction: stats.engagementRateGrowth >= 0 ? "up" : "down", label: "%" } : undefined}
						sub="vs last 30 days"
						accent="amber"
					/>
					<StatCard
						icon={Heart}
						label="Retention Rate"
						value={isLoading ? "—" : `${stats?.retentionRate ?? 0}%`}
						trend={stats ? { value: Math.abs(stats.retentionRateGrowth), direction: stats.retentionRateGrowth >= 0 ? "up" : "down", label: "%" } : undefined}
						sub="vs last 30 days"
						accent="rose"
					/>
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
								<span
									className={cn(
										"rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
										activeFilter === tab.id
											? "bg-white/20 text-white"
											: "bg-white text-text-secondary",
									)}
								>
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
						<option value="RECENTLY_JOINED">Sort by: Recently Joined</option>
						<option value="LAST_ACTIVE">Sort by: Last Active</option>
						<option value="ENGAGEMENT">Sort by: Engagement</option>
						<option value="ALPHABETICAL">Sort by: Alphabetical</option>
					</select>
				</div>

				{/* Table */}
				<DataTable
					columns={columns}
					data={members}
					isLoading={membersLoading}
					onRowClick={m => setDetailUserId(m.id)}
					emptyState={
						<div className="py-12 text-center text-sm text-text-tertiary">No members found.</div>
					}
				/>

				{/* Pagination */}
				<div className="flex items-center justify-between text-xs text-text-tertiary">
					<span>
						{membersLoading
							? "Loading…"
							: `Showing ${membersTotal === 0 ? 0 : (page - 1) * MEMBERS_LIMIT + 1} to ${Math.min(page * MEMBERS_LIMIT, membersTotal)} of ${membersTotal.toLocaleString("en-IN")} members`}
					</span>
					{membersTotalPages > 1 && (
						<div className="flex items-center gap-1">
							<button
								onClick={() => setPage(p => Math.max(1, p - 1))}
								disabled={page === 1}
								className="rounded-md p-1 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							>
								<ChevronLeft size={14} />
							</button>
							{paginationWindow(page, membersTotalPages).map((n, i) =>
								n === "…" ? (
									<span key={`ellipsis-${i}`} className="px-1 text-text-tertiary">…</span>
								) : (
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
								),
							)}
							<button
								onClick={() => setPage(p => Math.min(membersTotalPages, p + 1))}
								disabled={page === membersTotalPages}
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
					<h3 className="text-sm font-semibold text-text-primary mb-3">Member Insights</h3>

					{/* Top Cities */}
					<p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
						Top Cities
					</p>
					<div className="flex flex-col gap-2 mb-4">
						{isLoading ? (
							Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="flex items-center gap-2 animate-pulse">
									<div className="w-20 shrink-0 flex flex-col gap-1">
										<div className="h-2.5 rounded bg-surface-card-muted w-14" />
										<div className="h-2 rounded bg-surface-card-muted w-10" />
									</div>
									<div className="flex-1 h-1.5 rounded-full bg-surface-card-muted" />
									<div className="h-2.5 w-7 rounded bg-surface-card-muted" />
								</div>
							))
						) : (data?.topCities ?? []).length === 0 ? (
							<p className="text-xs text-text-tertiary">No data available.</p>
						) : (
							(data?.topCities ?? []).map(c => (
								<div key={c.city} className="flex items-center gap-2">
									<div className="w-20 shrink-0">
										<p className="text-xs text-text-secondary">{c.city}</p>
										<p className="text-[10px] text-text-tertiary tabular-nums">{c.count.toLocaleString("en-IN")}</p>
									</div>
									<div className="flex-1 h-1.5 rounded-full bg-surface-card-muted overflow-hidden">
										<div
											className="h-full rounded-full"
											style={{ width: `${c.pct}%`, backgroundColor: c.color }}
										/>
									</div>
									<span className="text-xs font-semibold text-text-primary w-8 text-right tabular-nums">
										{c.pct}%
									</span>
								</div>
							))
						)}
					</div>

					{/* Member Segments */}
					<p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
						Member Segments
					</p>
					<div className="flex flex-col gap-2">
						{isLoading ? (
							Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="flex items-center gap-2 animate-pulse">
									<div className="w-28 shrink-0 flex flex-col gap-1">
										<div className="h-2.5 rounded bg-surface-card-muted w-20" />
										<div className="h-2 rounded bg-surface-card-muted w-12" />
									</div>
									<div className="flex-1 h-1.5 rounded-full bg-surface-card-muted" />
									<div className="h-2.5 w-7 rounded bg-surface-card-muted" />
								</div>
							))
						) : (data?.segments ?? []).length === 0 ? (
							<p className="text-xs text-text-tertiary">No data available.</p>
						) : (
							(data?.segments ?? []).map(s => (
								<div key={s.label} className="flex items-center gap-2">
									<div className="w-28 shrink-0 min-w-0">
										<p className="text-xs text-text-secondary truncate">{s.label}</p>
										<p className="text-[10px] text-text-tertiary tabular-nums">{s.count.toLocaleString("en-IN")}</p>
									</div>
									<div className="flex-1 h-1.5 rounded-full bg-surface-card-muted overflow-hidden">
										<div
											className="h-full rounded-full"
											style={{ width: `${s.pct}%`, backgroundColor: s.color }}
										/>
									</div>
									<span className="text-xs font-semibold text-text-primary w-8 text-right tabular-nums">
										{s.pct}%
									</span>
								</div>
							))
						)}
					</div>
				</div>

				{/* Quick Actions */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-2">Quick Actions</h3>
					<div className="flex flex-col">
						{QUICK_ACTIONS.map(action => {
							const isExportAction = action.label === "Export Members"
							const isInviteAction = action.label === "Invite Members"
							const isImportAction = action.label === "Import Members"
							const acting = (isExportAction && isExporting) || (isImportAction && isImporting)
							return (
							<button
								key={action.label}
								className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-surface-card-muted transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
								disabled={acting}
								onClick={
									isExportAction ? handleExport
									: isInviteAction ? openInviteModal
									: isImportAction ? () => importInputRef.current?.click()
									: () => toast.info(`${action.label} coming soon`)
								}
							>
								<div
									className={cn(
										"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
										action.bg,
									)}
								>
									{acting ? (
										<svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
										</svg>
									) : (
										<action.icon size={15} className={action.color} />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-xs font-medium text-text-primary">{action.label}</p>
									<p className="text-[10px] text-text-tertiary leading-tight truncate">
										{isExportAction && acting ? "Exporting…" : isImportAction && acting ? "Importing…" : action.description}
									</p>
								</div>
								<ChevronRight size={13} className="text-text-tertiary shrink-0" />
							</button>
							)
						})}
					</div>
				</div>

			</div>
		</div>

		{/* ── Member Detail Drawer ─────────────────────────────────────────── */}
		<Drawer
			open={!!detailUserId}
			onClose={() => {
				setDetailUserId(null)
				setBanConfirmOpen(false)
				setUnbanConfirmOpen(false)
				setKickConfirmOpen(false)
			}}
			title="Member Details"
			width="max-w-sm"
		>
			{detailLoading && (
				<div className="flex flex-col gap-4 animate-pulse">
					<div className="flex items-center gap-3">
						<div className="h-14 w-14 rounded-full bg-surface-card-muted shrink-0" />
						<div className="flex flex-col gap-2 flex-1">
							<div className="h-3.5 w-32 rounded bg-surface-card-muted" />
							<div className="h-3 w-24 rounded bg-surface-card-muted" />
						</div>
					</div>
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="h-3 rounded bg-surface-card-muted" style={{ width: `${70 + (i % 3) * 10}%` }} />
					))}
				</div>
			)}

			{detailError && (
				<div className="flex flex-col gap-3">
					<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
						{detailError}
					</div>
					{detailUserId && (
						<button
							onClick={() => fetchDetail(detailUserId)}
							className="text-xs font-medium text-text-brand hover:underline self-start"
						>
							Try again
						</button>
					)}
				</div>
			)}

			{detailData && !detailLoading && (() => {
				const d = detailData
				const eng = d.engagementPct >= 70 ? { label: "High", color: "text-green-600", bar: "#22c55e" }
					: d.engagementPct >= 40 ? { label: "Medium", color: "text-amber-600", bar: "#f59e0b" }
					: { label: "Low", color: "text-red-500", bar: "#ef4444" }
				return (
					<div className="flex flex-col gap-5">
						{/* Avatar + name + badges */}
						<div className="flex items-center gap-3">
							{d.avatarUrl ? (
								<img src={d.avatarUrl} alt={d.name} className="h-14 w-14 rounded-full object-cover shrink-0" />
							) : (
								<div
									className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0 select-none"
									style={{ backgroundColor: d.avatarColor }}
								>
									{d.avatarInitial}
								</div>
							)}
							<div className="min-w-0">
								<p className="text-sm font-semibold text-text-primary truncate">{d.name}</p>
								<p className="text-xs text-text-tertiary truncate">{d.email}</p>
								<div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
									<span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", ROLE_BADGE[d.role] ?? "bg-neutral-100 text-text-secondary")}>
										{d.role}
									</span>
									<span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_BADGE[d.status]?.className ?? "bg-neutral-100 text-text-secondary")}>
										{STATUS_BADGE[d.status]?.label ?? d.status}
									</span>
									{d.isNew && (
										<span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700">New</span>
									)}
								</div>
							</div>
						</div>

						<div className="h-px bg-border-subtle" />

						{/* Account */}
						<div className="flex flex-col gap-3">
							<p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Account</p>
							<div className="grid grid-cols-2 gap-x-4 gap-y-3">
								<div>
									<p className="text-[10px] text-text-tertiary mb-0.5">Member Since</p>
									<p className="text-xs font-medium text-text-primary">{d.memberSince}</p>
								</div>
								<div>
									<p className="text-[10px] text-text-tertiary mb-0.5">Joined Community</p>
									<p className="text-xs font-medium text-text-primary">{d.joinDate}</p>
									<p className="text-[10px] text-text-tertiary">{d.joinTime}</p>
								</div>
								<div>
									<p className="text-[10px] text-text-tertiary mb-0.5">Last Active</p>
									<p className="text-xs font-medium text-text-primary">{d.lastActive}</p>
									<p className="text-[10px] text-text-tertiary">{d.lastActiveTime}</p>
								</div>
								{d.bannedAt && (
									<div>
										<p className="text-[10px] text-text-tertiary mb-0.5">Banned On</p>
										<p className="text-xs font-medium text-red-600">{d.bannedAt}</p>
										{d.bannedBy && <p className="text-[10px] text-text-tertiary">by {d.bannedBy}</p>}
									</div>
								)}
							</div>
						</div>

						<div className="h-px bg-border-subtle" />

						{/* Engagement */}
						<div className="flex flex-col gap-3">
							<p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Engagement</p>
							<div>
								<div className="flex items-center justify-between text-xs mb-1">
									<span className={cn("font-medium text-[11px]", eng.color)}>{eng.label}</span>
									<span className="text-text-tertiary text-[11px]">{d.engagementPct}%</span>
								</div>
								<div className="h-1.5 rounded-full bg-surface-card-muted overflow-hidden">
									<div className="h-full rounded-full transition-all" style={{ width: `${d.engagementPct}%`, backgroundColor: eng.bar }} />
								</div>
							</div>
							<div className="grid grid-cols-3 gap-3">
								<div className="rounded-lg bg-surface-card-muted px-3 py-2.5 text-center">
									<p className="text-sm font-bold text-text-primary">{d.activityScore}</p>
									<p className="text-[10px] text-text-tertiary leading-tight">Activity Score</p>
								</div>
								<div className="rounded-lg bg-surface-card-muted px-3 py-2.5 text-center">
									<p className="text-sm font-bold text-text-primary">{d.messageCount}</p>
									<p className="text-[10px] text-text-tertiary leading-tight">Messages</p>
								</div>
								<div className="rounded-lg bg-surface-card-muted px-3 py-2.5 text-center">
									<p className="text-sm font-bold text-text-primary">{d.eventsAttendedCount}</p>
									<p className="text-[10px] text-text-tertiary leading-tight">Events</p>
								</div>
							</div>
						</div>

						<>
							<div className="h-px bg-border-subtle" />
							<div className="flex gap-2">
								{d.status === "Banned" ? (
									<button
										onClick={() => setUnbanConfirmOpen(true)}
										className="flex-1 rounded-lg border border-green-200 bg-green-50 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
									>
										Unban Member
									</button>
								) : (
									<button
										onClick={() => setBanConfirmOpen(true)}
										className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
									>
										Ban Member
									</button>
								)}
								<button
									onClick={() => setKickConfirmOpen(true)}
									className="flex-1 rounded-lg border border-orange-200 bg-orange-50 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-colors"
								>
									Kick Member
								</button>
							</div>
						</>
					</div>
				)
			})()}
		</Drawer>

		<ConfirmDialog
			open={banConfirmOpen}
			onClose={() => setBanConfirmOpen(false)}
			onConfirm={handleBan}
			title="Ban Member"
			description={`Are you sure you want to ban ${detailData?.name ?? "this member"}? They will no longer be able to access this community.`}
			confirmLabel="Ban Member"
			cancelLabel="Cancel"
			destructive
			isLoading={isBanning}
		/>

		<ConfirmDialog
			open={unbanConfirmOpen}
			onClose={() => setUnbanConfirmOpen(false)}
			onConfirm={handleUnban}
			title="Unban Member"
			description={`Are you sure you want to unban ${detailData?.name ?? "this member"}? They will regain access to this community.`}
			confirmLabel="Unban Member"
			cancelLabel="Cancel"
			isLoading={isUnbanning}
		/>

		<ConfirmDialog
			open={kickConfirmOpen}
			onClose={() => setKickConfirmOpen(false)}
			onConfirm={handleKick}
			title="Kick Member"
			description={`Are you sure you want to remove ${detailData?.name ?? "this member"} from this community? They can rejoin unless banned.`}
			confirmLabel="Kick Member"
			cancelLabel="Cancel"
			destructive
			isLoading={isKicking}
		/>

		{/* ── Invite Members Modal ─────────────────────────────────────────── */}
		{inviteOpen && (
			<div
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
				onClick={e => { if (e.target === e.currentTarget) setInviteOpen(false) }}
			>
				<div className="w-full max-w-sm rounded-2xl border border-border-default bg-surface-card shadow-xl">
					<div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
						<h2 className="text-sm font-semibold text-text-primary">Invite Members</h2>
						<button
							onClick={() => setInviteOpen(false)}
							className="rounded-lg p-1 text-text-tertiary hover:bg-surface-card-muted transition-colors"
						>
							<X size={15} />
						</button>
					</div>

					{inviteResult ? (
						<div className="flex flex-col gap-4 px-5 py-4">
							<div className="flex flex-col gap-1.5">
								<p className="text-[11px] font-medium text-text-secondary">Invite Link</p>
								<div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-card-muted px-3 py-2">
									<p className="flex-1 min-w-0 truncate text-xs text-text-primary tabular-nums">
										{inviteResult.inviteUrl}
									</p>
									<button
										onClick={() => handleCopyInviteUrl(inviteResult.inviteUrl)}
										className="shrink-0 rounded-md p-1 text-text-secondary hover:text-text-primary hover:bg-surface-card transition-colors"
									>
										{inviteCopied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
									</button>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="flex flex-col gap-0.5">
									<p className="text-[10px] text-text-tertiary">Max Uses</p>
									<p className="text-xs font-medium text-text-primary">{inviteResult.maxUses}</p>
								</div>
								<div className="flex flex-col gap-0.5">
									<p className="text-[10px] text-text-tertiary">Expires</p>
									<p className="text-xs font-medium text-text-primary">
										{new Date(inviteResult.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
									</p>
								</div>
							</div>
							<Button variant="secondary" size="sm" radius="md" onClick={() => setInviteOpen(false)}>
								Done
							</Button>
						</div>
					) : (
						<div className="flex flex-col gap-4 px-5 py-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-[11px] font-medium text-text-secondary">Expires In (days)</label>
								<input
									type="number"
									min={1}
									max={365}
									value={inviteExpiresInDays}
									onChange={e => setInviteExpiresInDays(Math.max(1, Number(e.target.value)))}
									className="h-8 rounded-lg border border-border-default bg-surface-card px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-[11px] font-medium text-text-secondary">Max Uses</label>
								<input
									type="number"
									min={1}
									value={inviteMaxUses}
									onChange={e => setInviteMaxUses(Math.max(1, Number(e.target.value)))}
									className="h-8 rounded-lg border border-border-default bg-surface-card px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
								/>
							</div>
							<div className="flex gap-2">
								<Button variant="secondary" size="sm" radius="md" onClick={() => setInviteOpen(false)}>
									Cancel
								</Button>
								<Button variant="primary" size="sm" radius="md" disabled={isInviting} onClick={handleInvite}>
									{isInviting ? "Generating…" : "Generate Link"}
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		)}
		</>
	)
}
