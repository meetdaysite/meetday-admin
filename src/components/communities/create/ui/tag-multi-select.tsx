"use client"

import { useState, useRef, useCallback } from "react"
import { X, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TagOption {
	id: string
	label: string
}

interface TagMultiSelectProps {
	options: TagOption[]
	value: TagOption[]
	onChange: (value: TagOption[]) => void
	placeholder?: string
	label?: string
	hint?: string
	required?: boolean
	loading?: boolean
	maxItems?: number
}

export function TagMultiSelect({
	options,
	value,
	onChange,
	placeholder = "Search or add...",
	label,
	hint,
	required,
	loading,
	maxItems,
}: TagMultiSelectProps) {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	const selected = new Set(value.map(v => v.id))

	const filtered = options.filter(
		o => !selected.has(o.id) && o.label.toLowerCase().includes(query.toLowerCase()),
	)

	const add = useCallback(
		(opt: TagOption) => {
			if (maxItems && value.length >= maxItems) return
			onChange([...value, opt])
			setQuery("")
			inputRef.current?.focus()
		},
		[value, onChange, maxItems],
	)

	const remove = useCallback((id: string) => onChange(value.filter(v => v.id !== id)), [value, onChange])

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Backspace" && !query && value.length > 0) {
				remove(value[value.length - 1].id)
			}
			if (e.key === "Escape") {
				setOpen(false)
				inputRef.current?.blur()
			}
		},
		[query, value, remove],
	)

	return (
		<div className="flex flex-col gap-1.5" ref={containerRef}>
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
					"relative flex min-h-(--size-input-md) flex-wrap items-center gap-1.5 rounded-input border bg-surface-canvas px-3 py-2 transition-colors duration-(--duration-120)",
					open ? "border-border-focused" : "border-border-default hover:border-border-strong",
				)}
				onClick={() => {
					inputRef.current?.focus()
					setOpen(true)
				}}
			>
				{value.map(tag => (
					<span
						key={tag.id}
						className="flex items-center gap-1 rounded-badge bg-surface-brand-soft px-2 py-0.5 text-caption font-medium text-text-brand"
					>
						{tag.label}
						<button
							type="button"
							onClick={e => {
								e.stopPropagation()
								remove(tag.id)
							}}
							className="text-icon-brand hover:text-text-danger transition-colors"
						>
							<X size={10} />
						</button>
					</span>
				))}

				<div className="flex flex-1 items-center gap-1.5 min-w-25">
					<Search size={14} className="shrink-0 text-icon-secondary" />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={e => {
							setQuery(e.target.value)
							setOpen(true)
						}}
						onFocus={() => setOpen(true)}
						onBlur={() => setTimeout(() => setOpen(false), 150)}
						onKeyDown={onKeyDown}
						placeholder={value.length === 0 ? placeholder : ""}
						className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
					/>
				</div>

				<ChevronDown
					size={14}
					className={cn(
						"shrink-0 text-icon-secondary transition-transform duration-(--duration-120)",
						open && "rotate-180",
					)}
				/>

				{open && (filtered.length > 0 || loading) && (
					<div className="absolute left-0 top-full z-50 mt-1 w-full rounded-card border border-border-default bg-surface-canvas shadow-floating">
						{loading ? (
							<p className="px-3 py-2 text-caption text-text-secondary">Loading...</p>
						) : (
							<ul className="max-h-48 overflow-y-auto py-1">
								{filtered.map(opt => (
									<li key={opt.id}>
										<button
											type="button"
											onMouseDown={e => e.preventDefault()}
											onClick={() => add(opt)}
											className="flex w-full items-center px-3 py-2 text-sm text-text-primary hover:bg-surface-card transition-colors"
										>
											{opt.label}
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
