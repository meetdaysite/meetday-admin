import { cn } from "@/lib/utils"
import { StatusBadge, type BadgeStatus } from "@/components/ui/status-badge"
import { Star } from "lucide-react"

// ─── TwoLineCell ──────────────────────────────────────────────────────────────

export function TwoLineCell({
	primary,
	secondary,
}: {
	primary: React.ReactNode
	secondary?: React.ReactNode
}) {
	return (
		<div>
			<p className="text-sm font-black font-heading text-black leading-none mb-1">{primary}</p>
			{secondary != null && (
				<p className="text-xs text-text-tertiary">{secondary}</p>
			)}
		</div>
	)
}

// ─── ChipCell ─────────────────────────────────────────────────────────────────

export function ChipCell({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold",
				className ?? "bg-neutral-100 text-text-secondary border-neutral-200",
			)}
		>
			{children}
		</span>
	)
}

// ─── DateCell ─────────────────────────────────────────────────────────────────

export function DateCell({
	value,
	format,
	secondary,
}: {
	value: string | null | undefined
	format: (v: string) => string
	secondary?: boolean
}) {
	if (!value) return <span className="text-xs text-text-tertiary">—</span>
	return (
		<span className={cn("text-xs", secondary ? "text-text-secondary" : "text-text-primary")}>
			{format(value)}
		</span>
	)
}

// ─── ProgressCell ─────────────────────────────────────────────────────────────

export function ProgressCell({
	used,
	max,
}: {
	used: number
	max: number | null
}) {
	const pct = max != null ? Math.round((used / max) * 100) : null
	return (
		<div className="space-y-1 min-w-24">
			<p className="text-xs text-text-primary">
				{used}
				<span className="text-text-tertiary">{max != null ? ` / ${max}` : " / ∞"}</span>
			</p>
			{pct !== null && (
				<div className="h-1 w-16 rounded-full bg-neutral-100 overflow-hidden">
					<div
						className="h-full rounded-full bg-action-primary/70 transition-all"
						style={{ width: `${Math.min(pct, 100)}%` }}
					/>
				</div>
			)}
		</div>
	)
}

// ─── ImageCell ────────────────────────────────────────────────────────────────

export function ImageCell({ src, alt }: { src: string | null | undefined; alt?: string }) {
	if (!src) return <span className="text-xs text-text-tertiary">—</span>
	return (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			src={src}
			alt={alt ?? ""}
			loading="lazy"
			decoding="async"
			className="h-12 w-12 rounded-md object-cover bg-neutral-100"
			onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
		/>
	)
}

// ─── StatusCell ───────────────────────────────────────────────────────────────

export function StatusCell({ status }: { status: BadgeStatus | string | null | undefined }) {
	if (!status) return <span className="text-xs text-text-tertiary">—</span>
	return <StatusBadge status={status} />
}

// ─── RatingCell ───────────────────────────────────────────────────────────────

export function RatingCell({ rating }: { rating: number }) {
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

// ─── AgeDateCell ──────────────────────────────────────────────────────────────

export function AgeDateCell({
	iso,
	getDaysSince,
	format,
}: {
	iso: string | undefined
	getDaysSince: (iso: string) => number
	format: (v: string) => string
}) {
	if (!iso) return <span className="text-xs text-text-tertiary">—</span>
	const days = getDaysSince(iso)
	const ageColor =
		days > 35 ? "text-red-600" :
		days > 21 ? "text-orange-600" :
		days > 7  ? "text-amber-600" :
		"text-text-tertiary"
	const label =
		days === 0 ? "Today" :
		days === 1 ? "Yesterday" :
		`${days} days ago`
	return (
		<div>
			<p className="text-xs text-text-primary">{format(iso)}</p>
			<p className={cn("text-[11px] font-medium", ageColor)}>{label}</p>
		</div>
	)
}
