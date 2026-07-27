// ─── Date formatters ─────────────────────────────────────────────────────────

/** "12 Jan 2025" — used for created-at / updated-at columns across all list pages */
export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

/**
 * "26 – 28 Jan 2025" / "26 Jan – 3 Feb 2025" / "26 Jan 2025 – 3 Jan 2026" —
 * collapses the shared month/year between two dates, used for multi-day events.
 */
export function formatDateRange(startIso: string, endIso: string): string {
	const start = new Date(startIso)
	const end = new Date(endIso)
	const day = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric" })
	const month = (d: Date) => d.toLocaleDateString("en-IN", { month: "short" })
	const year = (d: Date) => d.toLocaleDateString("en-IN", { year: "numeric" })

	if (start.getFullYear() !== end.getFullYear()) {
		return `${day(start)} ${month(start)} ${year(start)} – ${day(end)} ${month(end)} ${year(end)}`
	}
	if (start.getMonth() !== end.getMonth()) {
		return `${day(start)} ${month(start)} – ${day(end)} ${month(end)} ${year(end)}`
	}
	return `${day(start)} – ${day(end)} ${month(end)} ${year(end)}`
}

/** "12 January 2025" — long month form, used where extra formality is needed */
export function formatDateLong(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "long",
		year: "numeric",
	})
}

/** "12 Jan 2025, 03:45 PM" — timestamp with time, used in audit logs */
export function formatDateTime(iso: string): string {
	return new Date(iso).toLocaleString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
}

/**
 * Whole calendar days between an ISO timestamp and now, in the local timezone.
 * Compares midnight-to-midnight rather than raw elapsed milliseconds, so a
 * timestamp from late yesterday reads as 1 day old (not 0 → "Today") even if
 * fewer than 24 hours have actually elapsed.
 */
export function getDaysSince(iso: string): number {
	const then = new Date(iso)
	const now = new Date()
	const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate())
	const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	return Math.round((startOfNow.getTime() - startOfThen.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Number formatters ────────────────────────────────────────────────────────

/** 1500 → "1.5K", 2000 → "2K" */
export function formatCount(n: number): string {
	if (n >= 1000) {
		const v = n / 1000
		return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`
	}
	return String(n)
}

/** 1200 → "₹1,200" */
export function formatCurrency(value: number): string {
	return `₹${value.toLocaleString("en-IN")}`
}

// ─── String formatters ────────────────────────────────────────────────────────

/** "USER_BANNED" → "User banned" */
export function actionLabel(action: string): string {
	return action
		.replace(/_/g, " ")
		.toLowerCase()
		.replace(/^\w/, c => c.toUpperCase())
}
