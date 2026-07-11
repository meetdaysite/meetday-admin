"use client"

import { useCallback, useEffect, useState } from "react"
import {
	Users,
	Activity,
	Ticket,
	IndianRupee,
	Heart,
	Star,
} from "lucide-react"
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts"
import { StatCard } from "@/components/dashboard/stat-card"
import { getCommunityAnalytics, type AnalyticsTabData } from "@/lib/api/communities"

// ─── Constants ────────────────────────────────────────────────────────────────

const RANK_COLORS = ["#f59e0b", "#9ca3af", "#b45309", "#6366f1", "#6366f1"]

// ─── Health Score Donut ───────────────────────────────────────────────────────

const HEALTH_COLOR: Record<string, { fill: string; track: string; text: string }> = {
	Excellent:        { fill: "#22c55e", track: "#f0fdf4", text: "text-green-600" },
	Good:             { fill: "#3b82f6", track: "#eff6ff", text: "text-blue-600"  },
	Fair:             { fill: "#f59e0b", track: "#fffbeb", text: "text-amber-600" },
	"Needs Attention":{ fill: "#ef4444", track: "#fef2f2", text: "text-red-600"   },
}

const HEALTH_SUBTEXT: Record<string, string> = {
	Excellent:         "Your community is thriving! Keep it up.",
	Good:              "Your community is in good shape.",
	Fair:              "Some areas need attention.",
	"Needs Attention": "Action required to improve community health.",
}

function HealthDonut({ score, maxScore, label }: { score: number; maxScore: number; label: string }) {
	const filled = (score / maxScore) * 100
	const colors = HEALTH_COLOR[label] ?? HEALTH_COLOR["Good"]
	const data = [{ v: filled }, { v: 100 - filled }]
	return (
		<div className="relative flex items-center justify-center">
			<PieChart width={140} height={140}>
				<Pie
					data={data}
					cx={70}
					cy={70}
					innerRadius={48}
					outerRadius={62}
					startAngle={90}
					endAngle={-270}
					dataKey="v"
					strokeWidth={0}
					paddingAngle={0}
				>
					<Cell fill={colors.fill} />
					<Cell fill={colors.track} />
				</Pie>
			</PieChart>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className="text-2xl font-bold text-text-primary">{score}</span>
				<span className="text-[10px] text-text-tertiary">/{maxScore}</span>
				<div className="flex items-center gap-0.5 mt-0.5">
					<Star size={9} className="text-amber-400 fill-amber-400" />
					<span className={`text-[10px] font-semibold ${colors.text}`}>{label}</span>
				</div>
			</div>
		</div>
	)
}

// ─── Interests Donut ─────────────────────────────────────────────────────────

function InterestsDonut({ segments }: { segments: { label: string; pct: number; color: string }[] }) {
	const data = segments.map(s => ({ name: s.label, value: s.pct, color: s.color }))
	return (
		<div className="flex items-center gap-4">
			<PieChart width={88} height={88}>
				<Pie
					data={data}
					cx={44}
					cy={44}
					innerRadius={26}
					outerRadius={40}
					startAngle={90}
					endAngle={-270}
					dataKey="value"
					strokeWidth={2}
					stroke="#fff"
					paddingAngle={1}
				>
					{data.map((d, i) => (
						<Cell key={i} fill={d.color} />
					))}
				</Pie>
			</PieChart>
			<div className="flex flex-col gap-1.5">
				{segments.map(s => (
					<div key={s.label} className="flex items-center gap-2">
						<span
							className="h-2 w-2 rounded-full shrink-0"
							style={{ backgroundColor: s.color }}
						/>
						<span className="text-[11px] text-text-secondary">{s.label}</span>
						<span className="text-[11px] font-semibold text-text-primary ml-auto pl-2">
							{s.pct}%
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnalyticsTab({ communityId }: { communityId: string }) {
	const [data, setData] = useState<AnalyticsTabData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			setData(await getCommunityAnalytics(communityId))
		} catch {
			setError("Failed to load analytics.")
		} finally {
			setIsLoading(false)
		}
	}, [communityId])

	useEffect(() => {
		load()
	}, [load])

	if (error) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error}
			</div>
		)
	}

	const stats = data?.stats

	return (
		<div className="flex items-start gap-5">
			{/* ── Main ──────────────────────────────────────────────────────── */}
			<div className="flex-1 min-w-0 flex flex-col gap-5">
				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-base font-semibold text-text-primary">Community Analytics</h2>
						<p className="mt-0.5 text-xs text-text-tertiary">
							Deep insights into your community&apos;s growth, engagement and performance.
						</p>
					</div>
				</div>

				{/* Stat cards */}
				<div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
					<StatCard
						icon={Users}
						label="Members"
						value={isLoading ? "—" : (stats?.members ?? 0)}
						trend={
							stats ? { value: stats.membersGrowth, direction: "up", label: "%" } : undefined
						}
						sub="vs last 30 days"
						accent="purple"
					/>
					<StatCard
						icon={Activity}
						label="Active Members"
						value={isLoading ? "—" : (stats?.activeMembers ?? 0)}
						trend={
							stats
								? { value: stats.activeMembersGrowth, direction: "up", label: "%" }
								: undefined
						}
						sub="vs last 30 days"
						accent="green"
					/>
					<StatCard
						icon={Ticket}
						label="Experiences Booked"
						value={isLoading ? "—" : (stats?.experiencesBooked ?? 0)}
						trend={
							stats
								? { value: stats.experiencesBookedGrowth, direction: "up", label: "%" }
								: undefined
						}
						sub="vs last 30 days"
						accent="sky"
					/>
					<StatCard
						icon={IndianRupee}
						label="Community Revenue"
						value={isLoading ? "—" : (stats?.communityRevenue ?? "—")}
						trend={
							stats
								? { value: stats.communityRevenueGrowth, direction: "up", label: "%" }
								: undefined
						}
						sub="vs last 30 days"
						accent="amber"
					/>
					<StatCard
						icon={Heart}
						label="Retention"
						value={isLoading ? "—" : `${stats?.retention ?? 0}%`}
						trend={
							stats ? { value: stats.retentionGrowth, direction: "up", label: "%" } : undefined
						}
						sub="vs last 30 days"
						accent="rose"
					/>
				</div>

				{/* Row 1: Community Growth + Summary + Engagement Breakdown */}
				<div className="grid grid-cols-[1fr_auto_1fr] gap-4">
					{/* Community Growth chart */}
					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<div className="flex items-center justify-between mb-3">
							<div>
								<h3 className="text-sm font-semibold text-text-primary">Community Growth</h3>
								<p className="text-[10px] text-text-tertiary">Last 30 Days</p>
							</div>
						</div>
						<div className="flex items-center gap-4 mb-2 text-[10px] text-text-tertiary">
							<span className="flex items-center gap-1">
								<span className="h-2 w-2 rounded-full bg-green-500" />
								Members Joined
							</span>
							<span className="flex items-center gap-1">
								<span className="h-2 w-2 rounded-full bg-red-400" />
								Members Left
							</span>
							<span className="flex items-center gap-1">
								<span className="h-2 w-2 rounded-full bg-purple-500" />
								Net Growth
							</span>
						</div>
						{isLoading ? (
							<div className="h-44 flex items-center justify-center text-xs text-text-tertiary">
								Loading…
							</div>
						) : (
							<ResponsiveContainer width="100%" height={176}>
								<AreaChart
									data={data?.growthData ?? []}
									margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
								>
									<defs>
										<linearGradient id="gradJoined" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
											<stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
										</linearGradient>
										<linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
											<stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
									<XAxis
										dataKey="label"
										tick={{ fontSize: 9, fill: "#9ca3af" }}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										tick={{ fontSize: 9, fill: "#9ca3af" }}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip
										contentStyle={{
											fontSize: 11,
											borderRadius: 8,
											border: "1px solid #e5e7eb",
											padding: "6px 10px",
										}}
									/>
									<Area
										type="monotone"
										dataKey="membersJoined"
										stroke="#22c55e"
										strokeWidth={2}
										fill="url(#gradJoined)"
										dot={false}
										name="Members Joined"
									/>
									<Area
										type="monotone"
										dataKey="netGrowth"
										stroke="#a855f7"
										strokeWidth={2}
										fill="url(#gradNet)"
										dot={false}
										name="Net Growth"
									/>
									<Line
										type="monotone"
										dataKey="membersLeft"
										stroke="#f87171"
										strokeWidth={2}
										dot={false}
										name="Members Left"
									/>
								</AreaChart>
							</ResponsiveContainer>
						)}
					</div>

					{/* Growth summary card */}
					<div className="rounded-xl border border-border-default bg-surface-card p-4 w-48 flex flex-col gap-3">
						<p className="text-[11px] font-semibold text-text-tertiary">Last 30 Days</p>
						<div>
							<p className="text-[10px] text-text-tertiary mb-0.5">Members Joined</p>
							<p className="text-xl font-bold text-green-500">
								{data?.growthSummary.membersJoined ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-[10px] text-text-tertiary mb-0.5">Members Left</p>
							<p className="text-xl font-bold text-red-500">
								{data?.growthSummary.membersLeft ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-[10px] text-text-tertiary mb-0.5">Net Growth</p>
							<p className="text-xl font-bold text-purple-500">
								{data?.growthSummary.netGrowth ?? "—"}
							</p>
						</div>
						<div className="border-t border-border-subtle pt-2">
							<p className="text-[10px] text-text-tertiary mb-0.5">Growth Rate</p>
							<p className="text-sm font-bold text-green-500">
								+{data?.growthSummary.growthRate ?? 0}%
							</p>
							<p className="text-[9px] text-text-tertiary">vs last 30 days</p>
						</div>
					</div>

					{/* Engagement Breakdown */}
					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-semibold text-text-primary">Engagement Breakdown</h3>
							<span className="text-[10px] text-text-tertiary">Last 30 Days</span>
						</div>
						<div className="flex flex-col gap-2.5">
							{(data?.engagementBreakdown ?? []).map(item => {
								const max = Math.max(...(data?.engagementBreakdown ?? []).map(i => i.value))
								const barPct = (item.value / max) * 100
								return (
									<div key={item.label} className="flex items-center gap-2">
										<span className="text-[11px] text-text-secondary w-32 shrink-0">
											{item.label}
										</span>
										<div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
											<div
												className="h-full rounded-full transition-all"
												style={{
													width: `${barPct}%`,
													backgroundColor: item.barColor,
												}}
											/>
										</div>
										<span className="text-[11px] font-semibold text-text-primary w-10 text-right tabular-nums shrink-0">
											{item.value >= 1000
												? `${(item.value / 1000).toFixed(1)}K`
												: item.value}
										</span>
										<span className="text-[10px] font-semibold text-green-500 w-8 text-right shrink-0">
											↑{item.growth}%
										</span>
									</div>
								)
							})}
						</div>
					</div>
				</div>

				{/* Row 2: Experiences Impact + Community Health */}
				<div className="grid grid-cols-2 gap-4">
					{/* Experiences Impact */}
					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<h3 className="text-sm font-semibold text-text-primary mb-3">Experiences Impact</h3>
						<div className="flex gap-4 mb-4">
							{/* Impact highlight */}
							<div className="rounded-xl bg-purple-50 border border-purple-100 p-3 w-36 shrink-0">
								<p className="text-[10px] text-purple-600 leading-tight mb-2">
									Experiences discovered from community
								</p>
								<p className="text-2xl font-bold text-purple-600">
									{data?.experiencesImpact.totalBookings ?? "—"}
									<span className="text-sm font-semibold ml-1">bookings</span>
								</p>
								<p className="text-[10px] text-green-600 font-semibold mt-1">
									↑{data?.experiencesImpact.bookingsGrowth ?? 0}% vs last 30 days
								</p>
							</div>
							{/* Top converting table */}
							<div className="flex-1 min-w-0">
								<div className="grid grid-cols-4 text-[10px] font-semibold text-text-tertiary uppercase tracking-wide pb-1 border-b border-border-subtle mb-2">
									<span className="col-span-2">Experience</span>
									<span className="text-right">Bookings</span>
									<span className="text-right">Revenue</span>
								</div>
								{(data?.topExperiences ?? []).length === 0 ? (
									<div className="flex h-16 items-center justify-center text-xs text-text-tertiary">
										No experiences yet
									</div>
								) : (data?.topExperiences ?? []).map(exp => (
									<div
										key={exp.id}
										className="grid grid-cols-4 items-center py-1.5 border-b border-border-subtle last:border-0"
									>
										<div className="col-span-2 flex items-center gap-2 min-w-0">
											<div
												className="h-7 w-7 shrink-0 rounded-lg"
												style={{ background: exp.imageGradient }}
											/>
											<span className="text-[11px] font-medium text-text-primary truncate">
												{exp.name}
											</span>
										</div>
										<span className="text-[11px] text-text-primary text-right tabular-nums">
											{exp.bookings}
										</span>
										<span className="text-[11px] font-semibold text-text-primary text-right tabular-nums">
											{exp.revenue}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Community Health */}
					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<h3 className="text-sm font-semibold text-text-primary mb-3">Community Health</h3>
						<div className="flex items-start gap-4">
							<div className="flex flex-col items-center gap-1 shrink-0">
								{data ? (
									<HealthDonut
										score={data.communityHealth.score}
										maxScore={data.communityHealth.maxScore}
										label={data.communityHealth.label}
									/>
								) : (
									<div className="h-36 w-36 rounded-full border-4 border-neutral-100 flex items-center justify-center">
										<span className="text-xs text-text-tertiary">—</span>
									</div>
								)}
								<p className="text-[10px] text-text-tertiary text-center leading-tight">
									{data ? (HEALTH_SUBTEXT[data.communityHealth.label] ?? "") : ""}
								</p>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-[11px] font-semibold text-text-secondary mb-2">
									Health Factors
								</p>
								<div className="flex flex-col gap-2">
									{(data?.communityHealth.factors ?? []).map(f => {
										const pct = f.score / f.max
										const good = pct >= 0.75
										const fair = pct >= 0.5
										const iconBg = good ? "bg-green-100" : fair ? "bg-amber-100" : "bg-red-100"
										const iconStroke = good ? "#22c55e" : fair ? "#f59e0b" : "#ef4444"
										const scoreColor = good ? "text-green-600" : fair ? "text-amber-600" : "text-red-500"
										return (
											<div key={f.label} className="flex items-center gap-2">
												<div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
													<svg width="8" height="8" viewBox="0 0 8 8" fill="none">
														<path
															d={good || fair ? "M1.5 4L3 5.5L6.5 2" : "M2 2L6 6M6 2L2 6"}
															stroke={iconStroke}
															strokeWidth="1.5"
															strokeLinecap="round"
															strokeLinejoin="round"
														/>
													</svg>
												</div>
												<span className="flex-1 text-[11px] text-text-primary">
													{f.label}
												</span>
												<span className={`text-[11px] font-semibold tabular-nums ${scoreColor}`}>
													{f.score} / {f.max}
												</span>
											</div>
										)
									})}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Row 3: Member Insights */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-4">Member Insights</h3>
					<div className="grid grid-cols-3 gap-6">
						{/* Interests donut */}
						<div>
							<p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-3">
								Interests
							</p>
							{!data || data.interests.length === 0 ? (
								<div className="h-20 flex items-center justify-center text-xs text-text-tertiary">
									No data yet
								</div>
							) : (
								<InterestsDonut segments={data.interests} />
							)}
						</div>

						{/* Top Cities */}
						<div>
							<p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-3">
								Top Cities
							</p>
							{(data?.topCities ?? []).length === 0 ? (
								<div className="h-20 flex items-center justify-center text-xs text-text-tertiary">
									No data yet
								</div>
							) : (
								<div className="flex flex-col gap-2">
									{(data?.topCities ?? []).map(c => (
										<div key={c.city} className="flex items-center gap-2">
											<span className="text-[11px] text-text-secondary w-20 shrink-0">
												{c.city}
											</span>
											<div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
												<div
													className="h-full rounded-full"
													style={{
														width: `${(c.pct / 30) * 100}%`,
														backgroundColor: c.color,
													}}
												/>
											</div>
											<span className="text-[11px] font-semibold text-text-primary w-8 text-right tabular-nums">
												{c.pct}%
											</span>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Age Distribution bar chart */}
						<div>
							<p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-3">
								Age Distribution
							</p>
							{isLoading ? (
								<div className="h-28 flex items-center justify-center text-xs text-text-tertiary">
									—
								</div>
							) : (data?.ageDistribution ?? []).length === 0 ? (
								<div className="h-28 flex items-center justify-center text-xs text-text-tertiary">
									No data yet
								</div>
							) : (
								<ResponsiveContainer width="100%" height={112}>
									<BarChart
										data={data?.ageDistribution ?? []}
										margin={{ top: 16, right: 0, left: -28, bottom: 0 }}
										barSize={18}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="#f0f0f0"
											vertical={false}
										/>
										<XAxis
											dataKey="range"
											tick={{ fontSize: 9, fill: "#9ca3af" }}
											tickLine={false}
											axisLine={false}
										/>
										<YAxis
											tick={{ fontSize: 9, fill: "#9ca3af" }}
											tickLine={false}
											axisLine={false}
											tickFormatter={v => `${v}%`}
										/>
										<Tooltip
											formatter={v => [`${v}%`, "Share"]}
											contentStyle={{
												fontSize: 11,
												borderRadius: 8,
												border: "1px solid #e5e7eb",
												padding: "4px 8px",
											}}
										/>
										<Bar dataKey="pct" fill="#a855f7" radius={[3, 3, 0, 0]}>
											{(() => {
												const ages = data?.ageDistribution ?? []
												const maxPct = Math.max(...ages.map(a => a.pct), 0)
												return ages.map((a, i) => (
													<Cell key={i} fill={a.pct === maxPct ? "#7c3aed" : "#c4b5fd"} />
												))
											})()}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* ── Sidebar ───────────────────────────────────────────────────── */}
			<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">
				{/* Top Contributors */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Top Contributors</h3>
						<p className="text-[10px] text-text-tertiary">Last 30 Days</p>
					</div>
					<div className="flex flex-col gap-2.5">
						{(data?.topContributors ?? []).map((c, i) => (
							<div key={c.rank} className="flex items-center gap-2.5">
								<span className="text-[11px] font-bold text-text-tertiary w-4 text-center shrink-0">
									{c.rank}
								</span>
								{c.avatarUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={c.avatarUrl} alt={c.name} loading="lazy" decoding="async" className="h-7 w-7 shrink-0 rounded-full object-cover" />
								) : (
									<div
										className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
										style={{ backgroundColor: c.avatarColor }}
									>
										{c.avatarInitial}
									</div>
								)}
								<div className="flex-1 min-w-0">
									<p className="text-xs font-semibold text-text-primary">{c.name}</p>
									<p className="text-[10px] text-text-tertiary">{c.handle}</p>
								</div>
								<div className="flex items-center gap-0.5 shrink-0">
									<Star
										size={10}
										style={{ fill: RANK_COLORS[i], color: RANK_COLORS[i] }}
									/>
									<span className="text-[11px] font-semibold text-text-secondary tabular-nums">
										{c.points} pts
									</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Top Hosts */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Top Hosts</h3>
					</div>
					<div className="flex flex-col gap-2.5">
						{(data?.topHosts ?? []).map(h => (
							<div key={h.id} className="flex items-center gap-2.5">
								{h.avatarUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={h.avatarUrl} alt={h.name} loading="lazy" decoding="async" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
								) : (
									<div
										className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold text-white"
										style={{ backgroundColor: h.avatarColor }}
									>
										{h.avatarInitial}
									</div>
								)}
								<div className="flex-1 min-w-0">
									<p className="text-xs font-semibold text-text-primary">{h.name}</p>
									<p className="text-[10px] text-text-tertiary">{h.handle}</p>
								</div>
								<span className="text-[11px] font-semibold text-text-secondary shrink-0 tabular-nums">
									{h.eventCount} Events
								</span>
							</div>
						))}
					</div>
				</div>

			</div>
		</div>
	)
}
