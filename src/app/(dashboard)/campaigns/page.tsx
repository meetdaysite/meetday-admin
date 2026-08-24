"use client"

import { CampaignReviewDrawer, type CampaignAction } from "@/components/campaigns/campaign-review-drawer"
import { ClearableInput } from "@/components/ui/clearable-input"
import { DataView } from "@/components/ui/data-view"
import { FilterSelect } from "@/components/ui/filter-select"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { AgeDateCell, ChipCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
import {
	approveCampaign,
	getCampaigns,
	rejectCampaign,
	type GetCampaignsParams,
} from "@/lib/api/campaigns"
import { formatDate, getDaysSince } from "@/lib/formatters"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Campaign, CampaignStatus } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

const PAGE_LIMIT = 20

type StatusFilter = CampaignStatus | "ALL"

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Under Review", value: "UNDER_REVIEW" },
	{ label: "Published", value: "PUBLISHED" },
	{ label: "Draft", value: "DRAFT" },
	{ label: "Rejected", value: "REJECTED" },
]

export default function CampaignsPage() {
	const router = useRouter()
	const canApprove = usePermission("sponsorship.approve")

	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [cityInput, setCityInput] = useState("")
	const [cityFilter, setCityFilter] = useState("")
	const [search, setSearch] = useState("")

	const { item: selectedCampaign, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<Campaign>()

	const fetcher = useCallback(() => {
		const params: GetCampaignsParams = { page, limit: PAGE_LIMIT }
		if (statusFilter !== "ALL") params.status = statusFilter
		if (cityFilter) params.city = cityFilter
		return getCampaigns(params).then(r => ({ items: r.campaigns, total: r.total }))
	}, [page, statusFilter, cityFilter])

	const {
		items: campaigns,
		total,
		isLoading,
		error,
		refresh: fetchCampaigns,
	} = usePaginatedFetch(fetcher, "Failed to load campaigns")

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

	function handleCitySearch(e: React.FormEvent) {
		e.preventDefault()
		setPage(1)
		setCityFilter(cityInput.trim())
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
				id: "status",
				header: "Status",
				cell: ({ row }) => <StatusCell status={row.original.status} />,
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
				id: "created",
				header: "Created At",
				cell: ({ row }) => (
					<AgeDateCell iso={row.original.createdAt ?? undefined} getDaysSince={getDaysSince} format={formatDate} />
				),
			},
		],
		[],
	)

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view campaigns." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="All Campaigns"
				description="Browse and manage all campaign briefs submitted by brands."
			/>

			{/* Filters */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap items-center gap-3">
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search campaigns…"
						className="max-w-xs"
					/>
					<form onSubmit={handleCitySearch}>
						<ClearableInput
							value={cityInput}
							onChange={setCityInput}
							placeholder="Search by city…"
							showClear={!!cityFilter}
							onClear={() => {
								setCityInput("")
								setCityFilter("")
								setPage(1)
							}}
						/>
					</form>
				</div>
				<FilterSelect
					options={STATUS_TABS}
					value={statusFilter}
					onChange={val => {
						setPage(1)
						setStatusFilter(val)
					}}
				/>
			</div>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No campaigns found matching current filters."
				onRowClick={openDrawer}
				pagination={{
					page,
					totalPages,
					total,
					pageSize: PAGE_LIMIT,
					onPageChange: setPage,
				}}
			/>

			<CampaignReviewDrawer
				open={drawerOpen}
				onClose={closeDrawer}
				campaign={selectedCampaign}
				onAction={handleAction}
			/>
		</div>
	)
}
