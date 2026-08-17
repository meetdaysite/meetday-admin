"use client"

import {
	CommunityProfileReviewDrawer,
	type CommunityProfileAction,
} from "@/components/community-profiles/community-profile-review-drawer"
import { CreateCommunityProfileDrawer } from "@/components/community-profiles/create-community-profile-drawer"
import { DataView } from "@/components/ui/data-view"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { approveCommunityProfile, getPendingCommunityProfiles, rejectCommunityProfile } from "@/lib/api/community-profiles"
import { formatDate, getDaysSince } from "@/lib/formatters"
import { AgeDateCell, ChipCell, TwoLineCell } from "@/components/ui/table-cells"
import { usePermission } from "@/lib/hooks/use-permission"
import type { CommunityProfile, CommunityProfileDetail } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

function getRowTint(profile: CommunityProfile): string {
	const days = getDaysSince(profile.updatedAt)
	if (days <= 7) return ""
	if (days <= 21) return "border-l-4 border-amber-500"
	if (days <= 35) return "border-l-4 border-orange-500"
	return "border-l-4 border-red-500"
}

export default function CommunityProfileQueuePage() {
	const router = useRouter()
	const canApprove = usePermission("communityProfile.approve")

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [profiles, setProfiles] = useState<CommunityProfile[]>([])
	const [search, setSearch] = useState("")

	const [selectedProfile, setSelectedProfile] = useState<CommunityProfile | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)
	const [editingProfile, setEditingProfile] = useState<CommunityProfileDetail | null>(null)

	const fetchProfiles = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await getPendingCommunityProfiles()
			setProfiles(res.profiles)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
			if (status === 403) {
				setError("You don't have permission to view the community profile queue.")
			} else {
				toast.error("Failed to load community profiles")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [router])

	useEffect(() => {
		fetchProfiles()
	}, [fetchProfiles])

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return profiles
		return profiles.filter(
			p =>
				p.name.toLowerCase().includes(q) ||
				(p.hostProfile.displayName ?? "").toLowerCase().includes(q) ||
				(p.hostProfile.user.email ?? "").toLowerCase().includes(q),
		)
	}, [profiles, search])

	function openDrawer(profile: CommunityProfile) {
		setSelectedProfile(profile)
		setDrawerOpen(true)
	}

	async function handleAction(profileId: string, action: CommunityProfileAction, message?: string) {
		try {
			if (action === "approve") await approveCommunityProfile(profileId)
			else if (action === "reject") await rejectCommunityProfile(profileId, message!)

			const labels: Record<CommunityProfileAction, string> = {
				approve: "Community profile approved",
				reject: "Community profile rejected",
			}
			toast.success(labels[action])
			fetchProfiles()
		} catch (err: unknown) {
			const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
			const status = axiosErr?.response?.status
			if (status === 401) {
				router.replace("/login")
				throw err
			}
			if (status === 403) {
				toast.error("Permission denied", {
					description: `You don't have permission to ${action} community profiles.`,
				})
			} else if (status === 404) {
				toast.error("Community profile not found")
			} else if (status === 400) {
				const msg = axiosErr?.response?.data?.message
				toast.error(`Cannot ${action} community profile`, {
					description: msg ?? "Profile is not in the required state.",
				})
			} else {
				toast.error(`Failed to ${action} community profile`, {
					description: "Something went wrong. Please try again.",
				})
			}
			throw err
		}
	}

	const columns = useMemo<ColumnDef<CommunityProfile>[]>(
		() => [
			{
				id: "profile",
				header: "Community",
				cell: ({ row }) => (
					<TwoLineCell primary={row.original.name} secondary={row.original.hostProfile.displayName ?? undefined} />
				),
			},
			{
				id: "size",
				header: "Size",
				cell: ({ row }) => <ChipCell>{row.original.size} members</ChipCell>,
			},
			{
				id: "categories",
				header: "Categories",
				cell: ({ row }) => row.original.categories.map(c => c.name).join(", ") || "—",
			},
			{
				id: "cities",
				header: "Operating cities",
				cell: ({ row }) => row.original.hostProfile.operatingCities.join(", ") || "—",
			},
			{
				id: "submitted",
				header: "Submitted",
				cell: ({ row }) => (
					<AgeDateCell iso={row.original.updatedAt} getDaysSince={getDaysSince} format={formatDate} />
				),
			},
		],
		[],
	)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view the community profile queue." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="Community Profile Queue"
				description="Review and approve community profiles submitted by hosts before they're shown to brands."
			/>

			<SearchInput
				value={search}
				onChange={setSearch}
				placeholder="Search by name or host…"
				className="max-w-xs"
			/>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No community profiles pending review."
				onRowClick={openDrawer}
				getRowClassName={getRowTint}
			/>

			<CommunityProfileReviewDrawer
				open={drawerOpen}
				onClose={() => {
					setDrawerOpen(false)
					setSelectedProfile(null)
				}}
				profile={selectedProfile}
				onAction={handleAction}
				onEdit={setEditingProfile}
			/>

			<CreateCommunityProfileDrawer
				open={!!editingProfile}
				editingProfile={editingProfile}
				onClose={() => setEditingProfile(null)}
				onCreated={() => setEditingProfile(null)}
				onUpdated={() => {
					setEditingProfile(null)
					fetchProfiles()
				}}
			/>
		</div>
	)
}
