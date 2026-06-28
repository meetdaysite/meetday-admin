"use client"

import { CategoryDrawer } from "@/components/categories/category-drawer"
import { DataTable } from "@/components/ui/data-table"
import { ErrorBanner } from "@/components/ui/error-banner"
import { PageHeader } from "@/components/ui/page-header"
import { SearchInput } from "@/components/ui/search-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { getCategories } from "@/lib/api/categories"
import { formatDate } from "@/lib/formatters"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Category } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// Helpers

// Page

export default function CategoriesPage() {
	const router = useRouter()
	const canManage = usePermission("category.manage")

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [categories, setCategories] = useState<Category[]>([])
	const [search, setSearch] = useState("")
	const [drawerOpen, setDrawerOpen] = useState(false)
	const [selected, setSelected] = useState<Category | null>(null)

	const fetchCategories = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const data = await getCategories()
			setCategories(data)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
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
			c => c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q),
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
		setCategories(prev => {
			const idx = prev.findIndex(c => c.id === saved.id)
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
					<p className="text-xs font-semibold text-text-primary">{row.original.name}</p>
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
				id: "status",
				header: "Status",
				cell: ({ row }) => <StatusBadge status={row.original.isActive ? "ACTIVE" : "DISABLED"} />,
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

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader title="Categories" count={categories.length}>
				{canManage && (
					<button
						onClick={openCreate}
						className="flex items-center gap-1.5 rounded-lg bg-action-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors"
					>
						<Plus size={13} />
						New Category
					</button>
				)}
			</PageHeader>

			{/* Search */}
			<SearchInput
				value={search}
				onChange={setSearch}
				placeholder="Search categories…"
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
					onRowClick={canManage ? openEdit : undefined}
					emptyState={
						<div className="py-12 text-center text-sm text-text-tertiary">
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
