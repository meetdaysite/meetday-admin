"use client"

import { CampaignReviewDrawer, type CampaignAction } from "@/components/campaigns/campaign-review-drawer"
import { DataView } from "@/components/ui/data-view"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { approveCampaign, getPendingCampaigns, rejectCampaign } from "@/lib/api/campaigns"
import { formatDate, getDaysSince } from "@/lib/formatters"
import { AgeDateCell, ChipCell, TwoLineCell } from "@/components/ui/table-cells"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Campaign } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

function getRowTint(campaign: Campaign): string {
	if (!campaign.createdAt) return ""
	const days = getDaysSince(campaign.createdAt)
	if (days <= 7) return ""
	if (days <= 21) return "border-l-4 border-amber-500"
	if (days <= 35) return "border-l-4 border-orange-500"
	return "border-l-4 border-red-500"
}

export default function CampaignQueuePage() {
	const router = useRouter()
	const canApprove = usePermission("sponsorship.approve")

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [campaigns, setCampaigns] = useState<Campaign[]>([])
	const [search, setSearch] = useState("")

	const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)

	const fetchCampaigns = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await getPendingCampaigns()
			setCampaigns(res.campaigns)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
			if (status === 403) {
				setError("You don't have permission to view the campaigns queue.")
			} else {
				toast.error("Failed to load campaigns")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [router])

	useEffect(() => {
		fetchCampaigns()
	}, [fetchCampaigns])

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return campaigns
		return campaigns.filter(
			c =>
				(c.name ?? "").toLowerCase().includes(q) ||
				c.brandProfile.brandName.toLowerCase().includes(q) ||
				c.brandProfile.user.email.toLowerCase().includes(q),
		)
	}, [campaigns, search])

	function openDrawer(campaign: Campaign) {
		setSelectedCampaign(campaign)
		setDrawerOpen(true)
	}

	async function handleAction(campaignId: string, action: CampaignAction, remark?: string) {
		try {
			if (action === "approve") await approveCampaign(campaignId)
			else if (action === "reject") await rejectCampaign(campaignId, remark!)

			const labels: Record<CampaignAction, string> = {
				approve: "Campaign brief approved",
				reject: "Campaign brief rejected",
			}
			toast.success(labels[action])
			fetchCampaigns()
		} catch (err: unknown) {
			const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
			const status = axiosErr?.response?.status
			if (status === 401) {
				router.replace("/login")
				throw err
			}
			if (status === 403) {
				toast.error("Permission denied", {
					description: `You don't have permission to ${action} campaigns.`,
				})
			} else if (status === 404) {
				toast.error("Campaign not found")
			} else if (status === 400) {
				const msg = axiosErr?.response?.data?.message
				toast.error(`Cannot ${action} campaign`, {
					description: msg ?? "Campaign is not in the required state.",
				})
			} else {
				toast.error(`Failed to ${action} campaign`, {
					description: "Something went wrong. Please try again.",
				})
			}
			throw err
		}
	}

	const columns = useMemo<ColumnDef<Campaign>[]>(
		() => [
			{
				id: "campaign",
				header: "Campaign",
				cell: ({ row }) => (
					<div className="min-w-[250px]">
						<TwoLineCell primary={row.original.name ?? "—"} secondary={row.original.brandProfile.brandName} />
					</div>
				),
			},
			{
				id: "goal",
				header: "Goal",
				cell: ({ row }) => <ChipCell>{row.original.goal ?? "—"}</ChipCell>,
			},
			{
				id: "budget",
				header: "Budget & Offer",
				cell: ({ row }) => (
					<span className="text-xs font-semibold text-neutral-800">
						{row.original.budgetCurrency} {Number(row.original.budgetAmount).toLocaleString()} ({row.original.offerType})
					</span>
				),
			},
			{
				id: "runDates",
				header: "Run Dates",
				cell: ({ row }) => (
					<span className="text-xs text-neutral-600">
						{formatDate(row.original.startDate)} - {formatDate(row.original.endDate)}
					</span>
				),
			},
			{
				id: "submitted",
				header: "Submitted",
				cell: ({ row }) => (
					<AgeDateCell iso={row.original.createdAt ?? undefined} getDaysSince={getDaysSince} format={formatDate} />
				),
			},
		],
		[],
	)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view the campaigns queue." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="Campaign Queue"
				description="Review and approve campaign briefs submitted by brands before they go live."
			/>

			<SearchInput
				value={search}
				onChange={setSearch}
				placeholder="Search by name or brand…"
				className="max-w-xs"
			/>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No campaigns pending review."
				onRowClick={openDrawer}
				getRowClassName={getRowTint}
			/>

			<CampaignReviewDrawer
				open={drawerOpen}
				onClose={() => {
					setDrawerOpen(false)
					setSelectedCampaign(null)
				}}
				campaign={selectedCampaign}
				onAction={handleAction}
			/>
		</div>
	)
}
