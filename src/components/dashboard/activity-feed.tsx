import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type ActivityEventType =
	| "host_approved"
	| "host_rejected"
	| "host_info_requested"
	| "host_invite_sent"
	| "event_approved"
	| "event_rejected"
	| "event_edit_requested"
	| "admin_invited"
	| "coupon_created"

export type ActivityItem = {
	id: string
	type: ActivityEventType
	actorName: string
	targetName: string
	createdAt: Date
}

// â”€â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const EVENT_CONFIG: Record<
	ActivityEventType,
	{ label: string; dotClass: string }
> = {
	host_approved:       { label: "approved host",              dotClass: "bg-green-500" },
	host_rejected:       { label: "rejected host",              dotClass: "bg-red-500" },
	host_info_requested: { label: "requested info from host",   dotClass: "bg-amber-400" },
	host_invite_sent:    { label: "invited host",               dotClass: "bg-blue-400" },
	event_approved:      { label: "approved event",             dotClass: "bg-green-500" },
	event_rejected:      { label: "rejected event",             dotClass: "bg-red-500" },
	event_edit_requested:{ label: "requested edit on event",    dotClass: "bg-amber-400" },
	admin_invited:       { label: "invited admin",              dotClass: "bg-blue-500" },
	coupon_created:      { label: "created coupon",             dotClass: "bg-purple-500" },
}

// â”€â”€â”€ Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function FeedRow({ item }: { item: ActivityItem }) {
	const cfg = EVENT_CONFIG[item.type]
	const initials = item.actorName
		.split(" ")
		.map(w => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase()

	return (
		<li className="flex items-start gap-3 py-3">
			{/* Avatar */}
			<div className="relative shrink-0">
				<div className="h-8 w-8 rounded-full bg-surface-brand-soft text-icon-brand text-[11px] font-semibold flex items-center justify-center">
					{initials}
				</div>
				<span
					className={cn(
						"absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
						cfg.dotClass,
					)}
					aria-hidden
				/>
			</div>

			{/* Text */}
			<div className="flex-1 min-w-0">
				<p className="text-sm leading-snug text-text-primary">
					<span className="font-medium">{item.actorName}</span>{" "}
					<span className="text-text-secondary">{cfg.label}</span>{" "}
					<span className="font-medium">{item.targetName}</span>
				</p>
				<p className="mt-0.5 text-[11px] text-text-tertiary" suppressHydrationWarning>
					{formatDistanceToNow(item.createdAt, { addSuffix: true })}
				</p>
			</div>
		</li>
	)
}

// â”€â”€â”€ Activity feed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type ActivityFeedProps = {
	items: ActivityItem[]
	/** Max items to show before truncating */
	limit?: number
}

export function ActivityFeed({ items, limit = 10 }: ActivityFeedProps) {
	const visible = items.slice(0, limit)

	if (visible.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<p className="text-sm font-medium text-text-secondary">No recent activity</p>
				<p className="mt-1 text-xs text-text-tertiary">Actions taken by admins will appear here.</p>
			</div>
		)
	}

	return (
		<ul className="divide-y divide-border-subtle">
			{visible.map(item => (
				<FeedRow key={item.id} item={item} />
			))}
		</ul>
	)
}
