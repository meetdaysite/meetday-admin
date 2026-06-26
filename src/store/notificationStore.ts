import { create } from "zustand"
import type { Notification } from "@/types/notification"

type NotificationStore = {
	notifications: Notification[]
	unreadCount: number
	hasMore: boolean
	isLoading: boolean
	markRead: (id: string) => void
	markAllRead: () => void
	loadMore: () => void
	clearAll: () => void
}

export const useNotificationStore = create<NotificationStore>(() => ({
	notifications: [],
	unreadCount: 0,
	hasMore: false,
	isLoading: false,
	markRead: () => {},
	markAllRead: () => {},
	loadMore: () => {},
	clearAll: () => {},
}))
