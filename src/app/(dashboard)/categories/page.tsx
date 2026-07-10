"use client"

import { CategoryDrawer } from "@/components/categories/category-drawer"
import { Button } from "@/components/ui/Button"
import { DataView } from "@/components/ui/data-view"
import PageHeader from "@/components/ui/PageHeader"
import { SearchInput } from "@/components/ui/search-input"
import { getCategories } from "@/lib/api/categories"
import { formatDate } from "@/lib/formatters"
import { DateCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Category } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

// Helpers

// Page

export default function CategoriesPage() {
	const canManage = usePermission("category.manage")

	const [search, setSearch] = useState("")
	const [drawerOpen, setDrawerOpen] = useState(false)
	const [selected, setSelected] = useState<Category | null>(null)

	const fetcher = useCallback(() => getCategories().then(data => ({ items: data, total: data.length })), [])

	const {
		items: categories,
		isLoading,
		error,
		refresh: fetchCategories,
	} = usePaginatedFetch(fetcher, "Failed to load categories")

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

	function handleSaved() {
		toast.success(selected ? "Category updated" : "Category created")
		setDrawerOpen(false)
		fetchCategories()
	}

	const columns = useMemo<ColumnDef<Category>[]>(
		() => [
			{
				id: "name",
				header: "Name",
				cell: ({ row }) => <TwoLineCell primary={row.original.name} />,
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
				cell: ({ row }) => <StatusCell status={row.original.isActive ? "ACTIVE" : "DISABLED"} />,
			},
			{
				id: "createdAt",
				header: "Created",
				cell: ({ row }) => <DateCell value={row.original.createdAt} format={formatDate} secondary />,
			},
		],
		[],
	)

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader
				title="Categories"
				description="Manage the categories for your products."
				buttons={
					canManage && (
						<Button leftIcon={<Plus size={13} />} onClick={openCreate}>
							Add Category
						</Button>
					)
				}
			/>

			{/* Search */}
			<SearchInput
				value={search}
				onChange={setSearch}
				placeholder="Search categories…"
				className="max-w-xs"
			/>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No categories found."
				onRowClick={canManage ? openEdit : undefined}
			/>

			<CategoryDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				onSaved={handleSaved}
				category={selected}
			/>
		</div>
	)
}
