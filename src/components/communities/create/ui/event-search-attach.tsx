"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { Search, Plus, X, MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getEvents } from "@/lib/api/events"
import type { Event } from "@/types"
import { toast } from "sonner"

type AttachedEvent = Pick<Event, "id" | "title" | "eventDate" | "city">

interface EventSearchAttachProps {
	value: AttachedEvent[]
	onChange: (events: AttachedEvent[]) => void
}

export function EventSearchAttach({ value, onChange }: EventSearchAttachProps) {
	const [query, setQuery] = useState("")
	const [results, setResults] = useState<Event[]>([])
	const [searching, setSearching] = useState(false)
	const [open, setOpen] = useState(false)
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
	const attached = useMemo(() => new Set(value.map(e => e.id)), [value])

	useEffect(() => {
		if (!query.trim()) {
			setResults([])
			return
		}
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(async () => {
			setSearching(true)
			try {
				const res = await getEvents({ limit: 10 })
				setResults(res.events.filter(e => e.title.toLowerCase().includes(query.toLowerCase())))
			} catch {
				toast.error("Failed to search events")
			} finally {
				setSearching(false)
			}
		}, 350)
	}, [query])

	const attach = useCallback(
		(event: Event) => {
			if (attached.has(event.id)) return
			onChange([
				...value,
				{ id: event.id, title: event.title, eventDate: event.eventDate, city: event.city },
			])
			setQuery("")
			setOpen(false)
		},
		[value, onChange, attached],
	)

	const detach = useCallback((id: string) => onChange(value.filter(e => e.id !== id)), [value, onChange])

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<Search
						size={14}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-icon-secondary"
					/>
					<input
						type="text"
						value={query}
						onChange={e => {
							setQuery(e.target.value)
							setOpen(true)
						}}
						onFocus={() => setOpen(true)}
						onBlur={() => setTimeout(() => setOpen(false), 150)}
						placeholder="Search events by name..."
						className={cn(
							"h-(--size-input-md) w-full rounded-input border border-border-default bg-surface-canvas pl-9 pr-4 text-sm text-text-primary outline-none placeholder:text-text-muted",
							"hover:border-border-strong focus:border-border-focused transition-colors",
						)}
					/>
					{open && (query.trim() || searching) && (
						<div className="absolute left-0 top-full z-50 mt-1 w-full rounded-card border border-border-default bg-surface-canvas shadow-floating">
							{searching ? (
								<div className="flex items-center gap-2 px-3 py-2 text-caption text-text-secondary">
									<Loader2 size={12} className="animate-spin" /> Searching...
								</div>
							) : results.length === 0 ? (
								<p className="px-3 py-2 text-caption text-text-secondary">No events found</p>
							) : (
								<ul className="max-h-48 overflow-y-auto py-1">
									{results.map(event => (
										<li key={event.id}>
											<button
												type="button"
												onMouseDown={e => e.preventDefault()}
												onClick={() => attach(event)}
												disabled={attached.has(event.id)}
												className={cn(
													"flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
													attached.has(event.id)
														? "opacity-40 cursor-not-allowed"
														: "hover:bg-surface-card",
												)}
											>
												<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-badge bg-surface-card text-xs font-bold text-text-secondary">
													{event.title.charAt(0)}
												</div>
												<div className="min-w-0 flex-1">
													<p className="text-label-sm text-text-primary truncate">
														{event.title}
													</p>
													<p className="text-caption text-text-secondary">
														{event.city}
													</p>
												</div>
												{!attached.has(event.id) && (
													<Plus size={14} className="shrink-0 text-icon-brand" />
												)}
											</button>
										</li>
									))}
								</ul>
							)}
						</div>
					)}
				</div>
			</div>

			{value.length > 0 && (
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{value.map(event => (
						<div
							key={event.id}
							className="flex items-center gap-3 rounded-card border border-border-subtle bg-surface-canvas p-3"
						>
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-badge bg-surface-card text-sm font-bold text-text-secondary">
								{event.title.charAt(0)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-label-sm font-medium text-text-primary truncate">
									{event.title}
								</p>
								<div className="flex items-center gap-1 mt-0.5">
									<MapPin size={10} className="text-icon-secondary" />
									<span className="text-caption text-text-secondary">{event.city}</span>
								</div>
							</div>
							<button
								type="button"
								onClick={() => detach(event.id)}
								className="shrink-0 text-icon-secondary hover:text-text-danger transition-colors"
							>
								<X size={14} />
							</button>
						</div>
					))}
				</div>
			)}

			{value.length === 0 && (
				<p className="text-caption text-text-secondary">
					No events added yet. Search and add events above.
				</p>
			)}
		</div>
	)
}

export type { AttachedEvent }
