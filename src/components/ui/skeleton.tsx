import { cn } from "@/lib/utils"

// ─── Base ─────────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
	return (
		<div className={cn("animate-pulse rounded-badge bg-neutral-100", className)} />
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
				"rounded-xl border border-border-default bg-surface-card p-5 space-y-3",
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

// ─── Stat card ────────────────────────────────────────────────────────────────

export function SkeletonStatCard({ className }: { className?: string }) {
	return (
		<div className={cn("rounded-xl border border-border-default bg-surface-card p-5 space-y-3", className)}>
			<div className="flex items-start justify-between">
				<Skeleton className="h-9 w-9 rounded-lg" />
			</div>
			<div className="space-y-1.5">
				<Skeleton className="h-7 w-12" />
				<Skeleton className="h-3 w-32" />
			</div>
			<Skeleton className="h-3 w-20 border-t border-border-subtle pt-2.5" />
		</div>
	)
}

// ─── Activity feed item ────────────────────────────────────────────────────────

export function SkeletonActivityFeedItem() {
	return (
		<div className="flex items-start gap-3 py-3">
			<Skeleton className="mt-1 h-2 w-2 rounded-full shrink-0" />
			<div className="flex-1 space-y-1.5">
				<Skeleton className="h-3 w-48" />
				<Skeleton className="h-3 w-24" />
			</div>
		</div>
	)
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export function SkeletonDashboardPage() {
	return (
		<div className="p-6 space-y-6 max-w-7xl mx-auto">
			{/* SLA banner placeholder */}
			<Skeleton className="h-16 w-full rounded-xl" />

			{/* Stat cards */}
			<section>
				<Skeleton className="mb-3 h-3 w-20" />
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<SkeletonStatCard key={i} />
					))}
				</div>
			</section>

			{/* Activity feed */}
			<section className="rounded-xl border border-border-default bg-surface-card">
				<div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-3 w-20" />
				</div>
				<div className="px-5 divide-y divide-border-subtle">
					{Array.from({ length: 6 }).map((_, i) => (
						<SkeletonActivityFeedItem key={i} />
					))}
				</div>
			</section>
		</div>
	)
}

// ─── Page header ──────────────────────────────────────────────────────────────

export function SkeletonPageHeader() {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-3">
				<Skeleton className="h-5 w-24" />
				<Skeleton className="h-5 w-16 rounded-full" />
			</div>
			<Skeleton className="h-8 w-28 rounded-lg" />
		</div>
	)
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────

export function SkeletonDashboardShell({ children }: { children?: React.ReactNode }) {
	return (
		<div className="flex h-screen overflow-hidden bg-surface-page">
			{/* Sidebar */}
			<aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border-default bg-surface-canvas">
				<div className="flex items-center h-14 px-5 border-b border-border-default">
					<Skeleton className="h-5 w-24" />
				</div>
				<nav className="flex-1 py-3 px-2 space-y-1">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-8 w-full rounded-badge" />
					))}
				</nav>
			</aside>

			{/* Main */}
			<div className="flex-1 flex flex-col overflow-hidden min-w-0">
				{/* Topbar */}
				<header className="h-14 shrink-0 flex items-center justify-between px-4 bg-surface-canvas border-b border-border-default">
					<Skeleton className="h-6 w-6 rounded-md" />
					<div className="flex items-center gap-2">
						<div className="hidden sm:flex flex-col items-end gap-1">
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-2.5 w-32" />
						</div>
						<Skeleton className="h-7 w-7 rounded-full" />
					</div>
				</header>

				{/* Content */}
				<main className="flex-1 overflow-y-auto">
					{children}
				</main>
			</div>
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
