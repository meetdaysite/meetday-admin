"use client"

import { useState } from "react"
import { CheckCircle2, Pencil, Copy, Check, Loader2, Rocket, Globe, ShieldCheck, Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { publishCommunity } from "@/lib/api/communities"
import { useCreateCommunityStore } from "@/stores/create-community.store"
import type { CommunityType } from "@/types"

const TYPE_LABEL: Record<CommunityType, string> = {
	MEETDAY_MANAGED_PUBLIC: "Meetday Managed",
	HOST_LED: "Host Led",
	PRIVATE_INVITE_ONLY: "Private",
}
const ACCESS_LABEL: Record<CommunityType, { label: string; icon: React.ReactNode }> = {
	MEETDAY_MANAGED_PUBLIC: { label: "Public Community", icon: <Globe size={12} /> },
	HOST_LED: { label: "Approval Required", icon: <ShieldCheck size={12} /> },
	PRIVATE_INVITE_ONLY: { label: "Invite Only", icon: <Lock size={12} /> },
}

function EditLink({ step, label }: { step: number; label: string }) {
	const { goToStep } = useCreateCommunityStore()
	return (
		<button
			type="button"
			onClick={() => goToStep(step)}
			className="flex items-center gap-1 text-caption text-text-brand hover:text-text-primary transition-colors"
		>
			<Pencil size={10} />
			{label}
		</button>
	)
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
	return (
		<div className="flex items-center gap-2">
			<CheckCircle2 size={14} className={done ? "text-[#16a34a]" : "text-border-subtle"} />
			<span className={done ? "text-caption text-text-secondary" : "text-caption text-text-secondary"}>
				{label}
			</span>
		</div>
	)
}

export function Step5ReviewPublish() {
	const store = useCreateCommunityStore()
	const [publishing, setPublishing] = useState(false)
	const [urlCopied, setUrlCopied] = useState(false)

	const { step1Data: s1, step2Snapshot: s2, step3Snapshot: s3, step4Snapshot: s4, communityId } = store

	if (!s1) return null

	const slug = s1.slug
	const communityUrl = `meetday.ai/communities/${slug}`
	const communityType = s1.type

	const copyUrl = () => {
		navigator.clipboard.writeText(communityUrl)
		setUrlCopied(true)
		setTimeout(() => setUrlCopied(false), 2000)
	}

	const checklist = [
		{ label: "Community name added", done: !!s1.name },
		{ label: "Description completed", done: !!s1.description },
		{ label: "Community rules configured", done: !!s2 },
		{ label: "Experience mapping completed", done: !!s3 },
		{ label: "Managers and roles assigned", done: !!s4 },
	]
	const allDone = checklist.every(c => c.done)

	const onPublish = async () => {
		if (!communityId) return
		setPublishing(true)
		try {
			await publishCommunity(communityId)
			store.nextStep() // â†’ success screen (step 6)
		} catch {
			toast.error("Failed to publish community. Please try again.")
		} finally {
			setPublishing(false)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Two-column layout */}
			<div className="flex gap-6">
				{/* Left: summary */}
				<div className="flex-1 min-w-0 flex flex-col gap-6">
					{/* 1. Community Preview */}
					<div className="rounded-panel border border-border-subtle bg-surface-canvas shadow-card overflow-hidden">
						<div className="h-40 bg-linear-to-br from-[#1a0533] to-[#4c1d95] relative">
							{s1.coverImageUrl && (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={s1.coverImageUrl}
									alt="Cover"
									className="h-full w-full object-cover"
								/>
							)}
							<div className="absolute -bottom-6 left-6">
								<div className="h-14 w-14 rounded-full border-2 border-white bg-surface-card overflow-hidden shadow-card">
									{s1.iconUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={s1.iconUrl}
											alt="Icon"
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="h-full w-full bg-linear-to-br from-[#4c1d95] to-[#db2777]" />
									)}
								</div>
							</div>
						</div>
						<div className="px-6 pt-10 pb-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<h1 className="text-xl font-bold text-text-primary">{s1.name}</h1>
									<div className="mt-1.5 flex flex-wrap gap-1.5">
										<span className="rounded-badge bg-[#f0e6ff] px-1.5 py-0.5 text-[11px] font-semibold leading-none text-[#7c3aed]">
											{TYPE_LABEL[communityType]}
										</span>
										<span className="flex items-center gap-1 rounded-badge bg-[#e8f5e9] px-1.5 py-0.5 text-[11px] font-semibold leading-none text-[#2e7d32]">
											{ACCESS_LABEL[communityType].icon}
											{ACCESS_LABEL[communityType].label}
										</span>
									</div>
								</div>
							</div>
							<p className="mt-3 text-sm text-text-secondary leading-relaxed">
								{s1.description}
							</p>
							<div className="mt-4 grid grid-cols-3 gap-3 border-t border-border-subtle pt-4 text-center">
								{[
									{ label: "Members", value: "0" },
									{ label: "Cities", value: s3?.cities.join(", ") ?? s1.primaryCity },
									{ label: "Visibility", value: ACCESS_LABEL[communityType].label },
								].map(stat => (
									<div key={stat.label}>
										<p className="text-label-sm font-semibold text-text-primary">
											{stat.value}
										</p>
										<p className="text-caption text-text-secondary">{stat.label}</p>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* 2. Configuration Summary */}
					<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
						<h2 className="text-label-md font-semibold text-text-primary mb-4">
							2. Configuration Summary
						</h2>
						<div className="grid grid-cols-2 gap-3">
							{/* Community Details */}
							<div className="rounded-card border border-border-subtle bg-surface-card p-4 flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<p className="text-label-sm font-semibold text-text-primary">
										Community Details
									</p>
									<EditLink step={1} label="Edit" />
								</div>
								<div className="flex flex-col gap-2 text-caption text-text-secondary">
									<div>
										<p className="text-[10px] font-medium uppercase tracking-wide mb-0.5">
											Category
										</p>
										<p>{s1.categoryName || "â€”"}</p>
									</div>
									<div>
										<p className="text-[10px] font-medium uppercase tracking-wide mb-1">
											Interests
										</p>
										<div className="flex flex-wrap gap-1">
											{s1.interestTags.slice(0, 5).map(t => (
												<span
													key={t}
													className="rounded-badge bg-surface-canvas border border-border-subtle px-1.5 py-0.5 text-[10px]"
												>
													{t}
												</span>
											))}
											{s1.interestTags.length > 5 && (
												<span className="text-[10px]">
													+{s1.interestTags.length - 5} more
												</span>
											)}
										</div>
									</div>
									{s3 && (
										<div>
											<p className="text-[10px] font-medium uppercase tracking-wide mb-1">
												Cities
											</p>
											<div className="flex flex-wrap gap-1">
												{s3.cities.map(c => (
													<span
														key={c}
														className="rounded-badge bg-surface-canvas border border-border-subtle px-1.5 py-0.5 text-[10px]"
													>
														{c}
													</span>
												))}
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Community Rules */}
							<div className="rounded-card border border-border-subtle bg-surface-card p-4 flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<p className="text-label-sm font-semibold text-text-primary">
										Community Rules
									</p>
									<EditLink step={2} label="Edit" />
								</div>
								{s2 ? (
									<div className="flex flex-col gap-1.5 text-caption text-text-secondary">
										{[
											{ label: ACCESS_LABEL[communityType].label, done: true },
											{ label: "Community Chat", done: s2.chatEnabled },
											{ label: "Community Feed", done: s2.feedEnabled },
											{ label: "Announcements", done: s2.announcementsEnabled },
											{ label: "Member Directory", done: s2.memberDirectoryEnabled },
											{ label: "Experiences Tab", done: s2.experiencesTabEnabled },
											{
												label: "Auto Moderation",
												done: s2.spamDetection || s2.toxicContentDetection,
											},
										].map(item => (
											<div key={item.label} className="flex items-center gap-1.5">
												<CheckCircle2
													size={13}
													className={
														item.done ? "text-[#16a34a]" : "text-border-subtle"
													}
												/>
												{item.label}
											</div>
										))}
										<div className="mt-1 pt-2 border-t border-border-subtle flex flex-col gap-0.5">
											<p>Report threshold: {s2.reportThreshold} reports</p>
											<p>
												DMs:{" "}
												{s2.dmPolicy === "MUTUAL_ATTENDEES_ONLY"
													? "Mutual Attendees Only"
													: s2.dmPolicy}
											</p>
										</div>
									</div>
								) : (
									<p className="text-caption text-text-secondary italic">Not configured</p>
								)}
							</div>

							{/* Experience Mapping */}
							<div className="rounded-card border border-border-subtle bg-surface-card p-4 flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<p className="text-label-sm font-semibold text-text-primary">
										Experience Mapping
									</p>
									<EditLink step={3} label="Edit" />
								</div>
								{s3 ? (
									<div className="flex flex-col gap-1.5 text-caption text-text-secondary">
										<p>
											{s3.interests.length} interest
											{s3.interests.length !== 1 ? "s" : ""} selected
										</p>
										<p>{s3.cities.length} {s3.cities.length !== 1 ? "cities" : "city"}</p>
									</div>) : (
									<p className="text-caption text-text-secondary italic">Not configured</p>
								)}
							</div>

							{/* Managers */}
							<div className="rounded-card border border-border-subtle bg-surface-card p-4 flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<p className="text-label-sm font-semibold text-text-primary">
										Managers & Moderators
									</p>
									<EditLink step={4} label="Edit" />
								</div>
								{s4 ? (
									<div className="flex flex-col gap-1.5 text-caption text-text-secondary">
										<div className="flex items-center justify-between">
											<p>Owner</p>
											<span className="font-semibold text-text-primary">1</span>
										</div>
										<div className="flex items-center justify-between">
											<p>Managers</p>
											<span className="font-semibold text-text-primary">
												{s4.managers.length}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<p>Approved Hosts</p>
											<span className="font-semibold text-text-primary">
												{s4.hosts.length}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<p>Moderators</p>
											<span className="font-semibold text-text-primary">
												{s4.moderators.length}
											</span>
										</div>
									</div>
								) : (
									<p className="text-caption text-text-secondary italic">Not configured</p>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Right: checklist + publish info */}
				<div className="w-72 shrink-0 flex flex-col gap-4">
					{/* Pre-Publish Checklist */}
					<div className="rounded-panel border border-border-subtle bg-surface-canvas p-5 shadow-card">
						<p className="text-label-sm font-semibold text-text-primary mb-3">
							Pre-Publish Checklist
						</p>
						<div className="flex flex-col gap-2">
							{checklist.map(item => (
								<ChecklistItem key={item.label} done={item.done} label={item.label} />
							))}
						</div>
					</div>

					{/* What Happens After */}
					<div className="rounded-panel border border-border-subtle bg-surface-canvas p-5 shadow-card">
						<div className="flex items-center gap-2 mb-3">
							<Rocket size={15} className="text-[#dc2626]" />
							<p className="text-label-sm font-semibold text-text-primary">
								What Happens After Publish?
							</p>
						</div>
						<div className="flex flex-col gap-1.5">
							{[
								"Community becomes discoverable to users.",
								"Members can join and start interacting.",
								"Chat, Feed and Announcements go live.",
								"Community URL is created and active.",
							].map(item => (
								<p
									key={item}
									className="text-caption text-text-secondary flex items-start gap-1.5"
								>
									<span className="mt-0.5">â€¢</span>
									{item}
								</p>
							))}
						</div>
					</div>

					{/* Community URL */}
					<div className="rounded-panel border border-border-subtle bg-surface-canvas p-5 shadow-card">
						<p className="text-label-sm font-semibold text-text-primary mb-2">
							Community URL (Preview)
						</p>
						<div className="flex items-center gap-2 rounded-input border border-border-subtle bg-surface-card px-3 py-2">
							<span className="text-caption text-text-secondary flex-1 truncate">
								{communityUrl}
							</span>
							<button
								type="button"
								onClick={copyUrl}
								className="shrink-0 text-icon-secondary hover:text-icon-primary transition-colors"
							>
								{urlCopied ? (
									<Check size={13} className="text-[#16a34a]" />
								) : (
									<Copy size={13} />
								)}
							</button>
						</div>
					</div>

					{/* Visibility */}
					<div className="rounded-panel border border-border-subtle bg-surface-canvas p-5 shadow-card">
						<p className="text-label-sm font-semibold text-text-primary mb-1">Visibility</p>
						<div className="flex items-center gap-1.5 text-label-sm text-text-secondary">
							{ACCESS_LABEL[communityType].icon}
							{ACCESS_LABEL[communityType].label}
						</div>
						<p className="mt-0.5 text-caption text-text-secondary">
							Anyone can discover and join this community.
						</p>
					</div>

					{/* Ready to publish */}
					{allDone && (
						<div className="rounded-panel border border-[#e8f5e9] bg-[#f0fdf4] p-5 shadow-card">
							<div className="flex items-center gap-2">
								<CheckCircle2 size={16} className="text-[#16a34a]" />
								<p className="text-label-sm font-semibold text-[#16a34a]">Ready To Publish</p>
							</div>
							<p className="mt-0.5 text-caption text-[#166534]">
								Everything looks good! You can publish now.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between">
				<Button
					type="button"
					variant="secondary"
					size="md"
					radius="md"
					onClick={() => store.prevStep()}
				>
					â† Back
				</Button>
				<Button
					type="button"
					variant="primary"
					size="md"
					radius="md"
					disabled={publishing}
					onClick={onPublish}
					rightIcon={
						publishing ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />
					}
				>
					{publishing ? "Publishing..." : "Publish Community"}
				</Button>
			</div>
		</div>
	)
}
