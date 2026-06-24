"use client"

import { useCallback, useEffect, useState } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import {
	Settings,
	Plus,
	Hash,
	Lock,
	Users,
	CheckCircle,
	XCircle,
	MoreHorizontal,
	Pin,
	VolumeX,
	Flag,
	Search,
	Ban,
	AlertTriangle,
	ChevronRight,
	MessageSquare,
	Megaphone,
	Download,
	ChevronDown,
	Pencil,
	Trash2,
	type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/Button"
import { StatCard } from "@/components/dashboard/stat-card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ChannelDrawer } from "@/components/communities/channel-drawer"
import {
	getCommunityChat,
	deleteCommunityChannel,
	type ChatTabData,
	type ChatChannel,
	type ChatOverviewItem,
	type ChatModerationTool,
} from "@/lib/api/communities"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const MOD_ICON_MAP: Record<string, LucideIcon> = {
	flag: Flag,
	search: Search,
	ban: Ban,
	warning: AlertTriangle,
}

const QUICK_ACTIONS: { label: string; icon: LucideIcon; bg: string; color: string }[] = [
	{ label: "Create Channel", icon: MessageSquare, bg: "bg-purple-50", color: "text-purple-500" },
	{ label: "Send Announcement", icon: Megaphone, bg: "bg-red-50", color: "text-red-500" },
	{ label: "Pin Message", icon: Pin, bg: "bg-amber-50", color: "text-amber-500" },
	{ label: "Export Chat Logs", icon: Download, bg: "bg-blue-50", color: "text-blue-500" },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function OverviewRow({ item }: { item: ChatOverviewItem }) {
	const chartData = item.sparkline.map((v, i) => ({ i, v }))
	return (
		<div className="flex items-center gap-2 py-2">
			<div className="flex-1 min-w-0">
				<p className="text-xs text-text-secondary">{item.label}</p>
				<div className="flex items-center gap-1.5 mt-0.5">
					<span className="text-sm font-bold text-text-primary">{item.value}</span>
					<span
						className={cn(
							"text-[10px] font-semibold",
							item.direction === "up" ? "text-green-500" : "text-red-500",
						)}
					>
						{item.direction === "up" ? "↑" : "↓"} {item.growth}%
					</span>
				</div>
			</div>
			<div className="w-20 h-8 shrink-0">
				<ResponsiveContainer width="100%" height={32}>
					<LineChart data={chartData}>
						<Line
							type="monotone"
							dataKey="v"
							stroke={item.color}
							strokeWidth={1.5}
							dot={false}
							isAnimationActive={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	)
}

function ModerationToolRow({ tool }: { tool: ChatModerationTool }) {
	const Icon = MOD_ICON_MAP[tool.iconKey] ?? Flag
	return (
		<button
			className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-card-muted transition-colors text-left w-full"
			onClick={() => toast.info(`${tool.label} coming soon`)}
		>
			<div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", tool.bg)}>
				<Icon size={13} className={tool.color} />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-xs font-medium text-text-primary">{tool.label}</p>
				<p className="text-[10px] text-text-tertiary">{tool.description}</p>
			</div>
			<ChevronRight size={12} className="text-text-tertiary shrink-0" />
		</button>
	)
}

// ─── Channel row ──────────────────────────────────────────────────────────────

type ChannelRowProps = {
	ch: ChatChannel
	onEdit: (ch: ChatChannel) => void
	onDelete: (ch: ChatChannel) => void
}

function ChannelRow({ ch, onEdit, onDelete }: ChannelRowProps) {
	return (
		<div className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-card-muted transition-colors group">
			<div
				className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white font-bold text-sm"
				style={{ backgroundColor: ch.isPrivate ? "#6b7280" : ch.iconColor }}
			>
				{ch.isPrivate ? <Lock size={13} /> : <Hash size={13} />}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1.5">
					<span className="text-xs font-semibold text-text-primary">{ch.name}</span>
					<span
						className={cn(
							"inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-semibold",
							ch.isPrivate
								? "bg-amber-100 text-amber-700"
								: "bg-green-100 text-green-700",
						)}
					>
						{ch.isPrivate ? "Private" : "Public"}
					</span>
				</div>
				<p className="text-[10px] text-text-tertiary truncate">{ch.description}</p>
			</div>
			<div className="flex items-center gap-2.5 shrink-0">
				<span className="flex items-center gap-1 text-[10px] text-text-tertiary">
					<Users size={10} /> {ch.members.toLocaleString("en-IN")}
				</span>
				<span className="flex items-center gap-1 text-[10px] text-green-500 font-medium">
					<span className="h-1.5 w-1.5 rounded-full bg-green-500" />
					{ch.online} online
				</span>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild>
						<button className="rounded-md p-1 text-text-tertiary hover:text-text-primary hover:bg-neutral-100 transition-colors opacity-0 group-hover:opacity-100">
							<MoreHorizontal size={13} />
						</button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Portal>
						<DropdownMenu.Content
							align="end"
							sideOffset={4}
							className="z-50 min-w-32.5 rounded-xl border border-border-default bg-surface-card shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
						>
							<DropdownMenu.Item
								onSelect={() => onEdit(ch)}
								className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-card-muted cursor-pointer outline-none"
							>
								<Pencil size={12} className="text-text-tertiary" />
								Edit Channel
							</DropdownMenu.Item>
							<DropdownMenu.Item
								onSelect={() => onDelete(ch)}
								className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer outline-none"
							>
								<Trash2 size={12} />
								Delete Channel
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			</div>
		</div>
	)
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChatTab({ communityId }: { communityId: string }) {
	const [data, setData] = useState<ChatTabData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showAllReported, setShowAllReported] = useState(false)
	const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())
	const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

	// Channel drawer state
	const [drawerOpen, setDrawerOpen] = useState(false)
	const [editingChannel, setEditingChannel] = useState<ChatChannel | null>(null)

	// Delete confirm state
	const [deleteTarget, setDeleteTarget] = useState<ChatChannel | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			setData(await getCommunityChat(communityId))
		} catch {
			setError("Failed to load chat.")
		} finally {
			setIsLoading(false)
		}
	}, [communityId])

	useEffect(() => {
		load()
	}, [load])

	function openCreateDrawer() {
		setEditingChannel(null)
		setDrawerOpen(true)
	}

	function openEditDrawer(ch: ChatChannel) {
		setEditingChannel(ch)
		setDrawerOpen(true)
	}

	function openDeleteConfirm(ch: ChatChannel) {
		setDeleteTarget(ch)
	}

	async function handleDelete() {
		if (!deleteTarget) return
		setIsDeleting(true)
		try {
			await deleteCommunityChannel(communityId, deleteTarget.id)
			toast.success(`#${deleteTarget.name} deleted`)
			setDeleteTarget(null)
			load()
		} catch {
			toast.error("Failed to delete channel. Please try again.")
		} finally {
			setIsDeleting(false)
		}
	}

	if (error) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error}
			</div>
		)
	}

	const stats = data?.stats
	const visibleReported = (data?.reportedMessages ?? []).filter(
		m => !approvedIds.has(m.id) && !removedIds.has(m.id),
	)
	const displayedReported = showAllReported ? visibleReported : visibleReported.slice(0, 4)

	return (
		<>
			<div className="flex items-start gap-5">
				{/* ── Main ──────────────────────────────────────────────────────── */}
				<div className="flex-1 min-w-0 flex flex-col gap-5">
					{/* Header */}
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="text-base font-semibold text-text-primary">
								Community Chat Management
							</h2>
							<p className="mt-0.5 text-xs text-text-tertiary">
								Manage conversations, moderate messages and keep the community chat safe and
								engaging.
							</p>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<Button
								variant="secondary"
								size="sm"
								radius="md"
								leftIcon={<Settings size={13} />}
								onClick={() => toast.info("Chat settings coming soon")}
							>
								Chat Settings
							</Button>
							<Button
								variant="primary"
								size="sm"
								radius="md"
								leftIcon={<Plus size={13} />}
								onClick={openCreateDrawer}
							>
								Create Channel
							</Button>
						</div>
					</div>

					{/* Stat cards */}
					{/* TODO: wire growth values from getCommunityChat API response */}
					<div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
						<StatCard
							icon={Hash}
							label="Total Channels"
							value={isLoading ? "—" : (stats?.totalChannels ?? 0)}
							sub="Active channels"
							accent="purple"
						/>
						<StatCard
							icon={Users}
							label="Active Members"
							value={isLoading ? "—" : (stats?.activeMembers ?? 0)}
							sub={`Online now: ${stats?.onlineNow ?? 0}`}
							accent="green"
						/>
						<StatCard
							icon={Flag}
							label="Reported Messages"
							value={isLoading ? "—" : (stats?.reportedMessages ?? 0)}
							sub="Needs review"
							accent="rose"
						/>
						<StatCard
							icon={VolumeX}
							label="Muted Users"
							value={isLoading ? "—" : (stats?.mutedUsers ?? 0)}
							sub="Across all channels"
							accent="amber"
						/>
						<StatCard
							icon={Pin}
							label="Pinned Messages"
							value={isLoading ? "—" : (stats?.pinnedMessages ?? 0)}
							sub="Across all channels"
							accent="sky"
						/>
					</div>

					{/* Two-column content grid */}
					<div className="grid grid-cols-2 gap-4">
						{/* ── LEFT: Chat Channels ─────────────────────────────── */}
						<div className="flex flex-col gap-4">
							<div className="rounded-xl border border-border-default bg-surface-card p-4">
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-sm font-semibold text-text-primary">Chat Channels</h3>
									<button
										className="text-xs font-medium text-text-brand hover:underline"
										onClick={() => toast.info("View all channels coming soon")}
									>
										View All Channels
									</button>
								</div>
								<div className="flex flex-col gap-0.5">
									{(data?.channels ?? []).map(ch => (
										<ChannelRow
											key={ch.id}
											ch={ch}
											onEdit={openEditDrawer}
											onDelete={openDeleteConfirm}
										/>
									))}
								</div>
								<button
									className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-default py-2 text-xs font-medium text-text-secondary hover:bg-surface-card-muted transition-colors"
									onClick={openCreateDrawer}
								>
									<Plus size={12} /> Create New Channel
								</button>
							</div>

							{/* Pinned Messages */}
							<div className="rounded-xl border border-border-default bg-surface-card p-4">
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-sm font-semibold text-text-primary">Pinned Messages</h3>
									<button
										className="text-xs font-medium text-text-brand hover:underline"
										onClick={() => toast.info("View all pinned coming soon")}
									>
										View All
									</button>
								</div>
								<div className="flex flex-col gap-2">
									{(data?.pinnedMessages ?? []).map(pm => (
										<div
											key={pm.id}
											className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-card-muted transition-colors"
										>
											<div
												className={cn(
													"flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
													pm.id === "pm-1"
														? "bg-amber-50"
														: pm.id === "pm-2"
															? "bg-purple-50"
															: "bg-orange-50",
												)}
											>
												<Pin
													size={12}
													className={cn(
														pm.id === "pm-1"
															? "text-amber-500"
															: pm.id === "pm-2"
																? "text-purple-500"
																: "text-orange-500",
													)}
												/>
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-xs font-medium text-text-primary">
													{pm.title}
												</p>
												<p className="text-[10px] text-text-tertiary">
													Pinned in {pm.channel}
												</p>
											</div>
											<div className="flex items-center gap-1 text-[10px] text-text-tertiary shrink-0">
												<div
													className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
													style={{ backgroundColor: pm.pinnedByColor }}
												>
													{pm.pinnedByInitial}
												</div>
												<span>by {pm.pinnedBy}</span>
											</div>
										</div>
									))}
								</div>
								<button
									className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-default py-2 text-xs font-medium text-text-secondary hover:bg-surface-card-muted transition-colors"
									onClick={() => toast.info("Pin new message coming soon")}
								>
									<Plus size={12} /> Pin New Message
								</button>
							</div>

							{/* Muted Users */}
							<div className="rounded-xl border border-border-default bg-surface-card p-4">
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-sm font-semibold text-text-primary">
										Muted Users ({stats?.mutedUsers ?? 0})
									</h3>
									<button
										className="text-xs font-medium text-text-brand hover:underline"
										onClick={() => toast.info("View all muted users coming soon")}
									>
										View All
									</button>
								</div>
								<div className="flex flex-col gap-2.5">
									{(data?.mutedUsers ?? []).map(u => (
										<div key={u.id} className="flex items-center gap-2.5">
											<div
												className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
												style={{ backgroundColor: u.avatarColor }}
											>
												{u.avatarInitial}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-xs font-medium text-text-primary truncate">
													{u.name}
												</p>
												<p className="text-[10px] text-text-tertiary">
													Muted in {u.mutedInChannels} channel
													{u.mutedInChannels !== 1 ? "s" : ""}
												</p>
											</div>
											<span className="text-[10px] text-text-tertiary shrink-0">
												{u.timeAgo}
											</span>
										</div>
									))}
								</div>
								<button
									className="mt-3 w-full rounded-lg border border-border-default bg-surface-card py-1.5 text-[11px] font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
									onClick={() => toast.info("View all muted users coming soon")}
								>
									View All Muted Users
								</button>
							</div>
						</div>

						{/* ── RIGHT: Reported Messages + Auto-moderation ──────── */}
						<div className="flex flex-col gap-4">
							{/* Reported Messages */}
							<div className="rounded-xl border border-border-default bg-surface-card p-4">
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-sm font-semibold text-text-primary">
										Reported Messages ({visibleReported.length})
									</h3>
									<button
										className="text-xs font-medium text-red-500 hover:underline"
										onClick={() => toast.info("View all reports coming soon")}
									>
										View All
									</button>
								</div>
								<div className="flex flex-col gap-3">
									{displayedReported.map(msg => (
										<div
											key={msg.id}
											className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-card-muted p-3"
										>
											<div className="flex items-center justify-between gap-2">
												<div className="flex items-center gap-2">
													<div
														className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
														style={{ backgroundColor: msg.authorAvatarColor }}
													>
														{msg.authorAvatarInitial}
													</div>
													<span className="text-xs font-semibold text-text-primary">
														{msg.authorName}
													</span>
												</div>
												<span className="text-[10px] text-text-tertiary shrink-0">
													{msg.timeAgo}
												</span>
											</div>
											<p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
												{msg.message}
											</p>
											<div className="flex items-center gap-1 text-[10px] text-blue-500">
												<Hash size={9} />
												{msg.channel}
											</div>
											<div className="flex items-center gap-2">
												<button
													onClick={() => {
														setApprovedIds(prev => new Set([...prev, msg.id]))
														toast.success("Message approved")
													}}
													className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700 hover:bg-green-100 transition-colors"
												>
													<CheckCircle size={10} /> Approve
												</button>
												<button
													onClick={() => {
														setRemovedIds(prev => new Set([...prev, msg.id]))
														toast.error("Message removed")
													}}
													className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100 transition-colors"
												>
													<XCircle size={10} /> Remove
												</button>
												<button className="ml-auto rounded-lg border border-border-default bg-surface-card p-1 text-text-tertiary hover:bg-neutral-50 transition-colors">
													<MoreHorizontal size={12} />
												</button>
											</div>
										</div>
									))}
								</div>
								{visibleReported.length > 4 && (
									<button
										onClick={() => setShowAllReported(v => !v)}
										className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-card py-2 text-xs font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
									>
										{showAllReported ? "Show less" : `View All Reported Messages`}
										<ChevronDown
											size={12}
											className={cn(
												"transition-transform",
												showAllReported && "rotate-180",
											)}
										/>
									</button>
								)}
							</div>

							{/* Auto-moderation */}
							<div className="rounded-xl border border-border-default bg-surface-card p-4">
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-sm font-semibold text-text-primary">Auto-moderation</h3>
									<button
										className="flex items-center gap-0.5 text-xs font-medium text-text-brand hover:underline"
										onClick={() => toast.info("Manage filters coming soon")}
									>
										Manage <ChevronRight size={11} />
									</button>
								</div>
								<div className="flex flex-col gap-2">
									{(data?.autoModFilters ?? []).map(f => (
										<div key={f.label} className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<CheckCircle size={12} className="text-green-500 shrink-0" />
												<span className="text-[11px] text-text-primary">{f.label}</span>
											</div>
											<span
												className={cn(
													"text-[10px] font-semibold",
													f.enabled ? "text-green-600" : "text-text-tertiary",
												)}
											>
												{f.enabled ? "Enabled" : "Disabled"}
											</span>
										</div>
									))}
								</div>
								<button
									className="mt-3 w-full rounded-lg border border-border-default bg-surface-card py-1.5 text-[11px] font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
									onClick={() => toast.info("Configure filters coming soon")}
								>
									Configure Filters
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* ── Sidebar ───────────────────────────────────────────────────── */}
				<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">
					{/* Chat Overview */}
					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<div className="flex items-center justify-between mb-1">
							<h3 className="text-sm font-semibold text-text-primary">Chat Overview</h3>
							<span className="text-[10px] text-text-tertiary">Last 7 Days</span>
						</div>
						<button
							className="mb-2 text-xs font-medium text-text-brand hover:underline block ml-auto"
							onClick={() => toast.info("Analytics coming soon")}
						>
							View Analytics
						</button>
						<div className="divide-y divide-border-subtle">
							{(data?.overview ?? []).map(item => (
								<OverviewRow key={item.label} item={item} />
							))}
						</div>
					</div>

					{/* Moderation Tools */}
					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<h3 className="text-sm font-semibold text-text-primary mb-2">Moderation Tools</h3>
						<div className="flex flex-col">
							{(data?.moderationTools ?? []).map(tool => (
								<ModerationToolRow key={tool.label} tool={tool} />
							))}
						</div>
					</div>

					{/* Quick Actions — 2×2 grid */}
					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
						<div className="grid grid-cols-2 gap-2">
							{QUICK_ACTIONS.map(action => (
								<button
									key={action.label}
									onClick={
										action.label === "Create Channel"
											? openCreateDrawer
											: () => toast.info(`${action.label} coming soon`)
									}
									className="flex flex-col items-center gap-2 rounded-xl border border-border-default bg-surface-card p-3 text-center hover:bg-surface-card-muted transition-colors"
								>
									<div
										className={cn(
											"flex h-9 w-9 items-center justify-center rounded-xl",
											action.bg,
										)}
									>
										<action.icon size={16} className={action.color} />
									</div>
									<span className="text-[11px] font-medium text-text-secondary leading-tight">
										{action.label}
									</span>
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* ── Channel Drawer ────────────────────────────────────────────────── */}
			<ChannelDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				onSuccess={load}
				communityId={communityId}
				channel={editingChannel}
			/>

			{/* ── Delete Confirm Dialog ─────────────────────────────────────────── */}
			<ConfirmDialog
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleDelete}
				title={`Delete #${deleteTarget?.name}?`}
				description="This will permanently remove the channel and all its messages. This action cannot be undone."
				confirmLabel="Delete Channel"
				destructive
				isLoading={isDeleting}
			/>
		</>
	)
}
