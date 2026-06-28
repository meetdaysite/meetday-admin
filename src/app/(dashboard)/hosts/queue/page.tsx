"use client"

import { HostReviewDrawer, type HostAction } from "@/components/hosts/host-review-drawer"
import { DataView } from "@/components/ui/data-view"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { approveHost, getHosts, rejectHost } from "@/lib/api/hosts"
import { formatDate } from "@/lib/formatters"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Host } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// Helpers

function getDaysSince(iso: string): number {
	return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function getRowTint(host: Host): string {
	if (!host.createdAt) return ""
	const days = getDaysSince(host.createdAt)
	if (days >= 14) return "bg-orange-50"
	if (days >= 7) return "bg-amber-50"
	return ""
}

// Page

export default function HostQueuePage() {
	const router = useRouter()
	const canApprove = usePermission("host.approve")

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [hosts, setHosts] = useState<Host[]>([])
	const [search, setSearch] = useState("")
	const [selectedHost, setSelectedHost] = useState<Host | null>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)

	const fetchHosts = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const res = await getHosts({ approvalStatus: "PENDING" })
			setHosts(res.hosts)
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
	}, [router])

	useEffect(() => {
		fetchHosts()
	}, [fetchHosts])

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

	function openDrawer(host: Host) {
		setSelectedHost(host)
		setDrawerOpen(true)
	}

	async function handleAction(hostId: string, action: HostAction, reason?: string) {
		try {
			if (action === "approve") await approveHost(hostId)
			else if (action === "reject") await rejectHost(hostId, reason!)

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
				id: "kycStatus",
				header: "KYC",
				cell: ({ row }) => <StatusBadge status={row.original.kycStatus} />,
			},
			{
				id: "submitted",
				header: "Submitted",
				cell: ({ row }) => {
					const iso = row.original.createdAt
					if (!iso) return <span className="text-xs text-text-tertiary">—</span>
					const days = getDaysSince(iso)
					const ageColor =
						days >= 14 ? "text-orange-600" : days >= 7 ? "text-amber-600" : "text-text-tertiary"
					return (
						<div>
							<p className="text-xs text-text-secondary">{formatDate(iso)}</p>
							<p className={`text-[11px] font-medium ${ageColor}`}>
								{days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`}
							</p>
						</div>
					)
				},
			},
		],
		[],
	)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view the host queue." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader
				title="Host Queue"
				description="Review and approve hosts who have applied to join the platform."
			/>

			{/* Search */}
			<SearchInput
				value={search}
				onChange={setSearch}
				placeholder="Search by name or email…"
				className="max-w-xs"
			/>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No hosts pending review."
				onRowClick={openDrawer}
				getRowClassName={getRowTint}
			/>

			{/* Age tint legend */}
			{!error && !isLoading && filtered.length > 0 && (
				<div className="flex items-center gap-4 text-[11px] text-text-tertiary">
					<span className="font-medium">Row colour:</span>
					<span className="flex items-center gap-1.5">
						<span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-200" />
						7–13 days pending
					</span>
					<span className="flex items-center gap-1.5">
						<span className="w-3 h-3 rounded-sm bg-orange-100 border border-orange-200" />
						14+ days pending
					</span>
				</div>
			)}

			<HostReviewDrawer
				open={drawerOpen}
				onClose={() => {
					setDrawerOpen(false)
					setSelectedHost(null)
				}}
				host={selectedHost}
				onAction={handleAction}
			/>
		</div>
	)
}
