"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Phone, ShieldCheck, Calendar, RefreshCw, AlertTriangle, UserX } from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"
import { getAdminProfile, type AdminProfile } from "@/lib/api/profile"
import type { Role } from "@/types"

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "long",
		year: "numeric",
	})
}

function getInitials(firstName: string, lastName: string): string {
	return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
	return (
		<div className="p-6 space-y-6 max-w-2xl mx-auto animate-pulse">
			<div className="h-5 w-32 bg-neutral-200 rounded" />
			<div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
				<div className="flex items-center gap-4">
					<div className="w-16 h-16 rounded-full bg-neutral-200 shrink-0" />
					<div className="space-y-2">
						<div className="h-4 w-40 bg-neutral-200 rounded" />
						<div className="h-3 w-24 bg-neutral-100 rounded" />
					</div>
				</div>
				<div className="divide-y divide-neutral-100">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="py-3 flex items-center gap-3">
							<div className="w-4 h-4 bg-neutral-200 rounded shrink-0" />
							<div className="h-3 w-48 bg-neutral-100 rounded" />
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ElementType
	label: string
	value: React.ReactNode
}) {
	return (
		<div className="py-3 flex items-start gap-3">
			<Icon size={14} className="mt-0.5 shrink-0 text-neutral-light" />
			<div className="min-w-0 flex-1">
				<p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-light mb-0.5">
					{label}
				</p>
				<div className="text-xs text-foreground">{value}</div>
			</div>
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PageState = "loading" | "done" | "error" | "access-denied" | "not-found"

export default function ProfilePage() {
	const router = useRouter()
	const clearAuth = useAuthStore((s) => s.clearAuth)

	const [state, setState] = useState<PageState>("loading")
	const [profile, setProfile] = useState<AdminProfile | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false

		setState("loading")
		setProfile(null)
		setErrorMessage(null)

		getAdminProfile()
			.then((data) => {
				if (cancelled) return
				setProfile(data)
				setState("done")
			})
			.catch((err: unknown) => {
				if (cancelled) return
				const status = (err as { response?: { status?: number } })?.response?.status
				if (status === 401) {
					clearAuth()
					router.replace("/login")
					return
				}
				if (status === 403) {
					setState("access-denied")
					return
				}
				if (status === 404) {
					setState("not-found")
					return
				}
				setErrorMessage("Something went wrong. Please try again.")
				setState("error")
			})

		return () => { cancelled = true }
	}, [clearAuth, router])

	if (state === "loading") return <ProfileSkeleton />

	if (state === "access-denied") {
		return (
			<div className="p-6 max-w-2xl mx-auto">
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<ShieldCheck size={32} className="mb-3 text-neutral-300" />
					<p className="text-sm font-semibold text-foreground">Access Denied</p>
					<p className="mt-1 text-xs text-neutral-light">
						You don&apos;t have permission to view this profile.
					</p>
				</div>
			</div>
		)
	}

	if (state === "not-found") {
		return (
			<div className="p-6 max-w-2xl mx-auto">
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<UserX size={32} className="mb-3 text-neutral-300" />
					<p className="text-sm font-semibold text-foreground">Profile Not Found</p>
					<p className="mt-1 text-xs text-neutral-light">
						Your admin profile could not be located.
					</p>
				</div>
			</div>
		)
	}

	if (state === "error") {
		return (
			<div className="p-6 max-w-2xl mx-auto">
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<AlertTriangle size={32} className="mb-3 text-neutral-300" />
					<p className="text-sm font-semibold text-foreground">Something went wrong</p>
					<p className="mt-1 text-xs text-neutral-light">
						{errorMessage ?? "Unable to load your profile."}
					</p>
				</div>
			</div>
		)
	}

	if (!profile) return null

	const initials = getInitials(profile.firstName, profile.lastName)
	const roleName = profile.role.name

	return (
		<div className="p-6 space-y-6 max-w-2xl mx-auto">
			{/* Page header */}
			<h1 className="text-base font-semibold text-foreground">My Profile</h1>

			{/* Profile card */}
			<div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
				{/* Avatar + name */}
				<div className="p-6 flex items-center gap-4 border-b border-neutral-100">
					{profile.avatarUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={profile.avatarUrl}
							alt={`${profile.firstName} ${profile.lastName}`}
							className="w-16 h-16 rounded-full object-cover shrink-0 border border-neutral-200"
						/>
					) : (
						<div className="w-16 h-16 rounded-full bg-brand-red text-white text-lg font-bold flex items-center justify-center shrink-0 select-none">
							{initials}
						</div>
					)}

					<div className="min-w-0">
						<p className="text-sm font-semibold text-foreground leading-none">
							{profile.firstName} {profile.lastName}
						</p>
						<div className="mt-1.5 flex items-center gap-2 flex-wrap">
							<span
								className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_STYLE[roleName]}`}
							>
								{ROLE_LABEL[roleName]}
							</span>
							<span
								className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
									profile.isActive
										? "bg-green-50 text-green-700"
										: "bg-neutral-100 text-neutral-500"
								}`}
							>
								{profile.isActive ? "Active" : "Inactive"}
							</span>
						</div>
					</div>
				</div>

				{/* Info rows */}
				<div className="px-6 divide-y divide-neutral-100">
					<InfoRow
						icon={Mail}
						label="Email"
						value={<span className="font-medium">{profile.email}</span>}
					/>

					<InfoRow
						icon={Phone}
						label="Phone"
						value={
							profile.phone ? (
								<span className="font-medium">{profile.phone}</span>
							) : (
								<span className="text-neutral-light italic">Not provided</span>
							)
						}
					/>

					<InfoRow
						icon={Calendar}
						label="Member since"
						value={formatDate(profile.createdAt)}
					/>

					<InfoRow
						icon={RefreshCw}
						label="Last updated"
						value={formatDate(profile.updatedAt)}
					/>
				</div>
			</div>
		</div>
	)
}
