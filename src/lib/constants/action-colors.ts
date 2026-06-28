// Maps audit log action strings to Tailwind badge class pairs.
// Matching is keyword-based so new action types are covered automatically.

export function actionColor(action: string): string {
	if (
		action.includes("APPROVED") ||
		action.includes("CONFIRMED") ||
		action.includes("RESTORED") ||
		action.includes("SCANNED")
	) {
		return "text-green-700 bg-green-50"
	}
	if (
		action.includes("REJECTED") ||
		action.includes("CANCELLED") ||
		action.includes("DELETED") ||
		action.includes("DEACTIVATED") ||
		action.includes("SUSPENDED") ||
		action.includes("DUPLICATE")
	) {
		return "text-red-600 bg-red-50"
	}
	if (action.includes("SUBMITTED") || action.includes("CREATED") || action.includes("INITIATED")) {
		return "text-sky-700 bg-sky-50"
	}
	return "text-text-secondary bg-neutral-100"
}
