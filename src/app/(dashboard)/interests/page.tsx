"use client"

import { InterestDrawer } from "@/components/interests/interest-drawer"
import { DataTable } from "@/components/ui/data-table"
import { ErrorBanner } from "@/components/ui/error-banner"
import { PageHeader } from "@/components/ui/page-header"
import { SearchInput } from "@/components/ui/search-input"
import { getInterests } from "@/lib/api/interests"
import { formatDate } from "@/lib/formatters"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Interest } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

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
			<PageHeader title="Interests" count={interests.length}>
				<button
					onClick={openCreate}
					className="flex items-center gap-1.5 rounded-lg bg-action-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors"
				>
					<Plus size={13} />
					New Interest
				</button>
			</PageHeader>

			{/* Search */}
			<SearchInput
				value={search}
				onChange={setSearch}
				placeholder="Search interests…"
				className="max-w-xs"
			/>

			{/* Error */}
			{error ? (
				<ErrorBanner>{error}</ErrorBanner>
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
