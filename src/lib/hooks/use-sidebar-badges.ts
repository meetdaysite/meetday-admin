import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { getPendingHosts } from "@/lib/api/hosts"
// Events nav is commented out in the sidebar — badge queries below are commented out too.
// import { getPendingEvents, getPendingRevisions } from "@/lib/api/events"
import { getPendingSponsorships, getPendingSponsorshipRevisions } from "@/lib/api/sponsorships"
import { getPendingCampaigns } from "@/lib/api/campaigns"
import { getPendingCommunityProfiles, getPendingCommunityProfileRevisions } from "@/lib/api/community-profiles"
import { getPendingBrands } from "@/lib/api/brands"
import { getSupportTickets } from "@/lib/api/support-tickets"
import { getPendingSponsorshipChatsCount, getSponsorshipChats } from "@/lib/api/sponsorship-chats"
import { getMeetdayChatUnreadCount } from "@/lib/api/meetday-chats"
import { getSponsorshipDeals, getCampaignDeals } from "@/lib/api/sponsorship-deals"
import { getSponsorshipDealPayments } from "@/lib/api/sponsorship-payments"
import { playMessageChime } from "@/lib/notificationSound"
import { usePermission } from "@/lib/hooks/use-permission"

const REFETCH_INTERVAL = 60_000
const FAST_REFETCH_INTERVAL = 8_000

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
	| "campaignQueue"
	| "pendingChats"
	| "ongoingChats"
	| "chatRequests"
	| "meetdayChats"
	| "sponsorshipDeals"
	| "campaignDeals"
	| "sponsorshipPayments"

function getLastSeenTimestamp(key: string): number {
	if (typeof window === "undefined") return 0
	const stored = localStorage.getItem(key)
	if (!stored) {
		// If never set before, seed with current time so past deals aren't treated as new unread
		const now = Date.now()
		localStorage.setItem(key, String(now))
		return now
	}
	return Number(stored) || 0
}

function setLastSeenTimestamp(key: string) {
	if (typeof window === "undefined") return
	localStorage.setItem(key, String(Date.now()))
}

export function useSidebarBadgeCounts(): Partial<Record<SidebarBadgeKey, number>> {
	const pathname = usePathname()
	const queryClient = useQueryClient()

	const canSeeHostQueue = usePermission("host.approve")
	const canSeeSupportTickets = usePermission("support.view")

	// Reset badge for deals & payments as soon as the admin opens the respective tab
	useEffect(() => {
		if (pathname === "/sponsorship-deals") {
			setLastSeenTimestamp("meetday_seen_sponsorship_deals")
			queryClient.invalidateQueries({ queryKey: ["sidebar-badge", "sponsorship-deals"] })
		} else if (pathname === "/campaign-deals") {
			setLastSeenTimestamp("meetday_seen_campaign_deals")
			queryClient.invalidateQueries({ queryKey: ["sidebar-badge", "campaign-deals"] })
		} else if (pathname === "/sponsorship-payments") {
			setLastSeenTimestamp("meetday_seen_sponsorship_payments")
			queryClient.invalidateQueries({ queryKey: ["sidebar-badge", "sponsorship-payments"] })
		}
	}, [pathname, queryClient])

	const hostQueue = useQuery({
		queryKey: ["sidebar-badge", "host-queue"],
		queryFn: () => getPendingHosts({ limit: 1 }).then((r) => r.total),
		enabled: canSeeHostQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const supportTickets = useQuery({
		queryKey: ["sidebar-badge", "support-tickets"],
		queryFn: () => getSupportTickets({ status: "OPEN", limit: 1 }).then((r) => r.total),
		enabled: canSeeSupportTickets,
		refetchInterval: REFETCH_INTERVAL,
	})

	const canSeeSponsorshipQueue = usePermission("sponsorship.approve")
	const sponsorshipQueue = useQuery({
		queryKey: ["sidebar-badge", "sponsorship-queue"],
		queryFn: () => getPendingSponsorships({ limit: 1 }).then((r) => r.total),
		enabled: canSeeSponsorshipQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const sponsorshipRevisions = useQuery({
		queryKey: ["sidebar-badge", "sponsorship-revisions"],
		queryFn: () => getPendingSponsorshipRevisions({ limit: 1 }).then((r) => r.total),
		enabled: canSeeSponsorshipQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const canSeeCommunityProfileQueue = usePermission("communityProfile.approve")
	const communityProfileQueue = useQuery({
		queryKey: ["sidebar-badge", "community-profile-queue"],
		queryFn: () => getPendingCommunityProfiles({ limit: 1 }).then((r) => r.total),
		enabled: canSeeCommunityProfileQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const communityProfileRevisions = useQuery({
		queryKey: ["sidebar-badge", "community-profile-revisions"],
		queryFn: () => getPendingCommunityProfileRevisions({ limit: 1 }).then((r) => r.total),
		enabled: canSeeCommunityProfileQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const canSeeBrandQueue = usePermission("sponsorship.approve")
	const brandQueue = useQuery({
		queryKey: ["sidebar-badge", "brand-queue"],
		queryFn: () => getPendingBrands({ limit: 1 }).then((r) => r.total),
		enabled: canSeeBrandQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const campaignQueue = useQuery({
		queryKey: ["sidebar-badge", "campaign-queue"],
		queryFn: () => getPendingCampaigns({ limit: 1 }).then((r) => r.total),
		enabled: canSeeBrandQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	// Ongoing chats unread count — tracks unread messages in accepted chats
	const ongoingChats = useQuery({
		queryKey: ["sidebar-badge", "ongoing-chats-unread"],
		queryFn: () =>
			getSponsorshipChats("ACCEPTED")
				.then((threads) => threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0))
				.catch(() => 0),
		refetchInterval: FAST_REFETCH_INTERVAL,
	})

	// Chat Requests pending count — tracks requests awaiting acceptance
	const chatRequests = useQuery({
		queryKey: ["sidebar-badge", "chat-requests"],
		queryFn: () => getPendingSponsorshipChatsCount(),
		refetchInterval: FAST_REFETCH_INTERVAL,
	})

	// Meetday support chats unread count
	const meetdayChats = useQuery({
		queryKey: ["sidebar-badge", "meetday-chats"],
		queryFn: () => getMeetdayChatUnreadCount(),
		refetchInterval: FAST_REFETCH_INTERVAL,
	})

	// Sponsorship Deals: counts locked deals newer than the last time the admin visited the tab
	const sponsorshipDeals = useQuery({
		queryKey: ["sidebar-badge", "sponsorship-deals"],
		queryFn: async () => {
			if (pathname === "/sponsorship-deals") return 0
			const lastSeen = getLastSeenTimestamp("meetday_seen_sponsorship_deals")
			const deals = await getSponsorshipDeals("APPROVED")
			const unread = deals.filter((d) => {
				const dealTime = new Date(d.approvedAt || d.updatedAt || d.createdAt).getTime()
				return dealTime > lastSeen
			})
			return unread.length
		},
		refetchInterval: FAST_REFETCH_INTERVAL,
	})

	// Campaign Deals: counts locked campaign deals newer than the last time the admin visited the tab
	const campaignDeals = useQuery({
		queryKey: ["sidebar-badge", "campaign-deals"],
		queryFn: async () => {
			if (pathname === "/campaign-deals") return 0
			const lastSeen = getLastSeenTimestamp("meetday_seen_campaign_deals")
			const deals = await getCampaignDeals("APPROVED")
			const unread = deals.filter((d) => {
				const dealTime = new Date(d.approvedAt || d.updatedAt || d.createdAt).getTime()
				return dealTime > lastSeen
			})
			return unread.length
		},
		refetchInterval: FAST_REFETCH_INTERVAL,
	})

	// Payments: counts completed payments newer than the last time the admin visited the tab
	const sponsorshipPayments = useQuery({
		queryKey: ["sidebar-badge", "sponsorship-payments"],
		queryFn: async () => {
			if (pathname === "/sponsorship-payments") return 0
			const lastSeen = getLastSeenTimestamp("meetday_seen_sponsorship_payments")
			const payments = await getSponsorshipDealPayments()
			const unread = payments.filter((d) => {
				if (d.paymentStatus !== "PAID") return false
				const paidTime = new Date(d.paidAt || d.approvedAt || 0).getTime()
				return paidTime > lastSeen
			})
			return unread.length
		},
		refetchInterval: FAST_REFETCH_INTERVAL,
	})

	// Chime ONLY when NEW unread chat messages arrive (skip initial load, and only when count increases)
	const prevChatUnreadRef = useRef<number | null>(null)
	useEffect(() => {
		if (ongoingChats.data === undefined && meetdayChats.data === undefined) return
		const totalUnread = (ongoingChats.data ?? 0) + (meetdayChats.data ?? 0)

		if (prevChatUnreadRef.current === null) {
			prevChatUnreadRef.current = totalUnread
			return
		}

		if (totalUnread > prevChatUnreadRef.current) {
			playMessageChime()
		}
		prevChatUnreadRef.current = totalUnread
	}, [ongoingChats.data, meetdayChats.data])

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
		campaignQueue: campaignQueue.data,
		pendingChats: chatRequests.data,
		ongoingChats: ongoingChats.data,
		chatRequests: chatRequests.data,
		meetdayChats: meetdayChats.data,
		sponsorshipDeals: sponsorshipDeals.data,
		campaignDeals: campaignDeals.data,
		sponsorshipPayments: sponsorshipPayments.data,
	}
}
