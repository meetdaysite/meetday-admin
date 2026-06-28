import axios from "axios"

/**
 * Extracts a human-readable message from an unknown thrown value.
 *
 * Priority order:
 *   1. response.data.message (API validation / business error)
 *   2. axios error message
 *   3. Error.message
 *   4. fallback string
 */
export function extractApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
	if (axios.isAxiosError(err)) {
		return (err.response?.data as { message?: string })?.message ?? err.message ?? fallback
	}
	if (err instanceof Error) return err.message
	return fallback
}

// ─── HTTP status helpers ──────────────────────────────────────────────────────

export function isUnauthorized(err: unknown): boolean {
	return (err as { response?: { status?: number } })?.response?.status === 401
}

export function isForbidden(err: unknown): boolean {
	return (err as { response?: { status?: number } })?.response?.status === 403
}

export function isNotFound(err: unknown): boolean {
	return (err as { response?: { status?: number } })?.response?.status === 404
}

export function isBadRequest(err: unknown): boolean {
	return (err as { response?: { status?: number } })?.response?.status === 400
}

export function httpStatus(err: unknown): number | undefined {
	return (err as { response?: { status?: number } })?.response?.status
}
