"use client"

import { Eye, Users, CalendarDays, MapPin, MessageSquare, Star, Globe, Lock, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreateCommunityStore } from "@/stores/create-community.store"
import type { CommunityType } from "@/types"

const TYPE_LABEL: Record<CommunityType, { label: string; badge: string }> = {
	MEETDAY_MANAGED_PUBLIC: { label: "Meetday Managed", badge: "bg-[#f0e6ff] text-[#7c3aed]" },
	HOST_LED: { label: "Host Led", badge: "bg-[#fff3e0] text-[#e65100]" },
	PRIVATE_INVITE_ONLY: { label: "Private", badge: "bg-[#e3f2fd] text-[#1565c0]" },
}

const ACCESS_INFO: Record<CommunityType, { label: string; icon: React.ReactNode }> = {
	MEETDAY_MANAGED_PUBLIC: { label: "Public Community", icon: <Globe size={12} /> },
	HOST_LED: { label: "Approval Required", icon: <ShieldCheck size={12} /> },
	PRIVATE_INVITE_ONLY: { label: "Invite Only", icon: <Lock size={12} /> },
}

const HIGHLIGHTS = [
	{ icon: <MessageSquare size={13} />, label: "Community chat & discussions" },
	{ icon: <CalendarDays size={13} />, label: "Event updates & announcements" },
	{ icon: <Users size={13} />, label: "Connect with like-minded people" },
	{ icon: <Star size={13} />, label: "Rewards and exclusive perks" },
]

export function CommunityPreviewPanel() {
	const { preview, currentStep, step2Snapshot } = useCreateCommunityStore()

	const typeInfo = preview.type ? TYPE_LABEL[preview.type] : null
	const accessInfo = preview.type ? ACCESS_INFO[preview.type] : null

	const enabledFeatures = step2Snapshot
		? [
				step2Snapshot.chatEnabled && "Chat",
				step2Snapshot.feedEnabled && "Feed",
				step2Snapshot.announcementsEnabled && "Announcements",
				step2Snapshot.memberDirectoryEnabled && "Member Directory",
				step2Snapshot.experiencesTabEnabled && "Experiences Tab",
			].filter(Boolean)
		: null

	return (
		<div className="sticky top-6 flex flex-col gap-0 rounded-panel border border-border-subtle bg-surface-canvas shadow-card overflow-hidden">
			<div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
				<Eye size={15} className="text-icon-secondary" />
				<p className="text-label-sm font-semibold text-text-primary">Community Preview</p>
			</div>

			{/* Cover image */}
			<div className="relative h-32 bg-linear-to-br from-[#1a0533] to-[#4c1d95] overflow-hidden">
				{preview.coverImageUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={preview.coverImageUrl} alt="Cover" className="h-full w-full object-cover" />
				) : (
					<div className="h-full w-full" />
				)}

				{/* Icon */}
				<div className="absolute -bottom-5 left-4">
					<div className="h-12 w-12 rounded-full border-2 border-white bg-surface-card overflow-hidden shadow-card">
						{preview.iconUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={preview.iconUrl} alt="Icon" className="h-full w-full object-cover" />
						) : (
							<div className="h-full w-full bg-linear-to-br from-[#4c1d95] to-[#db2777]" />
						)}
					</div>
				</div>
			</div>

			<div className="px-4 pt-8 pb-4 flex flex-col gap-3">
				{/* Name + badges */}
				<div>
					<h3 className="text-label-md font-bold text-text-primary leading-tight">
						{preview.name || "Community Name"}
					</h3>
					{typeInfo && (
						<div className="mt-1.5 flex flex-wrap gap-1.5">
							<span
								className={cn(
									"rounded-badge px-1.5 py-0.5 text-[11px] font-semibold leading-none",
									typeInfo.badge,
								)}
							>
								{typeInfo.label}
							</span>
							{accessInfo && (
								<span className="flex items-center gap-1 rounded-badge bg-[#e8f5e9] px-1.5 py-0.5 text-[11px] font-semibold leading-none text-[#2e7d32]">
									{accessInfo.icon}
									{accessInfo.label}
								</span>
							)}
						</div>
					)}
				</div>

				{/* Description */}
				<p className="text-caption text-text-secondary leading-relaxed line-clamp-3">
					{preview.description || "Community description will appear here."}
				</p>

				{/* Stats */}
				<div className="grid grid-cols-3 gap-2 border-t border-border-subtle pt-3">
					<div className="flex flex-col items-center gap-0.5">
						<Users size={14} className="text-icon-secondary" />
						<span className="text-label-sm font-bold text-text-primary">0</span>
						<span className="text-[10px] text-text-secondary">Members</span>
					</div>
					<div className="flex flex-col items-center gap-0.5">
						<CalendarDays size={14} className="text-icon-secondary" />
						<span className="text-label-sm font-bold text-text-primary">0</span>
						<span className="text-[10px] text-text-secondary">Experiences</span>
					</div>
					<div className="flex flex-col items-center gap-0.5">
						<MapPin size={14} className="text-icon-secondary" />
						<span className="text-label-sm font-bold text-text-primary truncate max-w-full text-center">
							{preview.primaryCity || "â€”"}
						</span>
						<span className="text-[10px] text-text-secondary">City</span>
					</div>
				</div>

				{/* Step 1: Highlights; Steps 2+: feature summary */}
				{currentStep === 1 && (
					<div className="border-t border-border-subtle pt-3">
						<p className="text-caption font-semibold text-text-secondary mb-2">
							Highlights (preview)
						</p>
						<div className="flex flex-col gap-1.5">
							{HIGHLIGHTS.map(h => (
								<div key={h.label} className="flex items-center gap-2 text-text-secondary">
									<span className="text-icon-secondary">{h.icon}</span>
									<span className="text-caption">{h.label}</span>
								</div>
							))}
						</div>
					</div>
				)}

				{currentStep >= 2 && step2Snapshot && enabledFeatures && (
					<div className="border-t border-border-subtle pt-3">
						<p className="text-caption font-semibold text-text-secondary mb-2">
							Features Enabled
						</p>
						<div className="flex flex-col gap-1">
							{enabledFeatures.map(f => (
								<div
									key={String(f)}
									className="flex items-center gap-1.5 text-caption text-text-secondary"
								>
									<div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
									{f}
								</div>
							))}
						</div>
					</div>
				)}

				{currentStep >= 2 && step2Snapshot && (
					<div className="border-t border-border-subtle pt-3 flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<span className="text-caption text-text-secondary">Access</span>
							<span className="text-caption font-medium text-text-secondary flex items-center gap-1">
								{accessInfo?.icon}
								{accessInfo?.label ?? "â€”"}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-caption text-text-secondary">Moderation</span>
							<span className="text-caption font-medium text-[#22c55e]">Active</span>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
