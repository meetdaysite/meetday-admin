﻿"use client"

import type { HostAction } from "@/components/hosts/host-review-drawer"
import { HostReviewDrawer } from "@/components/hosts/host-review-drawer"
import { ClearableInput } from "@/components/ui/clearable-input"
import { DataView } from "@/components/ui/data-view"
import { FilterSelect } from "@/components/ui/filter-select"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge } from "@/components/ui/status-badge"
import { approveHost, getHosts, rejectHost } from "@/lib/api/hosts"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { ApprovalStatus, Host, HostPlan, KycStatus } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

// â"€â"€â"€ Constants â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const PAGE_LIMIT = 20

type ApprovalFilter = ApprovalStatus | "ALL"
type KycFilter = KycStatus | "ALL"
type PlanFilter = HostPlan | "ALL"

const APPROVAL_FILTER_OPTIONS: { label: string; value: ApprovalFilter }[] = [
	{ label: "All statuses", value: "ALL" },
	{ label: "Pending", value: "PENDING" },
	{ label: "Approved", value: "APPROVED" },
	{ label: "Rejected", value: "REJECTED" },
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

// â"€â"€â"€ Page â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export default function HostsPage() {
	const router = useRouter()
	const canApprove = usePermission("host.approve")

	const [page, setPage] = useState(1)
	const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("ALL")
	const [kycFilter, setKycFilter] = useState<KycFilter>("ALL")
	const [planFilter, setPlanFilter] = useState<PlanFilter>("ALL")
	const [cityFilter, setCityFilter] = useState("")
	const [cityInput, setCityInput] = useState("")

	const [selectedHost, setSelectedHost] = useState<Host | null>(null)

	const fetcher = useCallback(
		() =>
			getHosts({
				page,
				limit: PAGE_LIMIT,
				...(approvalFilter !== "ALL" && { approvalStatus: approvalFilter }),
				...(kycFilter !== "ALL" && { kycStatus: kycFilter }),
				...(planFilter !== "ALL" && { plan: planFilter }),
				...(cityFilter && { city: cityFilter }),
			}).then(r => ({ items: r.hosts, total: r.total })),
		[page, approvalFilter, kycFilter, planFilter, cityFilter],
	)

	const {
		items: hosts,
		total,
		isLoading,
		error,
		refresh: fetchHosts,
	} = usePaginatedFetch(fetcher, "Failed to load hosts")

	async function handleAction(hostId: string, action: HostAction, reason?: string) {
		const call = action === "approve" ? approveHost(hostId) : rejectHost(hostId, reason!)
		try {
			await call
			toast.success(action === "approve" ? "Host approved" : "Host rejected", {
				description:
					action === "approve"
						? "The host has been approved and will be notified."
						: "The host has been rejected and will be notified.",
			})
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
					description: msg ?? "Host is not in a pending state.",
				})
			} else {
				toast.error(`Failed to ${action} host`, {
					description: "Something went wrong. Please try again.",
				})
			}
			throw err
		}
	}

	function handleCitySearch(e: React.FormEvent) {
		e.preventDefault()
		setPage(1)
		setCityFilter(cityInput.trim())
	}

	const columns = useMemo<ColumnDef<Host>[]>(
		() => [
			{
				id: "host",
				header: "Host",
				cell: ({ row }) => {
					const h = row.original
					return (
						<div>
							<p className="text-xs font-semibold text-text-primary leading-none mb-0.5">
								{h.displayName}
							</p>
							<p className="text-[11px] text-text-tertiary">
								{h.user.firstName} {h.user.lastName} · {h.user.email}
							</p>
						</div>
					)
				},
			},
			{
				id: "type",
				header: "Type",
				cell: ({ row }) => (
					<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
						{row.original.hostType}
					</span>
				),
			},
			{
				id: "plan",
				header: "Plan",
				cell: ({ row }) => (
					<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
						{row.original.currentPlan}
					</span>
				),
			},
			{
				id: "location",
				header: "Location",
				cell: ({ row }) => {
					const { city, state } = row.original.address ?? {}
					return (
						<span className="inline-flex items-center gap-1 text-xs text-text-primary">
							<MapPin size={12} className="text-text-tertiary shrink-0" />
							{[city, state].filter(Boolean).join(", ")}
						</span>
					)
				},
			},
			{
				id: "kycStatus",
				header: "KYC",
				cell: ({ row }) => <StatusBadge status={row.original.kycStatus} />,
			},
			{
				id: "approvalStatus",
				header: "Approval",
				cell: ({ row }) => <StatusBadge status={row.original.approvalStatus} />,
			},
			{
				id: "categories",
				header: "Categories",
				cell: ({ row }) => {
					const cats = row.original.categories
					if (cats.length === 0) return <span className="text-xs text-text-tertiary">-</span>
					return (
						<span className="text-xs text-text-primary">
							{cats.slice(0, 2).join(", ")}
							{cats.length > 2 && (
								<span className="text-text-tertiary"> +{cats.length - 2}</span>
							)}
						</span>
					)
				},
			},
		],
		[],
	)

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	return (
		<div className="p-6 space-y-6 max-w-7xl mx-auto">
			{/* Page header */}
			<PageHeader title="Hosts" count={total > 0 ? `${total} total` : undefined} />

			{/* Filters */}
			<div className="flex items-center gap-3 flex-wrap">
				<FilterSelect
					value={approvalFilter}
					onChange={v => {
						setApprovalFilter(v as ApprovalFilter)
						setPage(1)
					}}
					options={APPROVAL_FILTER_OPTIONS}
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

				<form onSubmit={handleCitySearch}>
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
				data={hosts}
				emptyMessage="No hosts found."
				onRowClick={canApprove ? row => setSelectedHost(row) : undefined}
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>

			{/* Review drawer */}
			{canApprove && (
				<HostReviewDrawer
					open={!!selectedHost}
					onClose={() => setSelectedHost(null)}
					host={selectedHost}
					onAction={handleAction}
				/>
			)}
		</div>
	)
}
