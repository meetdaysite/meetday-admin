"use client"

import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/Switch"

interface FeatureToggleRowProps {
	icon: React.ReactNode
	iconBg: string
	label: string
	description: string
	checked: boolean
	onCheckedChange: (v: boolean) => void
	disabled?: boolean
}

export function FeatureToggleRow({
	icon,
	iconBg,
	label,
	description,
	checked,
	onCheckedChange,
	disabled,
}: FeatureToggleRowProps) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-card border border-border-subtle bg-surface-canvas p-3">
			<div className="flex items-center gap-3">
				<div
					className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-badge", iconBg)}
				>
					{icon}
				</div>
				<div>
					<p className="text-label-sm font-semibold text-text-primary">{label}</p>
					<p className="text-caption text-text-tertiary">{description}</p>
				</div>
			</div>
			<Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} size="sm" />
		</div>
	)
}
