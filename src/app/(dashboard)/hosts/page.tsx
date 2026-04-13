"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { type ColumnDef } from "@tanstack/react-table"
import { MapPin } from "lucide-react"
import { usePermission } from "@/lib/hooks/use-permission"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { HostReviewDrawer } from "@/components/hosts/host-review-drawer"
import type { HostAction } from "@/components/hosts/host-review-drawer"
import { getHosts } from "@/lib/api/hosts"
import type { Host, ApprovalStatus, KycStatus, HostPlan } from "@/types"

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20

type ApprovalFilter = ApprovalStatus | "ALL"
type KycFilter = KycStatus | "ALL"
type PlanFilter = HostPlan | "ALL"

const APPROVAL_FILTER_OPTIONS: { label: string; value: ApprovalFilter }[] = [
	{ label: "All statuses",  value: "ALL" },
	{ label: "Pending",       value: "PENDING" },
	{ label: "Approved",      value: "APPROVED" },
	{ label: "Rejected",      value: "REJECTED" },
]

const KYC_FILTER_OPTIONS: { label: string; value: KycFilter }[] = [
	{ label: "All KYC",       value: "ALL" },
	{ label: "Not submitted", value: "NOT_SUBMITTED" },
	{ label: "Pending",       value: "PENDING" },
	{ label: "Verified",      value: "VERIFIED" },
	{ label: "Failed",        value: "FAILED" },
]

const PLAN_FILTER_OPTIONS: { label: string; value: PlanFilter }[] = [
	{ label: "All plans",  value: "ALL" },
	{ label: "Discover",   value: "DISCOVER" },
	{ label: "Sell",       value: "SELL" },
	{ label: "Community",  value: "COMMUNITY" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

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

	async function handleAction(hostId: string, action: HostAction) {
		// TODO: wire up approve/reject API endpoints
		await new Promise((r) => setTimeout(r, 600))
		setSelectedHost(null)
		fetchHosts()
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
							<p className="text-xs font-semibold text-foreground leading-none mb-0.5">
								{h.displayName}
							</p>
							<p className="text-[11px] text-neutral-light">
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
					<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-dark">
						{row.original.hostType}
					</span>
				),
			},
			{
				id: "plan",
				header: "Plan",
				cell: ({ row }) => (
					<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-dark">
						{row.original.currentPlan}
					</span>
				),
			},
			{
				id: "location",
				header: "Location",
				cell: ({ row }) => {
					const { city, state } = row.original.address
					return (
						<span className="inline-flex items-center gap-1 text-xs text-foreground">
							<MapPin size={12} className="text-neutral-light shrink-0" />
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
					if (cats.length === 0)
						return <span className="text-xs text-neutral-light">—</span>
					return (
						<span className="text-xs text-foreground">
							{cats.slice(0, 2).join(", ")}
							{cats.length > 2 && (
								<span className="text-neutral-light"> +{cats.length - 2}</span>
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
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h1 className="text-base font-semibold text-foreground">Hosts</h1>
					{total > 0 && (
						<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-dark">
							{total} total
						</span>
					)}
				</div>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-3 flex-wrap">
				<select
					value={approvalFilter}
					onChange={(e) => { setApprovalFilter(e.target.value as ApprovalFilter); setPage(1) }}
					className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-foreground focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
				>
					{APPROVAL_FILTER_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>{o.label}</option>
					))}
				</select>

				<select
					value={kycFilter}
					onChange={(e) => { setKycFilter(e.target.value as KycFilter); setPage(1) }}
					className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-foreground focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
				>
					{KYC_FILTER_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>{o.label}</option>
					))}
				</select>

				<select
					value={planFilter}
					onChange={(e) => { setPlanFilter(e.target.value as PlanFilter); setPage(1) }}
					className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-foreground focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
				>
					{PLAN_FILTER_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>{o.label}</option>
					))}
				</select>

				<form onSubmit={handleCitySearch} className="flex items-center gap-1.5">
					<input
						type="text"
						value={cityInput}
						onChange={(e) => setCityInput(e.target.value)}
						placeholder="Filter by city…"
						className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-foreground placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors w-36"
					/>
					{cityFilter && (
						<button
							type="button"
							onClick={() => { setCityInput(""); setCityFilter(""); setPage(1) }}
							className="rounded-lg border border-neutral-200 px-2.5 py-2 text-xs text-neutral-dark hover:bg-neutral-50 transition-colors"
						>
							Clear
						</button>
					)}
				</form>
			</div>

			{/* Error state */}
			{error ? (
				<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			) : (
				<>
					{/* Table */}
					<DataTable
						columns={columns}
						data={hosts}
						isLoading={isLoading}
						onRowClick={canApprove ? (row) => setSelectedHost(row) : undefined}
						emptyState={
							<div className="py-12 text-center text-sm text-neutral-light">
								No hosts found.
							</div>
						}
					/>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between text-xs text-neutral-light">
							<span>
								Showing {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)} of {total}
							</span>
							<div className="flex items-center gap-2">
								<button
									disabled={page === 1}
									onClick={() => setPage((p) => p - 1)}
									className="rounded-md px-2.5 py-1 text-xs font-medium border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
								>
									Previous
								</button>
								<span className="font-medium text-foreground">
									{page} / {totalPages}
								</span>
								<button
									disabled={page >= totalPages}
									onClick={() => setPage((p) => p + 1)}
									className="rounded-md px-2.5 py-1 text-xs font-medium border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
								>
									Next
								</button>
							</div>
						</div>
					)}
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
