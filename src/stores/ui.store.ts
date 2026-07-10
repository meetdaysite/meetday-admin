import { create } from "zustand"

type UIState = {
	isGlobalLoading: boolean
	setGlobalLoading: (val: boolean) => void
	sidebarOpen: boolean
	setSidebarOpen: (val: boolean) => void
	sidebarCollapsed: boolean
	toggleSidebarCollapsed: () => void
}

export const useUIStore = create<UIState>(set => ({
	isGlobalLoading: false,
	setGlobalLoading: val => set({ isGlobalLoading: val }),
	sidebarOpen: false,
	setSidebarOpen: val => set({ sidebarOpen: val }),
	sidebarCollapsed: false,
	toggleSidebarCollapsed: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
