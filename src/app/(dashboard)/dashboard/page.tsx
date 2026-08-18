"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { formatDistanceToNow } from "date-fns"
import {
	ArrowRight,
	Activity,
	AlertTriangle,
	CalendarDays,
	ChevronDown,
	ChevronRight,
	CircleCheckBig,
	Clock3,
	CreditCard,
	Flag,
	HandCoins,
	IndianRupee,
	Megaphone,
	ScanLine,
	Search,
	Server,
	ShieldAlert,
	ShieldCheck,
	TriangleAlert,
	Users,
	type LucideIcon,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/Button"
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown"
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed"
import { StatCard } from "@/components/dashboard/stat-card"
import { SkeletonDashboardPage } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth.store"
import { usePermission } from "@/lib/hooks/use-permission"
import { getPendingSponsorships, getSponsorships } from "@/lib/api/sponsorships"
import { getPendingHosts, getHosts } from "@/lib/api/hosts"
import { getPendingBrands, getBrands } from "@/lib/api/brands"
import { getCommunityProfiles } from "@/lib/api/community-profiles"
import {
	getDashboardHealth,
	getDashboardLiveOperations,
	getDashboardRecentActivity,
	getDashboardRevenue,
	getDashboardReviewQueue,
	getDashboardStats,
	type DashboardRecentActivityItem,
	type DashboardRevenuePeriod,
	type DashboardRevenueResponse,
} from "@/lib/api/dashboard"

type Accent = "rose" | "violet" | "amber" | "green" | "blue" | "neutral"
type HealthTone = "operational" | "degraded" | "down" | "maintenance"

type SectionErrorProps = {
	title: string
	message: string
	onRetry: () => void
}

const PERIOD_OPTIONS: DropdownOption[] = [
	{ value: "TODAY", label: "Today" },
	{ value: "THIS_WEEK", label: "This Week" },
	{ value: "THIS_MONTH", label: "This Month" },
	{ value: "THIS_QUARTER", label: "This Quarter" },
	{ value: "THIS_YEAR", label: "This Year" },
]

const HERO_ACCENTS: Record<
	Accent,
	{ panel: string; iconBox: string; icon: string; border: string; cta: string }
> = {
	rose: {
		panel: "bg-surface-brand-soft/60",
		iconBox: "bg-red-100",
		icon: "text-icon-brand",
		border: "border-red-200",
		cta: "text-text-brand",
	},
	violet: {
		panel: "bg-surface-vibe-soft/60",
		iconBox: "bg-violet-100",
		icon: "text-text-vibe",
		border: "border-violet-200",
		cta: "text-text-vibe",
	},
	amber: {
		panel: "bg-surface-warning-soft/60",
		iconBox: "bg-amber-100",
		icon: "text-icon-warning",
		border: "border-amber-200",
		cta: "text-text-warning",
	},
	green: {
		panel: "bg-surface-success-soft/60",
		iconBox: "bg-green-100",
		icon: "text-icon-success",
		border: "border-green-200",
		cta: "text-text-success",
	},
	blue: {
		panel: "bg-surface-info-soft/60",
		iconBox: "bg-sky-100",
		icon: "text-icon-info",
		border: "border-sky-200",
		cta: "text-text-info",
	},
	neutral: {
		panel: "bg-surface-card",
		iconBox: "bg-gray-100",
		icon: "text-icon-tertiary",
		border: "border-gray-200",
		cta: "text-text-tertiary",
	},
}

function formatCount(value: number): string {
	return value.toLocaleString("en-IN")
}

function formatCurrency(value: number): string {
	return `₹${value.toLocaleString("en-IN")}`
}

function formatPercent(value: number): string {
	const prefix = value > 0 ? "+" : ""
	return `${prefix}${value.toFixed(1)}%`
}

function formatChartLabel(date: string): string {
	return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
	})
}

function formatAxisCurrency(value: number): string {
	if (value >= 100000) {
		return `₹${Math.round(value / 100000)}L`
	}
	if (value >= 1000) {
		return `₹${Math.round(value / 1000)}K`
	}
	return `₹${Math.round(value)}`
}

function toActivityType(action: string): ActivityItem["type"] {
	if (action.includes("ADMIN")) return "admin_invited"
	if (action.includes("COUPON")) return "coupon_created"
	if (action.includes("REPORT") || action.includes("FLAG")) return "event_rejected"
	if (action.includes("EVENT")) return "event_approved"
	if (action.includes("HOST")) return "host_invite_sent"
	return "host_info_requested"
}

function mapActivityItem(item: DashboardRecentActivityItem): ActivityItem {
	return {
		id: item.id,
		type: toActivityType(item.action),
		actorName: item.actorName,
		targetName: item.label,
		subLabel: item.subLabel,
		createdAt: new Date(item.timestamp),
	}
}

function isUnauthorized(error: unknown): boolean {
	return axios.isAxiosError(error) && error.response?.status === 401
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-4">
			<div>
				<h2 className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary">{title}</h2>
				{subtitle && <p className="mt-1 text-xs text-text-tertiary">{subtitle}</p>}
			</div>
			{action}
		</div>
	)
}

function SectionShell({
	title,
	subtitle,
	action,
	children,
	className,
}: {
	title: string
	subtitle?: string
	action?: ReactNode
	children: ReactNode
	className?: string
}) {
	return (
		<section
			className={cn(
				"rounded-action border border-border-default bg-surface-canvas shadow-card",
				className,
			)}
		>
			<div className="px-5 pt-5">
				<SectionTitle title={title} subtitle={subtitle} action={action} />
			</div>
			<div className="px-5 pb-5 pt-4">{children}</div>
		</section>
	)
}

function ActionLink({ href, label, className }: { href?: string; label: string; className?: string }) {
	const content = (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
				className,
			)}
		>
			{label}
			<ArrowRight size={14} />
		</span>
	)

	if (!href) return content

	return (
		<Link href={href} className="inline-flex items-center">
			{content}
		</Link>
	)
}

function HeroStatCard({
	icon: Icon,
	value,
	label,
	subtitle,
	// actionLabel,
	// href,
	accent,
}: {
	icon: LucideIcon
	value: string
	label: string
	subtitle: string
	actionLabel: string
	href?: string
	accent: Accent
	trend?: { value: number; direction: "up" | "down"; suffix?: string }
}) {
	const theme = HERO_ACCENTS[accent]
	const card = (
		<div
			className={cn(
				"flex h-full flex-col rounded-action border p-5 shadow-card transition-all duration-150 hover:shadow-card-hover",
				theme.panel,
				theme.border,
			)}
		>
			<div className="flex items-start gap-4">
				<div
					className={cn(
						"flex h-16 w-16 shrink-0 items-center justify-center rounded-action border",
						theme.iconBox,
						theme.border,
					)}
				>
					<Icon size={28} className={theme.icon} />
				</div>
				<div className="min-w-0">
					<p className="text-[34px] font-semibold tracking-[-0.04em] text-text-primary leading-none tabular-nums">
						{value}
					</p>
					<p className="mt-3 text-sm font-semibold text-text-primary">{label}</p>
					<p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
				</div>
			</div>

			{/* <div className="mt-auto pt-4 ml-auto">
				{href ? (
					<Link
						href={href}
						className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", theme.cta)}
					>
						{actionLabel}
						<ArrowRight size={14} />
					</Link>
				) : (
					<span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", theme.cta)}>
						{actionLabel}
						<ArrowRight size={14} />
					</span>
				)}
			</div> */}
		</div>
	)

	return card
}

function QueueRow({
	icon: Icon,
	title,
	subtitle,
	count,
	href,
	accent = "rose",
}: {
	icon: LucideIcon
	title: string
	subtitle: string
	count: number
	href?: string
	accent?: Accent
}) {
	const theme = HERO_ACCENTS[accent]
	const row = (
		<div className="flex items-center gap-4 py-4">
			<div
				className={cn(
					"flex h-10 w-10 shrink-0 items-center justify-center rounded-action border",
					theme.iconBox,
					theme.border,
				)}
			>
				<Icon size={18} className={theme.icon} />
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-text-primary">{title}</p>
				<p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
			</div>
			<div className="flex items-center gap-3">
				<span
					className={cn(
						"rounded-full size-6 p-1 text-xs font-medium tabular-nums flex items-center justify-center",
						HERO_ACCENTS.neutral.iconBox,
						HERO_ACCENTS.neutral.icon,
					)}
				>
					{formatCount(count)}
				</span>
				<ChevronRight size={16} className="text-text-muted" />
			</div>
		</div>
	)

	if (!href) return row
	return (
		<Link
			href={href}
			className="block rounded-action outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30"
		>
			{row}
		</Link>
	)
}

function LiveRow({
	icon: Icon,
	title,
	subtitle,
	value,
	accent = "green",
}: {
	icon: LucideIcon
	title: string
	subtitle: string
	value: number
	accent?: Accent
}) {
	const theme = HERO_ACCENTS[accent]
	return (
		<div className="flex items-center gap-4 py-4">
			<div
				className={cn(
					"flex h-10 w-10 shrink-0 items-center justify-center rounded-action border",
					theme.iconBox,
					theme.border,
				)}
			>
				<Icon size={18} className={theme.icon} />
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-text-primary">{title}</p>
				<p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
			</div>
			<div className={cn("text-xl font-semibold tabular-nums tracking-[-0.03em]")}>
				{formatCount(value)}
			</div>
		</div>
	)
}

function HealthChip({ status }: { status: HealthTone }) {
	const statusClasses: Record<HealthTone, string> = {
		operational: "bg-green-50 text-green-700 border-green-200",
		degraded: "bg-amber-50 text-amber-700 border-amber-200",
		down: "bg-red-50 text-red-600 border-red-200",
		maintenance: "bg-sky-50 text-sky-700 border-sky-200",
	}

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border",
				statusClasses[status],
			)}
		>
			<span className="h-1.5 w-1.5 rounded-full bg-current" />
			{status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
		</span>
	)
}

function HealthRow({
	icon: Icon,
	label,
	subtitle,
	status,
	accent = "green",
}: {
	icon: LucideIcon
	label: string
	subtitle: string
	status: HealthTone
	accent?: Accent
}) {
	const theme = HERO_ACCENTS[accent]
	return (
		<div className="flex items-center gap-4 py-3.5">
			<div
				className={cn(
					"flex h-11 w-11 shrink-0 items-center justify-center rounded-action",
					theme.iconBox,
				)}
			>
				<Icon size={18} className={theme.icon} />
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-text-primary">{label}</p>
				<p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
			</div>
			<HealthChip status={status} />
		</div>
	)
}

function RevenueLineChart({ points }: { points: DashboardRevenueResponse["timeSeries"] }) {
	if (points.length === 0) {
		return (
			<div className="flex h-60 items-center justify-center rounded-action border border-dashed border-border-default bg-surface-card text-sm text-text-tertiary">
				No revenue data for this period.
			</div>
		)
	}

	const chartData = points.map(p => ({
		date: formatChartLabel(p.date),
		total: p.ticketRevenue + p.platformFee,
	}))

	return (
		<div className="rounded-action border border-border-default bg-surface-card p-4">
			<div className="mb-4 flex items-center gap-3 text-[11px] text-text-tertiary">
				<span className="inline-flex items-center gap-1.5">Total revenue</span>
			</div>
			<ResponsiveContainer width="100%" height={240}>
				<AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
					<defs>
						<linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="rgb(238,39,39)" stopOpacity={0.18} />
							<stop offset="100%" stopColor="rgb(238,39,39)" stopOpacity={0.01} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 6" stroke="rgba(17,17,17,0.05)" vertical={false} />
					<XAxis
						dataKey="date"
						tick={{ fontSize: 10, fill: "var(--color-text-tertiary, #9ca3af)" }}
						tickLine={false}
						axisLine={false}
						dy={6}
					/>
					<YAxis
						tickFormatter={formatAxisCurrency}
						tick={{ fontSize: 10, fill: "var(--color-text-tertiary, #9ca3af)" }}
						tickLine={false}
						axisLine={false}
						width={52}
					/>
					<Tooltip
						formatter={value => [formatCurrency(Number(value)), "Total"]}
						labelStyle={{ fontSize: 11, color: "#374151" }}
						contentStyle={{
							fontSize: 11,
							borderRadius: 8,
							border: "1px solid rgba(0,0,0,0.08)",
							boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
						}}
					/>
					<Area
						type="monotone"
						dataKey="total"
						stroke="rgb(238,39,39)"
						strokeWidth={2.5}
						fill="url(#revenueFill)"
						dot={{ r: 3.5, fill: "rgb(238,39,39)", strokeWidth: 0 }}
						activeDot={{ r: 5, fill: "rgb(238,39,39)", strokeWidth: 0 }}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	)
}

function RevenueSectionError({ title, message, onRetry }: SectionErrorProps) {
	return (
		<div className="rounded-action border border-border-default bg-surface-card p-5">
			<div className="flex items-start gap-3">
				<AlertTriangle size={18} className="mt-0.5 text-text-warning" />
				<div className="min-w-0">
					<p className="text-sm font-semibold text-text-primary">{title}</p>
					<p className="mt-1 text-sm text-text-secondary">{message}</p>
					<Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
						Retry
					</Button>
				</div>
			</div>
		</div>
	)
}

// Old, full dashboard (health, revenue chart, activity feed, review queue) — kept but unused
// for now. Re-export this as default (and remove the simple dashboard below) to restore it.
function LegacyDashboardPage() {
	const router = useRouter()
	const hasPermission = useAuthStore(state => state.hasPermission)
	const [period, setPeriod] = useState<DashboardRevenuePeriod>("THIS_MONTH")

	const statsQuery = useQuery({
		queryKey: ["dashboard", "stats"],
		queryFn: getDashboardStats,
	})
	const reviewQueueQuery = useQuery({
		queryKey: ["dashboard", "review-queue"],
		queryFn: getDashboardReviewQueue,
	})
	const liveOperationsQuery = useQuery({
		queryKey: ["dashboard", "live-operations"],
		queryFn: getDashboardLiveOperations,
	})
	const activityQuery = useQuery({
		queryKey: ["dashboard", "recent-activity", 20],
		queryFn: () => getDashboardRecentActivity({ limit: 20 }),
	})
	const healthQuery = useQuery({
		queryKey: ["dashboard", "health"],
		queryFn: getDashboardHealth,
	})
	const revenueQuery = useQuery({
		queryKey: ["dashboard", "revenue", period],
		queryFn: () => getDashboardRevenue({ period }),
	})

	useEffect(() => {
		const allErrors = [
			statsQuery.error,
			reviewQueueQuery.error,
			liveOperationsQuery.error,
			activityQuery.error,
			healthQuery.error,
		]
		if (allErrors.some(isUnauthorized)) {
			router.replace("/login")
		}
	}, [
		statsQuery.error,
		reviewQueueQuery.error,
		liveOperationsQuery.error,
		activityQuery.error,
		healthQuery.error,
		router,
	])

	const hasCriticalData =
		!!statsQuery.data &&
		!!reviewQueueQuery.data &&
		!!liveOperationsQuery.data &&
		!!activityQuery.data &&
		!!healthQuery.data

	const isInitialLoading = !hasCriticalData

	const criticalError = hasCriticalData
		? null
		: (statsQuery.error ??
			reviewQueueQuery.error ??
			liveOperationsQuery.error ??
			activityQuery.error ??
			healthQuery.error)

	const activityItems = useMemo(
		() => activityQuery.data?.items.map(mapActivityItem) ?? [],
		[activityQuery.data?.items],
	)

	const revenue = revenueQuery.data
	const revenueErrorMessage = axios.isAxiosError(revenueQuery.error)
		? (revenueQuery.error.response?.data?.message ?? "Failed to load revenue overview.")
		: "Failed to load revenue overview."

	const reviewLinks = {
		hostApprovals: hasPermission("host.approve") ? "/hosts/queue" : undefined,
		eventApprovals: hasPermission("event.approve") ? "/events/queue" : undefined,
		contributorRequests: hasPermission("community.manage") ? "/communities" : undefined,
		reportedContent: hasPermission("moderation.read") ? "/reviews" : undefined,
	}

	const topLinkForStats = {
		reviews: hasPermission("moderation.read") ? "/reviews" : undefined,
		live: hasPermission("event.approve") ? "/events" : undefined,
		flags: hasPermission("audit.read") ? "/audit-logs" : undefined,
		revenue: hasPermission("order.view") ? "/orders" : undefined,
	}

	if (isInitialLoading) {
		return <SkeletonDashboardPage />
	}

	if (criticalError) {
		return (
			<div className="p-6 max-w-7xl mx-auto">
				<div className="rounded-action border border-border-default bg-surface-canvas p-5 shadow-card">
					<div className="flex items-start gap-3">
						<AlertTriangle size={18} className="mt-0.5 text-text-warning" />
						<div>
							<p className="text-sm font-semibold text-text-primary">
								Failed to load dashboard
							</p>
							<p className="mt-1 text-sm text-text-secondary">
								{axios.isAxiosError(criticalError)
									? (criticalError.response?.data?.message ?? "Please try again.")
									: "Please try again."}
							</p>
							<Button
								variant="secondary"
								size="sm"
								className="mt-4"
								onClick={() => router.refresh()}
							>
								Retry
							</Button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	const stats = statsQuery.data!
	const reviewQueue = reviewQueueQuery.data!
	const liveOperations = liveOperationsQuery.data!
	const health = healthQuery.data!

	return (
		<div className="relative p-6 max-w-7xl mx-auto">
			<div className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
				<HeroStatCard
					icon={ShieldAlert}
					value={formatCount(stats.pendingReviews)}
					label="Pending Reviews"
					subtitle="Across all queues"
					actionLabel="View all reviews"
					href={topLinkForStats.reviews}
					accent="rose"
				/>
				<HeroStatCard
					icon={Activity}
					value={formatCount(stats.liveEvents)}
					label="Live Events"
					subtitle={`${formatCount(stats.liveEventsStartingToday)} starting today`}
					actionLabel="View live events"
					href={topLinkForStats.live}
					accent="violet"
				/>
				<HeroStatCard
					icon={IndianRupee}
					value={formatCurrency(stats.revenueToday)}
					label="Revenue Today"
					subtitle={`${formatPercent(stats.revenueTodayDelta)} vs yesterday`}
					actionLabel="View report"
					href={topLinkForStats.revenue}
					accent="green"
					trend={{
						value: stats.revenueTodayDelta,
						direction: stats.revenueTodayDelta >= 0 ? "up" : "down",
					}}
				/>
			</div>

			{/* Row 2: Revenue Overview (2/3) + Recent Activity (1/3) */}
			<div className="mt-6 grid gap-4 xl:grid-cols-3">
				<section className="rounded-action border border-border-default bg-surface-canvas shadow-card xl:col-span-2">
					<div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
						<div>
							<h2 className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary">
								Revenue Overview
							</h2>
							<p className="mt-1 text-xs text-text-tertiary">
								Current period snapshot and daily trend
							</p>
						</div>
						<Dropdown
							options={PERIOD_OPTIONS}
							value={period}
							onChange={value => setPeriod(value as DashboardRevenuePeriod)}
							size="sm"
							className="w-36"
						/>
					</div>

					{revenueQuery.isError && !revenue ? (
						<div className="px-5 py-5">
							<RevenueSectionError
								title="Revenue overview unavailable"
								message={revenueErrorMessage}
								onRetry={() => revenueQuery.refetch()}
							/>
						</div>
					) : (
						<div className="grid gap-5 px-5 pb-5 pt-4 lg:grid-cols-12">
							<div className="lg:col-span-8">
								<div className="mb-5">
									<p className="text-[34px] font-semibold tracking-[-0.04em] text-text-primary leading-none tabular-nums">
										{formatCurrency(revenue?.total ?? 0)}
									</p>
									<p className="mt-3 text-sm font-medium text-text-secondary">
										<span
											className={cn(
												"font-semibold",
												(revenue?.totalDelta ?? 0) >= 0
													? "text-text-success"
													: "text-text-danger",
											)}
										>
											{formatPercent(revenue?.totalDelta ?? 0)}
										</span>{" "}
										vs previous period
									</p>
								</div>

								{revenueQuery.isFetching && !revenue ? (
									<div className="flex h-60 items-center justify-center rounded-action border border-dashed border-border-default bg-surface-card text-sm text-text-tertiary">
										Loading chart...
									</div>
								) : (
									<RevenueLineChart points={revenue?.timeSeries ?? []} />
								)}

								{/* <div className="mt-4 flex justify-end">
									<ActionLink
										href={topLinkForStats.revenue}
										label="View full report"
										className="text-text-brand"
									/>
								</div> */}
							</div>

							<div className="lg:col-span-4">
								<div className="rounded-action border border-border-default bg-surface-card">
									<div className="divide-y divide-border-subtle px-4">
										<div className="flex items-center justify-between py-3.5">
											<span className="text-sm font-medium text-text-secondary">
												Ticket Revenue
											</span>
											<span className="text-sm font-semibold text-text-primary tabular-nums">
												{formatCurrency(revenue?.ticketRevenue ?? 0)}
											</span>
										</div>
										<div className="flex items-center justify-between py-3.5">
											<span className="text-sm font-medium text-text-secondary">
												Platform Fees
											</span>
											<span className="text-sm font-semibold text-text-primary tabular-nums">
												{formatCurrency(revenue?.platformFees ?? 0)}
											</span>
										</div>
										<div className="flex items-center justify-between py-3.5">
											<span className="text-sm font-medium text-text-secondary">
												Sponsorships
											</span>
											<span className="text-sm font-semibold text-text-primary tabular-nums">
												{formatCurrency(revenue?.sponsorships ?? 0)}
											</span>
										</div>
										<div className="flex items-center justify-between py-3.5">
											<span className="text-sm font-medium text-text-secondary">
												Others
											</span>
											<span className="text-sm font-semibold text-text-primary tabular-nums">
												{formatCurrency(revenue?.others ?? 0)}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</section>

				<SectionShell
					title="Recent Activity"
					action={<ActionLink href="/audit-logs" label="View all" className="text-text-danger" />}
					className="xl:col-span-1"
				>
					<ActivityFeed items={activityItems} limit={4} />
					<div className="pt-4">
						<Button
							variant="secondary"
							className="w-full justify-center border-border-brand text-text-brand hover:bg-surface-brand-soft"
							leftIcon={<ArrowRight size={14} />}
							onClick={() => router.push("/audit-logs")}
						>
							View all activity
						</Button>
					</div>
				</SectionShell>
			</div>

			{/* Row 3: Review Queue | Live Operations | Platform Health */}
			<div className="mt-4 grid gap-4 xl:grid-cols-3">
				<SectionShell title="Review Queue">
					<div className="divide-y divide-border-subtle">
						<QueueRow
							icon={Users}
							title="Host Approvals"
							subtitle="New host applications to review"
							count={reviewQueue.hostApprovals}
							href={reviewLinks.hostApprovals}
							accent="blue"
						/>
						<QueueRow
							icon={CalendarDays}
							title="Event Approvals"
							subtitle="Events awaiting admin approval"
							count={reviewQueue.eventApprovals}
							href={reviewLinks.eventApprovals}
							accent="blue"
						/>
						<QueueRow
							icon={ShieldCheck}
							title="Contributor Requests"
							subtitle="Requests to join as community contributors"
							count={reviewQueue.contributorRequests}
							href={reviewLinks.contributorRequests}
							accent="blue"
						/>
						<QueueRow
							icon={Flag}
							title="Reported Content"
							subtitle="Posts, profiles and moments reported"
							count={reviewQueue.reportedContent}
							href={reviewLinks.reportedContent}
							accent="blue"
						/>
					</div>
				</SectionShell>

				<SectionShell title="Live Operations">
					<div className="divide-y divide-border-subtle">
						<LiveRow
							icon={Clock3}
							title="Events Live Now"
							subtitle="Events currently in progress"
							value={liveOperations.eventsLiveNow}
							accent="green"
						/>
						<LiveRow
							icon={ScanLine}
							title="Check-ins Today"
							subtitle="Total check-ins across events"
							value={liveOperations.checkInsToday}
							accent="violet"
						/>
						<LiveRow
							icon={TriangleAlert}
							title="Capacity Alerts"
							subtitle="Events nearing or at capacity"
							value={liveOperations.capacityAlerts}
							accent="amber"
						/>
					</div>
				</SectionShell>

				<section className="rounded-action border border-border-default bg-surface-canvas shadow-card">
					<div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
						<div>
							<h2 className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary">
								Platform Health
							</h2>
						</div>
					</div>

					<div className="px-5 pb-5 pt-4">
						<div className="divide-y divide-border-subtle">
							<HealthRow
								icon={Server}
								label="Server Status"
								subtitle="All core systems operational"
								status={health.server}
								accent="violet"
							/>
							<HealthRow
								icon={CreditCard}
								label="Payment Gateway"
								subtitle="All systems operational"
								status={health.paymentGateway}
								accent="green"
							/>
							<HealthRow
								icon={ShieldCheck}
								label="Inbox / Notifications"
								subtitle="All systems operational"
								status={health.notifications}
								accent="amber"
							/>
							<HealthRow
								icon={CircleCheckBig}
								label="Check-in System"
								subtitle="All systems operational"
								status={health.checkInSystem}
								accent="rose"
							/>
						</div>
					</div>
				</section>
			</div>
		</div>
	)
}

// Simple dashboard: at-a-glance Sponsorship/Host/Brand counts, plus Recent Updates and an
// Announcements composer. The full legacy dashboard above is kept but unused — swap the two
// default exports to bring it back.
//
// Send is stubbed — no email actually goes out yet. It just resolves the final recipient
// list and shows it in a toast, so the audience-selection UX can be reviewed before wiring
// a real /admin/announcements send endpoint.
function AnnouncementsBox() {
	const [selectAll, setSelectAll] = useState(false)
	const [selectBrands, setSelectBrands] = useState(false)
	const [selectCommunity, setSelectCommunity] = useState(false)
	const [brandsExpanded, setBrandsExpanded] = useState(false)
	const [communityExpanded, setCommunityExpanded] = useState(false)
	const [brandSearch, setBrandSearch] = useState("")
	const [communitySearch, setCommunitySearch] = useState("")
	const [selectedBrandIds, setSelectedBrandIds] = useState<Set<string>>(new Set())
	const [selectedHostIds, setSelectedHostIds] = useState<Set<string>>(new Set())
	const [subject, setSubject] = useState("")
	const [message, setMessage] = useState("")
	const [sending, setSending] = useState(false)

	// Fetched lazily — only once a group is expanded to search/pick specific recipients.
	const brandsQuery = useQuery({
		queryKey: ["announcement", "brands-list"],
		queryFn: () => getBrands({ limit: 200 }).then(r => r.brands),
		enabled: brandsExpanded,
	})
	const hostsQuery = useQuery({
		queryKey: ["announcement", "hosts-list"],
		queryFn: () => getHosts({ limit: 200 }).then(r => r.hosts),
		enabled: communityExpanded,
	})

	function toggleSelectAll(checked: boolean) {
		setSelectAll(checked)
		setSelectBrands(checked)
		setSelectCommunity(checked)
	}

	function toggleBrands(checked: boolean) {
		setSelectBrands(checked)
		if (!checked) setSelectAll(false)
	}

	function toggleCommunity(checked: boolean) {
		setSelectCommunity(checked)
		if (!checked) setSelectAll(false)
	}

	function toggleBrandId(id: string) {
		setSelectedBrandIds(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	function toggleHostId(id: string) {
		setSelectedHostIds(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const filteredBrands = useMemo(() => {
		const q = brandSearch.trim().toLowerCase()
		const list = brandsQuery.data ?? []
		if (!q) return list
		return list.filter(b => b.brandName?.toLowerCase().includes(q))
	}, [brandsQuery.data, brandSearch])

	const filteredHosts = useMemo(() => {
		const q = communitySearch.trim().toLowerCase()
		const list = hostsQuery.data ?? []
		if (!q) return list
		return list.filter(h => h.displayName?.toLowerCase().includes(q))
	}, [hostsQuery.data, communitySearch])

	const recipientCount =
		(selectBrands ? (brandsQuery.data?.length ?? 0) : selectedBrandIds.size) +
		(selectCommunity ? (hostsQuery.data?.length ?? 0) : selectedHostIds.size)


	function handleSend() {
		if (!message.trim()) {
			toast.error("Write a message first.")
			return
		}
		if (!selectBrands && !selectCommunity && selectedBrandIds.size === 0 && selectedHostIds.size === 0) {
			toast.error("Select at least one recipient.")
			return
		}
		// A group's checkbox can be selected without ever expanding/fetching its list (e.g. "Select
		// All" without opening the search) — fetch on demand so the resolved email list is real,
		// not just a stale/empty cache from before the group was expanded.
		setSending(true)
		Promise.all([
			selectBrands && !brandsQuery.data ? getBrands({ limit: 200 }).then(r => r.brands) : Promise.resolve(brandsQuery.data ?? []),
			selectCommunity && !hostsQuery.data ? getHosts({ limit: 200 }).then(r => r.hosts) : Promise.resolve(hostsQuery.data ?? []),
		])
			.then(([brands, hosts]) => {
				const brandEmails = brands
					.filter(b => selectBrands || selectedBrandIds.has(b.id))
					.map(b => b.user.email)
					.filter((e): e is string => !!e)
				const hostEmails = hosts
					.filter(h => selectCommunity || selectedHostIds.has(h.id))
					.map(h => h.user.email)
					.filter((e): e is string => !!e)
				const emails = Array.from(new Set([...brandEmails, ...hostEmails]))

				// STUBBED — no email is actually sent yet. Real recipient list is resolved from the
				// backend (real emails), just logged/previewed here for review before wiring a real send.
				console.log("[Announcement preview] Would email:", emails)
				const preview = emails.slice(0, 5).join(", ") + (emails.length > 5 ? ` +${emails.length - 5} more` : "")
				toast.success(`(Preview only — no email sent) ${emails.length} real recipient(s): ${preview || "none found"}`)
			})
			.finally(() => setSending(false))
	}

	return (
		<div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Megaphone size={18} className="text-text-tertiary" />
				<h2 className="text-label-md font-semibold text-text-primary">Announcements</h2>
			</div>

			<div className="flex flex-col gap-2">
				<label className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
					<input type="checkbox" checked={selectAll} onChange={e => toggleSelectAll(e.target.checked)} />
					Select All (Brands + Community)
				</label>

				{/* Brands group */}
				<div className="border border-border-default rounded-lg">
					<div className="flex items-center justify-between px-3 py-2">
						<label className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
							<input type="checkbox" checked={selectBrands} onChange={e => toggleBrands(e.target.checked)} />
							Brands
							{selectedBrandIds.size > 0 && !selectBrands && (
								<span className="text-caption text-text-tertiary">({selectedBrandIds.size} selected)</span>
							)}
						</label>
						<button
							type="button"
							onClick={() => setBrandsExpanded(v => !v)}
							className="text-text-tertiary hover:text-text-primary transition-colors"
						>
							<ChevronDown size={16} className={cn("transition-transform", brandsExpanded && "rotate-180")} />
						</button>
					</div>
					{brandsExpanded && (
						<div className="border-t border-border-subtle p-3 flex flex-col gap-2">
							<div className="relative">
								<Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
								<input
									type="text"
									value={brandSearch}
									onChange={e => setBrandSearch(e.target.value)}
									placeholder="Search brands by name…"
									className="w-full rounded-lg border border-border-default bg-surface-canvas pl-8 pr-3 py-1.5 text-xs outline-none focus:border-border-focus"
								/>
							</div>
							<div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
								{brandsQuery.isLoading ? (
									<p className="text-caption text-text-tertiary py-2 text-center">Loading…</p>
								) : filteredBrands.length === 0 ? (
									<p className="text-caption text-text-tertiary py-2 text-center">No brands found.</p>
								) : (
									filteredBrands.map(b => (
										<label key={b.id} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-neutral-50 text-caption text-text-primary">
											<input
												type="checkbox"
												disabled={selectBrands}
												checked={selectBrands || selectedBrandIds.has(b.id)}
												onChange={() => toggleBrandId(b.id)}
											/>
											<span className="truncate">{b.brandName}</span>
											<span className="text-text-tertiary truncate">{b.user.email}</span>
										</label>
									))
								)}
							</div>
						</div>
					)}
				</div>

				{/* Community/Host group */}
				<div className="border border-border-default rounded-lg">
					<div className="flex items-center justify-between px-3 py-2">
						<label className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
							<input type="checkbox" checked={selectCommunity} onChange={e => toggleCommunity(e.target.checked)} />
							Community
							{selectedHostIds.size > 0 && !selectCommunity && (
								<span className="text-caption text-text-tertiary">({selectedHostIds.size} selected)</span>
							)}
						</label>
						<button
							type="button"
							onClick={() => setCommunityExpanded(v => !v)}
							className="text-text-tertiary hover:text-text-primary transition-colors"
						>
							<ChevronDown size={16} className={cn("transition-transform", communityExpanded && "rotate-180")} />
						</button>
					</div>
					{communityExpanded && (
						<div className="border-t border-border-subtle p-3 flex flex-col gap-2">
							<div className="relative">
								<Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
								<input
									type="text"
									value={communitySearch}
									onChange={e => setCommunitySearch(e.target.value)}
									placeholder="Search hosts by name…"
									className="w-full rounded-lg border border-border-default bg-surface-canvas pl-8 pr-3 py-1.5 text-xs outline-none focus:border-border-focus"
								/>
							</div>
							<div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
								{hostsQuery.isLoading ? (
									<p className="text-caption text-text-tertiary py-2 text-center">Loading…</p>
								) : filteredHosts.length === 0 ? (
									<p className="text-caption text-text-tertiary py-2 text-center">No hosts found.</p>
								) : (
									filteredHosts.map(h => (
										<label key={h.id} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-neutral-50 text-caption text-text-primary">
											<input
												type="checkbox"
												disabled={selectCommunity}
												checked={selectCommunity || selectedHostIds.has(h.id)}
												onChange={() => toggleHostId(h.id)}
											/>
											<span className="truncate">{h.displayName}</span>
											<span className="text-text-tertiary truncate">{h.user.email}</span>
										</label>
									))
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			<input
				type="text"
				value={subject}
				onChange={e => setSubject(e.target.value)}
				placeholder="Subject (optional)"
				className="w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm outline-none focus:border-border-focus"
			/>
			<textarea
				value={message}
				onChange={e => setMessage(e.target.value)}
				placeholder="Write your announcement…"
				rows={4}
				className="w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm outline-none focus:border-border-focus resize-none"
			/>

			<Button onClick={handleSend} disabled={sending} className="self-end">
				{sending ? "Sending…" : `Send${recipientCount > 0 ? ` (${recipientCount})` : ""}`}
			</Button>
			<p className="text-caption text-text-tertiary text-right -mt-2">
				Preview mode — no email is sent yet.
			</p>
		</div>
	)
}

type UpdateItem = {
	id: string
	label: string
	title: string
	createdAt: string
	href: string
}

const UPDATE_ICONS: Record<string, LucideIcon> = {
	"New host": Users,
	"New brand": Users,
	"New sponsorship": HandCoins,
	"New community profile": Flag,
}

function RecentUpdatesBox({ items, isLoading }: { items: UpdateItem[]; isLoading: boolean }) {
	return (
		<div className="bg-surface-card border border-border-default rounded-action p-5 flex flex-col gap-1">
			<h2 className="text-label-md font-semibold text-text-primary mb-2">Recent Updates</h2>
			{isLoading ? (
				<p className="text-body-sm text-text-tertiary py-6 text-center">Loading…</p>
			) : items.length === 0 ? (
				<p className="text-body-sm text-text-tertiary py-6 text-center">Nothing new yet.</p>
			) : (
				<div className="divide-y divide-border-subtle">
					{items.map(item => {
						const Icon = UPDATE_ICONS[item.label] ?? Users
						return (
							<Link
								key={`${item.label}-${item.id}`}
								href={item.href}
								className="flex items-center gap-3 py-2.5 hover:bg-neutral-50 -mx-2 px-2 rounded-lg transition-colors"
							>
								<div className="size-8 rounded-md bg-neutral-100 flex items-center justify-center shrink-0">
									<Icon size={14} className="text-text-secondary" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-body-sm font-medium text-text-primary truncate">{item.title}</p>
									<p className="text-caption text-text-tertiary">{item.label}</p>
								</div>
								<span className="text-caption text-text-tertiary shrink-0">
									{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
								</span>
							</Link>
						)
					})}
				</div>
			)}
		</div>
	)
}

export default function DashboardPage() {
	const canSeeSponsorships = usePermission("sponsorship.approve")
	const canSeeHosts = usePermission("host.approve")
	const canSeeBrands = usePermission("sponsorship.approve")
	// Not full real-time (no websockets) — refetches in the background every 30s so
	// the counts/feed stay fresh without needing a manual page reload.
	const REFRESH_INTERVAL = 30_000

	const sponsorshipsTotal = useQuery({
		queryKey: ["dashboard", "sponsorships-total"],
		queryFn: () => getSponsorships({ limit: 1 }).then(r => r.total),
		enabled: canSeeSponsorships,
		refetchInterval: REFRESH_INTERVAL,
	})
	const sponsorshipsPending = useQuery({
		queryKey: ["dashboard", "sponsorships-pending"],
		queryFn: () => getPendingSponsorships({ limit: 1 }).then(r => r.total),
		enabled: canSeeSponsorships,
		refetchInterval: REFRESH_INTERVAL,
	})
	const hostsTotal = useQuery({
		queryKey: ["dashboard", "hosts-total"],
		queryFn: () => getHosts({ limit: 1 }).then(r => r.total),
		enabled: canSeeHosts,
		refetchInterval: REFRESH_INTERVAL,
	})
	const hostsPending = useQuery({
		queryKey: ["dashboard", "hosts-pending"],
		queryFn: () => getPendingHosts({ limit: 1 }).then(r => r.total),
		enabled: canSeeHosts,
		refetchInterval: REFRESH_INTERVAL,
	})
	const brandsTotal = useQuery({
		queryKey: ["dashboard", "brands-total"],
		queryFn: () => getBrands({ limit: 1 }).then(r => r.total),
		enabled: canSeeBrands,
		refetchInterval: REFRESH_INTERVAL,
	})
	const brandsPending = useQuery({
		queryKey: ["dashboard", "brands-pending"],
		queryFn: () => getPendingBrands({ limit: 1 }).then(r => r.total),
		enabled: canSeeBrands,
		refetchInterval: REFRESH_INTERVAL,
	})

	const recentHosts = useQuery({
		queryKey: ["dashboard", "recent-hosts"],
		queryFn: () => getHosts({ limit: 5 }).then(r => r.hosts),
		enabled: canSeeHosts,
		refetchInterval: REFRESH_INTERVAL,
	})
	const recentBrands = useQuery({
		queryKey: ["dashboard", "recent-brands"],
		queryFn: () => getBrands({ limit: 5 }).then(r => r.brands),
		enabled: canSeeBrands,
		refetchInterval: REFRESH_INTERVAL,
	})
	const recentSponsorships = useQuery({
		queryKey: ["dashboard", "recent-sponsorships"],
		queryFn: () => getSponsorships({ limit: 5 }).then(r => r.proposals),
		enabled: canSeeSponsorships,
		refetchInterval: REFRESH_INTERVAL,
	})
	const recentCommunityProfiles = useQuery({
		queryKey: ["dashboard", "recent-community-profiles"],
		queryFn: () => getCommunityProfiles({ limit: 5 }).then(r => r.profiles),
		enabled: canSeeSponsorships,
		refetchInterval: REFRESH_INTERVAL,
	})

	const recentUpdatesLoading =
		recentHosts.isLoading || recentBrands.isLoading || recentSponsorships.isLoading || recentCommunityProfiles.isLoading

	const recentUpdates = useMemo<UpdateItem[]>(() => {
		const items: UpdateItem[] = [
			...(recentHosts.data ?? []).map(h => ({
				id: h.id,
				label: "New host",
				title: h.displayName || `${h.user.firstName} ${h.user.lastName}`,
				createdAt: h.createdAt ?? new Date(0).toISOString(),
				href: "/hosts",
			})),
			...(recentBrands.data ?? []).map(b => ({
				id: b.id,
				label: "New brand",
				title: b.brandName || `${b.user.firstName} ${b.user.lastName}`,
				createdAt: b.createdAt,
				href: "/brands",
			})),
			...(recentSponsorships.data ?? []).map(s => ({
				id: s.id,
				label: "New sponsorship",
				title: s.name || "Untitled proposal",
				createdAt: s.createdAt,
				href: "/sponsorships",
			})),
			...(recentCommunityProfiles.data ?? []).map(c => ({
				id: c.id,
				label: "New community profile",
				title: c.name,
				createdAt: c.createdAt,
				href: "/community-profiles",
			})),
		]
		return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8)
	}, [recentHosts.data, recentBrands.data, recentSponsorships.data, recentCommunityProfiles.data])

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<div>
				<h1 className="text-heading-sm font-semibold text-text-primary">Dashboard</h1>
				<p className="text-body-sm text-text-secondary mt-1">What's happening right now.</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<StatCard
					icon={HandCoins}
					label="Sponsorships"
					value={sponsorshipsTotal.data ?? "—"}
					sub={`${sponsorshipsPending.data ?? "—"} pending review`}
					href="/sponsorships"
				/>
				<StatCard
					icon={Users}
					label="Hosts"
					value={hostsTotal.data ?? "—"}
					sub={`${hostsPending.data ?? "—"} pending review`}
					href="/hosts"
				/>
				<StatCard
					icon={Users}
					label="Brands"
					value={brandsTotal.data ?? "—"}
					sub={`${brandsPending.data ?? "—"} pending review`}
					href="/brands"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="lg:col-span-2">
					<RecentUpdatesBox items={recentUpdates} isLoading={recentUpdatesLoading} />
				</div>
				<AnnouncementsBox />
			</div>
		</div>
	)
}
