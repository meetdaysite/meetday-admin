import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./data-table"
import { ErrorBanner } from "./error-banner"
import { Pagination } from "./pagination"

type PaginationConfig = {
	page: number
	totalPages: number
	total: number
	pageSize: number
	onPageChange: (page: number) => void
}

type DataViewProps<TData> = {
	error: string | null
	isLoading: boolean
	columns: ColumnDef<TData>[]
	data: TData[]
	emptyMessage?: string
	onRowClick?: (row: TData) => void
	getRowClassName?: (row: TData) => string
	pagination?: PaginationConfig
}

export function DataView<TData>({
	error,
	isLoading,
	columns,
	data,
	emptyMessage = "No data found.",
	onRowClick,
	getRowClassName,
	pagination,
}: DataViewProps<TData>) {
	if (error) {
		return <ErrorBanner>{error}</ErrorBanner>
	}

	return (
		<>
			<DataTable
				columns={columns}
				data={data}
				isLoading={isLoading}
				onRowClick={onRowClick}
				getRowClassName={getRowClassName}
				emptyState={
					<div className="py-12 text-center text-sm text-text-tertiary">{emptyMessage}</div>
				}
			/>
			{pagination && <Pagination {...pagination} />}
		</>
	)
}
