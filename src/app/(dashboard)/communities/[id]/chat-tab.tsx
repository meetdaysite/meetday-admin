"use client"

import { useCallback, useEffect, useState } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import {
	Plus,
	Hash,
	Users,
	MoreHorizontal,
	Pin,
	Flag,
	VolumeX,
	Copy,
	Pencil,
	Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ChannelDrawer } from "@/components/communities/channel-drawer"
import {
	getCommunityChat,
	deleteCommunityChannel,
	type ChatTabData,
	type ChatChannel,
	type CommunityDetailManager,
	type CommunityStatus,
	type CommunityAccess,
} from "@/lib/api/communities"
import { cn } from "@/lib/utils"

// ─── Sub-components ───────────────────────────────────────────────────────────

function ComingSoon({ label }: { label: string }) {
	return (
		<div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-default">
			<p className="text-xs text-text-tertiary">{label} — coming soon</p>
		</div>
	)
}

function ChannelRow({
	ch,
	onEdit,
	onDelete,
}: {
	ch: ChatChannel
	onEdit: (ch: ChatChannel) => void
	onDelete: (ch: ChatChannel) => void
}) {
	return (
		<div className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-card-muted transition-colors group">
			<div
				className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white font-bold text-sm"
				style={{ backgroundColor: ch.iconColor }}
			>
				<Hash size={13} />
			</div>
			<div className="flex-1 min-w-0">
				<span className="text-xs font-semibold text-text-primary">{ch.name}</span>
				<p className="text-[10px] text-text-tertiary truncate">{ch.description}</p>
			</div>
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
							<Pencil size={12} className="text-text-tertiary" /> Edit Channel
						</DropdownMenu.Item>
						<DropdownMenu.Item
							onSelect={() => onDelete(ch)}
							className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer outline-none"
						>
							<Trash2 size={12} /> Delete Channel
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>
	)
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
	Owner: "bg-green-100 text-green-700",
	Manager: "bg-blue-100 text-blue-700",
	Moderator: "bg-purple-100 text-purple-700",
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChatTab({
	communityId,
	managers = [],
	communityMeta,
}: {
	communityId: string
	managers?: CommunityDetailManager[]
	communityMeta?: {
		status: CommunityStatus
		createdAt: string
		access: CommunityAccess
		communityUrl: string
	}
}) {
	const [data, setData] = useState<ChatTabData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const [drawerOpen, setDrawerOpen] = useState(false)
	const [editingChannel, setEditingChannel] = useState<ChatChannel | null>(null)
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

	useEffect(() => { load() }, [load])

	function openCreateDrawer() { setEditingChannel(null); setDrawerOpen(true) }
	function openEditDrawer(ch: ChatChannel) { setEditingChannel(ch); setDrawerOpen(true) }
	function openDeleteConfirm(ch: ChatChannel) { setDeleteTarget(ch) }

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
								Manage conversations, moderate messages and keep the community chat safe and engaging.
							</p>
						</div>
						<div className="flex items-center gap-2 shrink-0">
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
					<div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
						<StatCard
							icon={Hash}
							label="Total Channels"
							value={isLoading ? "—" : (data?.totalChannels ?? 0)}
							sub="Active channels"
							accent="purple"
						/>
						<StatCard
							icon={Users}
							label="Active Members"
							value="—"
							sub="Online now: —"
							accent="green"
						/>
						<StatCard
							icon={Flag}
							label="Reported Messages"
							value="—"
							sub="Needs review"
							accent="rose"
						/>
						<StatCard
							icon={VolumeX}
							label="Muted Users"
							value="—"
							sub="Across all channels"
							accent="amber"
						/>
						<StatCard
							icon={Pin}
							label="Pinned Messages"
							value="—"
							sub="Across all channels"
							accent="sky"
						/>
					</div>

					{/* Two-column content grid */}
					<div className="grid grid-cols-2 gap-4">
						{/* ── LEFT ────────────────────────────────────────────── */}
						<div className="flex flex-col gap-4">
							{/* Chat Channels — real data */}
							<div className="rounded-xl border border-border-default bg-surface-card p-4">
								<h3 className="text-sm font-semibold text-text-primary mb-3">Chat Channels</h3>
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
							</div>

							{/* Pinned Messages */}
							<div className="rounded-xl border border-border-default bg-surface-card p-4">
								<h3 className="text-sm font-semibold text-text-primary mb-3">Pinned Messages</h3>
								<ComingSoon label="Pinned messages" />
							</div>
						</div>

						{/* ── RIGHT ───────────────────────────────────────────── */}
						<div className="flex flex-col gap-4">
							{/* Reported Messages */}
							<div className="rounded-xl border border-border-default bg-surface-card p-4">
								<h3 className="text-sm font-semibold text-text-primary mb-3">Reported Messages</h3>
								<ComingSoon label="Reported messages" />
							</div>

							{/* Muted Users */}
							<div className="rounded-xl border border-border-default bg-surface-card p-4">
								<h3 className="text-sm font-semibold text-text-primary mb-3">Muted Users</h3>
								<ComingSoon label="Muted users" />
							</div>
						</div>
					</div>
				</div>

				{/* ── Sidebar ───────────────────────────────────────────────────── */}
				<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">
					{/* Community Status */}
					{communityMeta && (
						<div className="rounded-xl border border-border-default bg-surface-card p-4">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-sm font-semibold text-text-primary">Community Status</h3>
								<StatusBadge status={communityMeta.status} />
							</div>
							<dl className="flex flex-col gap-2.5 text-xs">
								<div className="flex items-center justify-between gap-2">
									<dt className="text-text-tertiary">Created on</dt>
									<dd className="text-text-primary font-medium">
										{new Date(communityMeta.createdAt).toLocaleDateString("en-GB", {
											day: "numeric", month: "short", year: "numeric",
										})}
									</dd>
								</div>
								<div className="flex items-center justify-between gap-2">
									<dt className="text-text-tertiary">Access</dt>
									<dd className="text-text-primary font-medium">
										{communityMeta.access === "PUBLIC"
											? "Public"
											: communityMeta.access === "APPROVAL_REQUIRED"
												? "Approval Required"
												: "Invite Only"}
									</dd>
								</div>
								<div className="flex flex-col gap-1 pt-0.5">
									<dt className="text-text-tertiary">Community URL</dt>
									<dd className="flex items-center gap-1.5">
										<span className="text-text-brand text-[11px] truncate">
											{communityMeta.communityUrl}
										</span>
										<button
											className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
											onClick={() => {
												void navigator.clipboard.writeText(communityMeta.communityUrl)
												toast.success("URL copied!")
											}}
										>
											<Copy size={11} />
										</button>
									</dd>
								</div>
							</dl>
						</div>
					)}

					{/* Chat Overview */}
					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<h3 className="text-sm font-semibold text-text-primary mb-3">
							Chat Overview <span className="font-normal text-text-tertiary">(Last 7 Days)</span>
						</h3>
						<ComingSoon label="Chat overview" />
					</div>

					{/* Managers & Moderators */}
					{managers.length > 0 && (
						<div className="rounded-xl border border-border-default bg-surface-card p-4">
							<h3 className="text-sm font-semibold text-text-primary mb-3">Managers &amp; Moderators</h3>
							<div className="flex flex-col gap-2.5">
								{managers.map(m => (
									<div key={m.id} className="flex items-center gap-2.5">
										{m.avatarUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={m.avatarUrl}
												alt={m.name}
												className="h-7 w-7 shrink-0 rounded-full object-cover"
											/>
										) : (
											<div className="h-7 w-7 shrink-0 rounded-full bg-surface-brand-soft flex items-center justify-center text-[10px] font-semibold text-text-brand">
												{m.initial}
											</div>
										)}
										<span className="flex-1 text-xs font-medium text-text-primary truncate">
											{m.name}
										</span>
										<span
											className={cn(
												"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0",
												ROLE_BADGE[m.role] ?? "bg-neutral-100 text-neutral-600",
											)}
										>
											{m.role}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Quick Actions */}
					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
						<button
							onClick={openCreateDrawer}
							className="flex items-center gap-3 w-full rounded-lg border border-purple-200 bg-purple-50 px-3 py-2.5 transition-opacity hover:opacity-80 text-left"
						>
							<Hash size={15} className="shrink-0 text-purple-500" />
							<span className="text-xs font-medium text-purple-500">Create Channel</span>
						</button>
					</div>
				</div>
			</div>

			<ChannelDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				onSuccess={load}
				communityId={communityId}
				channel={editingChannel}
			/>

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
