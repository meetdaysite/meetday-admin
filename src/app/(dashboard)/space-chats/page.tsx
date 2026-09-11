"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Image as ImageIcon, ArrowLeft } from "lucide-react"
import { cn, isPdfMediaUrl } from "@/lib/utils"
import PageHeader from "@/components/ui/PageHeader"
import { uploadSpaceChatImage } from "@/lib/api/storage"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { EmojiPicker } from "@/components/ui/EmojiPicker"
import { LinkifiedText } from "@/components/ui/linkified-text"
import {
	getSpaceChats,
	getSpaceChatMessages,
	sendSpaceChatMessage,
	deleteSpaceChatMessage,
	type SpaceChatMessage,
	type SpaceChatThread,
} from "@/lib/api/space-chats"

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
	if (senderType === "SPACE") return "Space"
	if (senderType === "BRAND") return "Brand"
	return "Community"
}

export default function SpaceChatsPage() {
	const queryClient = useQueryClient()
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const threadsQuery = useQuery({
		queryKey: ["admin-space-chats", "ACCEPTED"],
		queryFn: () => getSpaceChats("ACCEPTED"),
		refetchInterval: THREADS_POLL_MS,
	})

	const allThreads = threadsQuery.data ?? []

	const filteredThreads = [...allThreads]
		.filter((t) => {
			if (!searchQuery.trim()) return true
			const q = searchQuery.toLowerCase()
			return t.spaceName?.toLowerCase().includes(q) || t.requesterName?.toLowerCase().includes(q)
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
		queryClient.setQueryData<SpaceChatThread[]>(["admin-space-chats", "ACCEPTED"], (prev) =>
			prev?.map((t) => (t.id === id ? { ...t, unreadCount: 0 } : t)),
		)
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col h-full md:p-6 md:space-y-4 md:max-w-7xl md:mx-auto w-full">
			<div className="hidden md:flex items-center justify-between shrink-0">
				<PageHeader title="Space Chats" description="Active Community Space ↔ Brand/Community chat threads — monitor and participate as Meetday." />
			</div>

			<div className="flex-1 min-h-0 flex flex-col md:flex-row bg-white overflow-hidden md:border-[3px] md:border-black md:rounded-[24px] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:h-[calc(100vh-250px)] h-full">
				{/* Thread list */}
				<div className={cn(
					"flex flex-col h-full bg-white border-r-0 md:border-r-[3px] md:border-black",
					selectedId ? "hidden md:flex md:w-80 shrink-0" : "w-full md:w-80 shrink-0 flex-1 md:flex-initial"
				)}>
					{/* Mobile Header */}
					<div className="px-4 py-3 border-b border-black/10 md:hidden flex items-center justify-between shrink-0">
						<h2 className="font-heading font-black text-base text-black">Space Chats</h2>
						<span className="text-xs font-semibold text-black/50">{filteredThreads.length} chats</span>
					</div>

					{/* Search in threads */}
					<div className="p-2.5 border-b border-black/10 md:border-b-[3px] md:border-black bg-neutral-50/50 shrink-0">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search space chats…"
							className="w-full px-3 py-2 text-xs font-semibold rounded-xl border-[2px] md:border-[2.5px] border-black bg-white placeholder:text-black/40 focus:bg-neutral-50 focus:outline-none transition-colors"
						/>
					</div>

					<div className="flex-1 overflow-y-auto">
						{threadsQuery.isLoading ? (
							<p className="text-caption text-text-tertiary text-center py-8">Loading…</p>
						) : filteredThreads.length === 0 ? (
							<p className="text-caption text-text-tertiary text-center py-8 px-4">
								{searchQuery ? "No matching chats found." : "No ongoing space chats yet."}
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
										<div className="absolute left-0 top-0.5 w-7 h-7 rounded-lg border-2 border-black bg-neutral-100 flex items-center justify-center font-bold text-[10px] text-text-secondary z-0 overflow-hidden shadow-xs">
											{t.requesterLogoUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={t.requesterLogoUrl} alt={t.requesterName} className="w-full h-full object-cover" />
											) : (
												t.requesterName?.charAt(0).toUpperCase() ?? "R"
											)}
										</div>
										<div className="absolute right-0 bottom-0 w-7 h-7 rounded-lg border-2 border-black bg-[#FFC940] flex items-center justify-center font-black text-[10px] text-black z-10 shadow-xs overflow-hidden">
											{t.spaceLogoUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={t.spaceLogoUrl} alt={t.spaceName} className="w-full h-full object-cover" />
											) : (
												t.spaceName?.charAt(0).toUpperCase() ?? "S"
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
												<p className="text-xs font-black text-black truncate">
													{t.requesterName} • {t.requesterType === "BRAND" ? "Brand" : "Community"}
												</p>
												<p className="text-xs font-bold text-black/70 truncate mt-0.5">{t.spaceName} • Space</p>
											</div>
											<span className="text-[10px] font-bold text-black/40 shrink-0 self-start mt-0.5">
												{timeAgo(t.lastMessageAt ?? t.createdAt)}
											</span>
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
						<AdminSpaceChatThreadPanel key={selectedThread.id} thread={selectedThread} onBack={() => setSelectedId(null)} />
					)}
				</div>
			</div>
		</div>
	)
}

function AdminSpaceChatThreadPanel({
	thread,
	onBack,
}: {
	thread: SpaceChatThread
	onBack?: () => void
}) {
	const queryClient = useQueryClient()
	const [input, setInput] = useState("")
	const [replyingTo, setReplyingTo] = useState<SpaceChatMessage | null>(null)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
	const highlightTimerRef = useRef<NodeJS.Timeout | null>(null)
	const bottomRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

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
		queryKey: ["admin-space-chat-messages", thread.id],
		queryFn: () => getSpaceChatMessages(thread.id),
		refetchInterval: MESSAGES_POLL_MS,
	})
	const messages = messagesQuery.data?.messages ?? []

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages.length])

	const sendMutation = useMutation({
		mutationFn: (payload: { content?: string; mediaKey?: string; replyToId?: string }) =>
			sendSpaceChatMessage(thread.id, payload),
		onSuccess: () => {
			setInput("")
			setReplyingTo(null)
			queryClient.invalidateQueries({ queryKey: ["admin-space-chat-messages", thread.id] })
			queryClient.invalidateQueries({ queryKey: ["admin-space-chats"] })
		},
		onError: () => toast.error("Failed to send message."),
	})

	const deleteMutation = useMutation({
		mutationFn: (messageId: string) => deleteSpaceChatMessage(thread.id, messageId),
		onSuccess: () => {
			toast.success("Message deleted.")
			queryClient.invalidateQueries({ queryKey: ["admin-space-chat-messages", thread.id] })
		},
		onError: () => toast.error("Failed to delete message."),
	})

	function handleReplyStart(m: SpaceChatMessage) {
		setReplyingTo(m)
		inputRef.current?.focus()
	}

	function handleDelete(m: SpaceChatMessage) {
		if (!window.confirm("Delete this message? This can't be undone.")) return
		deleteMutation.mutate(m.id)
	}

	async function handleSend() {
		const text = input.trim()
		if (!text) return
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
			const key = await uploadSpaceChatImage(file, thread.id)
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
								{thread.requesterLogoUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={thread.requesterLogoUrl} alt={thread.requesterName} className="w-full h-full object-cover" />
								) : (
									thread.requesterName?.charAt(0).toUpperCase() ?? "R"
								)}
							</div>
							<div className="absolute right-0 bottom-0 w-5.5 sm:w-6 h-5.5 sm:h-6 rounded-lg border border-black md:border-2 md:border-black bg-[#FFC940] flex items-center justify-center font-black text-[8px] sm:text-[9px] text-black z-10 shadow-xs overflow-hidden">
								{thread.spaceLogoUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={thread.spaceLogoUrl} alt={thread.spaceName} className="w-full h-full object-cover" />
								) : (
									thread.spaceName?.charAt(0).toUpperCase() ?? "S"
								)}
							</div>
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-xs sm:text-sm font-black text-black truncate leading-tight">
								{thread.requesterName} ↔ {thread.spaceName}
							</p>
							<p className="text-[10px] sm:text-xs font-bold text-black/50 truncate">
								{thread.requesterType === "BRAND" ? "Brand" : "Community"} interest in this Space
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Messages View */}
			<div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-2.5 sm:gap-3 min-h-0 bg-white">
				{messages.map((m) => {
					const isAdmin = m.senderType === "ADMIN"
					const isSpace = m.senderType === "SPACE"
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
							{/* Top role label and action buttons */}
							<div className={cn("flex items-center gap-2 mb-0.5 px-1 select-none", isAdmin ? "flex-row-reverse" : "flex-row")}>
								<span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
									{isAdmin ? "Meetday Admin" : isSpace ? `${thread.spaceName} (Space)` : `${thread.requesterName} (${thread.requesterType === "BRAND" ? "Brand" : "Community"})`}
								</span>
								<div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400">
									<button
										type="button"
										onClick={() => handleReplyStart(m)}
										className="text-neutral-400 hover:text-black transition-colors cursor-pointer"
									>
										Reply
									</button>
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

							{/* Message Bubble */}
							<div
								className={cn(
									"rounded-2xl p-2 sm:p-2.5 text-xs sm:text-sm font-semibold break-words flex flex-col shadow-xs max-w-full",
									isDeleted && "border-dashed opacity-90",
									m.senderType === "SPACE" && "bg-[#FFC940] text-black rounded-bl-sm border-0",
									(m.senderType === "BRAND" || m.senderType === "COMMUNITY") && "bg-neutral-100 text-black rounded-bl-sm border border-black/10",
									m.senderType === "ADMIN" && "bg-[#EE2C2C] text-white rounded-br-sm border border-[#EE2C2C]",
								)}
							>
								{/* Quoted reply */}
								{m.replyTo && (
									<button
										type="button"
										onClick={() => m.replyTo && handleJumpToMessage(m.replyTo.id)}
										className={cn(
											"w-full text-left mb-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer block border-l-4 shadow-xs",
											m.senderType === "ADMIN"
												? "bg-black/25 hover:bg-black/35 text-white border-white/80"
												: m.senderType === "SPACE"
													? "bg-black/10 hover:bg-black/15 text-black border-black/40"
													: "bg-white hover:bg-neutral-50 text-black border-[#EE2C2C] border border-black/10",
										)}
										title="Click to jump to message"
									>
										<p
											className={cn(
												"text-[9px] font-black uppercase tracking-wider",
												m.senderType === "ADMIN" ? "text-white/80" : "text-black/60",
											)}
										>
											↩ Replying to {replyLabel(m.replyTo.senderType)}
										</p>
										{m.replyTo.hasMedia && (
											<p
												className={cn(
													"text-xs font-semibold flex items-center gap-1 my-0.5",
													m.senderType === "ADMIN" ? "text-white/90" : "text-black/70",
												)}
											>
												📄 Attachment
											</p>
										)}
										{m.replyTo.content && (
											<p
												className={cn(
													"text-xs font-medium break-words whitespace-pre-wrap leading-relaxed mt-0.5",
													m.senderType === "ADMIN" ? "text-white/90" : "text-black/80",
												)}
											>
												{m.replyTo.content}
											</p>
										)}
									</button>
								)}

								{/* Deleted Message Sidenote */}
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
												m.senderType === "ADMIN"
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

							{/* Bottom timestamp line */}
							<div
								className={cn(
									"flex items-center gap-1 text-[9px] font-bold mt-0.5 px-0.5 select-none text-neutral-400",
									isAdmin ? "flex-row-reverse" : "flex-row",
								)}
							>
								<span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}</span>
								{isAdmin && <span className="font-bold">✓✓</span>}
							</div>
						</div>
					)
				})}
				<div ref={bottomRef} />
			</div>

			{/* Reply bar & Input Row */}
			<div className="border-t border-black/10 md:border-t-[3px] md:border-black shrink-0 bg-white flex flex-col">
				{replyingTo && (
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

				<div className="relative p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
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
						disabled={uploadingImage}
						className="shrink-0 size-8 sm:size-9 rounded-xl border-[2px] md:border-[3px] border-black flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50 cursor-pointer transition-colors"
						aria-label="Attach image or PDF"
					>
						<ImageIcon size={16} />
					</button>

					<EmojiPicker onSelect={(emoji) => setInput((prev) => prev + emoji)} />

					<input
						ref={inputRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault()
								handleSend()
							}
						}}
						placeholder="Write a message…"
						className="flex-1 min-w-0 rounded-2xl border-[2px] md:border-[3px] border-black bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold outline-none focus:bg-neutral-50"
					/>

					<button
						type="button"
						onClick={handleSend}
						disabled={sendMutation.isPending || !input.trim()}
						className="h-8 sm:h-10 px-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-[#EE2C2C] hover:bg-[#d42525] text-white border-[2px] md:border-[3px] border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 cursor-pointer shrink-0 transition-all flex items-center justify-center"
					>
						{sendMutation.isPending ? "…" : "Send"}
					</button>
				</div>
			</div>

			{/* Image Lightbox */}
			{viewingImage && <ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />}
		</div>
	)
}
