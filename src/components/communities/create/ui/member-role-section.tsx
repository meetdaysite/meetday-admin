"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Plus, X, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AssignedMember } from "@/stores/create-community.store"
import type { AssignableCommunityRole } from "@/types"
import { toast } from "sonner"

interface SearchableUser {
	id: string
	name: string
	email: string
	avatarInitial: string
	avatarColor: string
}

interface MemberRoleSectionProps {
	role: AssignableCommunityRole
	roleLabel: string
	roleBadgeClass: string
	permissionLabel: string
	members: AssignedMember[]
	onAdd: (member: AssignedMember) => void
	onRemove: (userId: string) => void
	fetchUsers: (query: string) => Promise<SearchableUser[]>
	addLabel: string
}

export function MemberRoleSection({
	role,
	roleLabel,
	roleBadgeClass,
	permissionLabel,
	members,
	onAdd,
	onRemove,
	fetchUsers,
	addLabel,
}: MemberRoleSectionProps) {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState("")
	const [results, setResults] = useState<SearchableUser[]>([])
	const [loading, setLoading] = useState(false)
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const assigned = new Set(members.map((m) => m.userId))

	useEffect(() => {
		if (!open) return
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(async () => {
			setLoading(true)
			try {
				const data = await fetchUsers(query)
				setResults(data)
			} catch {
				toast.error(`Failed to load ${roleLabel.toLowerCase()}s`)
			} finally {
				setLoading(false)
			}
		}, 300)
	}, [query, open, fetchUsers, roleLabel])

	const add = useCallback(
		(user: SearchableUser) => {
			onAdd({ userId: user.id, name: user.name, email: user.email, role, avatarInitial: user.avatarInitial, avatarColor: user.avatarColor })
			setOpen(false)
			setQuery("")
		},
		[onAdd, role],
	)

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-label-sm font-semibold text-text-primary">{members.length > 0 ? `${roleLabel}s (${members.length})` : `${roleLabel}s`}</p>
					<p className="text-caption text-text-secondary">{permissionLabel}</p>
				</div>
				<button
					type="button"
					onClick={() => { setOpen((o) => !o); setTimeout(() => inputRef.current?.focus(), 100) }}
					className="flex items-center gap-1.5 rounded-action border border-border-default bg-surface-canvas px-3 h-(--size-action-sm) text-label-sm text-text-secondary hover:bg-surface-card hover:border-border-strong transition-colors"
				>
					<Plus size={13} />
					{addLabel}
				</button>
			</div>

			{open && (
				<div className="relative rounded-card border border-border-default bg-surface-canvas p-3">
					<div className="relative">
						<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-icon-secondary" />
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={`Search ${roleLabel.toLowerCase()}s by name or email...`}
							className="h-(--size-action-sm) w-full rounded-input border border-border-default bg-surface-canvas pl-9 pr-4 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-border-focused"
						/>
					</div>

					<div className="mt-2 max-h-48 overflow-y-auto">
						{loading ? (
							<div className="flex items-center gap-2 py-3 text-caption text-text-secondary">
								<Loader2 size={12} className="animate-spin" /> Searching...
							</div>
						) : results.length === 0 ? (
							<p className="py-3 text-caption text-text-secondary">
								{query ? "No results found" : "Start typing to search"}
							</p>
						) : (
							results
								.filter((u) => !assigned.has(u.id))
								.map((user) => (
									<button
										key={user.id}
										type="button"
										onClick={() => add(user)}
										className="flex w-full items-center gap-3 rounded-action px-2 py-2 text-left hover:bg-surface-card transition-colors"
									>
										<div
											className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
											style={{ background: user.avatarColor }}
										>
											{user.avatarInitial}
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-label-sm text-text-primary truncate">{user.name}</p>
											<p className="text-caption text-text-secondary truncate">{user.email}</p>
										</div>
										<Plus size={14} className="shrink-0 text-icon-brand" />
									</button>
								))
						)}
					</div>
				</div>
			)}

			{members.length > 0 && (
				<div className="flex flex-col gap-2">
					{members.map((member) => (
						<div
							key={member.userId}
							className="flex items-center gap-3 rounded-card border border-border-subtle bg-surface-canvas px-4 py-3"
						>
							<div
								className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
								style={{ background: member.avatarColor }}
							>
								{member.avatarInitial}
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-label-sm font-medium text-text-primary">{member.name}</p>
								<p className="text-caption text-text-secondary">{member.email}</p>
							</div>
							<span className={cn("rounded-badge px-1.5 py-0.5 text-[11px] font-semibold leading-none", roleBadgeClass)}>
								{roleLabel}
							</span>
							<span className="text-caption text-text-secondary hidden sm:block">{permissionLabel}</span>
							<button
								type="button"
								onClick={() => onRemove(member.userId)}
								className="shrink-0 text-icon-secondary hover:text-text-danger transition-colors"
							>
								<X size={14} />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
