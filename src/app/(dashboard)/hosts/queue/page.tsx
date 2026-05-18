"use client"

import { HostReviewDrawer, type HostAction } from "@/components/hosts/host-review-drawer"
import { InviteBulkDrawer } from "@/components/hosts/invite-bulk-drawer"
import { InviteSingleDrawer } from "@/components/hosts/invite-single-drawer"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { getHosts, approveHost, rejectHost, suspendHost, restoreHost } from "@/lib/api/hosts"
import { usePermission } from "@/lib/hooks/use-permission"
import type { ApprovalStatus, Host, KycStatus, HostPlan } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Search, Upload, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20

type StatusFilter = ApprovalStatus | "ALL"

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
	{ label: "All",       value: "ALL" },
	{ label: "Pending",   value: "PENDING" },
	{ label: "Approved",  value: "APPROVED" },
	{ label: "Rejected",  value: "REJECTED" },
	{ label: "Suspended", value: "SUSPENDED" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRowTint(host: Host): string {
	if (host.approvalStatus === "PENDING") return "bg-amber-50"
	return ""
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HostQueuePage() {
	const router = useRouter()
	const canApprove = usePermission("host.approve")
	const canInvite = usePermission("host.invite")

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [hosts, setHosts] = useState<Host[]>([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)

	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
	const [kycFilter, setKycFilter] = useState<KycStatus | "ALL">("ALL")
	const [planFilter, setPlanFilter] = useState<HostPlan | "ALL">("ALL")
	const [cityFilter, setCityFilter] = useState("")
	const [cityInput, setCityInput] = useState("")
	const [search, setSearch] = useState("")

	const [selectedHost, setSelectedHost] = useState<Host | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)
	const [singleOpen, setSingleOpen] = useState(false)
	const [bulkOpen, setBulkOpen] = useState(false)

	const fetchHosts = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await getHosts({
				page,
				limit: PAGE_LIMIT,
				...(statusFilter !== "ALL" && { approvalStatus: statusFilter }),
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
				setError("You don't have permission to view the host queue.")
			} else {
				toast.error("Failed to load hosts")
				setError("Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}, [page, statusFilter, kycFilter, planFilter, cityFilter, router])

	useEffect(() => {
		fetchHosts()
	}, [fetchHosts])

	function openDrawer(host: Host) {
		setSelectedHost(host)
		setDrawerOpen(true)
	}

	async function handleAction(hostId: string, action: HostAction, reason?: string) {
		const callMap: Record<HostAction, () => Promise<void>> = {
			approve: () => approveHost(hostId),
			reject:  () => rejectHost(hostId, reason!),
			suspend: () => suspendHost(hostId, reason!),
			restore: () => restoreHost(hostId),
		}
		const successMap: Record<HostAction, string> = {
			approve: "Host approved",
			reject:  "Host rejected",
			suspend: "Host suspended",
			restore: "Host restored",
		}
		try {
			await callMap[action]()
			toast.success(successMap[action])
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

	function handleCitySearch(e: React.SyntheticEvent<HTMLFormElement>) {
		e.preventDefault()
		setPage(1)
		setCityFilter(cityInput.trim())
	}

	// Client-side search on the already-loaded page of results
	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return hosts
		return hosts.filter(
			(h) =>
				h.displayName.toLowerCase().includes(q) ||
				(h.user.email ?? "").toLowerCase().includes(q) ||
				`${h.user.firstName} ${h.user.lastName}`.toLowerCase().includes(q),
		)
	}, [hosts, search])

	const pendingCount = total > 0 && statusFilter === "PENDING" ? total : undefined

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
				id: "cities",
				header: "Cities",
				cell: ({ row }) => {
					const cities = row.original.operatingCities
					if (!cities?.length) return <span className="text-[11px] text-neutral-light">—</span>
					return (
						<span className="text-xs text-foreground">
							{cities.slice(0, 2).join(", ")}
							{cities.length > 2 && (
								<span className="text-neutral-light"> +{cities.length - 2}</span>
							)}
						</span>
					)
				},
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
				id: "kycStatus",
				header: "KYC",
				cell: ({ row }) => <StatusBadge status={row.original.kycStatus} />,
			},
			{
				id: "status",
				header: "Status",
				enableSorting: true,
				cell: ({ row }) => <StatusBadge status={row.original.approvalStatus} />,
			},
		],
		[],
	)

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	if (!canApprove) {
		return (
			<div className="p-6 max-w-7xl mx-auto">
				<p className="text-sm text-neutral-light">
					You don&apos;t have permission to view the host queue.
				</p>
			</div>
		)
	}

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center gap-3">
				<h1 className="text-base font-semibold text-foreground">Host Queue</h1>
				{pendingCount !== undefined && pendingCount > 0 && (
					<span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
						{pendingCount} pending
					</span>
				)}
				{canInvite && (
					<div className="ml-auto flex items-center gap-2">
						<button
							onClick={() => setSingleOpen(true)}
							className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors"
						>
							<UserPlus size={13} />
							Invite Host
						</button>
						<button
							onClick={() => setBulkOpen(true)}
							className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors"
						>
							<Upload size={13} />
							Bulk Upload
						</button>
					</div>
				)}
			</div>

			{/* Filters */}
			<div className="space-y-3">
				{/* Status tabs */}
				<div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
					{STATUS_TABS.map((tab) => {
						const active = statusFilter === tab.value
						const count = active ? total : null
						return (
							<button
								key={tab.value}
								onClick={() => { setStatusFilter(tab.value); setPage(1) }}
								className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
									active
										? "bg-brand-red text-white"
										: "bg-neutral-100 text-neutral-dark hover:bg-neutral-200"
								}`}
							>
								{tab.label}
								{count !== null && (
									<span
										className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
											active ? "bg-white/20 text-white" : "bg-white text-neutral-dark"
										}`}
									>
										{count}
									</span>
								)}
							</button>
						)
					})}
				</div>

				{/* Search + dropdowns + city filter */}
				<div className="flex items-center gap-2 flex-wrap">
					<div className="relative flex-1 min-w-48 max-w-xs">
						<Search
							size={13}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light pointer-events-none"
						/>
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search by name or email…"
							className="w-full rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-2 text-xs placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
						/>
					</div>

					<select
						value={kycFilter}
						onChange={(e) => { setKycFilter(e.target.value as KycStatus | "ALL"); setPage(1) }}
						className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-foreground focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
					>
						<option value="ALL">KYC: All</option>
						<option value="NOT_SUBMITTED">Not Submitted</option>
						<option value="PENDING">Pending</option>
						<option value="VERIFIED">Verified</option>
						<option value="FAILED">Failed</option>
					</select>

					<select
						value={planFilter}
						onChange={(e) => { setPlanFilter(e.target.value as HostPlan | "ALL"); setPage(1) }}
						className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-foreground focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
					>
						<option value="ALL">Plan: All</option>
						<option value="DISCOVER">Discover</option>
						<option value="SELL">Sell</option>
						<option value="COMMUNITY">Community</option>
					</select>

					<form onSubmit={handleCitySearch} className="flex items-center gap-1.5">
						<input
							type="text"
							value={cityInput}
							onChange={(e) => setCityInput(e.target.value)}
							placeholder="Filter by city…"
							className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors w-36"
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
						data={filtered}
						isLoading={isLoading}
						onRowClick={openDrawer}
						getRowClassName={getRowTint}
						emptyState={
							<div className="py-12 text-center text-sm text-neutral-light">
								No hosts match the current filters.
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
			<HostReviewDrawer
				open={drawerOpen}
				onClose={() => { setDrawerOpen(false); setSelectedHost(null) }}
				host={selectedHost}
				onAction={handleAction}
			/>

			{/* Invite drawers */}
			<InviteSingleDrawer
				open={singleOpen}
				onClose={() => setSingleOpen(false)}
				onOpenBulk={() => { setSingleOpen(false); setBulkOpen(true) }}
			/>
			<InviteBulkDrawer
				open={bulkOpen}
				onClose={() => setBulkOpen(false)}
				onOpenSingle={() => { setBulkOpen(false); setSingleOpen(true) }}
			/>
		</div>
	)
}
