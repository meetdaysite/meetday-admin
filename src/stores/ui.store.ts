import { create } from "zustand"

type UIState = {
	isGlobalLoading: boolean
	setGlobalLoading: (val: boolean) => void
}

export const useUIStore = create<UIState>(set => ({
	isGlobalLoading: false,
	setGlobalLoading: val => set({ isGlobalLoading: val }),
}))
