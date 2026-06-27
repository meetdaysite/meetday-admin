import { formatDistanceToNow } from "date-fns"
import { CalendarDays, Flag, ShieldCheck, Tag, Users, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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
	subLabel?: string
	createdAt: Date
}

const EVENT_CONFIG: Record<
	ActivityEventType,
	{
		icon: LucideIcon
		iconBox: string
		iconColor: string
		dotClass: string
	}
> = {
	host_approved: {
		icon: Users,
		iconBox: "bg-surface-brand-soft",
		iconColor: "text-icon-brand",
		dotClass: "bg-green-500",
	},
	host_rejected: {
		icon: Users,
		iconBox: "bg-rose-50",
		iconColor: "text-red-600",
		dotClass: "bg-red-500",
	},
	host_info_requested: {
		icon: Users,
		iconBox: "bg-amber-50",
		iconColor: "text-amber-600",
		dotClass: "bg-amber-400",
	},
	host_invite_sent: {
		icon: Users,
		iconBox: "bg-sky-50",
		iconColor: "text-sky-600",
		dotClass: "bg-blue-400",
	},
	event_approved: {
		icon: CalendarDays,
		iconBox: "bg-green-50",
		iconColor: "text-green-600",
		dotClass: "bg-green-500",
	},
	event_rejected: {
		icon: Flag,
		iconBox: "bg-rose-50",
		iconColor: "text-red-600",
		dotClass: "bg-red-500",
	},
	event_edit_requested: {
		icon: CalendarDays,
		iconBox: "bg-amber-50",
		iconColor: "text-amber-600",
		dotClass: "bg-amber-400",
	},
	admin_invited: {
		icon: ShieldCheck,
		iconBox: "bg-surface-vibe-soft",
		iconColor: "text-text-vibe",
		dotClass: "bg-blue-500",
	},
	coupon_created: {
		icon: Tag,
		iconBox: "bg-surface-success-soft",
		iconColor: "text-text-success",
		dotClass: "bg-purple-500",
	},
}

function FeedRow({ item }: { item: ActivityItem }) {
	const cfg = EVENT_CONFIG[item.type]
	const Icon = cfg.icon

	return (
		<li className="flex items-start gap-3 py-3">
			<div className="relative shrink-0">
				<div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", cfg.iconBox)}>
					<Icon size={18} className={cfg.iconColor} />
				</div>
				<span
					className={cn(
						"absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
						cfg.dotClass,
					)}
					aria-hidden
				/>
			</div>

			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium leading-snug text-text-primary">{item.targetName}</p>
				<p className="mt-0.5 text-[11px] text-text-secondary">
					<span className="font-medium text-text-primary">{item.actorName}</span>
					{item.subLabel ? ` · ${item.subLabel}` : ""}
				</p>
				<p className="mt-0.5 text-[11px] text-text-tertiary" suppressHydrationWarning>
					{formatDistanceToNow(item.createdAt, { addSuffix: true })}
				</p>
			</div>
		</li>
	)
}

export type ActivityFeedProps = {
	items: ActivityItem[]
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
			{visible.map((item) => (
				<FeedRow key={item.id} item={item} />
			))}
		</ul>
	)
}
