import { useQuery } from "@tanstack/react-query"
import { getPendingHosts } from "@/lib/api/hosts"
import { getPendingEvents, getPendingRevisions } from "@/lib/api/events"
import { getPendingSponsorships, getPendingSponsorshipRevisions } from "@/lib/api/sponsorships"
import { getPendingCommunityProfiles } from "@/lib/api/community-profiles"
import { getSupportTickets } from "@/lib/api/support-tickets"
import { usePermission } from "@/lib/hooks/use-permission"

const REFETCH_INTERVAL = 60_000

export type SidebarBadgeKey =
	| "hostQueue"
	| "eventQueue"
	| "revisions"
	| "supportTickets"
	| "sponsorshipQueue"
	| "sponsorshipRevisions"
	| "communityProfileQueue"

export function useSidebarBadgeCounts(): Partial<Record<SidebarBadgeKey, number>> {
	const canSeeHostQueue = usePermission("host.approve")
	const canSeeEventQueue = usePermission("event.approve")
	const canSeeRevisions = usePermission("event.revision.review")
	const canSeeSupportTickets = usePermission("support.view")

	const hostQueue = useQuery({
		queryKey: ["sidebar-badge", "host-queue"],
		queryFn: () => getPendingHosts({ limit: 1 }).then(r => r.total),
		enabled: canSeeHostQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const eventQueue = useQuery({
		queryKey: ["sidebar-badge", "event-queue"],
		queryFn: () => getPendingEvents().then(r => r.total),
		enabled: canSeeEventQueue,
		refetchInterval: REFETCH_INTERVAL,
	})

	const revisions = useQuery({
		queryKey: ["sidebar-badge", "revisions"],
		queryFn: () => getPendingRevisions({ limit: 1 }).then(r => r.total),
		enabled: canSeeRevisions,
		refetchInterval: REFETCH_INTERVAL,
	})

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

	return {
		hostQueue: hostQueue.data,
		eventQueue: eventQueue.data,
		revisions: revisions.data,
		supportTickets: supportTickets.data,
		sponsorshipQueue: sponsorshipQueue.data,
		sponsorshipRevisions: sponsorshipRevisions.data,
		communityProfileQueue: communityProfileQueue.data,
	}
}
