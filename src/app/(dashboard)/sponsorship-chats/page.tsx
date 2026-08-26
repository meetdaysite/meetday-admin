"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Image as ImageIcon, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
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
	type ChatSenderType,
	type SponsorshipChatStatus,
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
	const [statusFilter, setStatusFilter] = useState<SponsorshipChatStatus>("ACCEPTED")
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const threadsQuery = useQuery({
		queryKey: ["admin-sponsorship-chats", statusFilter],
		queryFn: () => getSponsorshipChats(statusFilter),
		refetchInterval: THREADS_POLL_MS,
	})

	const threads = [...(threadsQuery.data ?? [])].sort((a, b) => {
		const tA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
		const tB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
		return tB - tA
	})
	const selectedThread = threads.find(t => t.id === selectedId) ?? null

	function handleSelectThread(id: string) {
		setSelectedId(id)
		queryClient.setQueryData<SponsorshipChatThread[]>(["admin-sponsorship-chats", statusFilter], prev =>
			prev?.map(t => (t.id === id ? { ...t, unreadCount: 0 } : t)),
		)
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col h-full md:p-6 md:space-y-5 md:max-w-7xl md:mx-auto w-full">
			<div className="hidden md:block shrink-0">
				<PageHeader title="Ongoing Chats" description="Every Community ↔ Brand chat thread — view or step in as Meetday." />
			</div>

			<div className="flex-1 min-h-0 flex flex-col md:flex-row bg-white overflow-hidden md:border-[3px] md:border-black md:rounded-[24px] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:h-[calc(100vh-270px)]">
				{/* Thread list */}
				<div className={cn(
					"flex flex-col h-full bg-white border-r-0 md:border-r-[3px] md:border-black",
					selectedId ? "hidden md:flex md:w-80 shrink-0" : "w-full md:w-80 shrink-0 flex-1 md:flex-initial"
				)}>
					<div className="flex border-b border-black/10 md:border-b-[3px] md:border-black shrink-0">
						{(["ACCEPTED", "REQUESTED"] as SponsorshipChatStatus[]).map(s => (
							<button
								key={s}
								onClick={() => {
									setStatusFilter(s)
									setSelectedId(null)
								}}
								className={cn(
									"flex-grow py-3 text-xs font-black uppercase tracking-wider transition-colors relative",
									statusFilter === s ? "bg-[#EE2C2C] text-white" : "bg-white text-black/50 hover:bg-neutral-50",
								)}
							>
								{s === "REQUESTED" ? "Requests" : "General"}
							</button>
						))}
					</div>
					<div className="flex-1 overflow-y-auto">
						{threadsQuery.isLoading ? (
							<p className="text-caption text-text-tertiary text-center py-8">Loading…</p>
						) : threads.length === 0 ? (
							<p className="text-caption text-text-tertiary text-center py-8 px-4">No chat threads yet.</p>
						) : (
							threads.map(t => (
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
												t.brandName.charAt(0).toUpperCase()
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
												t.communityName.charAt(0).toUpperCase()
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
										<p className="text-[11px] text-text-tertiary truncate mt-1">{t.proposalName}</p>
										<div className="flex items-center gap-1.5 mt-1">
											<span
												className={cn(
													"text-[9px] font-bold px-1.5 py-0.5 rounded",
													t.chatStatus === "ACCEPTED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
												)}
											>
												{t.chatStatus === "ACCEPTED" ? "Accepted" : "Requested"}
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
					selectedId ? "flex-1 w-full" : "hidden md:flex flex-1"
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
			setInput(prev => prev + `@${tag} `)
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

	async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		e.target.value = ""
		if (!file) return
		if (!file.type.startsWith("image/")) {
			toast.error("Only image files can be sent.")
			return
		}
		setUploadingImage(true)
		try {
			const mediaKey = await uploadSponsorshipChatImage(file, thread.id)
			sendMutation.mutate({ mediaKey })
		} catch {
			toast.error("Failed to send image.")
		} finally {
			setUploadingImage(false)
		}
	}

	function labelFor(senderType: SponsorshipChatMessage["senderType"]) {
		if (senderType === "HOST") return `${thread.communityName} • Community`
		if (senderType === "BRAND") return `${thread.brandName} • Brand`
		return "Meetday • Admin"
	}

	function replySnippet(replyTo: SponsorshipChatMessage["replyTo"]) {
		if (!replyTo) return ""
		return replyTo.content?.trim() ? replyTo.content : replyTo.hasMedia ? "📷 Photo" : ""
	}

	function typingLabelFor(senderType: ChatSenderType) {
		if (senderType === "HOST") return thread.communityName
		if (senderType === "BRAND") return thread.brandName
		return "Meetday"
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col h-full">
			{/* Chat Header */}
			<div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-black/10 md:border-b-[3px] md:border-black bg-white shrink-0 flex items-center justify-between gap-2.5">
				<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
					{onBack && (
						<button
							type="button"
							onClick={onBack}
							className="md:hidden p-1.5 -ml-1 text-black/70 hover:text-black hover:bg-neutral-100 rounded-full shrink-0 transition-colors"
							aria-label="Back to chat list"
						>
							<ArrowLeft size={18} />
						</button>
					)}
					<div className="relative w-11 h-9 shrink-0 select-none">
						{/* Brand Logo or Initials */}
						<div className="absolute left-0 top-0.5 w-7 h-7 rounded-full border border-black/10 bg-neutral-100 flex items-center justify-center font-bold text-[10px] text-text-secondary z-0 overflow-hidden">
							{thread.brandLogoUrl ? (
								<img
									src={thread.brandLogoUrl}
									alt={thread.brandName}
									className="w-full h-full object-cover"
								/>
							) : (
								thread.brandName.charAt(0).toUpperCase()
							)}
						</div>
						{/* Community Logo or Initials */}
						<div className="absolute right-0 bottom-0 w-7 h-7 rounded-full border-2 border-black bg-[#FFC940] flex items-center justify-center font-black text-[10px] text-black z-10 shadow-xs overflow-hidden">
							{thread.communityLogoUrl ? (
								<img
									src={thread.communityLogoUrl}
									alt={thread.communityName}
									className="w-full h-full object-cover"
								/>
							) : (
								thread.communityName.charAt(0).toUpperCase()
							)}
						</div>
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-xs sm:text-sm font-heading font-black text-black truncate leading-tight">
							{thread.brandName} ↔ {thread.communityName}
						</p>
						<p className="text-[10px] sm:text-[11px] font-semibold text-black/50 truncate">
							{thread.proposalName}
						</p>
					</div>
				</div>

				{thread.isDealLocked && (
					<span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFC940] text-black border border-black/20">
						🔒 Deal Locked
					</span>
				)}
			</div>

			{/* Messages Stream */}
			<div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 flex flex-col gap-3">
				{messagesQuery.isLoading ? (
					<p className="text-caption text-text-tertiary text-center">Loading…</p>
				) : messages.length === 0 ? (
					<p className="text-caption text-text-tertiary text-center m-auto">
						{thread.chatStatus === "REQUESTED" ? "The community hasn't accepted this request yet." : "No messages yet."}
					</p>
				) : (
					messages.map(m => {
						if (m.messageType === "SYSTEM") {
							return (
								<div key={m.id} className="self-center max-w-[90%] px-3 py-1 rounded-full bg-white border border-black/10 text-black/60 text-[11px] font-semibold text-center shadow-xs">
									{m.content}
								</div>
							)
						}
						const isMeetday = m.senderType === "ADMIN"
						return (
							<div
								key={m.id}
								id={`msg-${m.id}`}
								className={cn(
									"flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%] transition-all duration-300 rounded-2xl p-1.5",
									isMeetday ? "self-end items-end" : "self-start items-start",
									highlightedMessageId === m.id && "ring-4 ring-[#EE2C2C] bg-[#FFC940]/40 shadow-xl scale-[1.03] animate-pulse"
								)}
							>
								<div className="flex items-center gap-2 mb-0.5 px-1">
									<span className="text-[10px] font-semibold uppercase tracking-wide text-black/40 font-heading">{labelFor(m.senderType)}</span>
									<button type="button" onClick={() => setReplyingTo(m)} className="text-[10px] font-bold text-black/40 hover:text-black transition-colors">
										Reply
									</button>
								</div>
								<div
									className={cn(
										"rounded-2xl p-2 sm:p-2.5 text-xs sm:text-body-sm break-words break-all border flex flex-col shadow-xs",
										m.senderType === "BRAND" && "bg-[#EE2C2C] text-white rounded-bl-xs border-[#EE2C2C]",
										m.senderType === "HOST" && "bg-[#FFC940] text-black rounded-bl-xs border-[#FFC940]",
										m.senderType === "ADMIN" && "bg-neutral-100 text-black rounded-br-xs border-black/10",
										m.deletedAt && "opacity-50 italic line-through",
									)}
								>
									{m.replyTo && (
										<button
											type="button"
											onClick={() => handleJumpToMessage(m.replyTo!.id)}
											className={cn(
												"w-full text-left mb-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer block border-l-4 shadow-xs",
												m.senderType === "BRAND"
													? "bg-black/25 hover:bg-black/35 text-white border-white/80"
													: m.senderType === "HOST"
													? "bg-black/10 hover:bg-black/15 text-black border-black/40"
													: "bg-white hover:bg-neutral-50 text-black border-[#EE2C2C] border border-black/10"
											)}
											title="Click to jump to message"
										>
											<p className={cn(
												"text-[9px] font-black uppercase tracking-wider",
												m.senderType === "BRAND" ? "text-white/80" : "text-black/60"
											)}>
												↩ Replying to {labelFor(m.replyTo.senderType)}
											</p>
											{m.replyTo.hasMedia && (
												<p className={cn("text-xs font-semibold flex items-center gap-1 my-0.5", m.senderType === "BRAND" ? "text-white/90" : "text-black/70")}>
													📷 Photo
												</p>
											)}
											{m.replyTo.content && (
												<p className={cn("text-xs font-medium break-words whitespace-pre-wrap leading-relaxed mt-0.5", m.senderType === "BRAND" ? "text-white/90" : "text-black/80")}>
													{m.replyTo.content}
												</p>
											)}
										</button>
									)}
									{m.deletedAt && (
										<p className="text-[10px] font-bold italic text-black/40 mb-0.5">
											🗑️ Deleted by {labelFor(m.senderType)}
										</p>
									)}
									{m.mediaUrl && (
										/* eslint-disable-next-line @next/next/no-img-element */
										<img
											src={m.mediaUrl}
											alt="Shared image"
											onClick={() => setViewingImage(m.mediaUrl!)}
											className="max-w-[220px] max-h-[220px] rounded-xl border border-black/15 object-cover cursor-pointer mb-1 shadow-sm"
										/>
									)}
									{m.content && (
										<div className="px-1 py-0.5">
											<LinkifiedText text={m.content} />
										</div>
									)}
								</div>
								{(m.content || m.mediaUrl) && (
									<div className={cn("flex items-center gap-1 mt-0.5 text-[9px] font-bold text-black/40 px-1", isMeetday ? "justify-end" : "justify-start")}>
										<span>
											{(() => {
												try {
													return new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
												} catch {
													return ""
												}
											})()}
										</span>
										{m.senderType === "ADMIN" && (() => {
											const isRead = !!m.hostReadAt && !!m.brandReadAt
											return (
												<span className={cn("text-[10px] leading-none font-bold", isRead ? "text-red-500 font-black" : "text-gray-400")}>
													✓✓
												</span>
											)
										})()}
									</div>
								)}
							</div>
						)
					})
				)}
				<div ref={bottomRef} />
			</div>

			{/* Input & Action Bar */}
			<div className="p-2 sm:p-3 border-t border-black/10 md:border-t-[3px] md:border-black bg-white flex flex-col gap-2 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
				{typingSenderType && (
					<p className="text-[11px] font-bold text-black/40 italic">{typingLabelFor(typingSenderType)} is typing…</p>
				)}
				{replyingTo && (
					<div className="flex items-center justify-between gap-2 px-1">
						<div className="min-w-0 pl-2 border-l-2 border-[#EE2C2C]">
							<p className="text-[10px] font-black uppercase text-black/40">Replying to {labelFor(replyingTo.senderType)}</p>
							<p className="text-[11px] font-semibold text-black/60 truncate">{replyingTo.content?.trim() ? replyingTo.content : (replyingTo.mediaUrl ? "Photo" : "")}</p>
						</div>
						<button type="button" onClick={() => setReplyingTo(null)} className="text-[10px] font-bold text-[#EE2C2C] shrink-0">Cancel</button>
					</div>
				)}
				<div className="relative flex items-center gap-1.5 sm:gap-2">
					<MentionPicker
						suggestions={mentionSuggestions}
						query={mentionQuery}
						isOpen={isMentionOpen}
						onSelect={handleMentionSelect}
						onClose={() => setIsMentionOpen(false)}
					/>
					<input type="file" accept="image/*" ref={fileInputRef} onChange={handleImagePick} className="hidden" />
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={uploadingImage}
						className="shrink-0 size-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-black/70 hover:text-black transition-colors disabled:opacity-50"
						aria-label="Attach image"
					>
						<ImageIcon size={18} />
					</button>
					<EmojiPicker onSelect={emoji => setInput(prev => prev + emoji)} />
					<input
						value={input}
						onChange={e => handleInputChange(e.target.value)}
						onKeyDown={e => {
							if (e.key === "Enter" && !e.shiftKey && input.trim() && !isMentionOpen) {
								e.preventDefault()
								sendMutation.mutate({ content: input.trim(), replyToId: replyingTo?.id })
							}
						}}
						placeholder="Message as Meetday… (type @ to tag)"
						className="flex-1 min-w-0 rounded-full border border-black/15 focus:border-black bg-neutral-100 focus:bg-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium outline-none transition-all"
					/>
					<button
						type="button"
						onClick={() => input.trim() && sendMutation.mutate({ content: input.trim(), replyToId: replyingTo?.id })}
						disabled={sendMutation.isPending || !input.trim()}
						className="h-9 px-3.5 sm:px-4 rounded-full bg-[#EE2C2C] hover:bg-[#D12525] text-white font-black text-xs uppercase tracking-wider disabled:opacity-40 transition-all shrink-0 flex items-center justify-center whitespace-nowrap"
					>
						{sendMutation.isPending ? "…" : "Send"}
					</button>
				</div>
			</div>

			{viewingImage && <ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />}
		</div>
	)
}
