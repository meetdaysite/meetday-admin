"use client"

import { Clock, CalendarDays, ShieldCheck, Tag } from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"
import { StatCard } from "@/components/dashboard/stat-card"
import { SlaBanner } from "@/components/dashboard/sla-banner"
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed"

// ─── Mock data (replace with API queries) ────────────────────────────────────

const MOCK_STATS = {
	hostsPending: 7,
	eventsPending: 3,
	activeAdmins: 12,
	activeCoupons: 5,
}

const MOCK_SLA = {
	hostsOverdue: 2,
	eventsOverdue: 1,
}

const MOCK_ACTIVITY: ActivityItem[] = [
	{
		id: "1",
		type: "host_approved",
		actorName: "Priya Sharma",
		targetName: "The Garden Venue",
		createdAt: new Date(Date.now() - 12 * 60 * 1000),
	},
	{
		id: "2",
		type: "event_rejected",
		actorName: "Ravi Mehta",
		targetName: "Sunset Rooftop Party",
		createdAt: new Date(Date.now() - 45 * 60 * 1000),
	},
	{
		id: "3",
		type: "admin_invited",
		actorName: "Aniket Chakraborty",
		targetName: "neha@meetday.in",
		createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
	},
	{
		id: "4",
		type: "host_invite_sent",
		actorName: "Priya Sharma",
		targetName: "Lakeview Events",
		createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
	},
	{
		id: "5",
		type: "event_approved",
		actorName: "Ravi Mehta",
		targetName: "Comedy Night at The Cellar",
		createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
	},
	{
		id: "6",
		type: "coupon_created",
		actorName: "Aniket Chakraborty",
		targetName: "SUMMER20",
		createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
	},
	{
		id: "7",
		type: "host_info_requested",
		actorName: "Priya Sharma",
		targetName: "Terrace Hub",
		createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000),
	},
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
	const { hasPermission } = useAuthStore()

	const showCoupons = hasPermission("coupon.view")
	const showHostQueue = hasPermission("host.approve")
	const showEventQueue = hasPermission("event.approve")

	return (
		<div className="p-6 space-y-6 max-w-7xl mx-auto">
			{/* SLA banner */}
			<SlaBanner
				hostsOverdue={MOCK_SLA.hostsOverdue}
				eventsOverdue={MOCK_SLA.eventsOverdue}
			/>

			{/* Stat cards */}
			<section>
				<h2 className="mb-3 text-xs font-semibold tracking-[0.12em] uppercase text-neutral-light">
					Overview
				</h2>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<StatCard
						icon={Clock}
						label="Hosts pending review"
						value={MOCK_STATS.hostsPending}
						href={showHostQueue ? "/hosts/queue" : undefined}
						sub={showHostQueue ? "View queue →" : undefined}
					/>
					<StatCard
						icon={CalendarDays}
						label="Events pending review"
						value={MOCK_STATS.eventsPending}
						href={showEventQueue ? "/events/queue" : undefined}
						sub={showEventQueue ? "View queue →" : undefined}
					/>
					<StatCard
						icon={ShieldCheck}
						label="Active admins"
						value={MOCK_STATS.activeAdmins}
						href="/admins"
						sub="Manage →"
					/>
					{showCoupons && (
						<StatCard
							icon={Tag}
							label="Active coupons"
							value={MOCK_STATS.activeCoupons}
							href="/coupons"
							sub="Manage →"
						/>
					)}
				</div>
			</section>

			{/* Activity feed */}
			<section className="rounded-xl border border-neutral-200 bg-white">
				<div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
					<h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
					<span className="text-[11px] text-neutral-light">Last 24 hours</span>
				</div>
				<div className="px-5">
					<ActivityFeed items={MOCK_ACTIVITY} />
				</div>
			</section>
		</div>
	)
}
