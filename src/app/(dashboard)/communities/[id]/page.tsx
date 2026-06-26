"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
	ExternalLink,
	Copy,
	Share2,
	Megaphone,
	CalendarPlus,
	MessageSquare,
	Users,
	Calendar,
	Bell,
	Star,
	TrendingUp,
	TrendingDown,
	type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { usePermission } from "@/lib/hooks/use-permission"
import { Button } from "@/components/ui/Button"
import { StatusBadge } from "@/components/ui/status-badge"
import {
	getCommunityById,
	type CommunityDetailData,
	type CommunityDetailStatCard,
} from "@/lib/api/communities"
import { cn } from "@/lib/utils"
import { ExperiencesTab } from "./experiences-tab"
import { MembersTab } from "./members-tab"
import { FeedTab } from "./feed-tab"
import { AnnouncementsTab } from "./announcements-tab"
import { ChatTab } from "./chat-tab"
import { AnalyticsTab } from "./analytics-tab"
import { ManagersTab } from "./managers-tab"

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab =
	| "overview"
	| "experiences"
	| "members"
	| "feed"
	| "announcements"
	| "chat"
	| "analytics"
	| "managers"

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
	{ id: "overview", label: "Overview" },
	{ id: "experiences", label: "Experiences" },
	{ id: "members", label: "Members" },
	{ id: "feed", label: "Feed" },
	{ id: "announcements", label: "Announcements" },
	{ id: "chat", label: "Chat" },
	{ id: "analytics", label: "Analytics" },
	{ id: "managers", label: "Managers" },
]

const ROLE_BADGE: Record<string, string> = {
	Owner: "bg-green-100 text-green-700",
	Manager: "bg-blue-100 text-blue-700",
	Moderator: "bg-purple-100 text-purple-700",
}

const ACTIVITY_ICON: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
	member: { icon: Users, bg: "bg-blue-50", color: "text-blue-500" },
	experience: { icon: Calendar, bg: "bg-green-50", color: "text-green-500" },
	post: { icon: MessageSquare, bg: "bg-purple-50", color: "text-purple-500" },
	announcement: { icon: Bell, bg: "bg-amber-50", color: "text-amber-500" },
}

const QUICK_ACTIONS: { label: string; icon: React.ElementType; bg: string; border: string; color: string; tab: Tab }[] = [
	{ label: "Create Announcement", icon: Megaphone,     bg: "bg-rose-50",   border: "border-rose-200",   color: "text-rose-500",   tab: "announcements" },
	{ label: "Schedule Event",      icon: CalendarPlus,  bg: "bg-sky-50",    border: "border-sky-200",    color: "text-sky-500",    tab: "experiences"   },
	{ label: "Post in Community",   icon: MessageSquare, bg: "bg-purple-50", border: "border-purple-200", color: "text-purple-500", tab: "feed"          },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailStatCard({ card }: { card: CommunityDetailStatCard }) {
	return (
		<div className="rounded-xl border border-border-default bg-surface-card p-4 flex flex-col gap-1.5">
			<p className="text-xs text-text-tertiary font-medium">{card.label}</p>
			<div className="flex items-baseline gap-2">
				<span className="text-2xl font-bold text-text-primary tabular-nums leading-none">
					{card.value}
				</span>
				{card.trend && (
					<span
						className={cn(
							"flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
							card.trend.direction === "up"
								? "bg-green-50 text-green-700"
								: "bg-red-50 text-red-600",
						)}
					>
						{card.trend.direction === "up" ? (
							<TrendingUp size={10} />
						) : (
							<TrendingDown size={10} />
						)}
						{card.trend.value > 0 ? "+" : ""}
						{card.trend.value}
						{card.trend.label ?? ""}
					</span>
				)}
			</div>
			{card.sub && <p className="text-[11px] text-text-tertiary">{card.sub}</p>}
			{card.spark.length > 0 && (
				<div className="h-12 mt-1">
					<ResponsiveContainer width="100%" height={48}>
						<LineChart data={card.spark}>
							<Line
								type="monotone"
								dataKey="v"
								stroke={card.color}
								strokeWidth={1.5}
								dot={false}
								isAnimationActive={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			)}
		</div>
	)
}

function SidebarCard({
	title,
	children,
	action,
}: {
	title: string
	children: React.ReactNode
	action?: React.ReactNode
}) {
	return (
		<div className="rounded-xl border border-border-default bg-surface-card p-4">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-sm font-semibold text-text-primary">{title}</h3>
				{action}
			</div>
			{children}
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunityDetailPage() {
	const params = useParams()
	const id = params.id as string
	const router = useRouter()
	const canView = usePermission("community.manage")

	const [community, setCommunity] = useState<CommunityDetailData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState<Tab>("overview")

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const data = await getCommunityById(id)
			setCommunity(data)
		} catch {
			setError("Failed to load community.")
		} finally {
			setIsLoading(false)
		}
	}, [id])

	useEffect(() => {
		load()
	}, [load])

	if (!canView) return null

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<span className="text-sm text-text-tertiary">Loading…</span>
			</div>
		)
	}

	if (error || !community) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error ?? "Community not found."}
			</div>
		)
	}

	const createdDate = new Date(community.createdAt).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})

	const accessLabel =
		community.access === "PUBLIC"
			? "Public"
			: community.access === "APPROVAL_REQUIRED"
				? "Approval Required"
				: "Invite Only"

	return (
		<div className="p-6 max-w-7xl mx-auto">
			{/* ── Header ────────────────────────────────────────────────────── */}
			<div className="flex items-start justify-between gap-4 pb-5">
				<div className="flex items-start gap-4">
					{community.iconUrl ? (
						<img
							src={community.iconUrl}
							alt={community.name}
							className="h-16 w-16 shrink-0 rounded-full object-cover"
						/>
					) : (
						<div className="h-16 w-16 shrink-0 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-bold select-none">
							{community.name[0]}
						</div>
					)}
					<div>
						<div className="flex items-center gap-2 flex-wrap">
							<h1 className="text-base font-semibold text-text-primary">{community.name}</h1>
							{community.isMeetdayManaged && (
								<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-700">
									Meetday Managed
								</span>
							)}
							<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-green-100 text-green-700">
								{accessLabel} Community
							</span>
						</div>
						{community.description && (
							<p className="mt-1 text-xs text-text-tertiary max-w-lg">
								{community.description}
							</p>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<Button
						variant="secondary"
						size="sm"
						radius="md"
						leftIcon={<ExternalLink size={13} />}
						onClick={() => toast.info("Opens the community on meetday.ai")}
					>
						View Community
					</Button>
				</div>
			</div>

			{/* ── Tabs ──────────────────────────────────────────────────────── */}
			<div className="border-b border-border-default mb-5">
				<nav className="flex gap-1 -mb-px overflow-x-auto no-scrollbar">
					{TABS.map(tab => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={cn(
								"shrink-0 px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap",
								activeTab === tab.id
									? "border-b-2 border-action-primary text-text-brand"
									: "border-b-2 border-transparent text-text-tertiary hover:text-text-primary",
							)}
						>
							{tab.label}
						</button>
					))}
				</nav>
			</div>

			{/* ── Tab Content ───────────────────────────────────────────────── */}
			{activeTab === "overview" ? (
				<div className="flex items-start gap-5">
					{/* ── Main ──────────────────────────────────────────────── */}
					<div className="flex-1 min-w-0 flex flex-col gap-5">
						{/* Stat cards */}
						<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
							{community.statCards.map(card => (
								<DetailStatCard key={card.label} card={card} />
							))}
						</div>

						{/* Upcoming Experiences */}
						<div className="rounded-xl border border-border-default bg-surface-card p-4">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h2 className="text-sm font-semibold text-text-primary">
										Upcoming Experiences
									</h2>
								</div>
								<button
									className="text-xs font-medium text-text-brand hover:underline"
									onClick={() => setActiveTab("experiences")}
								>
									View All
								</button>
							</div>
							{community.upcomingExperiences.length === 0 ? (
								<p className="text-xs text-text-tertiary">No upcoming experiences.</p>
							) : (
								<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
									{community.upcomingExperiences.map(exp => (
										<div
											key={exp.id}
											className="rounded-lg overflow-hidden border border-border-default"
										>
											<div
												className="h-24 flex items-end relative bg-surface-secondary"
												style={exp.coverUrl ? undefined : { backgroundColor: "#1a0533" }}
											>
												{exp.coverUrl ? (
													<img src={exp.coverUrl} alt={exp.title} className="absolute inset-0 w-full h-full object-cover" />
												) : (
													<span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white/10 select-none">
														{exp.coverInitial}
													</span>
												)}
											</div>
											<div className="p-2.5">
												<p className="text-xs font-semibold text-text-primary truncate">
													{exp.title}
												</p>
												<p className="text-[10px] text-text-tertiary mt-0.5">
													{exp.date}
												</p>
												<p className="text-[10px] text-text-tertiary">{exp.venue}</p>
												{(exp.attendeeCount > 0 || (exp.rating != null && exp.rating > 0)) && (
													<div className="flex items-center justify-between mt-2">
														{exp.attendeeCount > 0 && (
															<span className="flex items-center gap-0.5 text-[10px] text-text-secondary">
																<Users size={9} /> {exp.attendeeCount}
															</span>
														)}
														{exp.rating != null && exp.rating > 0 && (
															<span className="flex items-center gap-0.5 text-[10px] text-text-secondary">
																<Star size={9} /> {exp.rating}
															</span>
														)}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Recent Activity + Top Engagement */}
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{/* Recent Activity */}
							<div className="rounded-xl border border-border-default bg-surface-card p-4">
								<div className="mb-3">
									<h2 className="text-sm font-semibold text-text-primary">
										Recent Activity
									</h2>
								</div>
								{community.recentActivity.length === 0 ? (
									<p className="text-xs text-text-tertiary">No recent activity.</p>
								) : (
									<div className="flex flex-col gap-3.5">
										{community.recentActivity.map(item => {
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
														<p className="text-xs font-medium text-text-primary">
															{item.title}
														</p>
														<p className="text-[11px] text-text-tertiary truncate">
															{item.description}
														</p>
													</div>
													<span className="text-[11px] text-text-tertiary shrink-0">
														{item.timeAgo}
													</span>
												</div>
											)
										})}
									</div>
								)}
							</div>

							{/* Top Engagement */}
							<div className="rounded-xl border border-border-default bg-surface-card p-4">
								<div className="mb-3">
									<h2 className="text-sm font-semibold text-text-primary">
										Top Engagement{" "}
										<span className="font-normal text-text-tertiary">(7 Days)</span>
									</h2>
								</div>
								{community.topEngagement.length === 0 ? (
									<p className="text-xs text-text-tertiary">No engagement data yet.</p>
								) : (
									<div className="flex flex-col gap-3">
										{community.topEngagement.map(item => (
											<div key={item.label} className="flex items-center gap-3">
												<span className="text-xs text-text-secondary w-24 shrink-0">
													{item.label}
												</span>
												<div className="flex-1 h-1.5 rounded-full bg-surface-card-muted overflow-hidden">
													<div
														className="h-full rounded-full"
														style={{
															width: `${Math.round((item.value / item.max) * 100)}%`,
															backgroundColor: item.color,
														}}
													/>
												</div>
												<span className="text-xs font-semibold text-text-primary w-8 text-right tabular-nums">
													{item.value}
												</span>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* ── Sidebar ───────────────────────────────────────────── */}
					<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">
						{/* Community Status */}
						<SidebarCard
							title="Community Status"
							action={<StatusBadge status={community.status} />}
						>
							<dl className="flex flex-col gap-2.5 text-xs">
								<div className="flex items-center justify-between gap-2">
									<dt className="text-text-tertiary">Created on</dt>
									<dd className="text-text-primary font-medium">{createdDate}</dd>
								</div>
								<div className="flex items-center justify-between gap-2">
									<dt className="text-text-tertiary">Access</dt>
									<dd className="text-text-primary font-medium">{accessLabel}</dd>
								</div>
								<div className="flex flex-col gap-1 pt-0.5">
									<dt className="text-text-tertiary">Community URL</dt>
									<dd className="flex items-center gap-1.5">
										<span className="text-text-brand text-[11px] truncate">
											{community.communityUrl}
										</span>
										<button
											className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
											onClick={() => {
												navigator.clipboard.writeText(community.communityUrl)
												toast.success("URL copied!")
											}}
										>
											<Copy size={11} />
										</button>
									</dd>
								</div>
							</dl>
							<Button
								variant="primary"
								size="sm"
								radius="md"
								leftIcon={<Share2 size={13} />}
								className="w-full mt-4"
								onClick={() => toast.info("Share community coming soon")}
							>
								Share Community
							</Button>
						</SidebarCard>

						{/* Managers & Moderators */}
						<SidebarCard
							title="Managers & Moderators"
							action={
								<button
									className="text-xs font-medium text-text-brand hover:underline"
									onClick={() => setActiveTab("managers")}
								>
									View All
								</button>
							}
						>
							<div className="flex flex-col gap-2">
								{community.managers.map(mgr => (
									<div key={mgr.id} className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<div className="h-7 w-7 shrink-0 rounded-full bg-surface-brand-soft flex items-center justify-center text-[10px] font-semibold text-text-brand">
												{mgr.initial}
											</div>
											<span className="text-xs text-text-primary">{mgr.name}</span>
										</div>
										<span
											className={cn(
												"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
												ROLE_BADGE[mgr.role] ?? "bg-neutral-100 text-text-secondary",
											)}
										>
											{mgr.role}
										</span>
									</div>
								))}
							</div>
						</SidebarCard>

						{/* Quick Actions */}
						<div className="rounded-xl border border-border-default bg-surface-card p-4">
							<h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
							<div className="flex flex-col gap-2">
								{QUICK_ACTIONS.map(action => (
									<button
										key={action.label}
										className={cn(
											"flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-opacity hover:opacity-80 text-left",
											action.bg,
											action.border,
										)}
										onClick={() => setActiveTab(action.tab)}
									>
										<action.icon size={15} className={cn("shrink-0", action.color)} />
										<span className={cn("text-xs font-medium", action.color)}>
											{action.label}
										</span>
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			) : activeTab === "experiences" ? (
				<ExperiencesTab communityId={id} />
			) : activeTab === "members" ? (
				<MembersTab communityId={id} />
			) : activeTab === "feed" ? (
				<FeedTab communityId={id} />
			) : activeTab === "announcements" ? (
				<AnnouncementsTab
						communityId={id}
						communityName={community?.name}
						managers={community?.managers}
						communityMeta={community ? {
							status: community.status,
							createdAt: community.createdAt,
							access: community.access,
							communityUrl: community.communityUrl,
						} : undefined}
					/>
			) : activeTab === "chat" ? (
				<ChatTab
					communityId={id}
					managers={community?.managers}
					communityMeta={community ? {
						status: community.status,
						createdAt: community.createdAt,
						access: community.access,
						communityUrl: community.communityUrl,
					} : undefined}
				/>
			) : activeTab === "analytics" ? (
				<AnalyticsTab communityId={id} />
			) : activeTab === "managers" ? (
				<ManagersTab communityId={id} recentActivity={community?.recentActivity ?? []} />
			) : (
				<div className="flex h-48 items-center justify-center rounded-xl border border-border-default bg-surface-card">
					<p className="text-sm text-text-tertiary">
						{TABS.find(t => t.id === activeTab)?.label} — coming soon
					</p>
				</div>
			)}
		</div>
	)
}
