"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

type PaginatedFetchResult<T> = {
	items: T[]
	total: number
	isLoading: boolean
	error: string | null
	refresh: () => void
}

export function usePaginatedFetch<T>(
	fetcher: () => Promise<{ items: T[]; total: number }>,
	errorToast?: string,
): PaginatedFetchResult<T> {
	const router = useRouter()
	const [items, setItems] = useState<T[]>([])
	const [total, setTotal] = useState(0)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const refresh = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await fetcher()
			setItems(res.items)
			setTotal(res.total)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
			if (status === 403) {
				setError("You don't have permission.")
			} else {
				if (errorToast) toast.error(errorToast)
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher])

	useEffect(() => {
		refresh()
	}, [refresh])

	return { items, total, isLoading, error, refresh }
}
