"use client"

import { HostReviewDrawer, type HostAction } from "@/components/hosts/host-review-drawer"
import { InviteBulkDrawer } from "@/components/hosts/invite-bulk-drawer"
import { InviteSingleDrawer } from "@/components/hosts/invite-single-drawer"
import { ClearableInput } from "@/components/ui/clearable-input"
import { DataView } from "@/components/ui/data-view"
import { FilterSelect } from "@/components/ui/filter-select"
import { ChipCell, DateCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { approveHost, getHosts, rejectHost, suspendHost, restoreHost } from "@/lib/api/hosts"
import { formatDate } from "@/lib/formatters"
import { useDrawer } from "@/lib/hooks/use-drawer"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { ApprovalStatus, Host, HostPlan, KycStatus } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Upload, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

// Constants

const PAGE_LIMIT = 20

type ApprovalFilter = ApprovalStatus | "ALL"
type KycFilter = KycStatus | "ALL"
type PlanFilter = HostPlan | "ALL"

const STATUS_TABS: { label: string; value: ApprovalFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Pending", value: "PENDING" },
	{ label: "Approved", value: "APPROVED" },
	{ label: "Rejected", value: "REJECTED" },
	{ label: "Suspended", value: "SUSPENDED" },
]

const KYC_FILTER_OPTIONS: { label: string; value: KycFilter }[] = [
	{ label: "All KYC", value: "ALL" },
	{ label: "Not submitted", value: "NOT_SUBMITTED" },
	{ label: "Pending", value: "PENDING" },
	{ label: "Verified", value: "VERIFIED" },
	{ label: "Failed", value: "FAILED" },
]

const PLAN_FILTER_OPTIONS: { label: string; value: PlanFilter }[] = [
	{ label: "All plans", value: "ALL" },
	{ label: "Discover", value: "DISCOVER" },
	{ label: "Sell", value: "SELL" },
	{ label: "Community", value: "COMMUNITY" },
]

// Page

export default function HostsPage() {
	const router = useRouter()
	const canApprove = usePermission("host.approve")
	const canInvite = usePermission("host.invite")

	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<ApprovalFilter>("ALL")
	const [kycFilter, setKycFilter] = useState<KycFilter>("ALL")
	const [planFilter, setPlanFilter] = useState<PlanFilter>("ALL")
	const [cityInput, setCityInput] = useState("")
	const [cityFilter, setCityFilter] = useState("")
	const [search, setSearch] = useState("")

	const [singleOpen, setSingleOpen] = useState(false)
	const [bulkOpen, setBulkOpen] = useState(false)

	const { item: selectedHost, open: drawerOpen, openDrawer, closeDrawer } = useDrawer<Host>()

	const fetcher = useCallback(
		() =>
			getHosts({
				page,
				limit: PAGE_LIMIT,
				...(statusFilter !== "ALL" && { approvalStatus: statusFilter }),
				...(kycFilter !== "ALL" && { kycStatus: kycFilter }),
				...(planFilter !== "ALL" && { plan: planFilter }),
				...(cityFilter && { city: cityFilter }),
			}).then(r => ({ items: r.hosts, total: r.total })),
		[page, statusFilter, kycFilter, planFilter, cityFilter],
	)

	const {
		items: hosts,
		total,
		isLoading,
		error,
		refresh: fetchHosts,
	} = usePaginatedFetch(fetcher, "Failed to load hosts")

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return hosts
		return hosts.filter(
			h =>
				h.displayName.toLowerCase().includes(q) ||
				(h.user.email ?? "").toLowerCase().includes(q) ||
				`${h.user.firstName} ${h.user.lastName}`.toLowerCase().includes(q),
		)
	}, [hosts, search])

	async function handleAction(hostId: string, action: HostAction, reason?: string) {
		try {
			if (action === "approve") await approveHost(hostId)
			else if (action === "reject") await rejectHost(hostId, reason!)
			else if (action === "suspend") await suspendHost(hostId, reason!)
			else if (action === "restore") await restoreHost(hostId)

			const labels: Record<HostAction, string> = {
				approve: "Host approved",
				reject: "Host rejected",
				suspend: "Host suspended",
				restore: "Host restored",
			}
			toast.success(labels[action])
			fetchHosts()
		} catch (err: unknown) {
			const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
			const status = axiosErr?.response?.status
			if (status === 401) {
				router.replace("/login")
				throw err
			}
			if (status === 403) {
				toast.error("Permission denied", {
					description: `You don't have permission to ${action} hosts.`,
				})
			} else if (status === 404) {
				toast.error("Host not found")
			} else if (status === 400) {
				const msg = axiosErr?.response?.data?.message
				toast.error(`Cannot ${action} host`, {
					description: msg ?? "Host is not in the required state.",
				})
			} else {
				toast.error(`Failed to ${action} host`, {
					description: "Something went wrong. Please try again.",
				})
			}
			throw err
		}
	}

	const columns = useMemo<ColumnDef<Host>[]>(
		() => [
			{
				id: "host",
				header: "Host",
				cell: ({ row }) => {
					const h = row.original
					return (
						<TwoLineCell
							primary={h.displayName}
							secondary={`${h.user.firstName} ${h.user.lastName} · ${h.user.email}`}
						/>
					)
				},
			},
			{
				id: "type",
				header: "Type",
				cell: ({ row }) => <ChipCell>{row.original.hostType}</ChipCell>,
			},
			{
				id: "cities",
				header: "Cities",
				cell: ({ row }) => {
					const cities = row.original.operatingCities
					if (!cities?.length) return <span className="text-[11px] text-text-tertiary">—</span>
					return (
						<span className="text-xs text-text-primary">
							{cities.slice(0, 2).join(", ")}
							{cities.length > 2 && (
								<span className="text-text-tertiary"> +{cities.length - 2}</span>
							)}
						</span>
					)
				},
			},
			{
				id: "plan",
				header: "Plan",
				cell: ({ row }) => <ChipCell>{row.original.currentPlan}</ChipCell>,
			},
			{
				id: "kycStatus",
				header: "KYC",
				cell: ({ row }) => <StatusCell status={row.original.kycStatus} />,
			},
			{
				id: "approvalStatus",
				header: "Status",
				cell: ({ row }) => <StatusCell status={row.original.approvalStatus} />,
			},
			{
				id: "joined",
				header: "Joined",
				cell: ({ row }) => <DateCell value={row.original.createdAt} format={formatDate} secondary />,
			},
		],
		[],
	)

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view hosts." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader
				title="All Hosts"
				description="View and manage all hosts on the platform."
				buttons={
					canInvite && (
						<>
							<Button
								variant="secondary"
								leftIcon={<UserPlus size={13} />}
								onClick={() => setSingleOpen(true)}
							>
								Invite Host
							</Button>
							<Button
								variant="primary"
								leftIcon={<Upload size={13} />}
								onClick={() => setBulkOpen(true)}
							>
								Bulk Upload
							</Button>
						</>
					)
				}
			/>

			{/* Filters */}
			<div className="flex items-center gap-2 flex-wrap">
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search by name or email…"
					className="flex-1 min-w-48 max-w-xs"
				/>

				<FilterSelect
					value={statusFilter}
					onChange={v => {
						setStatusFilter(v as ApprovalFilter)
						setPage(1)
					}}
					options={STATUS_TABS}
				/>

				<FilterSelect
					value={kycFilter}
					onChange={v => {
						setKycFilter(v as KycFilter)
						setPage(1)
					}}
					options={KYC_FILTER_OPTIONS}
				/>

				<FilterSelect
					value={planFilter}
					onChange={v => {
						setPlanFilter(v as PlanFilter)
						setPage(1)
					}}
					options={PLAN_FILTER_OPTIONS}
				/>

				<form onSubmit={e => { e.preventDefault(); setPage(1); setCityFilter(cityInput.trim()) }}>
					<ClearableInput
						value={cityInput}
						onChange={setCityInput}
						showClear={!!cityFilter}
						onClear={() => {
							setCityInput("")
							setCityFilter("")
							setPage(1)
						}}
						placeholder="Filter by city…"
					/>
				</form>
			</div>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No hosts match the current filters."
				onRowClick={canApprove ? openDrawer : undefined}
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>

			<HostReviewDrawer
				open={drawerOpen}
				onClose={closeDrawer}
				host={selectedHost}
				onAction={handleAction}
			/>

			<InviteSingleDrawer
				open={singleOpen}
				onClose={() => setSingleOpen(false)}
				onOpenBulk={() => {
					setSingleOpen(false)
					setBulkOpen(true)
				}}
			/>
			<InviteBulkDrawer
				open={bulkOpen}
				onClose={() => setBulkOpen(false)}
				onOpenSingle={() => {
					setBulkOpen(false)
					setSingleOpen(true)
				}}
			/>
		</div>
	)
}
