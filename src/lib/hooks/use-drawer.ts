import { useState } from "react"

type DrawerResult<T> = {
	item: T | null
	open: boolean
	openDrawer: (item: T) => void
	closeDrawer: () => void
}

export function useDrawer<T>(): DrawerResult<T> {
	const [item, setItem] = useState<T | null>(null)
	const [open, setOpen] = useState(false)

	return {
		item,
		open,
		openDrawer(i: T) {
			setItem(i)
			setOpen(true)
		},
		closeDrawer() {
			setOpen(false)
		},
	}
}
