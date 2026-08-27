"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Image as ImageIcon, ArrowLeft } from "lucide-react"
import { cn, isPdfMediaUrl } from "@/lib/utils"
import PageHeader from "@/components/ui/PageHeader"
import { uploadSponsorshipChatImage } from "@/lib/api/storage"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { EmojiPicker } from "@/components/ui/EmojiPicker"
import { LinkifiedText } from "@/components/ui/linkified-text"
import { MentionPicker, type MentionSuggestion } from "@/components/chat/MentionPicker"
import { useChatTyping } from "@/lib/hooks/use-chat-typing"
import {
	getSponsorshipChats,
	getSponsorshipChatMessages,
	sendSponsorshipChatMessage,
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

	const selectedThread = filteredThreads.find((t) => t.id === selectedId) ?? (filteredThreads.length > 0 && selectedId ? allThreads.find((t) => t.id === selectedId) ?? null : null)

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

			<div className="flex-1 min-h-0 flex flex-col md:flex-row bg-white overflow-hidden md:border-[3px] md:border-black md:rounded-[24px] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:h-[calc(100vh-250px)]">
				{/* Thread list */}
				<div className={cn(
					"flex flex-col h-full bg-white border-r-0 md:border-r-[3px] md:border-black",
					selectedId ? "hidden md:flex md:w-80 shrink-0" : "w-full md:w-80 shrink-0 flex-1 md:flex-initial",
				)}>
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
									"flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors relative cursor-pointer",
									activeTab === tab ? "bg-[#EE2C2C] text-white" : "bg-white text-black/60 hover:bg-neutral-50",
								)}
							>
								{tab === "SPONSORSHIP" ? "Sponsorships" : "Campaigns"}
							</button>
						))}
					</div>

					{/* Search in threads */}
					<div className="p-2 border-b border-black/10 bg-neutral-50/50 shrink-0">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder={activeTab === "SPONSORSHIP" ? "Search sponsorships…" : "Search campaigns…"}
							className="w-full px-3 py-1.5 text-xs rounded-xl border-[2px] border-neutral-300 bg-white placeholder:text-neutral-400 focus:border-black focus:outline-none transition-colors"
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
										"w-full text-left px-4 py-3 border-b border-black/10 transition-colors flex items-center gap-3",
										selectedId === t.id ? "bg-[#FFC940]/20" : "hover:bg-neutral-50",
									)}
								>
									{/* Cascading Logos */}
									<div className="relative w-11 h-9 shrink-0 select-none">
										{/* Brand Logo or Initials (back/left) */}
										<div className="absolute left-0 top-0.5 w-7 h-7 rounded-full border border-black/10 bg-neutral-100 flex items-center justify-center font-bold text-[10px] text-text-secondary z-0 overflow-hidden">
											{t.brandLogoUrl ? (
												<img
													src={t.brandLogoUrl}
													alt={t.brandName}
													className="w-full h-full object-cover"
												/>
											) : (
												t.brandName?.charAt(0).toUpperCase() ?? "B"
											)}
										</div>
										{/* Community Logo or Initials (front/right overlapping) */}
										<div className="absolute right-0 bottom-0 w-7 h-7 rounded-full border-2 border-black bg-[#FFC940] flex items-center justify-center font-black text-[10px] text-black z-10 shadow-xs overflow-hidden">
											{t.communityLogoUrl ? (
												<img
													src={t.communityLogoUrl}
													alt={t.communityName}
													className="w-full h-full object-cover"
												/>
											) : (
												t.communityName?.charAt(0).toUpperCase() ?? "C"
											)}
										</div>
										{t.unreadCount > 0 && (
											<div className="absolute -top-1.5 -right-2 flex items-center gap-0.5 z-20">
												{t.hasUnreadMention && (
													<span className="size-4 rounded-full bg-black text-[#FFC940] text-[9px] font-black flex items-center justify-center border border-white shadow-xs" title="You were mentioned or replied to">
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
												<p className="text-xs sm:text-body-sm font-bold text-text-primary truncate">{t.brandName} • Brand</p>
												<p className="text-xs sm:text-body-sm font-bold text-text-primary truncate mt-0.5">{t.communityName} • Community</p>
											</div>
											<span className="text-[10px] font-semibold text-text-tertiary shrink-0 self-start mt-0.5">{timeAgo(t.lastMessageAt ?? t.createdAt)}</span>
										</div>
										<p className="text-[11px] text-text-tertiary truncate mt-1">
											{t.targetName || t.proposalName || t.campaignName || "Deal"}
										</p>
										<div className="flex items-center gap-1.5 mt-1">
											<span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
												Accepted
											</span>
											{t.isDealLocked && (
												<span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFC940]/30 text-amber-900 flex items-center gap-0.5">
													🔒 Locked
												</span>
											)}
										</div>
										{t.lastMessagePreview && <p className="text-[11px] text-text-tertiary truncate mt-1">{t.lastMessagePreview}</p>}
									</div>
								</button>
							))
						)}
					</div>
				</div>

				{/* Thread detail */}
				<div className={cn(
					"min-w-0 flex flex-col h-full bg-[#F8F9FB] md:bg-white",
					selectedId ? "flex-1 w-full" : "hidden md:flex flex-1",
				)}>
					{!selectedThread ? (
						<div className="flex-1 flex items-center justify-center text-body-sm text-text-tertiary">Select a chat to view</div>
					) : (
						<AdminChatThreadPanel
							key={selectedThread.id}
							thread={selectedThread}
							onBack={() => setSelectedId(null)}
						/>
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
	const [mentionQuery, setMentionQuery] = useState("")
	const [isMentionOpen, setIsMentionOpen] = useState(false)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
	const highlightTimerRef = useRef<NodeJS.Timeout | null>(null)
	const bottomRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const { typingSenderType, notifyTyping, notifyStopTyping } = useChatTyping(thread.id, "ADMIN")

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

	async function handleSend() {
		const text = input.trim()
		if (!text || sendMutation.isPending) return
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
			<div className="px-6 py-4 border-b border-black/10 flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					{onBack && (
						<button
							onClick={onBack}
							className="md:hidden p-1.5 -ml-2 rounded-lg hover:bg-neutral-100 text-black"
							aria-label="Back to thread list"
						>
							<ArrowLeft size={18} />
						</button>
					)}
					<div className="flex items-center gap-3">
						<div className="relative w-10 h-8 shrink-0 select-none">
							<div className="absolute left-0 top-0.5 w-6 h-6 rounded-full border border-black/10 bg-neutral-100 flex items-center justify-center font-bold text-[9px] text-text-secondary z-0 overflow-hidden">
								{thread.brandLogoUrl ? (
									<img src={thread.brandLogoUrl} alt={thread.brandName} className="w-full h-full object-cover" />
								) : (
									thread.brandName?.charAt(0).toUpperCase() ?? "B"
								)}
							</div>
							<div className="absolute right-0 bottom-0 w-6 h-6 rounded-full border-2 border-black bg-[#FFC940] flex items-center justify-center font-black text-[9px] text-black z-10 shadow-xs overflow-hidden">
								{thread.communityLogoUrl ? (
									<img src={thread.communityLogoUrl} alt={thread.communityName} className="w-full h-full object-cover" />
								) : (
									thread.communityName?.charAt(0).toUpperCase() ?? "C"
								)}
							</div>
						</div>
						<div>
							<p className="text-body-sm font-bold text-text-primary">
								{thread.brandName} ↔ {thread.communityName}
							</p>
							<p className="text-caption text-text-tertiary">
								{thread.targetName || thread.proposalName || thread.campaignName || "Deal"}
							</p>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
						Accepted
					</span>
					{thread.isDealLocked && (
						<span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FFC940]/30 text-amber-900 flex items-center gap-1">
							🔒 Deal Locked
						</span>
					)}
				</div>
			</div>

			{/* Messages View */}
			<div className="flex-1 p-6 overflow-y-auto space-y-4">
				{messages.map((m) => {
					const isAdmin = m.senderType === "ADMIN"
					const isHost = m.senderType === "HOST"
					const isBrand = m.senderType === "BRAND"

					return (
						<div
							key={m.id}
							id={`msg-${m.id}`}
							className={cn(
								"flex flex-col max-w-[70%] transition-colors duration-500 rounded-2xl p-3",
								isAdmin
									? "ml-auto bg-[#EE2C2C] text-white"
									: isBrand
										? "mr-auto bg-neutral-100 text-text-primary"
										: "mr-auto bg-[#FFC940]/30 text-text-primary border border-amber-300",
								highlightedMessageId === m.id && "ring-2 ring-blue-500",
							)}
						>
							<div className="flex items-center justify-between gap-4 mb-1">
								<span className={cn("text-[10px] font-bold uppercase", isAdmin ? "text-white/80" : "text-text-tertiary")}>
									{isAdmin ? "Meetday Admin" : isBrand ? `${thread.brandName} (Brand)` : `${thread.communityName} (Community)`}
								</span>
								<span className={cn("text-[10px]", isAdmin ? "text-white/70" : "text-text-tertiary")}>
									{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
								</span>
							</div>

							{m.replyTo && (
								<div
									onClick={() => m.replyTo && handleJumpToMessage(m.replyTo.id)}
									className={cn(
										"text-[11px] p-2 rounded-lg mb-2 border-l-2 cursor-pointer",
										isAdmin ? "bg-black/10 border-white text-white/90" : "bg-white border-neutral-400 text-text-secondary",
									)}
								>
									<span className="font-bold">{m.replyTo.senderType}: </span>
									<span>{m.replyTo.content}</span>
								</div>
							)}

							{m.content && (
								<div className="text-body-sm whitespace-pre-wrap">
									<LinkifiedText text={m.content} />
								</div>
							)}

							{m.mediaUrl && (
								isPdfMediaUrl(m.mediaUrl) ? (
									<a
										href={m.mediaUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-black/15 bg-white hover:bg-neutral-50 text-sm font-bold text-black w-fit"
									>
										📄 View PDF
									</a>
								) : (
									<img
										src={m.mediaUrl}
										alt="Attached"
										onClick={() => setViewingImage(m.mediaUrl ?? null)}
										className="mt-2 rounded-xl max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
									/>
								)
							)}
						</div>
					)
				})}
				<div ref={bottomRef} />
			</div>

			{/* Typing indicator */}
			{typingSenderType && (
				<div className="px-6 py-1 text-[11px] font-medium text-text-tertiary italic">
					{typingSenderType === "BRAND" ? thread.brandName : thread.communityName} is typing…
				</div>
			)}

			{/* Reply bar */}
			{replyingTo && (
				<div className="px-6 py-2 bg-neutral-50 border-t border-black/10 flex items-center justify-between text-xs">
					<span className="truncate">
						Replying to <span className="font-bold">{replyingTo.senderType}</span>: {replyingTo.content}
					</span>
					<button onClick={() => setReplyingTo(null)} className="text-neutral-500 hover:text-black">
						✕
					</button>
				</div>
			)}

			{/* Input Box */}
			<div className="p-4 border-t border-black/10 flex items-center gap-2 bg-white relative">
				{isMentionOpen && (
					<MentionPicker
						isOpen={isMentionOpen}
						query={mentionQuery}
						suggestions={mentionSuggestions}
						onSelect={handleMentionSelect}
						onClose={() => setIsMentionOpen(false)}
					/>
				)}

				<input
					type="file"
					ref={fileInputRef}
					onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
					className="hidden"
					accept="image/*,application/pdf"
				/>

				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					disabled={uploadingImage}
					className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-600 transition-colors"
					title="Attach image or PDF"
				>
					<ImageIcon size={20} />
				</button>

				<EmojiPicker onSelect={(emoji) => setInput((prev) => prev + emoji)} />

				<input
					type="text"
					value={input}
					onChange={(e) => handleInputChange(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
					placeholder="Reply as Meetday Admin… (@mention)"
					className="flex-1 px-4 py-2 text-sm rounded-xl border border-neutral-300 focus:border-black focus:outline-none transition-colors"
				/>

				<button
					type="button"
					onClick={handleSend}
					disabled={sendMutation.isPending || !input.trim()}
					className="px-4 py-2 bg-[#EE2C2C] text-white text-xs font-bold uppercase rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
				>
					Send
				</button>
			</div>

			{viewingImage && <ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />}
		</div>
	)
}
