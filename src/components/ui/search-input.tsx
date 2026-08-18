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
				size={16}
				className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-black"
			/>
			<input
				type="text"
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full rounded-2xl border-[3px] border-black bg-white pl-9 pr-3 h-10 text-sm font-semibold text-black placeholder:text-neutral-400 focus:bg-neutral-50 focus:outline-none transition-colors"
			/>
		</div>
	)
}
