"use client"

import { useCallback, useEffect, useState } from "react"
import {
	Plus,
	Megaphone,
	Calendar,
	FileText,
	Eye,
	Mail,
	MousePointer,
	Pencil,
	Copy,
	Trash2,
	Pin,
	ChevronLeft,
	ChevronRight,
	ClipboardCopy,
	Share2,
	CalendarPlus,
	MessageSquare,
	Download,
	Users,
	Upload,
	Bold,
	Italic,
	Underline,
	Strikethrough,
	List,
	ListOrdered,
	Link,
	Image,
	Smile,
	Undo,
	Redo,
	CheckCircle2,
	Bell,
	Send,
	ArrowRight,
	ThumbsUp,
	BarChart2,
	LayoutDashboard,
	type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { StatCard } from "@/components/dashboard/stat-card"
import {
	getCommunityAnnouncementsTab,
	createCommunityAnnouncement,
	deleteCommunityAnnouncement,
	pinCommunityAnnouncement,
	unpinCommunityAnnouncement,
	type AnnouncementsTabData,
	type AnnouncementItem,
	type AnnouncementStatus,
} from "@/lib/api/communities"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type TabView = "list" | "create" | "success"

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<AnnouncementStatus, string> = {
	Published: "bg-green-100 text-green-700",
	Scheduled: "bg-blue-100 text-blue-700",
	Draft: "bg-neutral-100 text-neutral-600",
}

const ROLE_BADGE: Record<string, string> = {
	Owner: "bg-amber-100 text-amber-700",
	Manager: "bg-purple-100 text-purple-700",
	Moderator: "bg-green-100 text-green-700",
}

const SIDEBAR_QUICK_ACTIONS: { label: string; icon: LucideIcon; bg: string; color: string }[] = [
	{ label: "Create Announcement", icon: Megaphone, bg: "bg-red-50", color: "text-red-500" },
	{ label: "Schedule Event", icon: CalendarPlus, bg: "bg-purple-50", color: "text-purple-500" },
	{ label: "Post in Community", icon: MessageSquare, bg: "bg-green-50", color: "text-green-500" },
	{ label: "Export Members", icon: Download, bg: "bg-blue-50", color: "text-blue-500" },
]

const MANAGERS_SIDEBAR = [
	{ name: "Arjun Mehta", initial: "A", color: "#f59e0b", role: "Owner" },
	{ name: "Riya Banerjee", initial: "R", color: "#ec4899", role: "Manager" },
	{ name: "Kabir Shah", initial: "K", color: "#6366f1", role: "Manager" },
	{ name: "Ishita Dey", initial: "I", color: "#a855f7", role: "Moderator" },
	{ name: "Manav Sinha", initial: "M", color: "#22c55e", role: "Moderator" },
]

type FilterStatus = "All Announcements" | "Published" | "Scheduled" | "Draft"
type SortMode = "Newest First" | "Oldest First" | "Most Views"
const PAGE_SIZE = 10

// ─── Announcement Row ─────────────────────────────────────────────────────────

function AnnouncementRow({
	item,
	onPin,
	onUnpin,
	onDelete,
}: {
	item: AnnouncementItem
	onPin: (id: string) => void
	onUnpin: (id: string) => void
	onDelete: (id: string) => void
}) {
	const isPublished = item.status === "Published"
	const isScheduled = item.status === "Scheduled"

	return (
		<div className="flex items-start gap-4 rounded-xl border border-border-default bg-surface-card p-4">
			<div className="h-24 w-20 shrink-0 rounded-lg" style={{ background: item.imageGradient }} />
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1.5 mb-1">
					<h4 className="text-sm font-semibold text-text-primary">{item.title}</h4>
					{item.isPinned && (
						<span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
							<Pin size={8} /> Pinned
						</span>
					)}
				</div>
				<div className="flex items-center gap-2 mb-2">
					<span
						className={cn(
							"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
							STATUS_BADGE[item.status],
						)}
					>
						{item.status}
					</span>
					<span className="text-[11px] text-text-tertiary">• {item.audience}</span>
				</div>
				<p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-2">
					{item.content}
				</p>
				{isScheduled && item.scheduledFor && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
							<Calendar size={11} className="shrink-0" />
							<span>
								Scheduled for{" "}
								<span className="font-medium text-text-secondary">{item.scheduledFor}</span>
							</span>
						</div>
						{item.estimatedReach && (
							<div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
								<Eye size={11} className="shrink-0" />
								<span>
									Estimated Reach{" "}
									<span className="font-medium text-text-secondary">
										{item.estimatedReach}
									</span>
								</span>
							</div>
						)}
					</div>
				)}
				{isPublished && item.timeAgo && (
					<div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
						<div
							className="h-4 w-4 shrink-0 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
							style={{ backgroundColor: item.authorAvatarColor }}
						>
							{item.authorInitial}
						</div>
						<span>
							By {item.authorName} • {item.timeAgo}
						</span>
					</div>
				)}
			</div>
			{isPublished && item.views !== null && (
				<div className="hidden md:flex items-center gap-6 shrink-0 pr-2">
					<div className="flex flex-col items-center gap-0.5">
						<div className="flex items-center gap-1 text-text-secondary">
							<Eye size={13} />
							<span className="text-sm font-bold text-text-primary">
								{item.views >= 1000 ? `${(item.views / 1000).toFixed(1)}K` : item.views}
							</span>
						</div>
						<span className="text-[10px] text-text-tertiary">Views</span>
					</div>
					<div className="flex flex-col items-center gap-0.5">
						<div className="flex items-center gap-1 text-text-secondary">
							<Mail size={13} />
							<span className="text-sm font-bold text-text-primary">{item.opens}</span>
						</div>
						<span className="text-[10px] text-text-tertiary">Opens</span>
					</div>
					<div className="flex flex-col items-center gap-0.5">
						<div className="flex items-center gap-1 text-text-secondary">
							<MousePointer size={13} />
							<span className="text-sm font-bold text-text-primary">{item.clicks}</span>
						</div>
						<span className="text-[10px] text-text-tertiary">Clicks</span>
					</div>
				</div>
			)}
			{isScheduled && item.scheduledFor && (
				<div className="hidden md:flex flex-col gap-1.5 shrink-0 pr-2 min-w-35">
					<div className="text-[11px] text-text-tertiary">Scheduled for</div>
					<div className="text-xs font-semibold text-text-primary">{item.scheduledFor}</div>
					{item.estimatedReach && (
						<>
							<div className="text-[11px] text-text-tertiary mt-1">Estimated Reach</div>
							<div className="text-xs font-semibold text-text-primary">
								{item.estimatedReach}
							</div>
						</>
					)}
				</div>
			)}
			<div className="flex items-center gap-1.5 shrink-0">
				{item.isPinned ? (
					<button
						onClick={() => onUnpin(item.id)}
						className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-500 hover:bg-amber-100 transition-colors"
						title="Unpin announcement"
					>
						<Pin size={13} />
					</button>
				) : (
					<button
						onClick={() => onPin(item.id)}
						className="rounded-lg border border-border-default bg-surface-card p-1.5 text-text-secondary hover:bg-amber-50 hover:border-amber-200 hover:text-amber-500 transition-colors"
						title="Pin announcement"
					>
						<Pin size={13} />
					</button>
				)}
				<button
					onClick={() => toast.info("Edit coming soon")}
					className="flex items-center gap-1 rounded-lg border border-border-default bg-surface-card px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
				>
					<Pencil size={11} /> Edit
				</button>
				<button
					onClick={() => toast.info("Duplicate coming soon")}
					className="flex items-center gap-1 rounded-lg border border-border-default bg-surface-card px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
				>
					<Copy size={11} /> Duplicate
				</button>
				<button
					onClick={() => onDelete(item.id)}
					className="rounded-lg border border-border-default bg-surface-card p-1.5 text-text-secondary hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
					title="Delete announcement"
				>
					<Trash2 size={13} />
				</button>
			</div>
		</div>
	)
}

// ─── Create View ──────────────────────────────────────────────────────────────

const ANN_TYPE_CATEGORY: Record<string, string> = {
	"General Announcement": "COMMUNITY_UPDATE",
	"Event Announcement":   "EVENT_ANNOUNCEMENT",
	"Alert":                "ALERT",
	"Update":               "COMMUNITY_UPDATE",
	"Promotion":            "PROMOTION",
}

function CreateView({
	communityId,
	onPublish,
	onBack,
}: {
	communityId: string
	onPublish: (title: string) => void
	onBack: () => void
}) {
	const [title, setTitle] = useState("")
	const [annType, setAnnType] = useState("General Announcement")
	const [audience, setAudience] = useState("All Members (1,248)")
	const [message, setMessage] = useState("")
	const [publishMode, setPublishMode] = useState<"now" | "later">("now")
	const [isPublishing, setIsPublishing] = useState(false)
	const [publishError, setPublishError] = useState<string | null>(null)

	const TOOLBAR_ITEMS = [
		{ icon: Bold, label: "Bold" },
		{ icon: Italic, label: "Italic" },
		{ icon: Underline, label: "Underline" },
		{ icon: Strikethrough, label: "Strike" },
		{ icon: List, label: "Bullet" },
		{ icon: ListOrdered, label: "Ordered" },
		null,
		{ icon: Link, label: "Link" },
		{ icon: Image, label: "Image" },
		{ icon: Smile, label: "Emoji" },
		null,
		{ icon: Undo, label: "Undo" },
		{ icon: Redo, label: "Redo" },
	]

	async function handlePublish() {
		if (!title.trim()) {
			toast.error("Please enter an announcement title")
			return
		}
		if (!message.trim()) {
			toast.error("Please write a message")
			return
		}
		setIsPublishing(true)
		setPublishError(null)
		try {
			await createCommunityAnnouncement(communityId, {
				category: ANN_TYPE_CATEGORY[annType] ?? "COMMUNITY_UPDATE",
				title: title.trim(),
				body: message.trim(),
			})
			onPublish(title.trim())
		} catch (err: unknown) {
			const axiosErr = err as { response?: { data?: { message?: string } } }
			setPublishError(axiosErr?.response?.data?.message ?? "Failed to publish. Please try again.")
		} finally {
			setIsPublishing(false)
		}
	}

	const previewTitle = title.trim() || "Announcement Title"
	const previewMessage = message.trim() || "This is how your announcement will appear to community members."

	return (
		<div className="flex items-start gap-5">
			{/* ── Form ──────────────────────────────────────────────────── */}
			<div className="flex-1 min-w-0 flex flex-col gap-5">
				<div>
					<h2 className="text-base font-semibold text-text-primary">Create Announcement</h2>
					<p className="mt-0.5 text-xs text-text-tertiary">
						Write your message and choose how you want to share it with your community.
					</p>
				</div>

				<div className="rounded-xl border border-border-default bg-surface-card p-5 flex flex-col gap-5">
					{/* 1. Title */}
					<div>
						<label className="text-xs font-semibold text-text-primary mb-1.5 block">
							1. Announcement Title <span className="text-red-500">*</span>
						</label>
						<div className="relative">
							<input
								type="text"
								maxLength={100}
								value={title}
								onChange={e => setTitle(e.target.value)}
								placeholder="Enter a catchy title for your announcement"
								className="h-9 w-full rounded-lg border border-border-default bg-surface-card px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus pr-14"
							/>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary tabular-nums">
								{title.length}/100
							</span>
						</div>
					</div>

					{/* 2 & 3. Type + Audience */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-xs font-semibold text-text-primary mb-1.5 block">
								2. Announcement Type
							</label>
							<div className="relative">
								<div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
									<Megaphone size={13} className="text-purple-500" />
								</div>
								<select
									value={annType}
									onChange={e => setAnnType(e.target.value)}
									className="h-10 w-full appearance-none rounded-lg border border-border-default bg-surface-card pl-8 pr-8 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
								>
									{[
										"General Announcement",
										"Event Announcement",
										"Alert",
										"Update",
										"Promotion",
									].map(t => (
										<option key={t}>{t}</option>
									))}
								</select>
								<ChevronRight
									size={11}
									className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-text-tertiary"
								/>
							</div>
						</div>
						<div>
							<label className="text-xs font-semibold text-text-primary mb-1.5 block">
								3. Audience <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
									<Users size={13} className="text-blue-500" />
								</div>
								<select
									value={audience}
									onChange={e => setAudience(e.target.value)}
									className="h-10 w-full appearance-none rounded-lg border border-border-default bg-surface-card pl-8 pr-8 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
								>
									{[
										"All Members (1,248)",
										"Active Members (786)",
										"New Members (142)",
										"Moderators",
									].map(t => (
										<option key={t}>{t}</option>
									))}
								</select>
								<ChevronRight
									size={11}
									className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-text-tertiary"
								/>
							</div>
							<p className="text-[10px] text-text-tertiary mt-1">
								Visible to all members in this community
							</p>
						</div>
					</div>

					{/* 4. Message */}
					<div>
						<label className="text-xs font-semibold text-text-primary mb-1.5 block">
							4. Message <span className="text-red-500">*</span>
						</label>
						<div className="rounded-lg border border-border-default overflow-hidden">
							{/* Toolbar */}
							<div className="flex items-center gap-0.5 border-b border-border-default bg-surface-card-muted px-2 py-1.5 flex-wrap">
								<div className="relative mr-2">
									<select className="h-6 appearance-none rounded border border-border-default bg-surface-card pl-2 pr-5 text-[10px] text-text-primary focus:outline-none">
										<option>Paragraph</option>
										<option>Heading 1</option>
										<option>Heading 2</option>
									</select>
									<ChevronRight
										size={8}
										className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 rotate-90 text-text-tertiary"
									/>
								</div>
								{TOOLBAR_ITEMS.map((item, i) =>
									item === null ? (
										<div key={i} className="mx-1 h-4 w-px bg-border-default" />
									) : (
										<button
											key={item.label}
											type="button"
											title={item.label}
											className="flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:bg-neutral-100 transition-colors"
										>
											<item.icon size={12} />
										</button>
									),
								)}
							</div>
							{/* Textarea */}
							<div className="relative">
								<textarea
									value={message}
									onChange={e => setMessage(e.target.value)}
									placeholder="Write your announcement here..."
									maxLength={5000}
									rows={5}
									className="w-full resize-none bg-surface-card px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
								/>
								<span className="absolute bottom-2 right-3 text-[10px] text-text-tertiary tabular-nums">
									{message.length}/5000
								</span>
							</div>
						</div>
					</div>

					{/* 5 & 6. Cover Image + Link to Experience */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-xs font-semibold text-text-primary mb-1.5 block">
								5. Add Cover Image{" "}
								<span className="text-text-tertiary font-normal">(Optional)</span>
							</label>
							<div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-default bg-surface-card-muted p-5">
								<Upload size={20} className="text-text-tertiary" />
								<p className="text-xs font-medium text-text-secondary">Upload image</p>
								<p className="text-[10px] text-text-tertiary">
									Recommended size: 1200 x 628 px (JPG, PNG)
								</p>
								<button className="rounded-lg border border-border-default bg-surface-card px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-neutral-50 transition-colors">
									Choose File
								</button>
							</div>
						</div>
						<div>
							<label className="text-xs font-semibold text-text-primary mb-1.5 block">
								6. Link to Experience{" "}
								<span className="text-text-tertiary font-normal">(Optional)</span>
							</label>
							<div className="relative">
								<div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
									<Calendar size={13} className="text-text-tertiary" />
								</div>
								<select className="h-10 w-full appearance-none rounded-lg border border-border-default bg-surface-card pl-8 pr-8 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus">
									<option value="">Select an experience to highlight</option>
									<option>Night Rituals</option>
									<option>After Hours</option>
									<option>Sunset Sessions</option>
								</select>
								<ChevronRight
									size={11}
									className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-text-tertiary"
								/>
							</div>
							<p className="mt-2 text-[11px] text-text-tertiary">
								Members can view the experience directly from this announcement.
							</p>
						</div>
					</div>

					{/* 7. Publish Settings */}
					<div>
						<label className="text-xs font-semibold text-text-primary mb-2 block">
							7. Publish Settings
						</label>
						<div className="grid grid-cols-2 gap-3">
							{[
								{
									id: "now",
									icon: Send,
									label: "Publish Now",
									sub: "Make this announcement live immediately.",
								},
								{
									id: "later",
									icon: Calendar,
									label: "Schedule for Later",
									sub: "Choose a date and time to publish.",
								},
							].map(opt => (
								<label
									key={opt.id}
									className={cn(
										"flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
										publishMode === opt.id
											? "border-action-primary bg-surface-brand-soft"
											: "border-border-default bg-surface-card hover:bg-neutral-50",
									)}
								>
									<input
										type="radio"
										className="sr-only"
										name="publish"
										value={opt.id}
										checked={publishMode === opt.id}
										onChange={() => setPublishMode(opt.id as "now" | "later")}
									/>
									<div
										className={cn(
											"mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
											publishMode === opt.id
												? "border-action-primary"
												: "border-border-default",
										)}
									>
										{publishMode === opt.id && (
											<div className="h-2 w-2 rounded-full bg-action-primary" />
										)}
									</div>
									<div
										className={cn(
											"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
											publishMode === opt.id ? "bg-action-primary" : "bg-neutral-100",
										)}
									>
										<opt.icon
											size={14}
											className={
												publishMode === opt.id ? "text-white" : "text-text-secondary"
											}
										/>
									</div>
									<div>
										<p className="text-xs font-semibold text-text-primary">{opt.label}</p>
										<p className="text-[11px] text-text-tertiary">{opt.sub}</p>
									</div>
								</label>
							))}
						</div>
					</div>
				</div>

				{/* Bottom actions */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Button
							variant="secondary"
							size="sm"
							radius="md"
							leftIcon={<Eye size={13} />}
							onClick={() => toast.info("Preview as member coming soon")}
						>
							Preview as Member
						</Button>
						<Button
							variant="secondary"
							size="sm"
							radius="md"
							leftIcon={<FileText size={13} />}
							onClick={() => toast.success("Draft saved")}
						>
							Save Draft
						</Button>
					</div>
					{publishError && (
						<p className="text-xs text-red-500">{publishError}</p>
					)}
					<Button
						variant="primary"
						size="sm"
						radius="md"
						leftIcon={<Send size={13} />}
						onClick={handlePublish}
						disabled={isPublishing}
					>
						{isPublishing ? "Publishing…" : "Publish Announcement"}
					</Button>
				</div>
			</div>

			{/* ── Live Preview sidebar ───────────────────────────────────── */}
			<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">
				{/* Live Preview */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Live Preview</h3>
						<button
							className="text-xs font-medium text-text-brand hover:underline"
							onClick={() => toast.info("Preview as member coming soon")}
						>
							Preview as Member
						</button>
					</div>
					{/* Mock post preview */}
					<div className="rounded-lg border border-border-default overflow-hidden">
						<div className="flex items-center gap-2 p-2.5 border-b border-border-subtle">
							<div className="h-7 w-7 shrink-0 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
								M
							</div>
							<div>
								<p className="text-[11px] font-semibold text-text-primary">
									Meetday Music Nights
								</p>
								<p className="text-[9px] text-text-tertiary">Announcement • Just now</p>
							</div>
						</div>
						<div className="h-20 bg-linear-to-br from-purple-900 via-purple-700 to-pink-600" />
						<div className="p-2.5">
							<p className="text-xs font-semibold text-text-primary mb-1">{previewTitle}</p>
							<p className="text-[10px] text-text-tertiary leading-relaxed line-clamp-2">
								{previewMessage}
							</p>
						</div>
						<div className="flex items-center justify-around border-t border-border-subtle py-2">
							{[
								{ icon: ThumbsUp, label: "Like" },
								{ icon: MessageSquare, label: "Comment" },
								{ icon: Share2, label: "Share" },
							].map(a => (
								<button
									key={a.label}
									className="flex items-center gap-1 text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
								>
									<a.icon size={11} /> {a.label}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Publish Summary */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-3">Publish Summary</h3>
					<div className="flex flex-col gap-2.5">
						{[
							{ icon: Users, label: "Audience", value: audience },
							{ icon: Megaphone, label: "Type", value: annType },
							{ icon: BarChart2, label: "Reach (Estimated)", value: "1,248 members" },
							{ icon: Bell, label: "Delivery", value: "In-app, Push Notification, Email" },
						].map(row => (
							<div key={row.label} className="flex items-start gap-2">
								<row.icon size={12} className="text-text-tertiary shrink-0 mt-0.5" />
								<span className="text-[11px] text-text-tertiary w-24 shrink-0">
									{row.label}
								</span>
								<span className="text-[11px] font-medium text-text-primary text-right flex-1">
									{row.value}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Tips */}
				<div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
					<div className="flex items-center gap-2 mb-2">
						<div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100">
							<span className="text-[10px]">💡</span>
						</div>
						<h3 className="text-xs font-semibold text-amber-800">Tips for better engagement</h3>
					</div>
					{[
						"Use a clear and exciting title.",
						"Add a cover image to grab attention.",
						"Keep your message short and engaging.",
						"Link to an experience for more context.",
					].map(tip => (
						<div key={tip} className="flex items-start gap-1.5 mt-1.5">
							<CheckCircle2 size={11} className="text-green-500 shrink-0 mt-0.5" />
							<p className="text-[11px] text-amber-700">{tip}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

// ─── Success View ─────────────────────────────────────────────────────────────

function SuccessView({ publishedTitle, onBack }: { publishedTitle: string; onBack: () => void }) {
	const WHATS_NEXT = [
		{
			icon: Bell,
			label: "Members receive notification",
			sub: "Push notifications and emails have been sent.",
		},
		{ icon: Eye, label: "Members open announcement", sub: "They can view the announcement in-app." },
		{ icon: MessageSquare, label: "Members engage", sub: "Members can like, comment and share." },
		{
			icon: BarChart2,
			label: "Traffic flows to events",
			sub: "Drive members to your experiences and events.",
		},
	]

	const SUCCESS_QUICK_ACTIONS: {
		icon: LucideIcon
		label: string
		sub: string
		bg: string
		color: string
	}[] = [
		{
			icon: Megaphone,
			label: "Create Another Announcement",
			sub: "Share another update with your community",
			bg: "bg-red-50",
			color: "text-red-500",
		},
		{
			icon: Eye,
			label: "View Announcement",
			sub: "See how members will see this announcement",
			bg: "bg-blue-50",
			color: "text-blue-500",
		},
		{
			icon: LayoutDashboard,
			label: "Go to Community Dashboard",
			sub: "Return to the community management dashboard",
			bg: "bg-purple-50",
			color: "text-purple-500",
		},
		{
			icon: BarChart2,
			label: "View Analytics",
			sub: "Track reach, opens and engagement",
			bg: "bg-amber-50",
			color: "text-amber-500",
		},
	]

	return (
		<div className="flex items-start gap-5">
			{/* ── Main ──────────────────────────────────────────────────── */}
			<div className="flex-1 min-w-0 flex flex-col gap-5">
				{/* Success banner */}
				<div className="rounded-xl border border-green-100 bg-green-50 p-8 flex flex-col items-center text-center gap-2">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-1">
						<CheckCircle2 size={24} className="text-green-500" />
					</div>
					<h2 className="text-xl font-bold text-text-primary">🎉 Announcement Published!</h2>
					<p className="text-sm text-text-secondary">
						Your announcement is now live and visible to community members.
					</p>
					<span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
						Published Successfully
					</span>
				</div>

				{/* Published announcement preview */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-start gap-4">
						<div className="h-20 w-28 shrink-0 rounded-lg bg-linear-to-br from-purple-900 via-purple-700 to-pink-600" />
						<div className="flex-1 min-w-0">
							<h3 className="text-sm font-semibold text-text-primary mb-1">{publishedTitle}</h3>
							<div className="flex items-center gap-2 mb-2">
								<span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700">
									Published
								</span>
								<span className="text-[11px] text-text-tertiary">• Just now</span>
							</div>
							<p className="text-xs text-text-secondary line-clamp-2">
								Welcome to the official community for music lovers and nightlife enthusiasts.
								We&apos;re excited to have you here!
							</p>
							<div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-text-tertiary">
								<Users size={10} /> <span>Audience: All Members (1,248)</span>
							</div>
						</div>
						<div className="flex flex-col items-center gap-3 shrink-0">
							<p className="text-[10px] font-semibold text-text-tertiary">Delivery Channels</p>
							<div className="flex items-start gap-3">
								{[
									{
										icon: MessageSquare,
										label: "In-app",
										bg: "bg-blue-50",
										color: "text-blue-500",
									},
									{
										icon: Bell,
										label: "Push\nNotification",
										bg: "bg-amber-50",
										color: "text-amber-500",
									},
									{
										icon: Mail,
										label: "Email",
										bg: "bg-green-50",
										color: "text-green-500",
									},
								].map(ch => (
									<div key={ch.label} className="flex flex-col items-center gap-1">
										<div
											className={cn(
												"flex h-9 w-9 items-center justify-center rounded-xl border border-border-default",
												ch.bg,
											)}
										>
											<ch.icon size={15} className={ch.color} />
										</div>
										<p className="text-[9px] text-text-tertiary text-center whitespace-pre-line leading-tight">
											{ch.label}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Stats strip */}
					<div className="mt-4 grid grid-cols-4 gap-3 border-t border-border-subtle pt-4">
						{[
							{
								icon: Users,
								label: "Audience",
								value: "1,248",
								sub: "Members",
								color: "text-blue-500",
							},
							{
								icon: Bell,
								label: "Push Notifications",
								value: "Sent",
								sub: "Delivered successfully",
								color: "text-green-500",
							},
							{
								icon: Mail,
								label: "Emails",
								value: "Sent",
								sub: "Delivered successfully",
								color: "text-green-500",
							},
							{
								icon: CheckCircle2,
								label: "Status",
								value: "Live",
								sub: "Announcement is live",
								color: "text-green-500",
							},
						].map(s => (
							<div
								key={s.label}
								className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-card-muted p-3"
							>
								<s.icon size={16} className={cn("shrink-0", s.color)} />
								<div>
									<p className="text-[9px] text-text-tertiary">{s.label}</p>
									<p className={cn("text-sm font-bold", s.color)}>{s.value}</p>
									<p className="text-[9px] text-text-tertiary">{s.sub}</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* What's Next + Quick Actions */}
				<div className="grid grid-cols-2 gap-4">
					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<h3 className="text-sm font-semibold text-text-primary mb-3">What&apos;s Next?</h3>
						<div className="flex flex-col gap-3">
							{WHATS_NEXT.map(item => (
								<div key={item.label} className="flex items-start gap-3">
									<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-green-200 bg-green-50">
										<item.icon size={12} className="text-green-500" />
									</div>
									<div>
										<p className="text-xs font-semibold text-text-primary">
											{item.label}
										</p>
										<p className="text-[10px] text-text-tertiary">{item.sub}</p>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-xl border border-border-default bg-surface-card p-4">
						<h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
						<div className="flex flex-col gap-1">
							{SUCCESS_QUICK_ACTIONS.map(action => (
								<button
									key={action.label}
									className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-surface-card-muted transition-colors text-left"
									onClick={() =>
										action.label === "Create Another Announcement"
											? onBack()
											: toast.info(`${action.label} coming soon`)
									}
								>
									<div
										className={cn(
											"flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
											action.bg,
										)}
									>
										<action.icon size={13} className={action.color} />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-xs font-medium text-text-primary">
											{action.label}
										</p>
										<p className="text-[10px] text-text-tertiary truncate">
											{action.sub}
										</p>
									</div>
									<ChevronRight size={12} className="text-text-tertiary shrink-0" />
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Bottom banner */}
				<div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 px-5 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
							<Megaphone size={16} className="text-green-600" />
						</div>
						<div>
							<p className="text-sm font-semibold text-green-800">
								Great job! Your announcement is live.
							</p>
							<p className="text-xs text-green-600">
								Keep your community informed and engaged.
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<Button variant="secondary" size="sm" radius="md" onClick={onBack}>
							Back to Announcements
						</Button>
						<Button
							variant="primary"
							size="sm"
							radius="md"
							rightIcon={<ArrowRight size={13} />}
							onClick={() => toast.info("Analytics coming soon")}
						>
							View Announcement Analytics
						</Button>
					</div>
				</div>
			</div>

			{/* ── Sidebar ───────────────────────────────────────────────────── */}
			<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">
				{/* Community Snapshot */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Community Snapshot</h3>
						<span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
							<span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live
						</span>
					</div>
					<div className="flex flex-col gap-2.5">
						{[
							{
								icon: Users,
								label: "Members",
								sub: "Total community members",
								value: "1,248",
								trend: null,
							},
							{
								icon: Megaphone,
								label: "Announcements",
								sub: "Total announcements",
								value: "25",
								trend: null,
							},
							{
								icon: Eye,
								label: "Average Open Rate",
								sub: "vs last 7 days",
								value: "68%",
								trend: "+12%",
							},
							{
								icon: BarChart2,
								label: "Average Engagement",
								sub: "vs last 7 days",
								value: "24%",
								trend: "+8%",
							},
						].map(row => (
							<div
								key={row.label}
								className="flex items-center gap-3 rounded-lg border border-border-subtle p-2.5"
							>
								<row.icon size={14} className="text-text-tertiary shrink-0" />
								<div className="flex-1 min-w-0">
									<p className="text-xs font-medium text-text-primary">{row.label}</p>
									<p className="text-[10px] text-text-tertiary">{row.sub}</p>
								</div>
								<div className="text-right shrink-0">
									<p className="text-sm font-bold text-text-primary">{row.value}</p>
									{row.trend && (
										<p className="text-[10px] font-semibold text-green-500">
											↑ {row.trend}
										</p>
									)}
								</div>
							</div>
						))}
					</div>
					<button
						className="mt-3 flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"
						onClick={() => toast.info("View analytics coming soon")}
					>
						View all analytics <ArrowRight size={11} />
					</button>
				</div>

				{/* Managers & Moderators */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Managers &amp; Moderators</h3>
						<button
							className="text-xs font-medium text-text-brand hover:underline"
							onClick={() => toast.info("View all coming soon")}
						>
							View All
						</button>
					</div>
					<div className="flex flex-col gap-2.5">
						{MANAGERS_SIDEBAR.map(m => (
							<div key={m.name} className="flex items-center gap-2.5">
								<div
									className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
									style={{ backgroundColor: m.color }}
								>
									{m.initial}
								</div>
								<span className="flex-1 text-xs font-medium text-text-primary truncate">
									{m.name}
								</span>
								<span
									className={cn(
										"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0",
										ROLE_BADGE[m.role] ?? "bg-neutral-100 text-neutral-600",
									)}
								>
									{m.role}
								</span>
							</div>
						))}
					</div>
					<button
						className="mt-3 w-full rounded-lg border border-border-default bg-surface-card py-2 text-xs font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
						onClick={() => toast.info("Manage roles coming soon")}
					>
						Manage Roles
					</button>
				</div>

				{/* Quick Actions 2x2 */}
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
					<div className="grid grid-cols-2 gap-2">
						{SIDEBAR_QUICK_ACTIONS.map(action => (
							<button
								key={action.label}
								onClick={() => toast.info(`${action.label} coming soon`)}
								className="flex flex-col items-center gap-2 rounded-xl border border-border-default bg-surface-card p-3 text-center hover:bg-surface-card-muted transition-colors"
							>
								<div
									className={cn(
										"flex h-9 w-9 items-center justify-center rounded-xl",
										action.bg,
									)}
								>
									<action.icon size={16} className={action.color} />
								</div>
								<span className="text-[11px] font-medium text-text-secondary leading-tight">
									{action.label}
								</span>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AnnouncementsTab({ communityId }: { communityId: string }) {
	const [data, setData] = useState<AnnouncementsTabData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [filter, setFilter] = useState<FilterStatus>("All Announcements")
	const [sort, setSort] = useState<SortMode>("Newest First")
	const [page, setPage] = useState(1)
	const [view, setView] = useState<TabView>("list")
	const [publishedTitle, setPublishedTitle] = useState("")

	const load = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			setData(await getCommunityAnnouncementsTab(communityId))
		} catch {
			setError("Failed to load announcements.")
		} finally {
			setIsLoading(false)
		}
	}, [communityId])

	useEffect(() => {
		load()
	}, [load])
	useEffect(() => {
		setPage(1)
	}, [filter, sort])

	function handlePublish(title: string) {
		setPublishedTitle(title)
		setView("success")
	}

	async function handlePin(announcementId: string) {
		try {
			await pinCommunityAnnouncement(communityId, announcementId)
			setData(prev =>
				prev
					? { ...prev, announcements: prev.announcements.map(a => a.id === announcementId ? { ...a, isPinned: true } : a) }
					: prev,
			)
			toast.success("Announcement pinned.")
		} catch {
			toast.error("Failed to pin announcement.")
		}
	}

	async function handleUnpin(announcementId: string) {
		try {
			await unpinCommunityAnnouncement(communityId, announcementId)
			setData(prev =>
				prev
					? { ...prev, announcements: prev.announcements.map(a => a.id === announcementId ? { ...a, isPinned: false } : a) }
					: prev,
			)
			toast.success("Announcement unpinned.")
		} catch {
			toast.error("Failed to unpin announcement.")
		}
	}

	async function handleDelete(announcementId: string) {
		if (!window.confirm("Delete this announcement? This cannot be undone.")) return
		try {
			await deleteCommunityAnnouncement(communityId, announcementId)
			setData(prev =>
				prev
					? { ...prev, announcements: prev.announcements.filter(a => a.id !== announcementId) }
					: prev,
			)
			toast.success("Announcement deleted.")
		} catch {
			toast.error("Failed to delete announcement.")
		}
	}

	if (view === "create") return <CreateView communityId={communityId} onPublish={handlePublish} onBack={() => setView("list")} />
	if (view === "success")
		return <SuccessView publishedTitle={publishedTitle} onBack={() => setView("list")} />

	const filtered = (() => {
		if (!data) return []
		let items = data.announcements
		if (filter !== "All Announcements") items = items.filter(a => a.status === filter)
		if (sort === "Most Views") items = [...items].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
		else if (sort === "Oldest First") items = [...items].reverse()
		return items
	})()

	const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
	const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
	const stats = data?.stats

	if (error)
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
				{error}
			</div>
		)

	return (
		<div className="flex items-start gap-5">
			<div className="flex-1 min-w-0 flex flex-col gap-5">
				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-base font-semibold text-text-primary">Announcements</h2>
						<p className="mt-0.5 text-xs text-text-tertiary">
							Create and manage announcements for your community members.
						</p>
					</div>
					<Button
						variant="primary"
						size="sm"
						radius="md"
						leftIcon={<Plus size={13} />}
						onClick={() => setView("create")}
					>
						Create Announcement
					</Button>
				</div>

				{/* Stat cards */}
				{/* TODO: wire growth values from getCommunityAnnouncementsTab API response */}
				<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
					<StatCard
						icon={Megaphone}
						label="Published"
						value={isLoading ? "—" : (stats?.published ?? 0)}
						trend={stats ? { value: stats.publishedGrowth, direction: "up" } : undefined}
						sub="vs last 7 days"
						accent="purple"
					/>
					<StatCard
						icon={Calendar}
						label="Scheduled"
						value={isLoading ? "—" : (stats?.scheduled ?? 0)}
						trend={stats ? { value: stats.scheduledGrowth, direction: "up" } : undefined}
						sub="vs last 7 days"
						accent="sky"
					/>
					<StatCard
						icon={FileText}
						label="Drafts"
						value={isLoading ? "—" : (stats?.drafts ?? 0)}
						trend={
							stats
								? {
										value: Math.abs(stats.draftsGrowth),
										direction: stats.draftsGrowth >= 0 ? "up" : "down",
									}
								: undefined
						}
						sub="vs last 7 days"
						accent="amber"
					/>
					<StatCard
						icon={Eye}
						label="Total Reach (7D)"
						value={isLoading ? "—" : (stats?.totalReach ?? "—")}
						trend={stats ? { value: stats.totalReachGrowth, direction: "up" } : undefined}
						sub="vs last 7 days"
						accent="green"
					/>
				</div>

				{/* Toolbar */}
				<div className="flex items-center gap-2">
					<div className="relative">
						<select
							value={filter}
							onChange={e => setFilter(e.target.value as FilterStatus)}
							className="h-8 appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-7 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
						>
							{(["All Announcements", "Published", "Scheduled", "Draft"] as FilterStatus[]).map(
								f => (
									<option key={f}>{f}</option>
								),
							)}
						</select>
						<ChevronRight
							size={11}
							className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-text-tertiary"
						/>
					</div>
					<div className="relative">
						<select
							value={sort}
							onChange={e => setSort(e.target.value as SortMode)}
							className="h-8 appearance-none rounded-lg border border-border-default bg-surface-card pl-3 pr-7 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-border-focus"
						>
							{(["Newest First", "Oldest First", "Most Views"] as SortMode[]).map(s => (
								<option key={s}>{s}</option>
							))}
						</select>
						<ChevronRight
							size={11}
							className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-text-tertiary"
						/>
					</div>
				</div>

				{/* List */}
				{isLoading ? (
					<div className="flex h-40 items-center justify-center rounded-xl border border-border-default bg-surface-card">
						<p className="text-sm text-text-tertiary">Loading announcements…</p>
					</div>
				) : paginated.length === 0 ? (
					<div className="flex h-40 items-center justify-center rounded-xl border border-border-default bg-surface-card">
						<p className="text-sm text-text-tertiary">No announcements found.</p>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{paginated.map(item => (
							<AnnouncementRow key={item.id} item={item} onPin={handlePin} onUnpin={handleUnpin} onDelete={handleDelete} />
						))}
					</div>
				)}

				{/* Pagination */}
				{!isLoading && filtered.length > 0 && (
					<div className="flex items-center justify-between text-xs text-text-tertiary">
						<span>
							Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
							{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} announcements
						</span>
						{totalPages > 1 && (
							<div className="flex items-center gap-1">
								<button
									onClick={() => setPage(p => Math.max(1, p - 1))}
									disabled={page === 1}
									className="rounded-md p-1 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
								>
									<ChevronLeft size={14} />
								</button>
								{Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
									<button
										key={n}
										onClick={() => setPage(n)}
										className={cn(
											"h-7 w-7 rounded-md text-xs font-medium transition-colors",
											n === page
												? "bg-action-primary text-action-primary-text"
												: "hover:bg-neutral-100 text-text-secondary",
										)}
									>
										{n}
									</button>
								))}
								<button
									onClick={() => setPage(p => Math.min(totalPages, p + 1))}
									disabled={page === totalPages}
									className="rounded-md p-1 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
								>
									<ChevronRight size={14} />
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Sidebar */}
			<div className="hidden lg:flex w-72 shrink-0 flex-col gap-4">
				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Community Status</h3>
						{data && (
							<span
								className={cn(
									"inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
									data.communityStatus === "Active"
										? "bg-green-100 text-green-700"
										: "bg-neutral-100 text-neutral-600",
								)}
							>
								{data.communityStatus}
							</span>
						)}
					</div>
					<div className="flex flex-col gap-2 text-xs">
						<div className="flex items-center justify-between">
							<span className="text-text-tertiary">Created on</span>
							<span className="font-medium text-text-primary">{data?.createdOn ?? "—"}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-text-tertiary">Visibility</span>
							<span className="font-medium text-text-primary">{data?.visibility ?? "—"}</span>
						</div>
						<div className="mt-1">
							<span className="text-text-tertiary block mb-1">Community URL</span>
							<div className="flex items-center justify-between gap-2 rounded-lg bg-surface-card-muted px-3 py-2">
								<span className="text-[11px] text-blue-500 truncate">
									{data?.communityUrl ?? "—"}
								</span>
								<button
									onClick={() => {
										if (data?.communityUrl) {
											void navigator.clipboard.writeText(data.communityUrl)
											toast.success("URL copied")
										}
									}}
									className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
								>
									<ClipboardCopy size={12} />
								</button>
							</div>
						</div>
					</div>
					<Button
						variant="secondary"
						size="sm"
						radius="md"
						leftIcon={<Share2 size={12} />}
						className="mt-3 w-full justify-center"
						onClick={() => toast.info("Share coming soon")}
					>
						Share Community
					</Button>
				</div>

				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-semibold text-text-primary">Managers &amp; Moderators</h3>
						<button
							className="text-xs font-medium text-text-brand hover:underline"
							onClick={() => toast.info("View all coming soon")}
						>
							View All
						</button>
					</div>
					<div className="flex flex-col gap-2.5">
						{(data?.managers ?? []).map(m => (
							<div key={m.id} className="flex items-center gap-2.5">
								<div
									className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
									style={{ backgroundColor: m.avatarColor }}
								>
									{m.initial}
								</div>
								<span className="flex-1 text-xs font-medium text-text-primary truncate">
									{m.name}
								</span>
								<span
									className={cn(
										"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0",
										ROLE_BADGE[m.role] ?? "bg-neutral-100 text-neutral-600",
									)}
								>
									{m.role}
								</span>
							</div>
						))}
					</div>
					<button
						className="mt-3 w-full rounded-lg border border-border-default bg-surface-card py-2 text-xs font-medium text-text-secondary hover:bg-neutral-50 transition-colors"
						onClick={() => toast.info("Manage roles coming soon")}
					>
						Manage Roles
					</button>
				</div>

				<div className="rounded-xl border border-border-default bg-surface-card p-4">
					<h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
					<div className="grid grid-cols-2 gap-2">
						{SIDEBAR_QUICK_ACTIONS.map(action => (
							<button
								key={action.label}
								onClick={() =>
									action.label === "Create Announcement"
										? setView("create")
										: toast.info(`${action.label} coming soon`)
								}
								className="flex flex-col items-center gap-2 rounded-xl border border-border-default bg-surface-card p-3 text-center hover:bg-surface-card-muted transition-colors"
							>
								<div
									className={cn(
										"flex h-9 w-9 items-center justify-center rounded-xl",
										action.bg,
									)}
								>
									<action.icon size={16} className={action.color} />
								</div>
								<span className="text-[11px] font-medium text-text-secondary leading-tight">
									{action.label}
								</span>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
