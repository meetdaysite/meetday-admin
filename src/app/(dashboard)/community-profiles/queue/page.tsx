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
import { approveCommunityProfile, getCommunityProfileById, getPendingCommunityProfiles, rejectCommunityProfile } from "@/lib/api/community-profiles"
import { formatDate, getDaysSince } from "@/lib/formatters"
import { AgeDateCell, ChipCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
import { usePermission } from "@/lib/hooks/use-permission"
import type { CommunityProfile, CommunityProfileDetail } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// Logo Cell Component to fetch detail image
function LogoCell({ id, name }: { id: string; name: string }) {
	const [logoUrl, setLogoUrl] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let active = true
		getCommunityProfileById(id)
			.then((data: CommunityProfileDetail) => {
				if (active && data.logoUrl) {
					setLogoUrl(data.logoUrl)
				}
			})
			.catch(() => {})
			.finally(() => {
				if (active) setLoading(false)
			})
		return () => {
			active = false
		}
	}, [id])

	if (loading) {
		return <div className="size-8 rounded-lg bg-neutral-100 animate-pulse border-2 border-black" />
	}

	return logoUrl ? (
		<img
			src={logoUrl}
			alt={name}
			className="size-8 rounded-lg object-cover border-2 border-black"
		/>
	) : (
		<div className="size-8 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-xs border-2 border-black text-neutral-700 select-none">
			{name.slice(0, 2).toUpperCase()}
		</div>
	)
}

function getRowTint(profile: CommunityProfile): string {
	const days = getDaysSince(profile.updatedAt)
	if (days <= 7) return ""
	if (days <= 21) return "border-l-4 border-amber-500"
	return "border-l-4 border-red-500 bg-red-50/10"
}

// Drawer Custom Hook
function useDrawer<T>() {
	const [item, setItem] = useState<T | null>(null)
	const open = item !== null
	const openDrawer = (val: T) => setItem(val)
	const closeDrawer = () => setItem(null)
	return { item, open, openDrawer, closeDrawer }
}

const PAGE_LIMIT = 20

// Component

export default function AllCommunityProfilesQueuePage() {
	const router = useRouter()
	const canApprove = usePermission("communityProfile.approve")

	const [page, setPage] = useState(1)
	const [search, setSearch] = useState("")
	const { item: selectedProfile, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<CommunityProfile>()

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [profiles, setProfiles] = useState<CommunityProfile[]>([])
	const [editingProfile, setEditingProfile] = useState<CommunityProfileDetail | null>(null)

	const fetchProfiles = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await getPendingCommunityProfiles({ page, limit: PAGE_LIMIT })
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
	}, [router, page])

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

	async function handleAction(profileId: string, action: CommunityProfileAction, message?: string) {
		try {
			if (action === "approve") {
				await approveCommunityProfile(profileId)
				toast.success("Community profile approved and published")
			} else {
				await rejectCommunityProfile(profileId, message!)
				toast.success("Community profile rejected")
			}
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
			} else {
				const msg = axiosErr?.response?.data?.message
				toast.error(`Failed to ${action} community profile`, {
					description: msg ?? "Something went wrong. Please try again.",
				})
			}
			throw err
		}
	}

	const columns = useMemo<ColumnDef<CommunityProfile>[]>(
		() => [
			{
				id: "logo",
				header: "Logo",
				cell: ({ row }) => <LogoCell id={row.original.id} name={row.original.name} />,
			},
			{
				id: "name",
				header: "Name",
				cell: ({ row }) => (
					<div className="min-w-[250px]">
						<TwoLineCell primary={row.original.name} secondary={row.original.hostProfile.displayName ?? undefined} />
					</div>
				),
			},
			{
				id: "size",
				header: "Size",
				cell: ({ row }) => <ChipCell>{row.original.size} members</ChipCell>,
			},
			{
				id: "cities",
				header: "Cities",
				cell: ({ row }) => {
					const cities = row.original.hostProfile.operatingCities
					if (cities.length <= 3) {
						return cities.join(", ") || "—"
					}
					return `${cities.slice(0, 3).join(", ")} +${cities.length - 3}`
				},
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
				onClose={closeDrawer}
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
