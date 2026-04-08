import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmptyStateProps = {
	icon?: LucideIcon
	title: string
	description?: string
	action?: { label: string; onClick: () => void }
	className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-14 px-6 text-center",
				className,
			)}
		>
			{Icon && (
				<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red/10">
					<Icon size={22} className="text-brand-red" />
				</div>
			)}
			<p className="text-sm font-semibold text-foreground">{title}</p>
			{description && (
				<p className="mt-1 text-xs text-neutral-light max-w-xs">{description}</p>
			)}
			{action && (
				<button
					onClick={action.onClick}
					className="mt-4 rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors"
				>
					{action.label}
				</button>
			)}
		</div>
	)
}
