"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { usePermission } from "@/lib/hooks/use-permission"
import { DataTable } from "@/components/ui/data-table"
import { InterestDrawer } from "@/components/interests/interest-drawer"
import { getInterests } from "@/lib/api/interests"
import type { Interest } from "@/types"
import { formatDate } from "@/lib/formatters"

// Helpers

// Page

export default function InterestsPage() {
	const router = useRouter()
	const canManage = usePermission("interest.manage")

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [interests, setInterests] = useState<Interest[]>([])
	const [search, setSearch] = useState("")
	const [drawerOpen, setDrawerOpen] = useState(false)
	const [selected, setSelected] = useState<Interest | null>(null)

	const fetchInterests = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const data = await getInterests()
			setInterests(data)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
			if (status === 403) {
				setError("You don't have permission to view interests.")
			} else {
				toast.error("Failed to load interests")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [router])

	useEffect(() => {
		fetchInterests()
	}, [fetchInterests])

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return interests
		return interests.filter(
			i =>
				i.name.toLowerCase().includes(q) ||
				(i.description ?? "").toLowerCase().includes(q) ||
				i.slug.toLowerCase().includes(q),
		)
	}, [interests, search])

	function openCreate() {
		setSelected(null)
		setDrawerOpen(true)
	}

	function openEdit(interest: Interest) {
		setSelected(interest)
		setDrawerOpen(true)
	}

	function handleSaved(saved: Interest) {
		setInterests(prev => {
			const idx = prev.findIndex(i => i.id === saved.id)
			if (idx >= 0) {
				const next = [...prev]
				next[idx] = saved
				return next
			}
			return [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
		})
		toast.success(selected ? "Interest updated" : "Interest created")
		setDrawerOpen(false)
	}

	const columns = useMemo<ColumnDef<Interest>[]>(
		() => [
			{
				id: "name",
				header: "Name",
				cell: ({ row }) => (
					<div>
						<p className="text-xs font-semibold text-text-primary">{row.original.name}</p>
						<p className="text-[11px] text-text-tertiary font-mono">{row.original.slug}</p>
					</div>
				),
			},
			{
				id: "description",
				header: "Description",
				cell: ({ row }) => (
					<p className="text-xs text-text-tertiary max-w-xs truncate">
						{row.original.description ?? <span className="italic">â€”</span>}
					</p>
				),
			},
			{
				id: "image",
				header: "Image",
				cell: ({ row }) => (
					<span className="text-[11px] font-mono text-text-tertiary truncate max-w-40 block">
						{row.original.image ?? <span className="not-italic">â€”</span>}
					</span>
				),
			},
			{
				id: "createdAt",
				header: "Created",
				cell: ({ row }) => (
					<span className="text-xs text-text-secondary">{formatDate(row.original.createdAt)}</span>
				),
			},
		],
		[],
	)

	if (!canManage) {
		return (
			<div className="p-6 max-w-7xl mx-auto">
				<p className="text-sm text-text-tertiary">
					You don&apos;t have permission to view interests.
				</p>
			</div>
		)
	}

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center gap-3">
				<h1 className="text-base font-semibold text-text-primary">Interests</h1>
				<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
					{interests.length}
				</span>
				<button
					onClick={openCreate}
					className="ml-auto flex items-center gap-1.5 rounded-lg bg-action-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors"
				>
					<Plus size={13} />
					New Interest
				</button>
			</div>

			{/* Search */}
			<div className="relative max-w-xs">
				<Search
					size={13}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
				/>
				<input
					type="text"
					value={search}
					onChange={e => setSearch(e.target.value)}
					placeholder="Search interests…"
					className="w-full rounded-lg border border-border-default bg-surface-canvas pl-8 pr-3 py-2 text-xs placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
				/>
			</div>

			{/* Error */}
			{error ? (
				<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			) : (
				<DataTable
					columns={columns}
					data={filtered}
					isLoading={isLoading}
					onRowClick={openEdit}
					emptyState={
						<div className="py-12 text-center text-sm text-text-tertiary">
							No interests found.
						</div>
					}
				/>
			)}

			<InterestDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				onSaved={handleSaved}
				interest={selected}
			/>
		</div>
	)
}
