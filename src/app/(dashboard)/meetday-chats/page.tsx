"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Image as ImageIcon, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/ui/PageHeader"
import { uploadMeetdayChatImage } from "@/lib/api/storage"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { EmojiPicker } from "@/components/ui/EmojiPicker"
import { LinkifiedText } from "@/components/ui/linkified-text"
import { MentionPicker, type MentionSuggestion } from "@/components/chat/MentionPicker"
import {
	getMeetdayChats,
	getMeetdayChatMessages,
	sendMeetdayChatMessage,
	resolveMeetdayChat,
	type MeetdayChatThread,
	type MeetdayChatMessage,
} from "@/lib/api/meetday-chats"

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

export default function MeetdayChatsPage() {
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const threadsQuery = useQuery({
		queryKey: ["admin-meetday-chats"],
		queryFn: () => getMeetdayChats(),
		refetchInterval: THREADS_POLL_MS,
	})

	const threads = [...(threadsQuery.data ?? [])].sort((a, b) => {
		const tA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
		const tB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
		return tB - tA
	})
	const selectedThread = threads.find(t => t.id === selectedId) ?? null

	return (
		<div className="flex-1 min-h-0 flex flex-col h-full md:p-6 md:space-y-5 md:max-w-7xl md:mx-auto w-full">
			<div className="hidden md:block shrink-0">
				<PageHeader title="Meetday Chats" description="Direct support chats from Communities and Brands — reply as Meetday." />
			</div>

			<div className="flex-1 min-h-0 flex flex-col md:flex-row bg-white overflow-hidden md:border-[3px] md:border-black md:rounded-[24px] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:h-[calc(100vh-270px)]">
				{/* Thread list */}
				<div className={cn(
					"flex flex-col h-full bg-white border-r-0 md:border-r-[3px] md:border-black",
					selectedId ? "hidden md:flex md:w-80 shrink-0" : "w-full md:w-80 shrink-0 flex-1 md:flex-initial"
				)}>
					<div className="px-4 py-3 border-b border-black/10 md:hidden flex items-center justify-between shrink-0">
						<h2 className="font-heading font-black text-base text-black">Support Chats</h2>
						<span className="text-xs font-semibold text-black/50">{threads.length} chats</span>
					</div>

					<div className="flex-1 overflow-y-auto">
						{threadsQuery.isLoading ? (
							<p className="text-caption text-text-tertiary text-center py-8">Loading…</p>
						) : threads.length === 0 ? (
							<p className="text-caption text-text-tertiary text-center py-8 px-4">No support chats yet.</p>
						) : (
							threads.map(t => (
								<button
									key={t.id}
									onClick={() => setSelectedId(t.id)}
									className={cn(
										"w-full text-left px-4 py-3 border-b border-black/10 transition-colors flex items-center gap-3",
										selectedId === t.id ? "bg-[#FFC940]/20" : "hover:bg-neutral-50",
									)}
								>
									<div className="w-9 h-9 rounded-full border border-black/15 bg-neutral-100 flex items-center justify-center font-black text-xs text-black/60 shrink-0 relative overflow-hidden">
										{t.userLogoUrl ? (
											<img
												src={t.userLogoUrl}
												alt={t.userName}
												className="w-full h-full object-cover"
											/>
										) : (
											t.userName.charAt(0).toUpperCase()
										)}
										{t.unreadCount > 0 && (
											<div className="absolute -top-1 -right-1 flex items-center gap-0.5 z-10">
												{t.hasUnreadMention && (
													<span className="size-4 rounded-full bg-black text-[#FFC940] text-[9px] font-black flex items-center justify-center border border-white shadow-xs" title="You were mentioned or replied to">
														@
													</span>
												)}
												<span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[#EE2C2C] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
													{t.unreadCount > 9 ? "9+" : t.unreadCount}
												</span>
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-2">
											<p className="text-sm font-black text-black truncate">{t.userName}</p>
											<span className="text-[10px] font-semibold text-black/40 shrink-0">{timeAgo(t.lastMessageAt ?? t.createdAt)}</span>
										</div>
										<p className="text-[11px] font-semibold text-black/50 truncate mt-0.5">{t.userRole ? `${t.userRole === "HOST" ? "Community" : t.userRole} • ` : ""}{t.userEmail}</p>
										{t.lastMessagePreview && (
											<p className="text-[11px] text-black/60 truncate mt-1">{t.lastMessagePreview}</p>
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
						<div className="flex-1 flex items-center justify-center text-body-sm text-text-tertiary">Select a chat to view</div>
					) : (
						<MeetdayAdminChatPanel
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

function MeetdayAdminChatPanel({
	thread,
	onBack,
}: {
	thread: MeetdayChatThread
	onBack?: () => void
}) {
	const queryClient = useQueryClient()
	const [input, setInput] = useState("")
	const [uploadingImage, setUploadingImage] = useState(false)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [replyingTo, setReplyingTo] = useState<MeetdayChatMessage | null>(null)
	const [mentionQuery, setMentionQuery] = useState("")
	const [isMentionOpen, setIsMentionOpen] = useState(false)
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
	const highlightTimerRef = useRef<NodeJS.Timeout | null>(null)
	const bottomRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const mentionSuggestions: MentionSuggestion[] = [
		{
			id: "user",
			name: thread.userName,
			tag: thread.userName.replace(/\s+/g, ""),
			role: thread.userRole === "BRAND" ? "Brand" : thread.userRole === "HOST" ? "Community" : "User",
			avatarUrl: thread.userLogoUrl,
		},
	]

	const handleInputChange = (val: string) => {
		setInput(val)

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
		queryKey: ["admin-meetday-chat-messages", thread.id],
		queryFn: () => getMeetdayChatMessages(thread.id),
		refetchInterval: MESSAGES_POLL_MS,
	})
	const messages = messagesQuery.data?.messages ?? []

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages.length])

	const sendMutation = useMutation({
		mutationFn: (payload: { content?: string; mediaKey?: string; replyToId?: string }) =>
			sendMeetdayChatMessage(thread.id, payload),
		onSuccess: () => {
			setInput("")
			setReplyingTo(null)
			queryClient.invalidateQueries({ queryKey: ["admin-meetday-chat-messages", thread.id] })
			queryClient.invalidateQueries({ queryKey: ["admin-meetday-chats"] })
		},
		onError: () => toast.error("Failed to send message."),
	})

	const resolveMutation = useMutation({
		mutationFn: () => resolveMeetdayChat(thread.id),
		onSuccess: () => {
			toast.success("Marked as resolved.")
			queryClient.invalidateQueries({ queryKey: ["admin-meetday-chat-messages", thread.id] })
			queryClient.invalidateQueries({ queryKey: ["admin-meetday-chats"] })
		},
		onError: () => toast.error("Failed to mark as resolved."),
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
			const mediaKey = await uploadMeetdayChatImage(file, thread.userId)
			sendMutation.mutate({ mediaKey })
		} catch {
			toast.error("Failed to send image.")
		} finally {
			setUploadingImage(false)
		}
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
					<div className="size-9 rounded-full border border-black/15 bg-neutral-100 flex items-center justify-center font-black text-xs text-black/60 shrink-0 overflow-hidden">
						{thread.userLogoUrl ? (
							<img
								src={thread.userLogoUrl}
								alt={thread.userName}
								className="w-full h-full object-cover"
							/>
						) : (
							thread.userName.charAt(0).toUpperCase()
						)}
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-xs sm:text-sm font-heading font-black text-black truncate leading-tight">{thread.userName}</p>
						<p className="text-[10px] sm:text-[11px] font-semibold text-black/50 truncate">
							{thread.userRole ? `${thread.userRole === "HOST" ? "Community" : thread.userRole} • ` : ""}{thread.userEmail}
						</p>
					</div>
				</div>

				{thread.botDormant && (
					<button
						type="button"
						onClick={() => resolveMutation.mutate()}
						disabled={resolveMutation.isPending}
						className="shrink-0 px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase rounded-lg border border-green-600 bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
					>
						{resolveMutation.isPending ? "…" : "Mark Resolved"}
					</button>
				)}
			</div>

			{/* Messages Stream */}
			<div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 flex flex-col gap-3">
				{messagesQuery.isLoading ? (
					<p className="text-caption text-text-tertiary text-center">Loading…</p>
				) : messages.length === 0 ? (
					<p className="text-caption text-text-tertiary text-center m-auto">No messages yet.</p>
				) : (
					messages.map(m => {
						const isMeetday = m.senderType === "ADMIN" || m.senderType === "BOT"
						const isBot = m.senderType === "BOT"
						const isSystemMessage = m.content?.startsWith("[System]")
						if (isSystemMessage) {
							return (
								<div key={m.id} className="w-full flex justify-center my-1">
									<span className="text-[11px] font-semibold text-text-tertiary bg-white border border-black/10 px-3 py-1 rounded-full shadow-xs">
										{m.content.replace(/^\[System\]\s*/, "")}
									</span>
								</div>
							)
						}
						const userRoleLabel = thread.userRole === "BRAND" ? "Brand" : thread.userRole === "HOST" ? "Community" : (thread.userRole || "")
						const senderLabel = isBot ? "Meetday" : isMeetday ? "Meetday • Admin" : `${thread.userName}${userRoleLabel ? ` • ${userRoleLabel}` : ""}`
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
									<span className="text-[10px] font-semibold uppercase tracking-wide text-black/40 font-heading">
										{senderLabel}
									</span>
									<button
										type="button"
										onClick={() => setReplyingTo(m)}
										className="text-[10px] font-bold text-black/40 hover:text-black transition-colors"
									>
										Reply
									</button>
								</div>
								<div
									className={cn(
										"rounded-2xl p-2 sm:p-2.5 text-xs sm:text-body-sm break-words break-all border flex flex-col shadow-xs",
										isBot
											? "bg-black text-white rounded-br-xs border-black"
											: isMeetday
												? "bg-neutral-100 text-black rounded-br-xs border-black/10"
												: (thread.userRole === "BRAND" ? "bg-[#EE2C2C] text-white rounded-bl-xs border-[#EE2C2C]" : "bg-[#FFC940] text-black rounded-bl-xs border-[#FFC940]"),
									)}
								>
									{m.replyTo && (
										<button
											type="button"
											onClick={() => handleJumpToMessage(m.replyTo!.id)}
											className={cn(
												"w-full text-left mb-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer block border-l-4 shadow-xs",
												isBot
													? "bg-white/15 hover:bg-white/25 text-white border-white/70"
													: !isMeetday && thread.userRole === "BRAND"
													? "bg-black/25 hover:bg-black/35 text-white border-white/80"
													: !isMeetday && thread.userRole === "HOST"
													? "bg-black/10 hover:bg-black/15 text-black border-black/40"
													: "bg-white hover:bg-neutral-50 text-black border-[#EE2C2C] border border-black/10"
											)}
											title="Click to jump to message"
										>
											<p className={cn(
												"text-[9px] font-black uppercase tracking-wider",
												(isBot || (!isMeetday && thread.userRole === "BRAND")) ? "text-white/80" : "text-black/60"
											)}>
												↩ Replying to {m.replyTo.senderType === "BOT" ? "Meetday" : m.replyTo.senderType === "ADMIN" ? "Meetday • Admin" : thread.userName}
											</p>
											{m.replyTo.hasMedia && (
												<p className={cn("text-xs font-semibold flex items-center gap-1 my-0.5", (isBot || (!isMeetday && thread.userRole === "BRAND")) ? "text-white/90" : "text-black/70")}>
													📷 Photo
												</p>
											)}
											{m.replyTo.content && (
												<p className={cn("text-xs font-medium break-words whitespace-pre-wrap leading-relaxed mt-0.5", (isBot || (!isMeetday && thread.userRole === "BRAND")) ? "text-white/90" : "text-black/80")}>
													{m.replyTo.content}
												</p>
											)}
										</button>
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
										{isMeetday && (() => {
											const isRead = thread.userRole === "BRAND" ? !!m.brandReadAt : !!m.hostReadAt
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

			{/* Input Bar */}
			<div className="p-2 sm:p-3 border-t border-black/10 md:border-t-[3px] md:border-black bg-white flex flex-col gap-2 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
				{replyingTo && (
					<div className="flex items-center justify-between gap-2 px-1">
						<div className="min-w-0 pl-2 border-l-2 border-[#EE2C2C]">
							<p className="text-[10px] font-black uppercase text-black/40">
								Replying to {replyingTo.senderType === "BOT" ? "Meetday" : replyingTo.senderType === "ADMIN" ? "Meetday • Admin" : thread.userName}
							</p>
							<p className="text-[11px] font-semibold text-black/60 truncate">
								{replyingTo.content?.trim() ? replyingTo.content : (replyingTo.mediaUrl ? "Photo" : "")}
							</p>
						</div>
						<button type="button" onClick={() => setReplyingTo(null)} className="text-[10px] font-bold text-[#EE2C2C] shrink-0">
							Cancel
						</button>
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
