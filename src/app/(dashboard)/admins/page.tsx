"use client"

import { InviteAdminDrawer, type InviteAdminSubmitValues } from "@/components/admins/invite-admin-drawer"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { deactivateAdmin, getAdmins, inviteAdmin, reactivateAdmin } from "@/lib/api/admins"
import { ROLE_LABEL, ROLE_STYLE } from "@/lib/constants/roles"
import { formatDate } from "@/lib/formatters"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import { useAuthStore } from "@/stores/auth.store"
import type { Admin, Role } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { Globe, MapPin, UserPlus } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

// Constants

const PAGE_LIMIT = 20

type RoleFilter = Exclude<Role, "SUPER_ADMIN"> | "ALL"
type ActiveFilter = "ALL" | "true" | "false"

const ROLE_FILTER_OPTIONS: { label: string; value: RoleFilter }[] = [
	{ label: "All roles", value: "ALL" },
	{ label: "City Admin", value: "CITY_ADMIN" },
	{ label: "Moderator", value: "MODERATOR" },
	{ label: "Support", value: "SUPPORT" },
]

const ACTIVE_FILTER_OPTIONS: { label: string; value: ActiveFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Active", value: "true" },
	{ label: "Inactive", value: "false" },
]

// Role badge

function RoleBadge({ role }: { role: Role }) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_STYLE[role]}`}
		>
			{ROLE_LABEL[role]}
		</span>
	)
}

// Helpers

// Page

export default function AdminsPage() {
	const currentUserId = useAuthStore(s => s.user?.id)
	const canInvite = usePermission("admin.invite")

	const [page, setPage] = useState(1)
	const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL")
	const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL")

	const [drawerOpen, setDrawerOpen] = useState(false)
	const [isInviting, setIsInviting] = useState(false)
	const [deactivateTarget, setDeactivateTarget] = useState<Admin | null>(null)
	const [isDeactivating, setIsDeactivating] = useState(false)
	const [reactivateTarget, setReactivateTarget] = useState<Admin | null>(null)
	const [isReactivating, setIsReactivating] = useState(false)

	const fetcher = useCallback(
		() =>
			getAdmins({
				page,
				limit: PAGE_LIMIT,
				...(roleFilter !== "ALL" && { role: roleFilter }),
				...(activeFilter !== "ALL" && { isActive: activeFilter === "true" }),
			}).then(r => ({ items: r.admins, total: r.total })),
		[page, roleFilter, activeFilter],
	)

	const {
		items: admins,
		total,
		isLoading,
		refresh: fetchAdmins,
	} = usePaginatedFetch(fetcher, "Failed to load admins")

	async function handleInvite(values: InviteAdminSubmitValues) {
		setIsInviting(true)
		try {
			await inviteAdmin({
				email: values.email,
				firstName: values.firstName,
				lastName: values.lastName,
				roleId: values.roleId,
				managedCities: values.managedCities,
			})
			setDrawerOpen(false)
			toast.success("Invitation sent", {
				description: `${values.firstName} ${values.lastName} will receive an email shortly.`,
			})
			if (page === 1) {
				fetchAdmins()
			} else {
				setPage(1) // triggers useEffect â†’ re-fetch
			}
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to send invitation. Please try again."
			toast.error("Invite failed", { description: message })
		} finally {
			setIsInviting(false)
		}
	}

	async function handleDeactivate() {
		if (!deactivateTarget) return
		setIsDeactivating(true)
		try {
			await deactivateAdmin(deactivateTarget.id)
			fetchAdmins()
			setDeactivateTarget(null)
			toast.success("Admin deactivated", {
				description: `${deactivateTarget.firstName} ${deactivateTarget.lastName}'s access has been revoked.`,
			})
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to deactivate admin. Please try again."
			toast.error("Deactivation failed", { description: message })
		} finally {
			setIsDeactivating(false)
		}
	}

	async function handleReactivate() {
		if (!reactivateTarget) return
		setIsReactivating(true)
		try {
			await reactivateAdmin(reactivateTarget.id)
			fetchAdmins()
			setReactivateTarget(null)
			toast.success("Admin reactivated", {
				description: `${reactivateTarget.firstName} ${reactivateTarget.lastName}'s access has been restored.`,
			})
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to reactivate admin. Please try again."
			toast.error("Reactivation failed", { description: message })
		} finally {
			setIsReactivating(false)
		}
	}

	const columns = useMemo<ColumnDef<Admin>[]>(
		() => [
			{
				id: "admin",
				header: "Admin",
				cell: ({ row }) => (
					<div>
						<p className="text-xs font-semibold text-text-primary leading-none mb-0.5">
							{row.original.firstName} {row.original.lastName}
						</p>
						<p className="text-[11px] text-text-tertiary">{row.original.email}</p>
					</div>
				),
			},
			{
				id: "role",
				header: "Role",
				accessorKey: "role",
				enableSorting: true,
				cell: ({ row }) => <RoleBadge role={row.original.role.name} />,
			},
			{
				id: "scope",
				header: "Scope",
				cell: ({ row }) => {
					const cities = row.original.adminProfile?.managedCities ?? []
					if (cities.length === 0)
						return (
							<span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
								<Globe size={12} />
								All cities
							</span>
						)
					return (
						<span className="inline-flex items-center gap-1 text-xs text-text-primary">
							<MapPin size={12} className="text-text-tertiary" />
							{cities.join(", ")}
						</span>
					)
				},
			},
			{
				id: "status",
				header: "Status",
				cell: ({ row }) => <StatusBadge status={row.original.isActive ? "ACTIVE" : "DISABLED"} />,
			},
			{
				id: "joined",
				header: "Member since",
				accessorKey: "createdAt",
				enableSorting: true,
				cell: ({ row }) => (
					<span className="text-xs text-text-secondary">{formatDate(row.original.createdAt)}</span>
				),
			},
			...(canInvite
				? ([
						{
							id: "actions",
							header: "",
							cell: ({ row }) => {
								const admin = row.original
								const isSelf = admin.id === currentUserId
								const isTargetSuperAdmin = admin.role.name === "SUPER_ADMIN"

								if (isSelf || isTargetSuperAdmin) return null

								if (admin.isActive) {
									return (
										<button
											onClick={e => {
												e.stopPropagation()
												setDeactivateTarget(admin)
											}}
											className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
										>
											Deactivate
										</button>
									)
								}

								return (
									<button
										onClick={e => {
											e.stopPropagation()
											setReactivateTarget(admin)
										}}
										className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-green-600 hover:bg-green-50 transition-colors"
									>
										Reactivate
									</button>
								)
							},
						},
					] as ColumnDef<Admin>[])
				: []),
		],
		[canInvite, currentUserId],
	)

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	return (
		<div className="p-6 space-y-6 max-w-7xl mx-auto">
			{/* Page header */}
			<PageHeader title="Admins" count={total > 0 ? `${total} total` : undefined}>
				{canInvite && (
					<button
						onClick={() => setDrawerOpen(true)}
						className="flex items-center gap-1.5 rounded-lg bg-action-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors"
					>
						<UserPlus size={13} />
						Invite Admin
					</button>
				)}
			</PageHeader>

			{/* Filters */}
			<div className="flex items-center gap-3">
				<select
					value={roleFilter}
					onChange={e => {
						setRoleFilter(e.target.value as RoleFilter)
						setPage(1)
					}}
					className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
				>
					{ROLE_FILTER_OPTIONS.map(o => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>

				<select
					value={activeFilter}
					onChange={e => {
						setActiveFilter(e.target.value as ActiveFilter)
						setPage(1)
					}}
					className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
				>
					{ACTIVE_FILTER_OPTIONS.map(o => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
			</div>

			{/* Table */}
			<DataTable
				columns={columns}
				data={admins}
				isLoading={isLoading}
				emptyState={
					<div className="py-12 text-center text-sm text-text-tertiary">No admins found.</div>
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

			{/* Invite drawer */}
			{canInvite && (
				<InviteAdminDrawer
					open={drawerOpen}
					onClose={() => setDrawerOpen(false)}
					onSubmit={handleInvite}
					isSubmitting={isInviting}
				/>
			)}

			{/* Deactivate confirm dialog */}
			<ConfirmDialog
				open={!!deactivateTarget}
				onClose={() => setDeactivateTarget(null)}
				onConfirm={handleDeactivate}
				title="Deactivate admin"
				description={
					deactivateTarget
						? `This will immediately revoke ${deactivateTarget.firstName} ${deactivateTarget.lastName}'s access to the admin panel. They won't be able to log in until reactivated.`
						: ""
				}
				confirmLabel="Deactivate"
				destructive
				isLoading={isDeactivating}
			/>

			{/* Reactivate confirm dialog */}
			<ConfirmDialog
				open={!!reactivateTarget}
				onClose={() => setReactivateTarget(null)}
				onConfirm={handleReactivate}
				title="Reactivate admin"
				description={
					reactivateTarget
						? `This will restore ${reactivateTarget.firstName} ${reactivateTarget.lastName}'s access to the admin panel.`
						: ""
				}
				confirmLabel="Reactivate"
				isLoading={isReactivating}
			/>
		</div>
	)
}
