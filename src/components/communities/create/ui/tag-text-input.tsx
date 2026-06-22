"use client"

import { useState, useRef, useCallback } from "react"
import { X, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagTextInputProps {
	value: string[]
	onChange: (value: string[]) => void
	placeholder?: string
	label?: string
	hint?: string
	required?: boolean
	maxItems?: number
	icon?: React.ReactNode
}

export function TagTextInput({
	value,
	onChange,
	placeholder = "Type and press Enter...",
	label,
	hint,
	required,
	maxItems,
	icon,
}: TagTextInputProps) {
	const [input, setInput] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)
	const [focused, setFocused] = useState(false)

	const add = useCallback(
		(raw: string) => {
			const trimmed = raw.trim()
			if (!trimmed || value.includes(trimmed)) return
			if (maxItems && value.length >= maxItems) return
			onChange([...value, trimmed])
			setInput("")
		},
		[value, onChange, maxItems],
	)

	const remove = useCallback(
		(item: string) => onChange(value.filter((v) => v !== item)),
		[value, onChange],
	)

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if ((e.key === "Enter" || e.key === ",") && input.trim()) {
				e.preventDefault()
				add(input)
			}
			if (e.key === "Backspace" && !input && value.length > 0) {
				remove(value[value.length - 1])
			}
		},
		[input, value, add, remove],
	)

	return (
		<div className="flex flex-col gap-1.5">
			{(label || hint) && (
				<div className="flex items-center justify-between gap-2">
					{label && (
						<span className="text-label-sm font-semibold text-text-primary">
							{label}
							{required && <span className="ml-0.5 text-text-danger">*</span>}
						</span>
					)}
					{hint && <span className="text-caption text-text-secondary">{hint}</span>}
				</div>
			)}

			<div
				className={cn(
					"flex min-h-[var(--size-input-md)] flex-wrap items-center gap-1.5 rounded-input border bg-surface-canvas px-3 py-2 transition-colors duration-(--duration-120) cursor-text",
					focused ? "border-border-focused" : "border-border-default hover:border-border-strong",
				)}
				onClick={() => inputRef.current?.focus()}
			>
				{value.map((tag) => (
					<span
						key={tag}
						className="flex items-center gap-1 rounded-badge bg-surface-card border border-border-subtle px-2 py-0.5 text-caption font-medium text-text-secondary"
					>
						{icon && <span className="text-icon-secondary">{icon}</span>}
						{tag}
						<button
							type="button"
							onClick={(e) => { e.stopPropagation(); remove(tag) }}
							className="text-icon-secondary hover:text-text-danger transition-colors"
						>
							<X size={10} />
						</button>
					</span>
				))}

				<input
					ref={inputRef}
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={onKeyDown}
					onFocus={() => setFocused(true)}
					onBlur={() => { setFocused(false); if (input.trim()) add(input) }}
					placeholder={value.length === 0 ? placeholder : ""}
					className="min-w-[120px] flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
				/>
			</div>
		</div>
	)
}
