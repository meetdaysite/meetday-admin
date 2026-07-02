import Link from "next/link"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Accent = "brand" | "green" | "amber" | "sky" | "purple" | "blue" | "rose"

// const ACCENT_CLASSES: Record<Accent, { box: string; icon: string; border: string; iconBox: string }> = {
// 	brand: {
// 		box: "bg-surface-brand-soft",
// 		icon: "text-icon-brand",
// 		border: "border-red-100",
// 		iconBox: "bg-red-50",
// 	},
// 	green: {
// 		box: "bg-green-50",
// 		icon: "text-green-600",
// 		border: "border-green-100",
// 		iconBox: "bg-green-50",
// 	},
// 	amber: {
// 		box: "bg-amber-50",
// 		icon: "text-amber-600",
// 		border: "border-amber-100",
// 		iconBox: "bg-amber-50",
// 	},
// 	sky: { box: "bg-sky-50", icon: "text-sky-600", border: "border-sky-100", iconBox: "bg-sky-50" },
// 	purple: {
// 		box: "bg-purple-50",
// 		icon: "text-purple-600",
// 		border: "border-purple-100",
// 		iconBox: "bg-purple-50",
// 	},
// 	blue: { box: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100", iconBox: "bg-blue-50" },
// 	rose: { box: "bg-rose-50", icon: "text-rose-600", border: "border-rose-100", iconBox: "bg-rose-50" },
// }

export type StatCardProps = {
	icon: LucideIcon
	label: string
	value: number | string
	sub?: string
	href?: string
	trend?: { value: number; direction: "up" | "down"; label?: string }
	accent?: Accent
	/** When true, the card is rendered in a muted / empty-state style */
	empty?: boolean
}

export function StatCard({
	// icon: Icon,
	label,
	value,
	sub,
	href,
	trend,
	// accent = "brand",
	empty,
}: StatCardProps) {
	// const ac = ACCENT_CLASSES[accent]
	const content = (
		<div
			className={cn(
				"group relative flex flex-col gap-3 rounded-xl border border-border-default p-5",
				"transition-shadow duration-150",
				href && "hover:shadow-md cursor-pointer",
				empty && "opacity-60",
			)}
		>
			<p className="mt-0.5 text-xs font-medium text-text-primary">{label}</p>

			<div className="flex gap-3 items-center">
				{/* Icon */}
				{/* <div
					className={cn(
						"flex h-8 w-8 items-center justify-center rounded-lg shrink-0 border",
						ac.iconBox,
						ac.border,
					)}
				>
					<Icon size={12} className={ac.icon} />
				</div> */}

				{/* Value */}
				<p className="text-2xl font-bold text-text-primary tabular-nums leading-none">{value}</p>
			</div>
			{(trend || sub) && (
				<div className="mt-1.5 flex items-center gap-2">
					{trend && (
						<span
							className={cn(
								"inline-flex items-center gap-0.5 rounded-full text-[11px] font-semibold",
								trend.direction === "up" ? "text-green-700" : "text-red-600",
							)}
						>
							{trend.direction === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
							{/* {trend.value > 0 ? "+" : ""} */}
							{trend.value}
							{trend.label ?? ""}
						</span>
					)}
					{sub && <p className="text-[11px] text-text-tertiary">{sub}</p>}
				</div>
			)}
		</div>
	)

	if (href) return <Link href={href}>{content}</Link>
	return content
}
