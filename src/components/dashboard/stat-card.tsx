import Link from "next/link"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type StatCardProps = {
	icon: LucideIcon
	label: string
	value: number | string
	sub?: string
	href?: string
	trend?: { value: number; direction: "up" | "down"; label?: string }
	/** When true, the card is rendered in a muted / empty-state style */
	empty?: boolean
}

export function StatCard({ icon: Icon, label, value, sub, href, trend, empty }: StatCardProps) {
	const content = (
		<div
			className={cn(
				"group relative flex flex-col gap-3 rounded-xl border border-border-default bg-surface-card p-5",
				"transition-shadow duration-150",
				href && "hover:shadow-md cursor-pointer",
				empty && "opacity-60",
			)}
		>
			{/* Header row */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-brand-soft shrink-0">
					<Icon size={16} className="text-icon-brand" />
				</div>

				{trend && (
					<span
						className={cn(
							"flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
							trend.direction === "up"
								? "bg-green-50 text-green-700"
								: "bg-red-50 text-red-600",
						)}
					>
						{trend.direction === "up" ? (
							<TrendingUp size={11} />
						) : (
							<TrendingDown size={11} />
						)}
						{trend.value > 0 ? "+" : ""}
						{trend.value}
						{trend.label ? ` ${trend.label}` : ""}
					</span>
				)}
			</div>

			{/* Value */}
			<div>
				<p className="text-2xl font-bold text-text-primary tabular-nums leading-none">{value}</p>
				<p className="mt-1 text-xs font-medium text-text-tertiary">{label}</p>
			</div>

			{/* Sub-label */}
			{sub && <p className="text-[11px] text-text-tertiary border-t border-border-subtle pt-2.5">{sub}</p>}

			{/* Hover accent line */}
			{href && (
				<span
					className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-xl bg-action-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"
					aria-hidden
				/>
			)}
		</div>
	)

	if (href) return <Link href={href}>{content}</Link>
	return content
}
