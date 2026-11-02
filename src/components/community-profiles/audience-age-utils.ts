export function parseAudienceAge(val: string): { minAge: string; maxAge: string; isAndAbove: boolean } {
	const trimmed = (val || "").trim()
	if (!trimmed) {
		return { minAge: "", maxAge: "", isAndAbove: false }
	}

	const andAboveMatch = trimmed.match(/^(\d+)\s*(?:\+|and\s+above|&\s*above)$/i)
	if (andAboveMatch) {
		return { minAge: andAboveMatch[1], maxAge: "", isAndAbove: true }
	}

	const rangeMatch = trimmed.match(/^(\d+)\s*(?:-|to)\s*(\d+)$/i)
	if (rangeMatch) {
		return { minAge: rangeMatch[1], maxAge: rangeMatch[2], isAndAbove: false }
	}

	const singleMatch = trimmed.match(/^(\d+)$/)
	if (singleMatch) {
		return { minAge: singleMatch[1], maxAge: "", isAndAbove: false }
	}

	return { minAge: "", maxAge: "", isAndAbove: false }
}

export function formatAudienceAge(minAge: string, maxAge: string, isAndAbove: boolean): string {
	const min = minAge.trim()
	const max = maxAge.trim()

	if (!min) return ""
	if (isAndAbove) {
		return `${min} and above`
	}
	if (max) {
		return `${min}-${max}`
	}
	return `${min}`
}
