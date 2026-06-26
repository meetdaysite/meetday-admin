"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import {
	MessageSquare,
	Rss,
	Megaphone,
	Users,
	CalendarDays,
	Shield,
	AlertTriangle,
	Link2,
	Copy,
	Loader2,
	Globe,
	ShieldCheck,
	Lock,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { updateCommunitySettings } from "@/lib/api/communities"
import { useCreateCommunityStore } from "@/stores/create-community.store"
import { FeatureToggleRow } from "../ui/feature-toggle-row"
import { PermissionRadioGroup } from "../ui/permission-radio-group"
import type { Step2Snapshot } from "@/stores/create-community.store"
import type { CommunityType } from "@/types"

const ACCESS_DISPLAY: Record<CommunityType, { label: string; desc: string; icon: React.ReactNode }> = {
	MEETDAY_MANAGED_PUBLIC: {
		label: "Public Community",
		desc: "Anyone can discover and join.",
		icon: <Globe size={16} className="text-[#7c3aed]" />,
	},
	HOST_LED: {
		label: "Approval Required",
		desc: "Members request access and admins approve.",
		icon: <ShieldCheck size={16} className="text-[#e65100]" />,
	},
	PRIVATE_INVITE_ONLY: {
		label: "Invite Only",
		desc: "Only invited users can join.",
		icon: <Lock size={16} className="text-[#1565c0]" />,
	},
}

const DEFAULT_VALUES: Step2Snapshot = {
	chatEnabled: true,
	feedEnabled: true,
	announcementsEnabled: true,
	memberDirectoryEnabled: true,
	experiencesTabEnabled: true,
	feedPosting: "ALL_MEMBERS",
	chat: "ALL_MEMBERS",
	spamDetection: true,
	toxicContentDetection: true,
	linkFiltering: true,
	duplicateContentDetection: true,
	reportThreshold: 5,
	dmPolicy: "EVERYONE",
	photoSharing: "REQUIRE_CONSENT_REMINDER",
}

export function Step2CommunityRules() {
	const store = useCreateCommunityStore()
	const [submitting, setSubmitting] = useState(false)
	const communityType = store.step1Data?.type ?? "MEETDAY_MANAGED_PUBLIC"
	const accessInfo = ACCESS_DISPLAY[communityType]

	const { control, handleSubmit, watch, setValue } = useForm<Step2Snapshot>({
		defaultValues: store.step2Snapshot ?? DEFAULT_VALUES,
	})

	const values = watch()

	const onSubmit = async (data: Step2Snapshot) => {
		if (!store.communityId) return
		setSubmitting(true)
		try {
			await updateCommunitySettings(store.communityId, {
				chatEnabled: data.chatEnabled,
				feedEnabled: data.feedEnabled,
				announcementsEnabled: data.announcementsEnabled,
				memberDirectoryEnabled: data.memberDirectoryEnabled,
				experiencesTabEnabled: data.experiencesTabEnabled,
				feedPosting: data.feedPosting,
				chat: data.chat,
				spamDetection: data.spamDetection,
				toxicContentDetection: data.toxicContentDetection,
				linkFiltering: data.linkFiltering,
				duplicateContentDetection: data.duplicateContentDetection,
				reportThreshold: data.reportThreshold,
				dmPolicy: data.dmPolicy,
				photoSharing: data.photoSharing,
			})
			store.setStep2Snapshot(data)
			store.nextStep()
		} catch {
			toast.error("Failed to save community rules. Please try again.")
		} finally {
			setSubmitting(false)
		}
	}

	const REPORT_THRESHOLD_OPTIONS = [3, 5, 10, 15, 20]

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
			{/* 1. Community Access (informational) */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<h2 className="text-label-md font-semibold text-text-primary mb-1">1. Community Access</h2>
				<p className="text-caption text-text-secondary mb-4">
					Determined by the community type selected in Step 1.
				</p>
				<div className="flex items-center gap-4 rounded-card border border-border-subtle bg-surface-card px-4 py-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-badge bg-surface-canvas border border-border-subtle">
						{accessInfo.icon}
					</div>
					<div>
						<p className="text-label-sm font-semibold text-text-primary">{accessInfo.label}</p>
						<p className="text-caption text-text-secondary">{accessInfo.desc}</p>
					</div>
					<span className="ml-auto rounded-badge border border-border-subtle bg-surface-canvas px-2 py-0.5 text-caption text-text-secondary">
						Set in Step 1
					</span>
				</div>
			</div>

			{/* 2. Community Features */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<h2 className="text-label-md font-semibold text-text-primary mb-1">2. Community Features</h2>
				<p className="text-caption text-text-secondary mb-4">
					Choose the features you want to enable.
				</p>
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{(
						[
							{
								name: "chatEnabled" as const,
								icon: <MessageSquare size={16} className="text-[#7c3aed]" />,
								bg: "bg-[#f0e6ff]",
								label: "Community Chat",
								desc: "Enable chat room for members",
							},
							{
								name: "feedEnabled" as const,
								icon: <Rss size={16} className="text-[#1565c0]" />,
								bg: "bg-[#e3f2fd]",
								label: "Community Feed",
								desc: "Allow members to create posts",
							},
							{
								name: "announcementsEnabled" as const,
								icon: <Megaphone size={16} className="text-[#e65100]" />,
								bg: "bg-[#fff3e0]",
								label: "Announcements",
								desc: "Admins & hosts can publish updates",
							},
							{
								name: "memberDirectoryEnabled" as const,
								icon: <Users size={16} className="text-[#2e7d32]" />,
								bg: "bg-[#e8f5e9]",
								label: "Member Directory",
								desc: "Allow members to browse members",
							},
							{
								name: "experiencesTabEnabled" as const,
								icon: <CalendarDays size={16} className="text-[#6a1b9a]" />,
								bg: "bg-[#f3e5f5]",
								label: "Experiences Tab",
								desc: "Show upcoming experiences",
							},
						] as const
					).map(feat => (
						<Controller
							key={feat.name}
							name={feat.name}
							control={control}
							render={({ field }) => (
								<FeatureToggleRow
									icon={feat.icon}
									iconBg={feat.bg}
									label={feat.label}
									description={feat.desc}
									checked={field.value as boolean}
									onCheckedChange={field.onChange}
								/>
							)}
						/>
					))}
				</div>
			</div>

			{/* 3. Posting & Chat Permissions */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<h2 className="text-label-md font-semibold text-text-primary mb-1">
					3. Posting & Chat Permissions
				</h2>
				<p className="text-caption text-text-secondary mb-4">
					Define who can interact in the community.
				</p>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<Controller
						name="feedPosting"
						control={control}
						render={({ field }) => (
							<PermissionRadioGroup
								name="feedPosting"
								label="Who can post in Feed?"
								value={field.value}
								onChange={field.onChange}
								options={[
									{ value: "ALL_MEMBERS", label: "All members" },
									{
										value: "ATTENDED_MEMBERS_ONLY",
										label: "Attended members only",
										description: "Ensures quality conversations and reduces spam.",
										recommended: true,
									},
									{ value: "ADMINS_ONLY", label: "Admins only" },
								]}
							/>
						)}
					/>
					<Controller
						name="chat"
						control={control}
						render={({ field }) => (
							<PermissionRadioGroup
								name="chat"
								label="Who can chat?"
								value={field.value}
								onChange={field.onChange}
								options={[
									{ value: "ALL_MEMBERS", label: "All members" },
									{
										value: "ATTENDED_MEMBERS_ONLY",
										label: "Attended members only",
										description: "Members can chat after attending an event.",
										recommended: true,
									},
									{ value: "ADMIN_APPROVAL_REQUIRED", label: "Admin approval required" },
								]}
							/>
						)}
					/>
				</div>
			</div>

			{/* 4. Moderation Settings */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<h2 className="text-label-md font-semibold text-text-primary mb-1">4. Moderation Settings</h2>
				<p className="text-caption text-text-secondary mb-4">Auto Moderation (AI-powered)</p>

				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mb-5">
					{(
						[
							{
								name: "spamDetection" as const,
								label: "Spam Detection",
								desc: "Detects and filters spam content",
								icon: <Shield size={14} className="text-[#2e7d32]" />,
							},
							{
								name: "toxicContentDetection" as const,
								label: "Toxic Content Detection",
								desc: "Flags harmful and abusive content",
								icon: <AlertTriangle size={14} className="text-[#e65100]" />,
							},
							{
								name: "linkFiltering" as const,
								label: "Link Filtering",
								desc: "Blocks suspicious links",
								icon: <Link2 size={14} className="text-[#1565c0]" />,
							},
							{
								name: "duplicateContentDetection" as const,
								label: "Duplicate Content Detection",
								desc: "Reduces repetitive posts",
								icon: <Copy size={14} className="text-[#7c3aed]" />,
							},
						] as const
					).map(mod => (
						<Controller
							key={mod.name}
							name={mod.name}
							control={control}
							render={({ field }) => (
								<label className="flex items-start gap-3 cursor-pointer rounded-card border border-border-subtle p-3">
									<Checkbox
										checked={field.value as boolean}
										onChange={checked => field.onChange(checked)}
									/>
									<div>
										<p className="text-label-sm font-medium text-text-primary">
											{mod.label}
										</p>
										<p className="text-caption text-text-secondary">{mod.desc}</p>
									</div>
								</label>
							)}
						/>
					))}
				</div>

				<div className="flex flex-col gap-2">
					<p className="text-label-sm font-semibold text-text-primary">Report Threshold</p>
					<p className="text-caption text-text-secondary">
						Auto-hide content after N reports by unique members
					</p>
					<Controller
						name="reportThreshold"
						control={control}
						render={({ field }) => (
							<select
								value={field.value}
								onChange={e => field.onChange(Number(e.target.value))}
								className="h-(--size-action-md) w-48 rounded-input border border-border-default bg-surface-canvas px-3 text-sm text-text-primary outline-none hover:border-border-strong focus:border-border-focused transition-colors"
							>
								{REPORT_THRESHOLD_OPTIONS.map(n => (
									<option key={n} value={n}>
										{n} reports
									</option>
								))}
							</select>
						)}
					/>
				</div>
			</div>

			{/* 5. Safety Settings */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<h2 className="text-label-md font-semibold text-text-primary mb-4">5. Safety Settings</h2>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<Controller
						name="dmPolicy"
						control={control}
						render={({ field }) => (
							<PermissionRadioGroup
								name="dmPolicy"
								label="Direct Messages"
								value={field.value}
								onChange={field.onChange}
								options={[
									{ value: "EVERYONE", label: "Everyone" },
									{ value: "MUTUAL_ATTENDEES_ONLY", label: "Mutual Event Attendees Only" },
									{ value: "DISABLED", label: "Disabled" },
								]}
							/>
						)}
					/>
					<Controller
						name="photoSharing"
						control={control}
						render={({ field }) => (
							<PermissionRadioGroup
								name="photoSharing"
								label="Photo Sharing"
								value={field.value}
								onChange={field.onChange}
								options={[
									{
										value: "REQUIRE_CONSENT_REMINDER",
										label: "Require consent reminder",
										description: "Show reminder before sharing photos.",
									},
									{ value: "OPEN", label: "Open sharing" },
									{ value: "DISABLED", label: "Disabled" },
								]}
							/>
						)}
					/>
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
					← Back
				</Button>
				<Button
					type="submit"
					variant="primary"
					size="md"
					radius="md"
					disabled={submitting}
					rightIcon={submitting ? <Loader2 size={15} className="animate-spin" /> : undefined}
				>
					{submitting ? "Saving..." : "Continue →"}
				</Button>
			</div>
		</form>
	)
}
