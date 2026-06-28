// Maps audit log action strings to Tailwind badge class pairs.
// Matching is keyword-based so new action types are covered automatically.

export function actionColor(action: string): string {
	if (
		action.includes("APPROVED") ||
		action.includes("CONFIRMED") ||
		action.includes("RESTORED") ||
		action.includes("SCANNED")
	) {
		return "text-green-700 bg-green-100 border border-green-200"
	}
	if (
		action.includes("REJECTED") ||
		action.includes("CANCELLED") ||
		action.includes("DELETED") ||
		action.includes("DEACTIVATED") ||
		action.includes("SUSPENDED") ||
		action.includes("DUPLICATE")
	) {
		return "text-red-600 bg-red-100 border border-red-200"
	}
	if (action.includes("SUBMITTED") || action.includes("CREATED") || action.includes("INITIATED")) {
		return "text-sky-700 bg-sky-100 border border-sky-200"
	}
	return "text-neutral-700 bg-neutral-100 border border-neutral-200"
}
