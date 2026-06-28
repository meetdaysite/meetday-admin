// ─── Date formatters ─────────────────────────────────────────────────────────

/** "12 Jan 2025" — used for created-at / updated-at columns across all list pages */
export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
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
