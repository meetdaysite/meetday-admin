"use client"

import { InviteAdminDrawer, type InviteAdminSubmitValues } from "@/components/admins/invite-admin-drawer"
import { Button } from "@/components/ui/Button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataView } from "@/components/ui/data-view"
import { FilterSelect } from "@/components/ui/filter-select"
import PageHeader from "@/components/ui/PageHeader"
import { deactivateAdmin, deleteAdmin, getAdmins, inviteAdmin, reactivateAdmin } from "@/lib/api/admins"
import { formatDate } from "@/lib/formatters"
import { DateCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
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
	{ label: "Admin", value: "CITY_ADMIN" },
	{ label: "Moderator", value: "MODERATOR" },
	{ label: "Support", value: "SUPPORT" },
]

const ACTIVE_FILTER_OPTIONS: { label: string; value: ActiveFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Active", value: "true" },
	{ label: "Inactive", value: "false" },
]

export default function AdminsPage() {
	const currentUserId = useAuthStore(s => s.user?.id)
	const currentUserRole = useAuthStore(s => s.role)
	const canInvite = usePermission("admin.invite")
	const canDelete = currentUserRole === "SUPER_ADMIN"

	const [page, setPage] = useState(1)
	const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL")
	const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL")

	const [drawerOpen, setDrawerOpen] = useState(false)
	const [isInviting, setIsInviting] = useState(false)
	const [deactivateTarget, setDeactivateTarget] = useState<Admin | null>(null)
	const [isDeactivating, setIsDeactivating] = useState(false)
	const [reactivateTarget, setReactivateTarget] = useState<Admin | null>(null)
	const [isReactivating, setIsReactivating] = useState(false)
	const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)

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
			const result = await inviteAdmin({
				email: values.email,
				firstName: values.firstName,
				lastName: values.lastName,
				roleId: values.roleId,
				managedCities: values.managedCities,
			})
			setDrawerOpen(false)
			toast.success(result.message)
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

	async function handleDelete() {
		if (!deleteTarget) return
		setIsDeleting(true)
		try {
			await deleteAdmin(deleteTarget.id)
			fetchAdmins()
			setDeleteTarget(null)
			toast.success("Admin deleted", {
				description: `${deleteTarget.firstName} ${deleteTarget.lastName}'s account has been removed.`,
			})
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to delete admin. Please try again."
			toast.error("Delete failed", { description: message })
		} finally {
			setIsDeleting(false)
		}
	}

	const columns = useMemo<ColumnDef<Admin>[]>(
		() => [
			{
				id: "admin",
				header: "Admin",
				cell: ({ row }) => (
					<TwoLineCell
						primary={`${row.original.firstName} ${row.original.lastName}`}
						secondary={row.original.email}
					/>
				),
			},
			{
				id: "role",
				header: "Role",
				accessorKey: "role",
				enableSorting: true,
				cell: ({ row }) => {
					const admin = row.original
					// A user primarily HOST/BRAND/USER can hold (or be pending for) admin access as a
					// secondary grant instead of their primary role — show whichever is the admin one.
					const ADMIN_ROLES = ["SUPER_ADMIN", "CITY_ADMIN", "MODERATOR", "SUPPORT"]
					const effectiveRole = ADMIN_ROLES.includes(admin.role.name)
						? admin.role.name
						: (admin.adminRole?.name ?? admin.pendingAdminRole?.name)
					return <StatusCell status={effectiveRole ?? admin.role.name} />
				},
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
				cell: ({ row }) => {
					const admin = row.original
					// Invited but not yet confirmed (fresh invite hasn't set a password yet, OR an
					// existing account's admin grant hasn't been accepted yet) vs genuinely deactivated
					// — both can otherwise look like isActive=false.
					const isPending = admin.pendingAdminRole || (!admin.isActive && admin.mustCompleteProfile)
					const status = isPending ? "PENDING" : admin.isActive ? "ACTIVE" : "DISABLED"
					return <StatusCell status={status} />
				},
			},
			{
				id: "joined",
				header: "Admin since",
				accessorKey: "createdAt",
				enableSorting: true,
				// The date admin access was requested/granted, NOT the account's original signup date
				// (relevant for a secondary grant on a pre-existing HOST/BRAND/USER account).
				cell: ({ row }) => (
					<DateCell value={row.original.adminInviteRequestedAt ?? row.original.createdAt} format={formatDate} secondary />
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

								if (isSelf) return null

								return (
									<div className="flex items-center justify-end gap-1">
										{!isTargetSuperAdmin &&
											(admin.isActive ? (
												<button
													onClick={e => {
														e.stopPropagation()
														setDeactivateTarget(admin)
													}}
													className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
												>
													Deactivate
												</button>
											) : (
												<button
													onClick={e => {
														e.stopPropagation()
														setReactivateTarget(admin)
													}}
													className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-green-600 hover:bg-green-50 transition-colors"
												>
													Reactivate
												</button>
											))}
										{canDelete && (
											<button
												onClick={e => {
													e.stopPropagation()
													setDeleteTarget(admin)
												}}
												className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
											>
												Delete
											</button>
										)}
									</div>
								)
							},
						},
					] as ColumnDef<Admin>[])
				: []),
		],
		[canInvite, canDelete, currentUserId],
	)

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	return (
		<div className="p-6 space-y-6 max-w-7xl mx-auto">
			{/* Page header */}
			<PageHeader
				title="Admins"
				description="Manage the admins who have access to the admin panel."
				buttons={
					canInvite && (
						<Button leftIcon={<UserPlus size={13} />} onClick={() => setDrawerOpen(true)}>
							Invite Admin
						</Button>
					)
				}
			/>

			{/* Filters */}
			<div className="flex items-center gap-3">
				<FilterSelect
					value={roleFilter}
					onChange={v => {
						setRoleFilter(v as RoleFilter)
						setPage(1)
					}}
					options={ROLE_FILTER_OPTIONS}
				/>

				<FilterSelect
					value={activeFilter}
					onChange={v => {
						setActiveFilter(v as ActiveFilter)
						setPage(1)
					}}
					options={ACTIVE_FILTER_OPTIONS}
				/>
			</div>

			<DataView
				error={null}
				isLoading={isLoading}
				columns={columns}
				data={admins}
				emptyMessage="No admins found."
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
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

			{/* Delete confirm dialog */}
			<ConfirmDialog
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleDelete}
				title="Delete admin"
				description={
					deleteTarget
						? `This will permanently remove ${deleteTarget.firstName} ${deleteTarget.lastName}'s account and disable their login. This cannot be undone.`
						: ""
				}
				confirmLabel="Delete"
				destructive
				isLoading={isDeleting}
			/>
		</div>
	)
}
