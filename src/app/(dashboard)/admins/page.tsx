"use client"

import { useMemo, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { UserPlus, Globe, MapPin } from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"
import { usePermission } from "@/lib/hooks/use-permission"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { InviteAdminDrawer } from "@/components/admins/invite-admin-drawer"
import type { Admin, Role } from "@/types"

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<Role, string> = {
	SUPER_ADMIN: "bg-violet-50 text-violet-700",
	CITY_ADMIN:  "bg-blue-50 text-blue-700",
	MODERATOR:   "bg-amber-50 text-amber-700",
	SUPPORT:     "bg-teal-50 text-teal-700",
}

const ROLE_LABEL: Record<Role, string> = {
	SUPER_ADMIN: "Super Admin",
	CITY_ADMIN:  "City Admin",
	MODERATOR:   "Moderator",
	SUPPORT:     "Support",
}

function RoleBadge({ role }: { role: Role }) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_STYLE[role]}`}
		>
			{ROLE_LABEL[role]}
		</span>
	)
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ADMINS: Admin[] = [
	{
		id: "1",
		name: "Aniket Chakraborty",
		email: "aniket@meetday.in",
		role: "SUPER_ADMIN",
		cityScope: null,
		status: "ACCEPTED",
		invitedAt: new Date("2024-01-10"),
		joinedAt: new Date("2024-01-11"),
	},
	{
		id: "2",
		name: "Priya Sharma",
		email: "priya@meetday.in",
		role: "CITY_ADMIN",
		cityScope: "Mumbai",
		status: "ACCEPTED",
		invitedAt: new Date("2024-02-15"),
		joinedAt: new Date("2024-02-17"),
	},
	{
		id: "3",
		name: "Ravi Mehta",
		email: "ravi@meetday.in",
		role: "MODERATOR",
		cityScope: null,
		status: "ACCEPTED",
		invitedAt: new Date("2024-03-01"),
		joinedAt: new Date("2024-03-03"),
	},
	{
		id: "4",
		name: "Neha Singh",
		email: "neha@meetday.in",
		role: "CITY_ADMIN",
		cityScope: "Bangalore",
		status: "PENDING",
		invitedAt: new Date("2024-04-01"),
		joinedAt: null,
	},
	{
		id: "5",
		name: "Arjun Patel",
		email: "arjun@meetday.in",
		role: "SUPPORT",
		cityScope: null,
		status: "ACCEPTED",
		invitedAt: new Date("2024-03-20"),
		joinedAt: new Date("2024-03-22"),
	},
	{
		id: "6",
		name: "Divya Nair",
		email: "divya@meetday.in",
		role: "MODERATOR",
		cityScope: null,
		status: "EXPIRED",
		invitedAt: new Date("2024-01-05"),
		joinedAt: null,
	},
	{
		id: "7",
		name: "Sameer Khan",
		email: "sameer@meetday.in",
		role: "CITY_ADMIN",
		cityScope: "Pune",
		status: "REVOKED",
		invitedAt: new Date("2024-02-20"),
		joinedAt: null,
	},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date | null): string {
	if (!date) return "—"
	return date.toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminsPage() {
	const currentUserId = useAuthStore((s) => s.user?.id)
	const canInvite = usePermission("admin.invite")

	const [admins, setAdmins] = useState<Admin[]>(MOCK_ADMINS)
	const [drawerOpen, setDrawerOpen] = useState(false)
	const [isInviting, setIsInviting] = useState(false)

	const [revokeTarget, setRevokeTarget] = useState<Admin | null>(null)
	const [isRevoking, setIsRevoking] = useState(false)

	async function handleInvite(values: {
		email: string
		role: Role
		cityScope?: string
	}) {
		setIsInviting(true)
		// TODO: replace with real API call
		await new Promise((r) => setTimeout(r, 1000))
		const newAdmin: Admin = {
			id: String(Date.now()),
			name: values.email.split("@")[0],
			email: values.email,
			role: values.role,
			cityScope: values.cityScope ?? null,
			status: "PENDING",
			invitedAt: new Date(),
			joinedAt: null,
		}
		setAdmins((prev) => [newAdmin, ...prev])
		setIsInviting(false)
		setDrawerOpen(false)
	}

	async function handleRevoke() {
		if (!revokeTarget) return
		setIsRevoking(true)
		// TODO: replace with real API call
		await new Promise((r) => setTimeout(r, 800))
		setAdmins((prev) =>
			prev.map((a) =>
				a.id === revokeTarget.id ? { ...a, status: "REVOKED" } : a,
			),
		)
		setIsRevoking(false)
		setRevokeTarget(null)
	}

	const columns = useMemo<ColumnDef<Admin>[]>(
		() => [
			{
				id: "admin",
				header: "Admin",
				cell: ({ row }) => (
					<div>
						<p className="text-xs font-semibold text-foreground leading-none mb-0.5">
							{row.original.name}
						</p>
						<p className="text-[11px] text-neutral-light">{row.original.email}</p>
					</div>
				),
			},
			{
				id: "role",
				header: "Role",
				accessorKey: "role",
				enableSorting: true,
				cell: ({ row }) => <RoleBadge role={row.original.role} />,
			},
			{
				id: "scope",
				header: "Scope",
				cell: ({ row }) => {
					const city = row.original.cityScope
					if (!city)
						return (
							<span className="inline-flex items-center gap-1 text-xs text-neutral-light">
								<Globe size={12} />
								All cities
							</span>
						)
					return (
						<span className="inline-flex items-center gap-1 text-xs text-foreground">
							<MapPin size={12} className="text-neutral-light" />
							{city}
						</span>
					)
				},
			},
			{
				id: "status",
				header: "Status",
				accessorKey: "status",
				enableSorting: true,
				cell: ({ row }) => <StatusBadge status={row.original.status} />,
			},
			{
				id: "joined",
				header: "Member since",
				accessorKey: "joinedAt",
				enableSorting: true,
				cell: ({ row }) => (
					<span className="text-xs text-neutral-dark">
						{formatDate(row.original.joinedAt)}
					</span>
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
								const isRevokable =
									admin.status === "PENDING" || admin.status === "ACCEPTED"

								if (isSelf || !isRevokable) return null

								return (
									<button
										onClick={(e) => {
											e.stopPropagation()
											setRevokeTarget(admin)
										}}
										className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
									>
										Revoke
									</button>
								)
							},
						},
					] as ColumnDef<Admin>[])
				: []),
		],
		[canInvite, currentUserId],
	)

	const activeCount = admins.filter((a) => a.status === "ACCEPTED").length

	return (
		<div className="p-6 space-y-6 max-w-7xl mx-auto">
			{/* Page header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h1 className="text-base font-semibold text-foreground">Admins</h1>
					<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-dark">
						{activeCount} active
					</span>
				</div>

				{canInvite && (
					<button
						onClick={() => setDrawerOpen(true)}
						className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors"
					>
						<UserPlus size={13} />
						Invite Admin
					</button>
				)}
			</div>

			{/* Table */}
			<DataTable
				columns={columns}
				data={admins}
				emptyState={
					<div className="py-12 text-center text-sm text-neutral-light">
						No admins found.
					</div>
				}
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

			{/* Revoke confirm dialog */}
			<ConfirmDialog
				open={!!revokeTarget}
				onClose={() => setRevokeTarget(null)}
				onConfirm={handleRevoke}
				title="Revoke access"
				description={
					revokeTarget
						? `This will immediately revoke ${revokeTarget.name}'s access to the admin panel. They won't be able to log in until re-invited.`
						: ""
				}
				confirmLabel="Revoke access"
				destructive
				isLoading={isRevoking}
			/>
		</div>
	)
}
