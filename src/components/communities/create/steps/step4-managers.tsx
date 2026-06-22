"use client"

import { useCallback, useState } from "react"
import { ShieldCheck, Crown, Star, Users, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { getAdmins } from "@/lib/api/admins"
import { getHosts } from "@/lib/api/hosts"
import { assignCommunityMember } from "@/lib/api/communities"
import { useCreateCommunityStore } from "@/stores/create-community.store"
import { useAuthStore } from "@/stores/auth.store"
import { MemberRoleSection } from "../ui/member-role-section"
import type { AssignedMember } from "@/stores/create-community.store"

function initials(name: string) {
	return name
		.split(" ")
		.map((p) => p[0])
		.join("")
		.toUpperCase()
		.slice(0, 2)
}

const AVATAR_COLORS = ["#7c3aed", "#1565c0", "#2e7d32", "#e65100", "#c62828", "#0097a7"]
function colorFor(id: string) {
	let hash = 0
	for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const PERMISSION_GUIDE = [
	{
		role: "Owner",
		icon: <Crown size={14} />,
		iconBg: "bg-[#fff5f5]",
		iconColor: "text-[#dc2626]",
		perms: ["Full control over community", "Manage managers & roles", "Delete or transfer ownership"],
	},
	{
		role: "Manager",
		icon: <Crown size={14} />,
		iconBg: "bg-[#e3f2fd]",
		iconColor: "text-[#1565c0]",
		perms: ["Edit community details", "Publish announcements", "Manage members & settings"],
	},
	{
		role: "Host",
		icon: <Star size={14} />,
		iconBg: "bg-[#fff3e0]",
		iconColor: "text-[#e65100]",
		perms: ["Create experiences", "Manage own events", "View attendees & stats"],
	},
	{
		role: "Moderator",
		icon: <ShieldCheck size={14} />,
		iconBg: "bg-[#e8f5e9]",
		iconColor: "text-[#2e7d32]",
		perms: ["Review posts & comments", "Handle reports", "Moderate chats"],
	},
]

export function Step4Managers() {
	const store = useCreateCommunityStore()
	const user = useAuthStore((s) => s.user)
	const [submitting, setSubmitting] = useState(false)

	const snap = store.step4Snapshot
	const [managers, setManagers] = useState<AssignedMember[]>(snap?.managers ?? [])
	const [hosts, setHosts] = useState<AssignedMember[]>(snap?.hosts ?? [])
	const [moderators, setModerators] = useState<AssignedMember[]>(snap?.moderators ?? [])

	const fetchAdmins = useCallback(async (query: string) => {
		const res = await getAdmins({ limit: 20 })
		return res.admins
			.filter((a) =>
				`${a.firstName} ${a.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
				a.email.toLowerCase().includes(query.toLowerCase()),
			)
			.map((a) => ({
				id: a.id,
				name: `${a.firstName} ${a.lastName}`,
				email: a.email,
				avatarInitial: initials(`${a.firstName} ${a.lastName}`),
				avatarColor: colorFor(a.id),
			}))
	}, [])

	const fetchHosts = useCallback(async (query: string) => {
		const res = await getHosts({ limit: 20 })
		return res.hosts
			.filter((h) =>
				h.displayName.toLowerCase().includes(query.toLowerCase()),
			)
			.map((h) => ({
				id: h.id,
				name: h.displayName,
				email: h.hostType,
				avatarInitial: initials(h.displayName),
				avatarColor: colorFor(h.id),
			}))
	}, [])

	const onContinue = async () => {
		if (!store.communityId) return
		setSubmitting(true)

		const allAssignments: AssignedMember[] = [...managers, ...hosts, ...moderators]
		const results = await Promise.allSettled(
			allAssignments.map((m) =>
				assignCommunityMember(store.communityId!, { userId: m.userId, role: m.role }),
			),
		)

		const failed = results.filter((r) => r.status === "rejected").length
		if (failed > 0) {
			toast.warning(`${failed} assignment(s) failed — they were skipped.`)
		}

		store.setStep4Snapshot({ managers, hosts, moderators })
		store.nextStep()
		setSubmitting(false)
	}

	const ownerName = user ? `${(user as { firstName?: string }).firstName ?? ""} ${(user as { lastName?: string }).lastName ?? ""}`.trim() || user.email : "You"
	const ownerInitial = initials(ownerName || "O")

	return (
		<div className="flex flex-col gap-6">
			{/* 1. Owner */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<h2 className="text-label-md font-semibold text-text-primary mb-1">1. Community Owner</h2>
				<p className="text-caption text-text-secondary mb-4">The owner has full control over the community, settings and members.</p>
				<div className="flex items-center gap-3 rounded-card border border-border-subtle bg-surface-card px-4 py-3">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-sm font-bold text-white">
						{ownerInitial}
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-label-sm font-semibold text-text-primary">{ownerName}</p>
					</div>
					<span className="rounded-badge bg-[#fff5f5] px-1.5 py-0.5 text-[11px] font-semibold leading-none text-[#dc2626]">
						Owner
					</span>
					<span className="text-caption text-text-secondary hidden sm:block">Full Access (All Permissions)</span>
				</div>
			</div>

			{/* 2. Managers */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<h2 className="text-label-md font-semibold text-text-primary mb-1">2. Community Managers</h2>
				<p className="text-caption text-text-secondary mb-4">Managers can edit community details, publish announcements and manage members.</p>
				<MemberRoleSection
					role="MANAGER"
					roleLabel="Manager"
					roleBadgeClass="bg-[#e3f2fd] text-[#1565c0]"
					permissionLabel="Edit Community, Announcements, Members"
					members={managers}
					onAdd={(m) => setManagers((prev) => [...prev, m])}
					onRemove={(id) => setManagers((prev) => prev.filter((m) => m.userId !== id))}
					fetchUsers={fetchAdmins}
					addLabel="Add Manager"
				/>
			</div>

			{/* 3. Hosts */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<h2 className="text-label-md font-semibold text-text-primary mb-1">3. Approved Hosts</h2>
				<p className="text-caption text-text-secondary mb-4">Hosts can create and manage experiences attached to this community.</p>
				<MemberRoleSection
					role="HOST"
					roleLabel="Host"
					roleBadgeClass="bg-[#fff3e0] text-[#e65100]"
					permissionLabel="Create & Manage Experiences"
					members={hosts}
					onAdd={(m) => setHosts((prev) => [...prev, m])}
					onRemove={(id) => setHosts((prev) => prev.filter((m) => m.userId !== id))}
					fetchUsers={fetchHosts}
					addLabel="Add Host"
				/>
			</div>

			{/* 4. Moderators */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<h2 className="text-label-md font-semibold text-text-primary mb-1">4. Moderators</h2>
				<p className="text-caption text-text-secondary mb-4">Moderators can review content, reports and manage community safety.</p>
				<MemberRoleSection
					role="MODERATOR"
					roleLabel="Moderator"
					roleBadgeClass="bg-[#e8f5e9] text-[#2e7d32]"
					permissionLabel="Review Posts, Reports, Chat Moderation"
					members={moderators}
					onAdd={(m) => setModerators((prev) => [...prev, m])}
					onRemove={(id) => setModerators((prev) => prev.filter((m) => m.userId !== id))}
					fetchUsers={fetchAdmins}
					addLabel="Add Moderator"
				/>
			</div>

			{/* 5. Permission Guide */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<h2 className="text-label-md font-semibold text-text-primary mb-3">5. Permission Guide</h2>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{PERMISSION_GUIDE.map((g) => (
						<div key={g.role} className="rounded-card border border-border-subtle p-3">
							<div className={`flex h-8 w-8 items-center justify-center rounded-full mb-2 ${g.iconBg}`}>
								<span className={g.iconColor}>{g.icon}</span>
							</div>
							<p className="text-label-sm font-semibold text-text-primary mb-1.5">{g.role}</p>
							{g.perms.map((p) => (
								<p key={p} className="text-caption text-text-secondary flex items-start gap-1 mb-0.5">
									<span className="mt-0.5 shrink-0">•</span>{p}
								</p>
							))}
						</div>
					))}
				</div>
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between">
				<Button type="button" variant="secondary" size="md" radius="md" onClick={() => store.prevStep()}>
					← Back
				</Button>
				<Button
					type="button"
					variant="primary"
					size="md"
					radius="md"
					disabled={submitting}
					onClick={onContinue}
					rightIcon={submitting ? <Loader2 size={15} className="animate-spin" /> : undefined}
				>
					{submitting ? "Saving..." : "Continue →"}
				</Button>
			</div>
		</div>
	)
}
