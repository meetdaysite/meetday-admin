"use client"

import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { DataView } from "@/components/ui/data-view"
import { TwoLineCell } from "@/components/ui/table-cells"
import { getSponsorshipInterests } from "@/lib/api/sponsorships"
import { formatDate } from "@/lib/formatters"
import { usePermission } from "@/lib/hooks/use-permission"
import type { SponsorshipInterest } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

export default function BrandInterestsPage() {
	const router = useRouter()
	const canView = usePermission("sponsorship.approve")

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [interests, setInterests] = useState<SponsorshipInterest[]>([])

	const fetchInterests = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await getSponsorshipInterests()
			setInterests(res.interests)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
			if (status === 403) {
				setError("You don't have permission to view brand interest.")
			} else {
				toast.error("Failed to load brand interest")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [router])

	useEffect(() => {
		fetchInterests()
	}, [fetchInterests])

	const columns = useMemo<ColumnDef<SponsorshipInterest>[]>(
		() => [
			{
				id: "brand",
				header: "Brand",
				cell: ({ row }) => (
					<TwoLineCell
						primary={row.original.brandProfile.brandName}
						secondary={row.original.brandProfile.user.email ?? row.original.brandProfile.user.phone ?? undefined}
					/>
				),
			},
			{
				id: "proposal",
				header: "Interested in",
				cell: ({ row }) => (
					<TwoLineCell
						primary={row.original.sponsorshipProposal.name ?? "—"}
						secondary={
							row.original.sponsorshipProposal.hostProfile.displayName ??
							`${row.original.sponsorshipProposal.hostProfile.user.firstName} ${row.original.sponsorshipProposal.hostProfile.user.lastName}`
						}
					/>
				),
			},
			{
				id: "date",
				header: "Marked interested",
				cell: ({ row }) => formatDate(row.original.createdAt),
			},
		],
		[],
	)

	if (!canView) return <PermissionGuard message="You don't have permission to view brand interest." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="Brand Interests"
				description="Brands that clicked 'I am Interested' on a sponsorship proposal."
			/>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={interests}
				emptyMessage="No brands have expressed interest yet."
			/>
		</div>
	)
}
