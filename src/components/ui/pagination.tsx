type PaginationProps = {
	page: number
	totalPages: number
	total: number
	pageSize: number
	onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
	if (totalPages <= 1) return null

	const from = (page - 1) * pageSize + 1
	const to = Math.min(page * pageSize, total)

	return (
		<div className="flex items-center justify-between text-xs text-text-tertiary">
			<span>
				Showing {from}–{to} of {total}
			</span>
			<div className="flex items-center gap-2">
				<button
					disabled={page === 1}
					onClick={() => onPageChange(page - 1)}
					className="rounded-md px-2.5 py-1 text-xs font-medium border border-border-default hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				>
					Previous
				</button>
				<span className="font-medium text-text-primary">
					{page} / {totalPages}
				</span>
				<button
					disabled={page >= totalPages}
					onClick={() => onPageChange(page + 1)}
					className="rounded-md px-2.5 py-1 text-xs font-medium border border-border-default hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				>
					Next
				</button>
			</div>
		</div>
	)
}
