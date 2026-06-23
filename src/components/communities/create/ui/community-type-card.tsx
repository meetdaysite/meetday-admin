"use client"

import { cn } from "@/lib/utils"
import type { CommunityType } from "@/types"

interface CommunityTypeOption {
	value: CommunityType
	label: string
	description: string
}

interface CommunityTypeCardProps {
	option: CommunityTypeOption
	selected: boolean
	onSelect: (value: CommunityType) => void
}

export function CommunityTypeCard({ option, selected, onSelect }: CommunityTypeCardProps) {
	return (
		<button
			type="button"
			onClick={() => onSelect(option.value)}
			className={cn(
				"flex items-start gap-3 rounded-card border-2 p-4 text-left transition-colors duration-(--duration-120) w-full",
				selected
					? "border-border-focus bg-surface-brand-soft"
					: "border-border-default bg-surface-canvas hover:border-border-strong",
			)}
		>
			<div className="mt-0.5 flex shrink-0 items-center justify-center">
				<div
					className={cn(
						"flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
						selected
							? "border-action-primary bg-action-primary"
							: "border-border-default bg-surface-canvas",
					)}
				>
					{selected && <div className="h-2 w-2 rounded-full bg-white" />}
				</div>
			</div>
			<div className="min-w-0 text-label-sm">
				<p
					className={cn(
						"text-label-sm font-semibold",
						selected ? "text-text-brand" : "text-text-primary",
					)}
				>
					{option.label}
				</p>
				<p className="mt-0.5 text-[11px] text-text-tertiary">{option.description}</p>
			</div>
		</button>
	)
}

export type { CommunityTypeOption }
