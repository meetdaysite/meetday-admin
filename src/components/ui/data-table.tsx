"use client"

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { SkeletonTableRow } from "./skeleton"
import { EmptyState } from "./empty-state"

// ─── Types ────────────────────────────────────────────────────────────────────

export type DataTableProps<TData, TValue> = {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	isLoading?: boolean
	skeletonRows?: number
	emptyState?: React.ReactNode
	onRowClick?: (row: TData) => void
	getRowClassName?: (row: TData) => string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<TData, TValue>({
	columns,
	data,
	isLoading = false,
	skeletonRows = 5,
	emptyState,
	onRowClick,
	getRowClassName,
}: DataTableProps<TData, TValue>) {
	"use no memo"

	const [sorting, setSorting] = useState<SortingState>([])

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data: data ?? [],
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	})

	const tableRows = !isLoading ? (table.getRowModel()?.rows ?? []) : []

	return (
		<div className="overflow-hidden rounded-[24px] border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
			<div className="overflow-x-auto">
				<table className="w-full">
					{/* Head */}
					<thead className="bg-[#FFC940] border-b-[3px] border-black">
						{table.getHeaderGroups().map(headerGroup => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map(header => {
									const canSort = header.column.getCanSort()
									const sorted = header.column.getIsSorted()
									return (
										<th
											key={header.id}
											onClick={
												canSort ? header.column.getToggleSortingHandler() : undefined
											}
											className={cn(
												"px-4 py-3.5 text-left text-xs font-black tracking-wider text-black uppercase",
												canSort &&
													"cursor-pointer select-none hover:opacity-80 transition-opacity",
											)}
										>
											<span className="inline-flex items-center gap-1.5">
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
												{canSort && (
													<span className="text-black/60">
														{sorted === "asc" ? (
															<ChevronUp size={13} />
														) : sorted === "desc" ? (
															<ChevronDown size={13} />
														) : (
															<ChevronsUpDown size={13} />
														)}
													</span>
												)}
											</span>
										</th>
									)
								})}
							</tr>
						))}
					</thead>

					{/* Body */}
					<tbody className="divide-y-2 divide-black/10 bg-white">
						{isLoading ? (
							Array.from({ length: skeletonRows }).map((_, i) => (
								<SkeletonTableRow key={i} cells={columns.length} />
							))
						) : tableRows.length === 0 ? (
							<tr>
								<td colSpan={columns.length}>
									{emptyState ?? (
										<EmptyState
											title="No results found"
											description="There's nothing here yet. Data will appear once available."
										/>
									)}
								</td>
							</tr>
						) : (
							tableRows.map(row => (
								<tr
									key={row.id}
									onClick={() => onRowClick?.(row.original)}
									className={cn(
										"transition-colors",
										onRowClick && "cursor-pointer hover:bg-neutral-50",
										getRowClassName?.(row.original),
									)}
								>
									{row.getVisibleCells().map(cell => (
										<td key={cell.id} className="px-4 py-3.5 text-sm font-semibold text-text-primary">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}
