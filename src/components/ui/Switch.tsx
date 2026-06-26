"use client"

import * as RadixSwitch from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

interface SwitchProps {
	checked: boolean
	onCheckedChange: (checked: boolean) => void
	disabled?: boolean
	id?: string
	size?: "sm" | "md"
}

const sizeConfig = {
	sm: {
		root: "h-5 w-9",
		thumb: "h-4 w-4 data-[state=checked]:translate-x-4",
	},
	md: {
		root: "h-6 w-11",
		thumb: "h-5 w-5 data-[state=checked]:translate-x-5",
	},
}

export function Switch({ checked, onCheckedChange, disabled, id, size = "md" }: SwitchProps) {
	const cfg = sizeConfig[size]
	return (
		<RadixSwitch.Root
			id={id}
			checked={checked}
			onCheckedChange={onCheckedChange}
			disabled={disabled}
			className={cn(
				"relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
				"transition-colors duration-(--duration-120) outline-none",
				"focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
				"disabled:cursor-not-allowed disabled:opacity-50",
				checked ? "bg-action-primary" : "bg-border-default",
				cfg.root,
			)}
		>
			<RadixSwitch.Thumb
				className={cn(
					"pointer-events-none block rounded-full bg-white shadow-sm",
					"transition-transform duration-(--duration-120) translate-x-0",
					cfg.thumb,
				)}
			/>
		</RadixSwitch.Root>
	)
}
