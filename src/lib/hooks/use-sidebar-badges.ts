import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { getPendingHosts } from "@/lib/api/hosts"
// Events nav is commented out in the sidebar — badge queries below are commented out too.
// import { getPendingEvents, getPendingRevisions } from "@/lib/api/events"
import { getPendingSponsorships, getPendingSponsorshipRevisions } from "@/lib/api/sponsorships"
import { getPendingCommunityProfiles, getPendingCommunityProfileRevisions } from "@/lib/api/community-profiles"
import { getPendingBrands } from "@/lib/api/brands"
import { getSupportTickets } from "@/lib/api/support-tickets"
import { getPendingSponsorshipChatsCount } from "@/lib/api/sponsorship-chats"
import { getMeetdayChatUnreadCount } from "@/lib/api/meetday-chats"
import { playMessageChime } from "@/lib/notificationSound"
import { usePermission } from "@/lib/hooks/use-permission"

const REFETCH_INTERVAL = 60_000
// Chats deserve a snappier poll than the approval queues, since a chime should feel roughly live.
const CHAT_REFETCH_INTERVAL = 15_000

export type SidebarBadgeKey =
	| "hostQueue"
	| "eventQueue"
	| "revisions"
	| "supportTickets"
	| "sponsorshipQueue"
	| "sponsorshipRevisions"
	| "communityProfileQueue"
	| "communityProfileRevisions"
	| "brandQueue"
	| "pendingChats"
	| "meetdayChats"

export function useSidebarBadgeCounts(): Partial<Record<SidebarBadgeKey, number>> {
	const canSeeHostQueue = usePermission("host.approve")
	// Events nav is commented out in the sidebar — no badge needed for it.
	// const canSeeEventQueue = usePermission("event.approve")
	// const canSeeRevisions = usePermission("event.revision.review")
	const canSeeSupportTickets = usePermission("support.view")

	const hostQueue = useQuery({
		queryKey: ["sidebar-badge", "host-queue"],
		queryFn: () => getPendingHosts({ limit: 1 }).then(r => r.total),
		enabled: canSeeHostQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	// const eventQueue = useQuery({
	// 	queryKey: ["sidebar-badge", "event-queue"],
	// 	queryFn: () => getPendingEvents().then(r => r.total),
	// 	enabled: canSeeEventQueue,
	// 	refetchInterval: REFETCH_INTERVAL,
	// })

	// const revisions = useQuery({
	// 	queryKey: ["sidebar-badge", "revisions"],
	// 	queryFn: () => getPendingRevisions({ limit: 1 }).then(r => r.total),
	// 	enabled: canSeeRevisions,
	// 	refetchInterval: REFETCH_INTERVAL,
	// })

	const supportTickets = useQuery({
		queryKey: ["sidebar-badge", "support-tickets"],
		queryFn: () => getSupportTickets({ status: "OPEN", limit: 1 }).then(r => r.total),
		enabled: canSeeSupportTickets,
		refetchInterval: REFETCH_INTERVAL,
	})

	const canSeeSponsorshipQueue = usePermission("sponsorship.approve")
	const sponsorshipQueue = useQuery({
		queryKey: ["sidebar-badge", "sponsorship-queue"],
		queryFn: () => getPendingSponsorships({ limit: 1 }).then(r => r.total),
		enabled: canSeeSponsorshipQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const sponsorshipRevisions = useQuery({
		queryKey: ["sidebar-badge", "sponsorship-revisions"],
		queryFn: () => getPendingSponsorshipRevisions({ limit: 1 }).then(r => r.total),
		enabled: canSeeSponsorshipQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const canSeeCommunityProfileQueue = usePermission("communityProfile.approve")
	const communityProfileQueue = useQuery({
		queryKey: ["sidebar-badge", "community-profile-queue"],
		queryFn: () => getPendingCommunityProfiles({ limit: 1 }).then(r => r.total),
		enabled: canSeeCommunityProfileQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const communityProfileRevisions = useQuery({
		queryKey: ["sidebar-badge", "community-profile-revisions"],
		queryFn: () => getPendingCommunityProfileRevisions({ limit: 1 }).then(r => r.total),
		enabled: canSeeCommunityProfileQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const canSeeBrandQueue = usePermission("sponsorship.approve")
	const brandQueue = useQuery({
		queryKey: ["sidebar-badge", "brand-queue"],
		queryFn: () => getPendingBrands({ limit: 1 }).then(r => r.total),
		enabled: canSeeBrandQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const pendingChats = useQuery({
		queryKey: ["sidebar-badge", "pending-chats"],
		queryFn: () => getPendingSponsorshipChatsCount(),
		refetchInterval: CHAT_REFETCH_INTERVAL,
	})

	const meetdayChats = useQuery({
		queryKey: ["sidebar-badge", "meetday-chats"],
		queryFn: () => getMeetdayChatUnreadCount(),
		refetchInterval: CHAT_REFETCH_INTERVAL,
	})

	// Chime when either chat badge count goes up — skip the very first load so opening the
	// admin panel with existing unread chats doesn't immediately play a sound.
	const prevChatUnreadRef = useRef<number | null>(null)
	useEffect(() => {
		if (pendingChats.data === undefined && meetdayChats.data === undefined) return
		const total = (pendingChats.data ?? 0) + (meetdayChats.data ?? 0)
		if (prevChatUnreadRef.current !== null && total > prevChatUnreadRef.current) {
			playMessageChime()
		}
		prevChatUnreadRef.current = total
	}, [pendingChats.data, meetdayChats.data])

	return {
		hostQueue: hostQueue.data,
		// eventQueue: eventQueue.data,
		// revisions: revisions.data,
		supportTickets: supportTickets.data,
		sponsorshipQueue: sponsorshipQueue.data,
		sponsorshipRevisions: sponsorshipRevisions.data,
		communityProfileQueue: communityProfileQueue.data,
		communityProfileRevisions: communityProfileRevisions.data,
		brandQueue: brandQueue.data,
		pendingChats: pendingChats.data,
		meetdayChats: meetdayChats.data,
	}
}
