"use client"

import { HostReviewDrawer, type HostAction } from "@/components/hosts/host-review-drawer"
import { DataView } from "@/components/ui/data-view"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { approveHost, getHosts, rejectHost } from "@/lib/api/hosts"
import { formatDate, getDaysSince } from "@/lib/formatters"
import { AgeDateCell, ChipCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Host } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// Helpers

function getRowTint(host: Host): string {
	if (!host.createdAt) return ""
	const days = getDaysSince(host.createdAt)
	if (days <=7) return ""
	if (days <=21) return "border-l-4 border-amber-500"
	if (days <= 35) return "border-l-4 border-orange-500"
	return "border-l-4 border-red-500"
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
				id: "kycStatus",
				header: "KYC",
				cell: ({ row }) => <StatusCell status={row.original.kycStatus} />,
			},
			{
				id: "submitted",
				header: "Submitted",
				cell: ({ row }) => (
					<AgeDateCell iso={row.original.createdAt} getDaysSince={getDaysSince} format={formatDate} />
				),
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
