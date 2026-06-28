"use client"

import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

type SearchInputProps = {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
}

export function SearchInput({ value, onChange, placeholder = "Search…", className }: SearchInputProps) {
	return (
		<div className={cn("relative", className)}>
			<Search
				size={13}
				className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
			/>
			<input
				type="text"
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full rounded-lg border border-border-default bg-surface-canvas pl-8 pr-3 py-2 text-xs placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
			/>
		</div>
	)
}
