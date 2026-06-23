"use client"

import { useCallback, useEffect, useState } from "react"
import {
	Crown,
	Shield,
	Users,
	Eye,
	UserPlus,
	Search,
	SlidersHorizontal,
	ChevronRight,
	ArrowRight,
	ShieldCheck,
	LogIn,
	KeyRound,
	Puzzle,
	Lock,
	FileBarChart,
	Plus,
	Send,
	Info,
	TrendingUp,
	Trash2,
	type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { PieChart, Pie, Cell } from "recharts"
import { Button } from "@/components/ui/Button"
import { StatCard } from "@/components/dashboard/stat-card"
import {
	getCommunityManagers,
	removeCommunityMember,
	type ManagersTabData,
	type ManagerRoleType,
	type ManagerRoleOverview,
} from "@/lib/api/communities"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<ManagerRoleType, string> = {
	Owner: "bg-red-100 text-red-600",
	Manager: "bg-blue-100 text-blue-700",
	Moderator: "bg-green-100 text-green-700",
	"View Only": "bg-orange-100 text-orange-600",
}

const ROLE_ICON_MAP: Record<string, LucideIcon> = {
	crown: Crown,
	shield: Shield,
	users: Users,
	eye: Eye,
}

const ACTIVITY_ICON_MAP: Record<string, LucideIcon> = {
	promote: TrendingUp,
	join: UserPlus,
	edit: ShieldCheck,
}

const SECURITY_ITEMS = [
	{
		label: "Two-Factor Authentication",
		description: "Required for all managers",
		icon: ShieldCheck,
		badge: "Enabled",
		badgeClass: "bg-green-100 text-green-700",
	},
	{
		label: "Login Activity",
		description: "Monitor access and logins",
		icon: LogIn,
		badge: null,
		badgeClass: "",
	},
	{
		label: "Access Requests",
		description: "0 pending requests",
		icon: KeyRound,
		badge: null,
		badgeClass: "",
	},
	{
		label: "API & Integrations",
		description: "Manage app access",
		icon: Puzzle,
		badge: null,
		badgeClass: "",
	},
]

const QUICK_ACTIONS: { label: string; icon: LucideIcon; bg: string; color: string }[] = [
	{ label: "Add Manager", icon: Users, bg: "bg-purple-50", color: "text-purple-500" },
	{ label: "Manage Roles", icon: Shield, bg: "bg-orange-50", color: "text-orange-500" },
	{ label: "Role Permissions", icon: Lock, bg: "bg-green-50", color: "text-green-500" },
	{ label: "Access Report", icon: FileBarChart, bg: "bg-blue-50", color: "text-blue-500" },
]

// ─── Role overview row ────────────────────────────────────────────────────────

function RoleOverviewRow({ role }: { role: ManagerRoleOverview }) {
	const Icon = ROLE_ICON_MAP[role.iconKey] ?? Shield
	return (
		<div className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-0">
			<div
				className={cn(
					"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
					role.bg,
					role.border,
					"border",
				)}
			>
				<Icon size={14} className={role.color} />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-xs font-semibold text-text-primary">{role.role}</p>
				<p className="text-[10px] text-text-tertiary">{role.description}</p>
			</div>
			<span className="text-[11px] text-text-tertiary tabular-nums shrink-0">
				{role.permissions} / {role.maxPermissions} permissions
			</span>
			<button
				className="shrink-0 rounded-lg border border-border-default bg-surface-card px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
				onClick={() => toast.info(`Edit ${role.role} permissions coming soon`)}
			>
				Edit
			</button>
		</div>
	)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ManagersTab({ communityId }: { communityId: string }) {
	const [data, setData] = useState<ManagersTabData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [roleFilter, setRoleFilter] = useState<string>("All Roles")
	const [inviteName, setInviteName] = useState("")
	const [inviteEmail, setInviteEmail] = useState("")
	const [inviteRole, setInviteRole] = useState("")
	const [search, setSearch] = useState("")
	const [removingId, setRemovingId] = useState<string | null>(null)

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			setData(await getCommunityManagers(communityId))
		} catch {
			setError("Failed to load managers.")
		} finally {
			setIsLoading(false)
		}
	}, [communityId])

	useEffect(() => {
		load()
	}, [load])

	async function handleRemoveMember(memberId: string) {
		setRemovingId(memberId)
		try {
			await removeCommunityMember(communityId, memberId)
			toast.success("Member removed from community")
			setData(prev =>
				prev ? { ...prev, teamMembers: prev.teamMembers.filter(m => m.id !== memberId) } : prev,
			)
		} catch {
			toast.error("Failed to remove member")
		} finally {
			setRemovingId(null)
		}
	}

	function handleSendInvitation() {
		if (!inviteName.trim() || !inviteEmail.trim() || !inviteRole) {
			toast.error("Please fill in all fields")
			return
		}
		toast.success(`Invitation sent to ${inviteEmail}`)
		setInviteName("")
		setInviteEmail("")
		setInviteRole("")
	}

	const stats = data?.stats

	const filteredMembers = (data?.teamMembers ?? []).filter(m => {
		const q = search.toLowerCase()
		const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
		const matchRole = roleFilter === "All Roles" || m.role === roleFilter
		return matchSearch && matchRole
	})

	if (error) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error}
			</div>
		)
	}

	return (
		<div className="flex items-start gap-5">
			{/* ── Main ──────────────────────────────────────────────────────── */}
			<div className="flex-1 min-w-0 flex flex-col gap-5">
				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-base font-semibold text-text-primary">
							Community Managers &amp; Permissions
						</h2>
						<p className="mt-0.5 text-xs text-text-tertiary">
							Manage community roles, permissions and access. Add managers, moderators and set
							role-based access.
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
						<Button
							variant="primary"
							size="sm"
							radius="md"
							leftIcon={<Plus size={13} />}
							onClick={() => toast.info("Invite manager coming soon")}
						>
							Invite Manager
						</Button>
					</div>
				</div>

				{/* Stat cards */}
				{/* TODO: wire growth values from getCommunityManagers API response */}
				<div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
					<StatCard
						icon={Crown}
						label="Owners"
						value={isLoading ? "—" : (stats?.owners ?? 0)}
						sub="Full access"
						accent="rose"
					/>
					<StatCard
						icon={Shield}
						label="Managers"
						value={isLoading ? "—" : (stats?.managers ?? 0)}
						sub="Manage community"
						accent="sky"
					/>
					<StatCard
						icon={Users}
						label="Moderators"
						value={isLoading ? "—" : (stats?.moderators ?? 0)}
						sub="Moderate content"
						accent="green"
					/>
					<StatCard
						icon={Eye}
						label="View Only"
						value={isLoading ? "—" : (stats?.viewOnly ?? 0)}
						sub="View analytics"
						accent="amber"
					/>
					<StatCard
						icon={UserPlus}
						label="Total Users"
						value={isLoading ? "—" : (stats?.totalUsers ?? 0)}
						sub="With access"
						accent="purple"
					/>
				</div>

				{/* 2-column content grid */}
				<div className="grid grid-cols-2 gap-4">
					{/* ── LEFT: Team Members + Permission Matrix ─────────── */}
					<div className="flex flex-col gap-4">
						{/* Team Members */}
						<div className="rounded-xl border border-border-default bg-surface-card p-4">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-sm font-semibold text-text-primary">
									Team Members ({stats?.totalUsers ?? 0})
								</h3>
								<div className="flex items-center gap-2">
									<div className="relative">
										<select
											value={roleFilter}
											onChange={e => setRoleFilter(e.target.value)}
											className="h-7 appearance-none rounded-lg border border-border-default bg-surface-card pl-2 pr-6 text-[11px] text-text-primary focus:outline-none"
										>
											{["All Roles", "Owner", "Manager", "Moderator", "View Only"].map(
												r => (
													<option key={r}>{r}</option>
												),
											)}
										</select>
										<ChevronRight
											size={10}
											className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 rotate-90 text-text-tertiary"
										/>
									</div>
									<button className="flex items-center gap-1 rounded-lg border border-border-default px-2 py-1 text-[11px] text-text-secondary hover:bg-neutral-50 transition-colors">
										<SlidersHorizontal size={10} /> Filters
									</button>
								</div>
							</div>

							{/* Table header */}
							<div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center py-1.5 border-b border-border-default text-[10px] font-semibold text-text-tertiary uppercase tracking-wide">
								<span>Member</span>
								<span>Role</span>
								<span>Permissions</span>
								<span>Joined</span>
								<span>Status</span>
								<span>Actions</span>
							</div>

							<div className="flex flex-col divide-y divide-border-subtle">
								{filteredMembers.map(m => (
									<div
										key={m.id}
										className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center py-2.5"
									>
										{/* Member */}
										<div className="flex items-center gap-2 min-w-0">
											<div
												className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
												style={{ backgroundColor: m.avatarColor }}
											>
												{m.avatarInitial}
											</div>
											<div className="min-w-0">
												<p className="text-xs font-semibold text-text-primary truncate">
													{m.name}
												</p>
												<p className="text-[10px] text-text-tertiary truncate">
													{m.email}
												</p>
											</div>
										</div>
										{/* Role */}
										<span
											className={cn(
												"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",
												ROLE_BADGE[m.role],
											)}
										>
											{m.role}
										</span>
										{/* Permissions */}
										<div className="text-right min-w-20">
											<p className="text-[11px] font-medium text-text-primary whitespace-nowrap">
												{m.permissionsLabel}
											</p>
											<p className="text-[10px] text-text-tertiary">
												{m.permissionsCount} permissions
											</p>
										</div>
										{/* Joined */}
										<p className="text-[10px] text-text-tertiary whitespace-nowrap">
											{m.joinedDate}
										</p>
										{/* Status */}
										<span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 whitespace-nowrap">
											{m.status}
										</span>
										{/* Actions */}
										<button
											disabled={removingId === m.id}
											onClick={() => handleRemoveMember(m.id)}
											className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
											title="Remove from community"
										>
											<Trash2 size={13} />
										</button>
									</div>
								))}
							</div>

							<button
								className="mt-3 flex items-center gap-1.5 text-xs font-medium text-text-brand hover:underline"
								onClick={() => toast.info("View all team members coming soon")}
							>
								View All Team Members <ArrowRight size={12} />
							</button>
						</div>

						{/* Permission Matrix */}
						<div className="rounded-xl border border-border-default bg-surface-card p-4">
							<div className="mb-3">
								<h3 className="text-sm font-semibold text-text-primary">Permission Matrix</h3>
								<p className="text-[11px] text-text-tertiary mt-0.5">
									See what each role can access and manage.
								</p>
							</div>

							{/* Matrix table */}
							<div className="overflow-x-auto">
								<table className="w-full text-[11px]">
									<thead>
										<tr className="border-b border-border-default">
											<th className="pb-2 text-left font-semibold text-text-secondary">
												Permissions
											</th>
											{[
												{ label: "Owner", icon: Crown, color: "text-red-500" },
												{ label: "Manager", icon: Shield, color: "text-blue-500" },
												{ label: "Moderator", icon: Users, color: "text-green-500" },
												{ label: "View Only", icon: Eye, color: "text-orange-500" },
											].map(col => (
												<th
													key={col.label}
													className="pb-2 text-center font-semibold text-text-secondary"
												>
													<div className="flex flex-col items-center gap-0.5">
														<col.icon size={12} className={col.color} />
														<span className="text-[9px]">{col.label}</span>
													</div>
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{(data?.permissionMatrix ?? []).map(row => (
											<tr
												key={row.label}
												className="border-b border-border-subtle last:border-0"
											>
												<td className="py-2 text-text-primary pr-4">{row.label}</td>
												{[row.owner, row.manager, row.moderator, row.viewOnly].map(
													(has, i) => (
														<td key={i} className="py-2 text-center">
															{has ? (
																<span className="inline-flex items-center justify-center">
																	<svg
																		width="14"
																		height="14"
																		viewBox="0 0 14 14"
																		fill="none"
																	>
																		<circle
																			cx="7"
																			cy="7"
																			r="7"
																			fill="#dcfce7"
																		/>
																		<path
																			d="M4.5 7L6 8.5L9.5 5"
																			stroke="#16a34a"
																			strokeWidth="1.5"
																			strokeLinecap="round"
																			strokeLinejoin="round"
																		/>
																	</svg>
																</span>
															) : (
																<span className="text-text-tertiary">—</span>
															)}
														</td>
													),
												)}
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<button
								className="mt-3 flex items-center gap-1.5 text-xs font-medium text-text-brand hover:underline"
								onClick={() => toast.info("View all permissions coming soon")}
							>
								View All Permissions <ArrowRight size={12} />
							</button>
						</div>
					</div>

					{/* ── RIGHT: Role Overview + Invite ─────────────────── */}
					<div className="flex flex-col gap-4">
						{/* Role & Permission Overview */}
						<div className="rounded-xl border border-border-default bg-surface-card p-4">
							<div className="mb-3">
								<h3 className="text-sm font-semibold text-text-primary">
									Role &amp; Permission Overview
								</h3>
								<p className="text-[11px] text-text-tertiary mt-0.5">
									Manage what each role can access and modify.
								</p>
							</div>
							<div className="flex flex-col">
								{(data?.roleOverview ?? []).map(role => (
									<RoleOverviewRow key={role.role} role={role} />
								))}
							</div>
							<button
								className="mt-3 flex items-center gap-1.5 text-xs font-medium text-text-brand hover:underline"
								onClick={() => toast.info("Customize roles coming soon")}
							>
								Customize Roles &amp; Permissions <ArrowRight size={12} />
							</button>
						</div>

						{/* Invite New Manager */}
						<div className="rounded-xl border border-border-default bg-surface-card p-4">
							<div className="mb-3">
								<h3 className="text-sm font-semibold text-text-primary">
									Invite New Manager
								</h3>
								<p className="text-[11px] text-text-tertiary mt-0.5">
									Invite someone to help manage this community.
								</p>
							</div>
							<div className="flex flex-col gap-3">
								<input
									type="text"
									placeholder="Full name"
									value={inviteName}
									onChange={e => setInviteName(e.target.value)}
									className="h-9 w-full rounded-lg border border-border-default bg-surface-card px-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
								/>
								<input
									type="email"
									placeholder="Email address"
									value={inviteEmail}
									onChange={e => setInviteEmail(e.target.value)}
									className="h-9 w-full rounded-lg border border-border-default bg-surface-card px-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
								/>
								<div className="relative">
									<select
										value={inviteRole}
										onChange={e => setInviteRole(e.target.value)}
										className="h-9 w-full appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-8 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
									>
										<option value="">Select Role</option>
										{["Manager", "Moderator", "View Only"].map(r => (
											<option key={r}>{r}</option>
										))}
									</select>
									<ChevronRight
										size={12}
										className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-text-tertiary"
									/>
								</div>
								<button
									onClick={handleSendInvitation}
									className="flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-purple-500 to-indigo-500 py-2.5 text-xs font-semibold text-white hover:from-purple-600 hover:to-indigo-600 transition-all"
								>
									Send Invitation <Send size={12} />
								</button>
								<div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
									<Info size={11} className="shrink-0" />
									<span>They&apos;ll receive an email invitation to join.</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ── Sidebar ───────────────────────────────────────────────────── */}
			<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">
				{/* Access Summary */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-3">Access Summary</h3>
					<div className="flex items-center gap-4">
						<div className="relative shrink-0">
							<PieChart width={100} height={100}>
								<Pie
									data={(data?.accessSummary ?? []).map(s => ({ value: s.pct }))}
									cx={50}
									cy={50}
									innerRadius={30}
									outerRadius={46}
									startAngle={90}
									endAngle={-270}
									dataKey="value"
									strokeWidth={2}
									stroke="#fff"
									paddingAngle={1}
								>
									{(data?.accessSummary ?? []).map((s, i) => (
										<Cell key={i} fill={s.color} />
									))}
								</Pie>
							</PieChart>
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<span className="text-sm font-bold text-text-primary">
									{stats?.totalUsers ?? "—"}
								</span>
								<span className="text-[9px] text-text-tertiary leading-tight text-center">
									Total
									<br />
									Users
								</span>
							</div>
						</div>
						<div className="flex flex-col gap-1.5">
							{(data?.accessSummary ?? []).map(s => (
								<div key={s.label} className="flex items-center gap-2">
									<span
										className="h-2 w-2 rounded-full shrink-0"
										style={{ backgroundColor: s.color }}
									/>
									<span className="text-[11px] text-text-secondary">{s.label}</span>
									<span className="text-[11px] font-semibold text-text-primary ml-auto pl-2 tabular-nums">
										{s.count} ({s.pct}%)
									</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Activity Timeline */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Activity Timeline</h3>
						<button
							className="text-xs font-medium text-text-brand hover:underline"
							onClick={() => toast.info("View all activity coming soon")}
						>
							View All
						</button>
					</div>
					<div className="flex flex-col gap-3">
						{(data?.activities ?? []).map(a => {
							const Icon = ACTIVITY_ICON_MAP[a.iconKey] ?? UserPlus
							return (
								<div key={a.id} className="flex items-start gap-2.5">
									<div
										className={cn(
											"flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
											a.iconBg,
										)}
									>
										<Icon size={12} className={a.iconColor} />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-[11px] text-text-primary leading-snug">{a.text}</p>
										<p className="text-[10px] text-text-tertiary mt-0.5">{a.timeAgo}</p>
									</div>
								</div>
							)
						})}
					</div>
				</div>

				{/* Security & Access */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-2">Security &amp; Access</h3>
					<div className="flex flex-col">
						{SECURITY_ITEMS.map(item => (
							<button
								key={item.label}
								className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-card-muted transition-colors text-left"
								onClick={() => toast.info(`${item.label} coming soon`)}
							>
								<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
									<item.icon size={12} className="text-text-secondary" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-xs font-medium text-text-primary">{item.label}</p>
									<p className="text-[10px] text-text-tertiary truncate">
										{item.description}
									</p>
								</div>
								{item.badge ? (
									<span
										className={cn(
											"shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
											item.badgeClass,
										)}
									>
										{item.badge}
									</span>
								) : (
									<ChevronRight size={12} className="text-text-tertiary shrink-0" />
								)}
							</button>
						))}
					</div>
				</div>

				{/* Quick Actions 2×2 */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
					<div className="grid grid-cols-2 gap-2">
						{QUICK_ACTIONS.map(action => (
							<button
								key={action.label}
								onClick={() => toast.info(`${action.label} coming soon`)}
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
	)
}
