"use client"

import { DataView } from "@/components/ui/data-view"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { PageHeader } from "@/components/ui/page-header"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { getReviews, updateReviewVisibility } from "@/lib/api/reviews"
import { formatDate } from "@/lib/formatters"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Review } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Eye, EyeOff, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// Constants

const PAGE_LIMIT = 20

// Helpers

function StarRating({ rating }: { rating: number }) {
	return (
		<span className="flex items-center gap-0.5">
			{Array.from({ length: 5 }).map((_, i) => (
				<Star
					key={i}
					size={11}
					className={i < rating ? "fill-amber-400 text-amber-400" : "text-neutral-200"}
				/>
			))}
			<span className="ml-1 text-[11px] font-semibold text-text-secondary">{rating}</span>
		</span>
	)
}

// Constants

const VISIBILITY_TABS: { label: string; value: "ALL" | "VISIBLE" | "HIDDEN" }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Visible", value: "VISIBLE" },
	{ label: "Hidden", value: "HIDDEN" },
]

// Page

export default function ReviewsPage() {
	const router = useRouter()
	const canRead = usePermission("moderation.read")
	const canAction = usePermission("moderation.action")

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [reviews, setReviews] = useState<Review[]>([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState("")
	const [togglingId, setTogglingId] = useState<string | null>(null)
	const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "VISIBLE" | "HIDDEN">("ALL")

	const fetchReviews = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await getReviews({ page, limit: PAGE_LIMIT })
			setReviews(res.reviews)
			setTotal(res.total ?? res.reviews.length)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
			if (status === 403) {
				setError("You don't have permission to view reviews.")
			} else {
				toast.error("Failed to load reviews")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [page, router])

	useEffect(() => {
		fetchReviews()
	}, [fetchReviews])

	async function handleToggleVisibility(review: Review) {
		if (togglingId) return
		setTogglingId(review.id)
		try {
			const updated = await updateReviewVisibility(review.id, !review.isVisible)
			setReviews(prev => prev.map(r => (r.id === updated.id ? updated : r)))
			toast.success(updated.isVisible ? "Review shown" : "Review hidden")
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
			toast.error("Failed to update review visibility")
		} finally {
			setTogglingId(null)
		}
	}

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		return reviews
			.filter(r => {
				if (visibilityFilter === "VISIBLE") return r.isVisible
				if (visibilityFilter === "HIDDEN") return !r.isVisible
				return true
			})
			.filter(
				r =>
					!q ||
					r.event.title.toLowerCase().includes(q) ||
					(r.reviewer
						? `${r.reviewer.firstName} ${r.reviewer.lastName}`.toLowerCase().includes(q)
						: false) ||
					(r.content ?? "").toLowerCase().includes(q),
			)
	}, [reviews, search, visibilityFilter])

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	const columns = useMemo<ColumnDef<Review>[]>(
		() => [
			{
				id: "reviewer",
				header: "Reviewer",
				cell: ({ row }) => {
					const u = row.original.reviewer
					if (!u) return <span className="text-xs text-text-tertiary italic">Unknown</span>
					return (
						<div>
							<p className="text-xs font-semibold text-text-primary leading-none mb-0.5">
								{u.firstName} {u.lastName}
							</p>
							<p className="text-[11px] text-text-tertiary">{u.email}</p>
						</div>
					)
				},
			},
			{
				id: "event",
				header: "Event",
				cell: ({ row }) => (
					<p className="text-xs font-semibold text-text-primary max-w-40 truncate">
						{row.original.event.title}
					</p>
				),
			},
			{
				id: "rating",
				header: "Rating",
				cell: ({ row }) => <StarRating rating={row.original.rating} />,
			},
			{
				id: "content",
				header: "Review",
				cell: ({ row }) => {
					const { content, highlights } = row.original
					return (
						<div className="flex flex-col gap-1 max-w-xs">
							{content ? (
								<p className="text-xs text-text-secondary truncate">{content}</p>
							) : (
								<span className="text-xs italic text-text-tertiary">No text</span>
							)}
							{highlights.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{highlights.map(h => (
										<span
											key={h}
											className="rounded-full bg-surface-page px-1.5 py-0.5 text-[10px] font-medium text-text-secondary border border-border-subtle capitalize"
										>
											{h.toLowerCase().replace(/_/g, " ")}
										</span>
									))}
								</div>
							)}
						</div>
					)
				},
			},
			{
				id: "date",
				header: "Date",
				cell: ({ row }) => (
					<span className="text-xs text-text-secondary">{formatDate(row.original.createdAt)}</span>
				),
			},
			{
				id: "visibility",
				header: "Visible",
				cell: ({ row }) => {
					const r = row.original
					const isBusy = togglingId === r.id
					return (
						<button
							onClick={e => {
								e.stopPropagation()
								handleToggleVisibility(r)
							}}
							disabled={!canAction || isBusy}
							title={r.isVisible ? "Hide review" : "Show review"}
							className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
								r.isVisible
									? "bg-green-50 text-green-700 hover:bg-green-100"
									: "bg-neutral-100 text-text-secondary hover:bg-neutral-200"
							}`}
						>
							{r.isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
							{r.isVisible ? "Visible" : "Hidden"}
						</button>
					)
				},
			},
		],
		[togglingId, canAction], // eslint-disable-line react-hooks/exhaustive-deps
	)

	if (!canRead) return <PermissionGuard message="You don't have permission to view reviews." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader title="Reviews" count={total} />

			{/* Filters */}
			<div className="flex items-center gap-2 flex-wrap">
				<FilterTabs
					options={VISIBILITY_TABS}
					value={visibilityFilter}
					onChange={setVisibilityFilter}
				/>
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search by reviewer, event, or content…"
					className="flex-1 min-w-48 max-w-xs ml-auto"
				/>
			</div>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No reviews match the current filters."
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>
		</div>
	)
}
