"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { usePermission } from "@/lib/hooks/use-permission"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { CategoryDrawer } from "@/components/categories/category-drawer"
import { getCategories } from "@/lib/api/categories"
import type { Category } from "@/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
	const router = useRouter()
	const canManage = usePermission("category.manage")

	const [isLoading, setIsLoading]     = useState(true)
	const [error, setError]             = useState<string | null>(null)
	const [categories, setCategories]   = useState<Category[]>([])
	const [search, setSearch]           = useState("")
	const [drawerOpen, setDrawerOpen]   = useState(false)
	const [selected, setSelected]       = useState<Category | null>(null)

	const fetchCategories = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const data = await getCategories()
			setCategories(data)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) { router.replace("/login"); return }
			if (status === 403) {
				setError("You don't have permission to view categories.")
			} else {
				toast.error("Failed to load categories")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [router])

	useEffect(() => {
		fetchCategories()
	}, [fetchCategories])

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return categories
		return categories.filter(
			(c) => c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q),
		)
	}, [categories, search])

	function openCreate() {
		setSelected(null)
		setDrawerOpen(true)
	}

	function openEdit(category: Category) {
		setSelected(category)
		setDrawerOpen(true)
	}

	function handleSaved(saved: Category) {
		setCategories((prev) => {
			const idx = prev.findIndex((c) => c.id === saved.id)
			if (idx >= 0) {
				const next = [...prev]
				next[idx] = saved
				return next
			}
			return [...prev, saved]
		})
		toast.success(selected ? "Category updated" : "Category created")
		setDrawerOpen(false)
	}

	const columns = useMemo<ColumnDef<Category>[]>(
		() => [
			{
				id: "name",
				header: "Name",
				cell: ({ row }) => (
					<p className="text-xs font-semibold text-foreground">{row.original.name}</p>
				),
			},
			{
				id: "description",
				header: "Description",
				cell: ({ row }) => (
					<p className="text-xs text-neutral-light max-w-xs truncate">
						{row.original.description ?? <span className="italic">—</span>}
					</p>
				),
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => (
					<StatusBadge status={row.original.isActive ? "ACTIVE" : "DISABLED"} />
				),
			},
			{
				id: "createdAt",
				header: "Created",
				cell: ({ row }) => (
					<span className="text-xs text-neutral-dark">{formatDate(row.original.createdAt)}</span>
				),
			},
		],
		[],
	)

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center gap-3">
				<h1 className="text-base font-semibold text-foreground">Categories</h1>
				<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-dark">
					{categories.length}
				</span>
				{canManage && (
					<button
						onClick={openCreate}
						className="ml-auto flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors"
					>
						<Plus size={13} />
						New Category
					</button>
				)}
			</div>

			{/* Search */}
			<div className="relative max-w-xs">
				<Search
					size={13}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light pointer-events-none"
				/>
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search categories…"
					className="w-full rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-2 text-xs placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
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
					onRowClick={canManage ? openEdit : undefined}
					emptyState={
						<div className="py-12 text-center text-sm text-neutral-light">
							No categories found.
						</div>
					}
				/>
			)}

			<CategoryDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				onSaved={handleSaved}
				category={selected}
			/>
		</div>
	)
}
