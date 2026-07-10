import { create } from "zustand"
import { persist } from "zustand/middleware"

type HostQueueFilters = {
	city: string[]
	status: string[]
	dateRange: { from: string | null; to: string | null }
}

type FilterState = {
	hostQueue: HostQueueFilters
	eventQueue: HostQueueFilters
	setHostQueueFilters: (filters: Partial<HostQueueFilters>) => void
	setEventQueueFilters: (filters: Partial<HostQueueFilters>) => void
	resetHostQueueFilters: () => void
	resetEventQueueFilters: () => void
}

const defaultFilters: HostQueueFilters = {
	city: [],
	status: [],
	dateRange: { from: null, to: null },
}

export const useFilterStore = create<FilterState>()(
	persist(
		set => ({
			hostQueue: defaultFilters,
			eventQueue: defaultFilters,
			setHostQueueFilters: filters => set(s => ({ hostQueue: { ...s.hostQueue, ...filters } })),
			setEventQueueFilters: filters => set(s => ({ eventQueue: { ...s.eventQueue, ...filters } })),
			resetHostQueueFilters: () => set({ hostQueue: defaultFilters }),
			resetEventQueueFilters: () => set({ eventQueue: defaultFilters }),
		}),
		{
			name: "meetday-filters",
			storage: {
				getItem: key => {
					const val = sessionStorage.getItem(key)
					return val ? JSON.parse(val) : null
				},
				setItem: (key, val) => sessionStorage.setItem(key, JSON.stringify(val)),
				removeItem: key => sessionStorage.removeItem(key),
			},
		},
	),
)
