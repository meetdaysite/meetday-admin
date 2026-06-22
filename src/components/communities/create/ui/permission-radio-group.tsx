"use client"

import { cn } from "@/lib/utils"

interface RadioOption<T extends string> {
	value: T
	label: string
	description?: string
	recommended?: boolean
}

interface PermissionRadioGroupProps<T extends string> {
	label: string
	options: RadioOption<T>[]
	value: T
	onChange: (value: T) => void
	name: string
}

export function PermissionRadioGroup<T extends string>({
	label,
	options,
	value,
	onChange,
	name,
}: PermissionRadioGroupProps<T>) {
	return (
		<div className="flex flex-col gap-2">
			<p className="text-label-sm font-semibold text-text-primary">{label}</p>
			<div className="flex flex-col gap-1.5">
				{options.map((opt) => (
					<label
						key={opt.value}
						className="flex cursor-pointer items-start gap-3"
					>
						<input
							type="radio"
							name={name}
							value={opt.value}
							checked={value === opt.value}
							onChange={() => onChange(opt.value)}
							className="sr-only"
						/>
						<div
							className={cn(
								"mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
								value === opt.value
									? "border-action-primary bg-action-primary"
									: "border-border-default",
							)}
						>
							{value === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<span className="text-label-sm text-text-primary">{opt.label}</span>
								{opt.recommended && (
									<span className="rounded-badge bg-surface-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-text-brand">
										Recommended
									</span>
								)}
							</div>
							{opt.description && (
								<p className="text-caption text-text-tertiary">{opt.description}</p>
							)}
						</div>
					</label>
				))}
			</div>
		</div>
	)
}

export type { RadioOption }
