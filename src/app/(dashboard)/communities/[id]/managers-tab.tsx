"use client"

import { useCallback, useEffect, useState } from "react"
import {
	Crown,
	Shield,
	Users,
	Eye,
	UserPlus,
	ChevronRight,
	Trash2,
	Calendar,
	MessageSquare,
	Bell,
	type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { PieChart, Pie, Cell } from "recharts"
import { StatCard } from "@/components/dashboard/stat-card"
import {
	getCommunityManagers,
	removeCommunityMember,
	type ManagersTabData,
	type ManagerRoleType,
	type CommunityDetailActivity,
} from "@/lib/api/communities"
import { cn } from "@/lib/utils"

const ROLE_BADGE: Record<ManagerRoleType, string> = {
	Owner: "bg-red-100 text-red-600",
	Manager: "bg-blue-100 text-blue-700",
	Moderator: "bg-green-100 text-green-700",
	"View Only": "bg-orange-100 text-orange-600",
}

const ACTIVITY_ICON: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
	member:       { icon: Users,         bg: "bg-blue-50",   color: "text-blue-500"   },
	experience:   { icon: Calendar,      bg: "bg-green-50",  color: "text-green-500"  },
	post:         { icon: MessageSquare, bg: "bg-purple-50", color: "text-purple-500" },
	announcement: { icon: Bell,          bg: "bg-amber-50",  color: "text-amber-500"  },
}

export function ManagersTab({
	communityId,
	recentActivity = [],
}: {
	communityId: string
	recentActivity?: CommunityDetailActivity[]
}) {
	const [data, setData] = useState<ManagersTabData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [roleFilter, setRoleFilter] = useState<string>("All Roles")
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

	useEffect(() => { load() }, [load])

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

	const stats = data?.stats
	const filteredMembers = (data?.teamMembers ?? []).filter(m =>
		roleFilter === "All Roles" || m.role === roleFilter,
	)

	if (error) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error}
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-5">
			{/* Header */}
			<div>
				<h2 className="text-base font-semibold text-text-primary">Community Managers</h2>
				<p className="mt-0.5 text-xs text-text-tertiary">
					View and manage the people who help run this community.
				</p>
			</div>

			{/* Stat cards */}
			<div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
				<StatCard icon={Crown}    label="Owners"      value={isLoading ? "—" : (stats?.owners ?? 0)}     sub="Full access"      accent="rose"   />
				<StatCard icon={Shield}   label="Managers"    value={isLoading ? "—" : (stats?.managers ?? 0)}   sub="Manage community" accent="sky"    />
				<StatCard icon={Users}    label="Moderators"  value={isLoading ? "—" : (stats?.moderators ?? 0)} sub="Moderate content" accent="green"  />
				<StatCard icon={Eye}      label="View Only"   value={isLoading ? "—" : (stats?.viewOnly ?? 0)}   sub="View analytics"   accent="amber"  />
				<StatCard icon={UserPlus} label="Total Users" value={isLoading ? "—" : (stats?.totalUsers ?? 0)} sub="With access"      accent="purple" />
			</div>

			{/* 2-col: left (Team Members + Access Summary) | right (Recent Activity) */}
			<div className="grid grid-cols-2 gap-4 items-start">
				{/* Left column */}
				<div className="flex flex-col gap-4">
					{/* Team Members */}
					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-semibold text-text-primary">
								Team Members ({stats?.totalUsers ?? 0})
							</h3>
							<div className="relative">
								<select
									value={roleFilter}
									onChange={e => setRoleFilter(e.target.value)}
									className="h-7 appearance-none rounded-lg border border-border-default bg-surface-card pl-2 pr-6 text-[11px] text-text-primary focus:outline-none"
								>
									{["All Roles", "Owner", "Manager", "Moderator", "View Only"].map(r => (
										<option key={r}>{r}</option>
									))}
								</select>
								<ChevronRight
									size={10}
									className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 rotate-90 text-text-tertiary"
								/>
							</div>
						</div>
						<div className="flex flex-col divide-y divide-border-subtle">
							{filteredMembers.map(m => (
								<div
									key={m.id}
									className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center py-2.5"
								>
									<div className="flex items-center gap-2 min-w-0">
										{m.avatarUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={m.avatarUrl}
												alt={m.name}
												className="h-8 w-8 shrink-0 rounded-full object-cover"
											/>
										) : (
											<div
												className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
												style={{ backgroundColor: m.avatarColor }}
											>
												{m.avatarInitial}
											</div>
										)}
										<p className="text-xs font-semibold text-text-primary truncate">{m.name}</p>
									</div>
									<span
										className={cn(
											"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",
											ROLE_BADGE[m.role],
										)}
									>
										{m.role}
									</span>
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
					</div>

					{/* Access Summary */}
					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<h3 className="text-sm font-semibold text-text-primary mb-4">Access Summary</h3>
						<div className="flex items-center gap-6">
							<div className="relative shrink-0">
								<PieChart width={140} height={140}>
									<Pie
										data={(data?.accessSummary ?? []).map(s => ({ value: s.pct }))}
										cx={70}
										cy={70}
										innerRadius={42}
										outerRadius={64}
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
									<span className="text-base font-bold text-text-primary">
										{stats?.totalUsers ?? "—"}
									</span>
									<span className="text-[9px] text-text-tertiary leading-tight text-center">
										Total
										<br />
										Users
									</span>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								{(data?.accessSummary ?? []).map(s => (
									<div key={s.label} className="flex items-center gap-2">
										<span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
										<span className="text-[11px] text-text-secondary">{s.label}</span>
										<span className="text-[11px] font-semibold text-text-primary ml-auto pl-3 tabular-nums">
											{s.count} ({s.pct}%)
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Right column: Recent Activity */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-3">Recent Activity</h3>
					{recentActivity.length === 0 ? (
						<p className="text-xs text-text-tertiary">No recent activity.</p>
					) : (
						<div className="flex flex-col gap-3.5">
							{recentActivity.map(item => {
								const cfg = ACTIVITY_ICON[item.type] ?? ACTIVITY_ICON.post
								const Icon = cfg.icon
								return (
									<div key={item.id} className="flex items-start gap-3">
										<div
											className={cn(
												"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
												cfg.bg,
											)}
										>
											<Icon size={14} className={cfg.color} />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs font-medium text-text-primary">{item.title}</p>
											<p className="text-[11px] text-text-tertiary truncate">{item.description}</p>
										</div>
										<span className="text-[11px] text-text-tertiary shrink-0">{item.timeAgo}</span>
									</div>
								)
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
