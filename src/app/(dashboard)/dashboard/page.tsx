"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import {
	ArrowRight,
	Activity,
	AlertTriangle,
	CalendarDays,
	ChevronRight,
	CircleCheckBig,
	Clock3,
	CreditCard,
	Flag,
	IndianRupee,
	ScanLine,
	Server,
	ShieldAlert,
	ShieldCheck,
	TriangleAlert,
	Users,
	type LucideIcon,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/Button"
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown"
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed"
import { SkeletonDashboardPage } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth.store"
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

type Accent = "rose" | "violet" | "amber" | "green"
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
				"rounded-panel border border-border-default bg-surface-canvas shadow-card",
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
				"flex h-full flex-col rounded-panel border p-5 shadow-card transition-all duration-150 hover:shadow-card-hover",
				theme.panel,
				theme.border,
			)}
		>
			<div className="flex items-start gap-4">
				<div
					className={cn(
						"flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl",
						theme.iconBox,
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
					"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
					theme.iconBox,
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
						"rounded-full px-3 py-1 text-sm font-semibold tabular-nums",
						theme.iconBox,
						theme.icon,
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
			className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-border-focus/30"
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
					"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
					theme.iconBox,
				)}
			>
				<Icon size={18} className={theme.icon} />
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-text-primary">{title}</p>
				<p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
			</div>
			<div className={cn("text-2xl font-semibold tabular-nums tracking-[-0.03em]", theme.cta)}>
				{formatCount(value)}
			</div>
		</div>
	)
}

function HealthChip({ status }: { status: HealthTone }) {
	const statusClasses: Record<HealthTone, string> = {
		operational: "bg-green-50 text-green-700",
		degraded: "bg-amber-50 text-amber-700",
		down: "bg-red-50 text-red-600",
		maintenance: "bg-sky-50 text-sky-700",
	}

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
				statusClasses[status],
			)}
		>
			<span className="h-1.5 w-1.5 rounded-full bg-current" />
			{status === "operational" ? "Operational" : status}
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
					"flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
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
			<div className="flex h-60 items-center justify-center rounded-card border border-dashed border-border-default bg-surface-card text-sm text-text-tertiary">
				No revenue data for this period.
			</div>
		)
	}

	const chartData = points.map(p => ({
		date: formatChartLabel(p.date),
		total: p.ticketRevenue + p.platformFee,
	}))

	return (
		<div className="rounded-card border border-border-default bg-surface-card p-4">
			<div className="mb-4 flex items-center gap-3 text-[11px] text-text-tertiary">
				<span className="inline-flex items-center gap-1.5">
					<span className="h-2.5 w-2.5 rounded-full bg-red-500" />
					Total revenue
				</span>
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
						formatter={(value) => [formatCurrency(Number(value)), "Total"]}
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
		<div className="rounded-card border border-border-default bg-surface-card p-5">
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

export default function DashboardPage() {
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
				<div className="rounded-panel border border-border-default bg-surface-canvas p-5 shadow-card">
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
				<section className="rounded-panel border border-border-default bg-surface-canvas shadow-card xl:col-span-2">
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
									<div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-border-default bg-surface-card text-sm text-text-tertiary">
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
								<div className="rounded-2xl border border-border-default bg-surface-card">
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
							accent="rose"
						/>
						<QueueRow
							icon={CalendarDays}
							title="Event Approvals"
							subtitle="Events awaiting admin approval"
							count={reviewQueue.eventApprovals}
							href={reviewLinks.eventApprovals}
							accent="rose"
						/>
						<QueueRow
							icon={ShieldCheck}
							title="Contributor Requests"
							subtitle="Requests to join as community contributors"
							count={reviewQueue.contributorRequests}
							href={reviewLinks.contributorRequests}
							accent="rose"
						/>
						<QueueRow
							icon={Flag}
							title="Reported Content"
							subtitle="Posts, profiles and moments reported"
							count={reviewQueue.reportedContent}
							href={reviewLinks.reportedContent}
							accent="rose"
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

				<section className="rounded-panel border border-border-default bg-surface-canvas shadow-card">
					<div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
						<div>
							<h2 className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary">
								Platform Health
							</h2>
						</div>
					</div>

					<div className="px-5 pb-5 pt-4">
						<div className="rounded-2xl border border-border-subtle bg-surface-card px-4">
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
					</div>
				</section>
			</div>
		</div>
	)
}
