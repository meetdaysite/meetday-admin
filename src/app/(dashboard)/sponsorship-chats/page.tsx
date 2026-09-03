"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Image as ImageIcon, ArrowLeft, CheckCircle2 } from "lucide-react"
import { cn, isPdfMediaUrl } from "@/lib/utils"
import PageHeader from "@/components/ui/PageHeader"
import { uploadSponsorshipChatImage } from "@/lib/api/storage"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { EmojiPicker } from "@/components/ui/EmojiPicker"
import { LinkifiedText } from "@/components/ui/linkified-text"
import { MentionPicker, type MentionSuggestion } from "@/components/chat/MentionPicker"
import { SystemMessageBubble } from "@/components/chat/SystemMessageBubble"
import { DealBanner, DealDetailsModal, DealReportModal } from "@/components/sponsorships/DealPanel"
import { useChatTyping } from "@/lib/hooks/use-chat-typing"
import {
	getSponsorshipChats,
	getSponsorshipChatMessages,
	sendSponsorshipChatMessage,
	editSponsorshipChatMessage,
	deleteSponsorshipChatMessage,
	getSponsorshipDeal,
	getSponsorshipDealReport,
	type SponsorshipChatMessage,
	type SponsorshipChatThread,
} from "@/lib/api/sponsorship-chats"

const THREADS_POLL_MS = 8000
const MESSAGES_POLL_MS = 4000

function timeAgo(iso: string | null) {
	if (!iso) return ""
	const diffMs = Date.now() - new Date(iso).getTime()
	const mins = Math.floor(diffMs / 60000)
	if (mins < 1) return "now"
	if (mins < 60) return `${mins}m`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours}h`
	return `${Math.floor(hours / 24)}d`
}

function replyLabel(senderType: string) {
	if (senderType === "ADMIN") return "Meetday"
	if (senderType === "BRAND") return "Brand"
	return "Community"
}

export default function SponsorshipChatsPage() {
	const queryClient = useQueryClient()
	const [activeTab, setActiveTab] = useState<"SPONSORSHIP" | "CAMPAIGN">("SPONSORSHIP")
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const threadsQuery = useQuery({
		queryKey: ["admin-sponsorship-chats", "ACCEPTED"],
		queryFn: () => getSponsorshipChats("ACCEPTED"),
		refetchInterval: THREADS_POLL_MS,
	})

	const allThreads = threadsQuery.data ?? []

	// Categorize threads into Sponsorships vs Campaigns
	const tabThreads = allThreads.filter((t) => {
		const isCampaign = t.type === "CAMPAIGN" || Boolean(t.campaignId) || (!t.proposalId && !t.proposalName && Boolean(t.campaignName))
		return activeTab === "CAMPAIGN" ? isCampaign : !isCampaign
	})

	const filteredThreads = [...tabThreads]
		.filter((t) => {
			if (!searchQuery.trim()) return true
			const q = searchQuery.toLowerCase()
			return (
				t.brandName?.toLowerCase().includes(q) ||
				t.communityName?.toLowerCase().includes(q) ||
				(t.proposalName && t.proposalName.toLowerCase().includes(q)) ||
				(t.campaignName && t.campaignName.toLowerCase().includes(q)) ||
				(t.targetName && t.targetName.toLowerCase().includes(q))
			)
		})
		.sort((a, b) => {
			const tA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
			const tB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
			return tB - tA
		})

	const selectedThread =
		filteredThreads.find((t) => t.id === selectedId) ??
		(filteredThreads.length > 0 && selectedId ? allThreads.find((t) => t.id === selectedId) ?? null : null)

	function handleSelectThread(id: string) {
		setSelectedId(id)
		queryClient.setQueryData<SponsorshipChatThread[]>(["admin-sponsorship-chats", "ACCEPTED"], (prev) =>
			prev?.map((t) => (t.id === id ? { ...t, unreadCount: 0 } : t)),
		)
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col h-full md:p-6 md:space-y-4 md:max-w-7xl md:mx-auto w-full">
			<div className="hidden md:flex items-center justify-between shrink-0">
				<PageHeader title="Ongoing Chats" description="Active Community ↔ Brand chat threads — monitor and participate as Meetday." />
			</div>

			<div className="flex-1 min-h-0 flex flex-col md:flex-row bg-white overflow-hidden md:border-[3px] md:border-black md:rounded-[24px] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:h-[calc(100vh-250px)] h-full">
				{/* Thread list */}
				<div className={cn(
					"flex flex-col h-full bg-white border-r-0 md:border-r-[3px] md:border-black",
					selectedId ? "hidden md:flex md:w-80 shrink-0" : "w-full md:w-80 shrink-0 flex-1 md:flex-initial"
				)}>
					{/* Mobile Header */}
					<div className="px-4 py-3 border-b border-black/10 md:hidden flex items-center justify-between shrink-0">
						<h2 className="font-heading font-black text-base text-black">Ongoing Chats</h2>
						<span className="text-xs font-semibold text-black/50">{filteredThreads.length} chats</span>
					</div>

					{/* Dual Tabs: Sponsorships & Campaigns */}
					<div className="flex border-b border-black/10 md:border-b-[3px] md:border-black shrink-0">
						{(["SPONSORSHIP", "CAMPAIGN"] as const).map((tab) => (
							<button
								key={tab}
								onClick={() => {
									setActiveTab(tab)
									setSelectedId(null)
								}}
								className={cn(
									"flex-1 py-2.5 sm:py-3 text-xs font-black uppercase tracking-wider transition-colors relative cursor-pointer",
									activeTab === tab ? "bg-[#EE2C2C] text-white" : "bg-white text-black/60 hover:bg-neutral-50",
								)}
							>
								{tab === "SPONSORSHIP" ? "Sponsorships" : "Campaigns"}
							</button>
						))}
					</div>

					{/* Search in threads */}
					<div className="p-2.5 border-b border-black/10 md:border-b-[3px] md:border-black bg-neutral-50/50 shrink-0">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder={activeTab === "SPONSORSHIP" ? "Search sponsorships…" : "Search campaigns…"}
							className="w-full px-3 py-2 text-xs font-semibold rounded-xl border-[2px] md:border-[2.5px] border-black bg-white placeholder:text-black/40 focus:bg-neutral-50 focus:outline-none transition-colors"
						/>
					</div>

					<div className="flex-1 overflow-y-auto">
						{threadsQuery.isLoading ? (
							<p className="text-caption text-text-tertiary text-center py-8">Loading…</p>
						) : filteredThreads.length === 0 ? (
							<p className="text-caption text-text-tertiary text-center py-8 px-4">
								{searchQuery ? "No matching chats found." : `No ongoing ${activeTab === "SPONSORSHIP" ? "sponsorship" : "campaign"} chats yet.`}
							</p>
						) : (
							filteredThreads.map((t) => (
								<button
									key={t.id}
									onClick={() => handleSelectThread(t.id)}
									className={cn(
										"w-full text-left px-4 py-3.5 border-b border-black/10 md:border-b-[2px] transition-colors flex items-center gap-3 cursor-pointer",
										selectedId === t.id ? "bg-[#FFC940]/25" : "hover:bg-neutral-50",
									)}
								>
									{/* Cascading Logos */}
									<div className="relative w-11 h-9 shrink-0 select-none">
										{/* Brand Logo or Initials (back/left) */}
										<div className="absolute left-0 top-0.5 w-7 h-7 rounded-lg border-2 border-black bg-neutral-100 flex items-center justify-center font-bold text-[10px] text-text-secondary z-0 overflow-hidden shadow-xs">
											{t.brandLogoUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={t.brandLogoUrl} alt={t.brandName} className="w-full h-full object-cover" />
											) : (
												t.brandName?.charAt(0).toUpperCase() ?? "B"
											)}
										</div>
										{/* Community Logo or Initials (front/right overlapping) */}
										<div className="absolute right-0 bottom-0 w-7 h-7 rounded-lg border-2 border-black bg-[#FFC940] flex items-center justify-center font-black text-[10px] text-black z-10 shadow-xs overflow-hidden">
											{t.communityLogoUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={t.communityLogoUrl} alt={t.communityName} className="w-full h-full object-cover" />
											) : (
												t.communityName?.charAt(0).toUpperCase() ?? "C"
											)}
										</div>
										{t.unreadCount > 0 && (
											<div className="absolute -top-1.5 -right-2 flex items-center gap-0.5 z-20">
												{t.hasUnreadMention && (
													<span
														className="size-4 rounded-full bg-black text-[#FFC940] text-[9px] font-black flex items-center justify-center border border-white shadow-xs"
														title="You were mentioned or replied to"
													>
														@
													</span>
												)}
												<span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[#EE2C2C] text-white text-[9px] font-black flex items-center justify-center border border-white shadow-xs">
													{t.unreadCount > 9 ? "9+" : t.unreadCount}
												</span>
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-2">
											<div className="min-w-0 flex-1">
												<p className="text-xs font-black text-black truncate">{t.brandName} • Brand</p>
												<p className="text-xs font-bold text-black/70 truncate mt-0.5">{t.communityName} • Community</p>
											</div>
											<span className="text-[10px] font-bold text-black/40 shrink-0 self-start mt-0.5">
												{timeAgo(t.lastMessageAt ?? t.createdAt)}
											</span>
										</div>
										<p className="text-[11px] font-semibold text-black/50 truncate mt-1">
											{t.targetName || t.proposalName || t.campaignName || "Deal"}
										</p>
										<div className="flex items-center gap-1.5 mt-1">
											{(() => {
												const isThreadClosed =
													t.isDealClosed ||
													(!!t.lastMessagePreview &&
														(t.lastMessagePreview.toLowerCase().includes("approved the deliverables report") ||
															t.lastMessagePreview.toLowerCase().includes("report approved") ||
															t.lastMessagePreview.toLowerCase().includes("deal is closed")))
												if (isThreadClosed) {
													return (
														<span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-black text-white flex items-center gap-1">
															<CheckCircle2 size={10} strokeWidth={2.5} /> Closed
														</span>
													)
												}
												if (t.isDealLocked) {
													return (
														<span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-black/20 bg-[#FFC940] text-black flex items-center gap-0.5">
															🔒 Locked
														</span>
													)
												}
												return null
											})()}
										</div>
										{t.lastMessagePreview && (
											<p className="text-[11px] font-medium text-black/40 truncate mt-1">{t.lastMessagePreview}</p>
										)}
									</div>
								</button>
							))
						)}
					</div>
				</div>

				{/* Thread detail */}
				<div className={cn(
					"min-w-0 flex flex-col h-full bg-[#F8F9FB] md:bg-white",
					selectedId ? "flex-1 w-full" : "hidden md:flex flex-1"
				)}>
					{!selectedThread ? (
						<div className="flex-1 flex items-center justify-center text-sm font-bold text-black/40">Select a chat to view</div>
					) : (
						<AdminChatThreadPanel key={selectedThread.id} thread={selectedThread} onBack={() => setSelectedId(null)} />
					)}
				</div>
			</div>
		</div>
	)
}

function AdminChatThreadPanel({
	thread,
	onBack,
}: {
	thread: SponsorshipChatThread
	onBack?: () => void
}) {
	const queryClient = useQueryClient()
	const [input, setInput] = useState("")
	const [replyingTo, setReplyingTo] = useState<SponsorshipChatMessage | null>(null)
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
	const [mentionQuery, setMentionQuery] = useState("")
	const [isMentionOpen, setIsMentionOpen] = useState(false)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
	const [showDealModal, setShowDealModal] = useState(false)
	const [showReportModal, setShowReportModal] = useState(false)
	const highlightTimerRef = useRef<NodeJS.Timeout | null>(null)
	const bottomRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const { typingSenderType, notifyTyping, notifyStopTyping } = useChatTyping(thread.id, "ADMIN")

	// Deal and Report queries for this thread
	const dealQuery = useQuery({
		queryKey: ["admin-sponsorship-chat-deal", thread.id],
		queryFn: () => getSponsorshipDeal(thread.id),
		enabled: Boolean(thread.id),
		refetchInterval: 6000,
	})
	const deal = dealQuery.data ?? null

	const reportQuery = useQuery({
		queryKey: ["admin-sponsorship-chat-report", thread.id],
		queryFn: () => getSponsorshipDealReport(thread.id),
		enabled: Boolean(thread.id && (deal?.status === "APPROVED" || thread.isDealLocked || thread.isDealClosed)),
		refetchInterval: 6000,
	})
	const report = reportQuery.data ?? null

	const mentionSuggestions: MentionSuggestion[] = [
		{
			id: "community",
			name: thread.communityName,
			tag: thread.communityName.replace(/\s+/g, ""),
			role: "Community",
			avatarUrl: thread.communityLogoUrl,
		},
		{
			id: "brand",
			name: thread.brandName,
			tag: thread.brandName.replace(/\s+/g, ""),
			role: "Brand",
			avatarUrl: thread.brandLogoUrl,
		},
	]

	const handleInputChange = (val: string) => {
		setInput(val)
		if (val.trim()) notifyTyping()
		else notifyStopTyping()

		const lastAt = val.lastIndexOf("@")
		if (lastAt !== -1 && (lastAt === 0 || /\s/.test(val[lastAt - 1]))) {
			const q = val.slice(lastAt + 1)
			if (!/\s/.test(q)) {
				setMentionQuery(q)
				setIsMentionOpen(true)
				return
			}
		}
		setIsMentionOpen(false)
	}

	const handleMentionSelect = (tag: string) => {
		const lastAt = input.lastIndexOf("@")
		if (lastAt !== -1) {
			const next = input.slice(0, lastAt) + `@${tag} `
			setInput(next)
		} else {
			setInput((prev) => prev + `@${tag} `)
		}
		setIsMentionOpen(false)
	}

	const handleJumpToMessage = useCallback((messageId: string) => {
		const el = document.getElementById(`msg-${messageId}`)
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" })
			if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
			setHighlightedMessageId(messageId)
			highlightTimerRef.current = setTimeout(() => {
				setHighlightedMessageId(null)
			}, 2000)
		}
	}, [])

	const messagesQuery = useQuery({
		queryKey: ["admin-sponsorship-chat-messages", thread.id],
		queryFn: () => getSponsorshipChatMessages(thread.id),
		refetchInterval: MESSAGES_POLL_MS,
	})
	const messages = messagesQuery.data?.messages ?? []

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages.length])

	const sendMutation = useMutation({
		mutationFn: (payload: { content?: string; mediaKey?: string; replyToId?: string }) =>
			sendSponsorshipChatMessage(thread.id, payload),
		onSuccess: () => {
			setInput("")
			setReplyingTo(null)
			notifyStopTyping()
			queryClient.invalidateQueries({ queryKey: ["admin-sponsorship-chat-messages", thread.id] })
			queryClient.invalidateQueries({ queryKey: ["admin-sponsorship-chats"] })
		},
		onError: () => toast.error("Failed to send message."),
	})

	const editMutation = useMutation({
		mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
			editSponsorshipChatMessage(thread.id, messageId, content),
		onSuccess: () => {
			setEditingMessageId(null)
			setInput("")
			toast.success("Message edited.")
			queryClient.invalidateQueries({ queryKey: ["admin-sponsorship-chat-messages", thread.id] })
		},
		onError: () => toast.error("Failed to edit message."),
	})

	const deleteMutation = useMutation({
		mutationFn: (messageId: string) => deleteSponsorshipChatMessage(thread.id, messageId),
		onSuccess: () => {
			toast.success("Message deleted.")
			queryClient.invalidateQueries({ queryKey: ["admin-sponsorship-chat-messages", thread.id] })
		},
		onError: () => toast.error("Failed to delete message."),
	})

	function handleReplyStart(m: SponsorshipChatMessage) {
		setEditingMessageId(null)
		setReplyingTo(m)
		inputRef.current?.focus()
	}

	function handleEditStart(m: SponsorshipChatMessage) {
		setReplyingTo(null)
		setEditingMessageId(m.id)
		setInput(m.content)
		inputRef.current?.focus()
	}

	function handleEditCancel() {
		setEditingMessageId(null)
		setInput("")
	}

	function handleDelete(m: SponsorshipChatMessage) {
		if (!window.confirm("Delete this message? This can't be undone.")) return
		deleteMutation.mutate(m.id)
		if (editingMessageId === m.id) handleEditCancel()
	}

	async function handleSend() {
		const text = input.trim()
		if (!text) return
		if (editingMessageId) {
			editMutation.mutate({ messageId: editingMessageId, content: text })
			return
		}
		if (sendMutation.isPending) return
		sendMutation.mutate({
			content: text,
			replyToId: replyingTo?.id,
		})
	}

	async function handleImageFile(file: File) {
		if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
			toast.error("Only images or PDFs can be attached.")
			return
		}
		if (file.size > 10 * 1024 * 1024) {
			toast.error("File must be under 10 MB.")
			return
		}
		setUploadingImage(true)
		try {
			const key = await uploadSponsorshipChatImage(file, thread.id)
			sendMutation.mutate({ mediaKey: key, replyToId: replyingTo?.id })
		} catch {
			toast.error("Upload failed.")
		} finally {
			setUploadingImage(false)
			if (fileInputRef.current) fileInputRef.current.value = ""
		}
	}

	return (
		<div className="flex flex-col h-full bg-white relative">
			{/* Top Bar */}
			<div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-black/10 md:border-b-[3px] md:border-black flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 bg-white">
				<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
					{onBack && (
						<button
							onClick={onBack}
							className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-neutral-100 text-black cursor-pointer transition-colors shrink-0"
							aria-label="Back to chat list"
						>
							<ArrowLeft size={18} />
						</button>
					)}
					<div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
						<div className="relative w-9 sm:w-10 h-7.5 sm:h-8 shrink-0 select-none">
							<div className="absolute left-0 top-0.5 w-5.5 sm:w-6 h-5.5 sm:h-6 rounded-lg border border-black md:border-2 md:border-black bg-neutral-100 flex items-center justify-center font-bold text-[8px] sm:text-[9px] text-text-secondary z-0 overflow-hidden shadow-xs">
								{thread.brandLogoUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={thread.brandLogoUrl} alt={thread.brandName} className="w-full h-full object-cover" />
								) : (
									thread.brandName?.charAt(0).toUpperCase() ?? "B"
								)}
							</div>
							<div className="absolute right-0 bottom-0 w-5.5 sm:w-6 h-5.5 sm:h-6 rounded-lg border border-black md:border-2 md:border-black bg-[#FFC940] flex items-center justify-center font-black text-[8px] sm:text-[9px] text-black z-10 shadow-xs overflow-hidden">
								{thread.communityLogoUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={thread.communityLogoUrl} alt={thread.communityName} className="w-full h-full object-cover" />
								) : (
									thread.communityName?.charAt(0).toUpperCase() ?? "C"
								)}
							</div>
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-xs sm:text-sm font-black text-black truncate leading-tight">
								{thread.brandName} ↔ {thread.communityName}
							</p>
							<p className="text-[10px] sm:text-xs font-bold text-black/50 truncate">
								{thread.targetName || thread.proposalName || thread.campaignName || "Deal"}
							</p>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
					{thread.isDealClosed ? (
						<span className="text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-2.5 py-0.5 rounded-full border border-black md:border-2 md:border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-black text-white flex items-center gap-1">
							<CheckCircle2 size={11} strokeWidth={2.5} /> Closed
						</span>
					) : null}
				</div>
			</div>

			{/* Deal Banner (pinned under header) */}
			<DealBanner
				deal={deal}
				onView={() => setShowDealModal(true)}
				onReport={() => setShowReportModal(true)}
				hasReport={Boolean(report || (deal?.report && deal.report.id))}
				report={report}
			/>

			{/* Messages View */}
			<div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-2.5 sm:gap-3 min-h-0 bg-white">
				{messages.map((m) => {
					if (m.messageType === "SYSTEM") {
						return <SystemMessageBubble key={m.id} content={m.content ?? ""} isCampaign={Boolean(thread.campaignId || thread.type === "CAMPAIGN" || thread.isCampaign)} />
					}

					const isAdmin = m.senderType === "ADMIN"
					const isHost = m.senderType === "HOST"
					const isBrand = m.senderType === "BRAND"
					const isDeleted = Boolean(m.deletedAt)

					return (
						<div
							key={m.id}
							id={`msg-${m.id}`}
							className={cn(
								"flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%] transition-all duration-300 rounded-2xl p-1",
								isAdmin ? "self-end items-end" : "self-start items-start",
								highlightedMessageId === m.id && "ring-4 ring-[#EE2C2C] bg-[#FFC940]/30 shadow-lg scale-[1.02]",
							)}
						>
							{/* Top role label and action buttons (always visible in grey) */}
							<div className={cn("flex items-center gap-2 mb-0.5 px-1 select-none", isAdmin ? "flex-row-reverse" : "flex-row")}>
								<span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
									{isAdmin ? "Meetday Admin" : isBrand ? `${thread.brandName} (Brand)` : `${thread.communityName} (Community)`}
								</span>
								<div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400">
									<button
										type="button"
										onClick={() => handleReplyStart(m)}
										className="text-neutral-400 hover:text-black transition-colors cursor-pointer"
									>
										Reply
									</button>
									{isAdmin && m.content && !isDeleted && (
										<button
											type="button"
											onClick={() => handleEditStart(m)}
											className="text-neutral-400 hover:text-black transition-colors cursor-pointer"
										>
											Edit
										</button>
									)}
									{isAdmin && !isDeleted && (
										<button
											type="button"
											onClick={() => handleDelete(m)}
											className="text-neutral-400 hover:text-[#EE2C2C] transition-colors cursor-pointer"
										>
											Delete
										</button>
									)}
								</div>
							</div>

							{/* Message Bubble - Thin border styling matching brand/community layout */}
							<div
								className={cn(
									"rounded-2xl p-2 sm:p-2.5 text-xs sm:text-sm font-semibold break-words flex flex-col shadow-xs max-w-full",
									isDeleted && "border-dashed opacity-90",
									m.senderType === "BRAND" && "bg-[#EE2C2C] text-white rounded-br-sm border border-[#EE2C2C]",
									m.senderType === "HOST" && "bg-[#FFC940] text-black rounded-bl-sm border-0",
									m.senderType === "ADMIN" && "bg-neutral-100 text-black rounded-br-sm border border-black/10",
								)}
							>
								{/* Quoted reply */}
								{m.replyTo && (
									<button
										type="button"
										onClick={() => m.replyTo && handleJumpToMessage(m.replyTo.id)}
										className={cn(
											"w-full text-left mb-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer block border-l-4 shadow-xs",
											m.senderType === "BRAND"
												? "bg-black/25 hover:bg-black/35 text-white border-white/80"
												: m.senderType === "HOST"
													? "bg-black/10 hover:bg-black/15 text-black border-black/40"
													: "bg-white hover:bg-neutral-50 text-black border-[#EE2C2C] border border-black/10",
										)}
										title="Click to jump to message"
									>
										<p
											className={cn(
												"text-[9px] font-black uppercase tracking-wider",
												m.senderType === "BRAND" ? "text-white/80" : "text-black/60",
											)}
										>
											↩ Replying to {replyLabel(m.replyTo.senderType)}
										</p>
										{m.replyTo.hasMedia && (
											<p
												className={cn(
													"text-xs font-semibold flex items-center gap-1 my-0.5",
													m.senderType === "BRAND" ? "text-white/90" : "text-black/70",
												)}
											>
												📄 Attachment
											</p>
										)}
										{m.replyTo.content && (
											<p
												className={cn(
													"text-xs font-medium break-words whitespace-pre-wrap leading-relaxed mt-0.5",
													m.senderType === "BRAND" ? "text-white/90" : "text-black/80",
												)}
											>
												{m.replyTo.content}
											</p>
										)}
									</button>
								)}

								{/* Deleted Message Sidenote / Badge for Admin */}
								{isDeleted && (
									<div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-dashed border-red-200 mb-1 w-fit">
										<span>🗑️</span>
										<span>This message was deleted by {replyLabel(m.senderType)}</span>
									</div>
								)}

								{/* Message text content */}
								{m.content && (
									<div className={cn("whitespace-pre-wrap leading-relaxed", isDeleted && "opacity-80")}>
										<LinkifiedText text={m.content} />
									</div>
								)}

								{/* Media attachments */}
								{m.mediaUrl &&
									(isPdfMediaUrl(m.mediaUrl) ? (
										<a
											href={m.mediaUrl}
											target="_blank"
											rel="noopener noreferrer"
											className={cn(
												"mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold w-fit transition-colors",
												m.senderType === "BRAND"
													? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
													: "bg-white hover:bg-neutral-100 text-black border border-black/10 shadow-xs",
											)}
										>
											<span className="text-base">📄</span>
											<span>View PDF</span>
										</a>
									) : (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={m.mediaUrl}
											alt="Attachment"
											onClick={() => setViewingImage(m.mediaUrl ?? null)}
											className={cn(
												"mt-1.5 rounded-xl max-h-60 max-w-full object-cover cursor-pointer hover:opacity-95 shadow-xs border border-black/10",
												isDeleted && "opacity-70",
											)}
										/>
									))}

								{!m.content && !m.mediaUrl && isDeleted && (
									<span className="italic text-black/40 text-xs">This message was deleted</span>
								)}
							</div>

							{/* Bottom timestamp line in grey */}
							<div
								className={cn(
									"flex items-center gap-1 text-[9px] font-bold mt-0.5 px-0.5 select-none text-neutral-400",
									isAdmin ? "flex-row-reverse" : "flex-row",
								)}
							>
								<span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}</span>
								{m.editedAt && <span>(edited)</span>}
								{isAdmin && <span className="font-bold">✓✓</span>}
							</div>
						</div>
					)
				})}
				<div ref={bottomRef} />
			</div>

			{/* Typing indicator & Action Banners */}
			<div className="border-t border-black/10 md:border-t-[3px] md:border-black shrink-0 bg-white flex flex-col">
				{typingSenderType && (
					<p className="px-4 pt-2 text-[11px] font-bold text-black/40 italic">
						{typingSenderType === "BRAND" ? thread.brandName : thread.communityName} is typing…
					</p>
				)}

				{editingMessageId && (
					<div className="px-4 pt-2 flex items-center justify-between">
						<span className="text-[10px] font-black uppercase text-black/40">Editing message</span>
						<button type="button" onClick={handleEditCancel} className="text-[10px] font-bold text-[#EE2C2C] hover:underline cursor-pointer">
							Cancel
						</button>
					</div>
				)}

				{replyingTo && !editingMessageId && (
					<div className="px-4 pt-2 flex items-center justify-between gap-2 border-b border-black/10 pb-2">
						<div className="min-w-0 pl-2 border-l-2 border-[#EE2C2C]">
							<p className="text-[10px] font-black uppercase text-black/40">Replying to {replyLabel(replyingTo.senderType)}</p>
							<p className="text-[11px] font-semibold text-black/50 truncate">
								{replyingTo.content?.trim() ? replyingTo.content : replyingTo.mediaUrl ? "Attachment" : ""}
							</p>
						</div>
						<button
							type="button"
							onClick={() => setReplyingTo(null)}
							className="text-[10px] font-bold text-[#EE2C2C] shrink-0 hover:underline cursor-pointer"
						>
							Cancel
						</button>
					</div>
				)}

				{/* Input Row */}
				<div className="relative p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
					<MentionPicker
						suggestions={mentionSuggestions}
						query={mentionQuery}
						isOpen={isMentionOpen}
						onSelect={handleMentionSelect}
						onClose={() => setIsMentionOpen(false)}
					/>

					<input
						type="file"
						accept="image/*,application/pdf"
						ref={fileInputRef}
						onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
						className="hidden"
					/>

					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={uploadingImage || Boolean(editingMessageId)}
						className="shrink-0 size-8 sm:size-9 rounded-xl border-[2px] md:border-[3px] border-black flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50 cursor-pointer transition-colors"
						aria-label="Attach image or PDF"
					>
						<ImageIcon size={16} />
					</button>

					<EmojiPicker onSelect={(emoji) => setInput((prev) => prev + emoji)} />

					<input
						ref={inputRef}
						value={input}
						onChange={(e) => handleInputChange(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey && !isMentionOpen) {
								e.preventDefault()
								handleSend()
							}
							if (e.key === "Escape" && editingMessageId) handleEditCancel()
						}}
						placeholder={editingMessageId ? "Edit your message… (Enter to save)" : "Write a message… (type @ to tag)"}
						className="flex-1 min-w-0 rounded-2xl border-[2px] md:border-[3px] border-black bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold outline-none focus:bg-neutral-50"
					/>

					<button
						type="button"
						onClick={handleSend}
						disabled={sendMutation.isPending || editMutation.isPending || !input.trim()}
						className="h-8 sm:h-10 px-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-[#EE2C2C] hover:bg-[#d42525] text-white border-[2px] md:border-[3px] border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 cursor-pointer shrink-0 transition-all flex items-center justify-center"
					>
						{sendMutation.isPending || editMutation.isPending ? "…" : editingMessageId ? "Save" : "Send"}
					</button>
				</div>
			</div>

			{/* Deal Details Modal */}
			{showDealModal && deal && (
				<DealDetailsModal interestId={thread.id} deal={deal} onClose={() => setShowDealModal(false)} />
			)}

			{/* Deliverables Report Modal */}
			{showReportModal && (
				<DealReportModal interestId={thread.id} onClose={() => setShowReportModal(false)} />
			)}

			{/* Image Lightbox */}
			{viewingImage && <ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />}
		</div>
	)
}
