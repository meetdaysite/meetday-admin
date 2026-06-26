import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

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
				<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-brand-soft">
					<Icon size={22} className="text-icon-brand" />
				</div>
			)}
			<p className="text-sm font-semibold text-text-primary">{title}</p>
			{description && (
				<p className="mt-1 text-xs text-text-tertiary max-w-xs">{description}</p>
			)}
			{action && (
				<Button size="sm" className="mt-4" onClick={action.onClick}>
					{action.label}
				</Button>
			)}
		</div>
	)
}
