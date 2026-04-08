import { cn } from "@/lib/utils"

// ─── Base ─────────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
	return (
		<div className={cn("animate-pulse rounded-md bg-neutral-100", className)} />
	)
}

// ─── Text lines ───────────────────────────────────────────────────────────────

export function SkeletonText({
	lines = 3,
	className,
}: {
	lines?: number
	className?: string
}) {
	const widths = ["w-full", "w-4/5", "w-3/5", "w-2/3", "w-1/2"]
	return (
		<div className={cn("space-y-2", className)}>
			{Array.from({ length: lines }).map((_, i) => (
				<Skeleton key={i} className={cn("h-3", widths[i % widths.length])} />
			))}
		</div>
	)
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function SkeletonCard({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"rounded-xl border border-neutral-200 bg-white p-5 space-y-3",
				className,
			)}
		>
			<div className="flex items-start justify-between">
				<Skeleton className="h-9 w-9 rounded-lg" />
				<Skeleton className="h-5 w-14 rounded-full" />
			</div>
			<div className="space-y-1.5">
				<Skeleton className="h-7 w-16" />
				<Skeleton className="h-3 w-28" />
			</div>
			<Skeleton className="h-3 w-24" />
		</div>
	)
}

// ─── Table row ────────────────────────────────────────────────────────────────

export function SkeletonTableRow({ cells = 4 }: { cells?: number }) {
	return (
		<tr>
			{Array.from({ length: cells }).map((_, i) => (
				<td key={i} className="px-4 py-3">
					<Skeleton
						className={cn(
							"h-4",
							i === 0 ? "w-32" : i === cells - 1 ? "w-16" : "w-24",
						)}
					/>
				</td>
			))}
		</tr>
	)
}
