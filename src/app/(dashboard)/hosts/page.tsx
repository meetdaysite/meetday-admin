﻿"use client"

import type { HostAction } from "@/components/hosts/host-review-drawer"
import { HostReviewDrawer } from "@/components/hosts/host-review-drawer"
import { DataTable } from "@/components/ui/data-table"
import { ErrorBanner } from "@/components/ui/error-banner"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { approveHost, getHosts, rejectHost } from "@/lib/api/hosts"
import { usePermission } from "@/lib/hooks/use-permission"
import type { ApprovalStatus, Host, HostPlan, KycStatus } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
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

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [hosts, setHosts] = useState<Host[]>([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)

	const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("ALL")
	const [kycFilter, setKycFilter] = useState<KycFilter>("ALL")
	const [planFilter, setPlanFilter] = useState<PlanFilter>("ALL")
	const [cityFilter, setCityFilter] = useState("")
	const [cityInput, setCityInput] = useState("")

	const [selectedHost, setSelectedHost] = useState<Host | null>(null)

	const fetchHosts = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await getHosts({
				page,
				limit: PAGE_LIMIT,
				...(approvalFilter !== "ALL" && { approvalStatus: approvalFilter }),
				...(kycFilter !== "ALL" && { kycStatus: kycFilter }),
				...(planFilter !== "ALL" && { plan: planFilter }),
				...(cityFilter && { city: cityFilter }),
			})
			setHosts(res.hosts)
			setTotal(res.total)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			if (status === 401) {
				router.replace("/login")
				return
			}
			if (status === 403) {
				setError("You don't have permission to view hosts.")
			} else {
				toast.error("Failed to load hosts")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [page, approvalFilter, kycFilter, planFilter, cityFilter, router])

	useEffect(() => {
		fetchHosts()
	}, [fetchHosts])

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
				<select
					value={approvalFilter}
					onChange={e => {
						setApprovalFilter(e.target.value as ApprovalFilter)
						setPage(1)
					}}
					className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
				>
					{APPROVAL_FILTER_OPTIONS.map(o => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>

				<select
					value={kycFilter}
					onChange={e => {
						setKycFilter(e.target.value as KycFilter)
						setPage(1)
					}}
					className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
				>
					{KYC_FILTER_OPTIONS.map(o => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>

				<select
					value={planFilter}
					onChange={e => {
						setPlanFilter(e.target.value as PlanFilter)
						setPage(1)
					}}
					className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
				>
					{PLAN_FILTER_OPTIONS.map(o => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>

				<form onSubmit={handleCitySearch} className="flex items-center gap-1.5">
					<input
						type="text"
						value={cityInput}
						onChange={e => setCityInput(e.target.value)}
						placeholder="Filter by city…"
						className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors w-36"
					/>
					{cityFilter && (
						<button
							type="button"
							onClick={() => {
								setCityInput("")
								setCityFilter("")
								setPage(1)
							}}
							className="rounded-lg border border-border-default px-2.5 py-2 text-xs text-text-secondary hover:bg-neutral-50 transition-colors"
						>
							Clear
						</button>
					)}
				</form>
			</div>

			{/* Error state */}
			{error ? (
				<ErrorBanner>{error}</ErrorBanner>
			) : (
				<>
					{/* Table */}
					<DataTable
						columns={columns}
						data={hosts}
						isLoading={isLoading}
						onRowClick={canApprove ? row => setSelectedHost(row) : undefined}
						emptyState={
							<div className="py-12 text-center text-sm text-text-tertiary">
								No hosts found.
							</div>
						}
					/>

					{/* Pagination */}
					<Pagination
						page={page}
						totalPages={totalPages}
						total={total}
						pageSize={PAGE_LIMIT}
						onPageChange={setPage}
					/>
				</>
			)}

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
