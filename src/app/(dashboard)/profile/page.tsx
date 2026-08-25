"use client"

import PageHeader from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { getAdminProfile, type AdminProfile } from "@/lib/api/profile"
import { ROLE_LABEL, ROLE_STYLE } from "@/lib/constants/roles"
import { formatDateLong } from "@/lib/formatters"
import { useAuthStore } from "@/stores/auth.store"
import { firebaseAuth } from "@/lib/firebase/config"
import { sendPasswordResetEmail } from "firebase/auth"
import { toast } from "sonner"
import { AlertTriangle, KeyRound, Loader2, Pencil, ShieldCheck, UserX, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { EditProfileDrawer } from "@/components/profile/edit-profile-drawer"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

// Role badge

// Helpers

function getInitials(firstName: string, lastName: string): string {
	return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

// Skeleton

function ProfileSkeleton() {
	return (
		<div className="p-6 space-y-6 max-w-2xl mx-auto animate-pulse">
			<div className="h-5 w-32 bg-neutral-200 rounded" />
			<div className="bg-surface-canvas rounded-xl border border-border-default p-6 space-y-6">
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

// Page

type PageState = "loading" | "done" | "error" | "access-denied" | "not-found"

export default function ProfilePage() {
	const router = useRouter()
	const clearAuth = useAuthStore(s => s.clearAuth)

	const [state, setState] = useState<PageState>("loading")
	const [profile, setProfile] = useState<AdminProfile | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [resetting, setResetting] = useState(false)
	const [editOpen, setEditOpen] = useState(false)
	const [confirmOpen, setConfirmOpen] = useState(false)

	function handleSignOut() {
		clearAuth()
		router.replace("/login")
	}

	useEffect(() => {
		let cancelled = false

		setState("loading")
		setProfile(null)
		setErrorMessage(null)

		getAdminProfile()
			.then(data => {
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

		return () => {
			cancelled = true
		}
	}, [clearAuth, router])

	async function handleResetPassword() {
		if (!profile) return
		setResetting(true)
		try {
			await sendPasswordResetEmail(firebaseAuth, profile.email)
			toast.success("Password reset link sent to your email.")
		} catch {
			toast.error("Failed to send reset link. Please try again.")
		} finally {
			setResetting(false)
		}
	}

	if (state === "loading") return <ProfileSkeleton />

	if (state === "access-denied") {
		return (
			<div className="p-6 max-w-2xl mx-auto">
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<ShieldCheck size={32} className="mb-3 text-neutral-300" />
					<p className="text-sm font-semibold text-text-primary">Access Denied</p>
					<p className="mt-1 text-xs text-text-tertiary">
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
					<p className="text-sm font-semibold text-text-primary">Profile Not Found</p>
					<p className="mt-1 text-xs text-text-tertiary">
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
					<p className="text-sm font-semibold text-text-primary">Something went wrong</p>
					<p className="mt-1 text-xs text-text-tertiary">
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
		<div className="max-w-2xl mx-auto py-10 px-6 space-y-8">
			{/* Page Header */}
			<div className="space-y-1">
				<h1 className="text-[32px] font-black font-heading text-black tracking-tight leading-none">
					My Profile
				</h1>
				<p className="text-sm font-semibold text-black/50">
					Your admin identity and account details
				</p>
			</div>

			<EditProfileDrawer
				open={editOpen}
				profile={profile}
				onClose={() => setEditOpen(false)}
				onSaved={updated => setProfile(updated)}
			/>

			{/* Profile card: Yellow outer, white inner */}
			<div className="bg-[#FFC940] border-[3px] border-black rounded-[24px] p-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
				<div className="bg-white border-2 border-dashed border-black/10 rounded-[20px] p-6 flex flex-col gap-6">
					{/* Avatar + name */}
					<div className="flex items-center gap-4 pb-4 border-b border-dashed border-black/10">
						{profile.avatarUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={profile.avatarUrl}
								alt={`${profile.firstName} ${profile.lastName}`}
								className="w-16 h-16 rounded-2xl object-cover shrink-0 border-[3px] border-black bg-white"
							/>
						) : (
							<div className="w-16 h-16 rounded-2xl bg-white border-[3px] border-black text-black text-lg font-black flex items-center justify-center shrink-0 select-none">
								{initials}
							</div>
						)}

						<div className="min-w-0 flex flex-col gap-1.5">
							<p className="text-xl font-black text-black leading-none">
								{profile.firstName} {profile.lastName}
							</p>
							<div className="flex items-center gap-2 flex-wrap">
								<span className="inline-block bg-[#1E1B4B] text-white text-[8px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
									{ROLE_LABEL[roleName]}
								</span>
							</div>
						</div>
					</div>

					{/* Info rows */}
					<div className="flex flex-col gap-3">
						<div className="flex gap-2 text-sm font-semibold">
							<span className="text-black/50 w-28">Email ID :</span>
							<span className="text-[#6C32D1] font-bold truncate max-w-[280px]">
								{profile.email}
							</span>
						</div>

						<div className="flex gap-2 text-sm font-semibold">
							<span className="text-black/50 w-28">Phone No :</span>
							<span className="text-[#6C32D1] font-bold">
								{profile.phone || "Not specified"}
							</span>
						</div>

						<div className="flex gap-2 text-sm font-semibold">
							<span className="text-black/50 w-28">Member Since :</span>
							<span className="text-[#6C32D1] font-bold">
								{formatDateLong(profile.createdAt)}
							</span>
						</div>

						<div className="flex gap-2 text-sm font-semibold">
							<span className="text-black/50 w-28">Last Updated :</span>
							<span className="text-[#6C32D1] font-bold">
								{formatDateLong(profile.updatedAt)}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Options Menu List */}
			<div className="flex flex-col mt-6 divide-y divide-black/10">
				{/* Manage Admins \u2014 shown to anyone who can invite admins (Super Admin, Admin) */}
				{(profile.role.name === "SUPER_ADMIN" || profile.role.name === "CITY_ADMIN") && (
					<div className="flex items-center justify-between py-4 border-b border-black/10 hover:bg-black/[0.01]">
						<span className="font-heading font-black text-base text-black">Manage Admins</span>
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() => router.push("/admins")}
								className="bg-[#EE2C2C] text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none"
							>
								MANAGE NOW
							</button>
							<span className="text-black/50 font-black text-lg">&gt;</span>
						</div>
					</div>
				)}

				{/* Edit Profile */}
				<div className="flex items-center justify-between py-4 border-b border-black/10 hover:bg-black/[0.01]">
					<span className="font-heading font-black text-base text-black">Edit Profile</span>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => setEditOpen(true)}
							className="bg-[#EE2C2C] text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[#1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none"
						>
							EDIT DETAILS
						</button>
						<span className="text-black/50 font-black text-lg">&gt;</span>
					</div>
				</div>

				{/* Profile Actions */}
				<div className="flex items-center justify-between py-4">
					<span className="font-heading font-black text-base text-black">Profile Actions</span>
					<div className="flex items-center gap-3">
						<button
							onClick={handleResetPassword}
							disabled={resetting}
							className="bg-white border-[3px] border-black text-black rounded-2xl px-4 py-2 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all select-none"
						>
							{resetting ? "SENDING…" : "RESET PASSWORD"}
						</button>
						<button
							onClick={() => setConfirmOpen(true)}
							className="bg-[#EE2C2C] border-[3px] border-black text-white rounded-2xl px-4 py-2 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all select-none"
						>
							LOG OUT
						</button>
					</div>
				</div>
			</div>

			<ConfirmDialog
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				onConfirm={handleSignOut}
				title="Sign out"
				description="Are you sure you want to sign out?"
				confirmLabel="Sign out"
			/>
		</div>
	)
}
