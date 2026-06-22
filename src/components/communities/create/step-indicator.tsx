"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreateCommunityStore } from "@/stores/create-community.store"

const STEPS = [
	"Basic Details",
	"Community Rules",
	"Experience Mapping",
	"Managers",
	"Review & Publish",
] as const

interface StepIndicatorProps {
	onStepClick?: (step: number) => void
}

export function StepIndicator({ onStepClick }: StepIndicatorProps) {
	const { currentStep, communityId } = useCreateCommunityStore()

	return (
		<div className="flex items-start w-full overflow-x-auto pb-1">
			{STEPS.map((label, i) => {
				const stepNum = i + 1
				const isCompleted = stepNum < currentStep
				const isActive = stepNum === currentStep
				const isLocked = stepNum > 1 && !communityId && stepNum !== currentStep
				const isClickable = (isCompleted || isActive) && onStepClick && !isLocked

				return (
					<div key={label} className={cn("flex items-center", i > 0 && "flex-1")}>
						{i > 0 && (
							<div
								className={cn(
									"h-px flex-1 min-w-[24px] transition-colors duration-(--duration-120)",
									isCompleted ? "bg-action-primary" : "bg-border-subtle",
								)}
							/>
						)}

						<div
							className={cn(
								"flex flex-col items-center gap-1.5 shrink-0",
								isClickable && "cursor-pointer",
							)}
							onClick={() => isClickable && onStepClick(stepNum)}
						>
							<div
								className={cn(
									"flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-(--duration-120)",
									isCompleted
										? "border-action-primary bg-action-primary text-white"
										: isActive
											? "border-action-primary bg-surface-canvas text-text-brand"
											: "border-border-subtle bg-surface-canvas text-text-secondary",
								)}
							>
								{isCompleted ? <Check size={13} /> : stepNum}
							</div>
							<span
								className={cn(
									"text-[10px] font-medium tracking-wide whitespace-nowrap",
									isActive
										? "text-text-brand"
										: isCompleted
											? "text-text-secondary"
											: "text-text-secondary",
								)}
							>
								{label}
							</span>
						</div>
					</div>
				)
			})}
		</div>
	)
}
