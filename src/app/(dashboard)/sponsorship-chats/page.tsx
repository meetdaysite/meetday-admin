"use client"

import { useEffect, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import PageHeader from "@/components/ui/PageHeader"
import { uploadSponsorshipChatImage } from "@/lib/api/storage"
import {
	getSponsorshipChats,
	getSponsorshipChatMessages,
	sendSponsorshipChatMessage,
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
	const [statusFilter, setStatusFilter] = useState<SponsorshipChatStatus | undefined>(undefined)
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const threadsQuery = useQuery({
		queryKey: ["admin-sponsorship-chats", statusFilter],
		queryFn: () => getSponsorshipChats(statusFilter).then(data => {
			console.log("[DEBUG admin sponsorship chats data]:", data)
			return data
		}),
		refetchInterval: THREADS_POLL_MS,
	})

	const threads = threadsQuery.data ?? []
	const selectedThread = threads.find(t => t.id === selectedId) ?? null

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader title="Ongoing Chats" description="Every Community ↔ Brand chat thread — view or step in as Meetday." />

			<div className="h-[calc(100vh-270px)] min-h-[450px] border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex bg-white">
				{/* Thread list */}
				<div className="w-80 shrink-0 border-r-[3px] border-black flex flex-col">
					<div className="flex border-b-[3px] border-black">
						{([undefined, "ACCEPTED", "REQUESTED"] as (SponsorshipChatStatus | undefined)[]).map(s => (
							<button
								key={s ?? "ALL"}
								onClick={() => {
									setStatusFilter(s)
									setSelectedId(null)
								}}
								className={cn(
									"flex-grow py-3 text-xs font-black uppercase tracking-wider transition-colors relative",
									statusFilter === s ? "bg-[#EE2C2C] text-white" : "bg-white text-black/50 hover:bg-neutral-50",
								)}
							>
								{s === "REQUESTED" ? "Requests" : s === s ? "General" : "All"}
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
									onClick={() => setSelectedId(t.id)}
									className={cn(
										"w-full text-left px-4 py-3 border-b border-black/10 transition-colors flex items-center gap-3",
										selectedId === t.id ? "bg-[#FFC940]/20" : "hover:bg-neutral-50",
									)}
								>
									{/* Cascading Logos */}
									<div className="relative w-12 h-10 shrink-0 select-none">
										{/* Brand Logo or Initials (back/left) */}
										<div className="absolute left-0 top-1 w-8 h-8 rounded-full border border-border-default bg-neutral-100 flex items-center justify-center font-bold text-xs text-text-secondary z-0 overflow-hidden">
											{t.brandLogoUrl || (t as any).brandLogo || (t as any).brandAvatarUrl ? (
												<img
													src={t.brandLogoUrl || (t as any).brandLogo || (t as any).brandAvatarUrl}
													alt={t.brandName}
													className="w-full h-full object-cover"
												/>
											) : (
												t.brandName.charAt(0).toUpperCase()
											)}
										</div>
										{/* Community Logo or Initials (front/right overlapping) */}
										<div className="absolute right-0 bottom-0.5 w-8 h-8 rounded-full border border-black bg-[#FFC940] flex items-center justify-center font-bold text-xs text-black z-10 shadow-[2px_2px_0px_rgba(0,0,0,1)] overflow-hidden">
											{t.communityLogoUrl || (t as any).communityLogo || (t as any).communityAvatarUrl ? (
												<img
													src={t.communityLogoUrl || (t as any).communityLogo || (t as any).communityAvatarUrl}
													alt={t.communityName}
													className="w-full h-full object-cover"
												/>
											) : (
												t.communityName.charAt(0).toUpperCase()
											)}
										</div>
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-2">
											<div className="min-w-0 flex-1">
												<p className="text-body-sm font-semibold text-text-primary truncate">{t.brandName} • Brand</p>
												<p className="text-body-sm font-semibold text-text-primary truncate mt-0.5">{t.communityName} • Community</p>
											</div>
											<span className="text-caption text-text-tertiary shrink-0 self-start mt-0.5">{timeAgo(t.lastMessageAt ?? t.createdAt)}</span>
										</div>
										<p className="text-caption text-text-tertiary truncate mt-1">{t.proposalName}</p>
										<div className="flex items-center gap-2 mt-1">
											<span
												className={cn(
													"text-[10px] font-semibold px-1.5 py-0.5 rounded",
													t.chatStatus === "ACCEPTED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
												)}
											>
												{t.chatStatus === "ACCEPTED" ? "Accepted" : "Requested"}
											</span>
										</div>
										{t.lastMessagePreview && <p className="text-caption text-text-tertiary truncate mt-1">{t.lastMessagePreview}</p>}
									</div>
								</button>
							))
						)}
					</div>
				</div>

				{/* Thread detail */}
				<div className="flex-1 min-w-0 flex flex-col">
					{!selectedThread ? (
						<div className="flex-1 flex items-center justify-center text-body-sm text-text-tertiary">Select a chat to view</div>
					) : (
						<AdminChatThreadPanel key={selectedThread.id} thread={selectedThread} />
					)}
				</div>
			</div>
		</div>
	)
}

function AdminChatThreadPanel({
	thread,
}: {
	thread: SponsorshipChatThread
}) {
	const queryClient = useQueryClient()
	const [input, setInput] = useState("")
	const [uploadingImage, setUploadingImage] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

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
		mutationFn: (payload: { content?: string; mediaKey?: string }) => sendSponsorshipChatMessage(thread.id, payload),
		onSuccess: () => {
			setInput("")
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

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="px-5 py-3 border-b-[3px] border-black shrink-0 flex items-center gap-4">
				<div className="relative w-12 h-10 shrink-0 select-none">
					{/* Brand Logo or Initials (back/left) */}
					<div className="absolute left-0 top-1 w-8 h-8 rounded-full border border-border-default bg-neutral-100 flex items-center justify-center font-bold text-xs text-text-secondary z-0 overflow-hidden">
						{thread.brandLogoUrl || (thread as any).brandLogo || (thread as any).brandAvatarUrl ? (
							<img
								src={thread.brandLogoUrl || (thread as any).brandLogo || (thread as any).brandAvatarUrl}
								alt={thread.brandName}
								className="w-full h-full object-cover"
							/>
						) : (
							thread.brandName.charAt(0).toUpperCase()
						)}
					</div>
					{/* Community Logo or Initials (front/right overlapping) */}
					<div className="absolute right-0 bottom-0.5 w-8 h-8 rounded-full border border-black bg-[#FFC940] flex items-center justify-center font-bold text-xs text-black z-10 shadow-[2px_2px_0px_rgba(0,0,0,1)] overflow-hidden">
						{thread.communityLogoUrl || (thread as any).communityLogo || (thread as any).communityAvatarUrl ? (
							<img
								src={thread.communityLogoUrl || (thread as any).communityLogo || (thread as any).communityAvatarUrl}
								alt={thread.communityName}
								className="w-full h-full object-cover"
							/>
						) : (
							thread.communityName.charAt(0).toUpperCase()
						)}
					</div>
				</div>
				<div className="min-w-0">
					<p className="text-body-sm font-semibold text-text-primary">{thread.brandName} ↔ {thread.communityName}</p>
					<p className="text-caption text-text-tertiary">{thread.proposalName}</p>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
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
								<div key={m.id} className="self-center max-w-[90%] px-3 py-1.5 rounded-full bg-neutral-100 text-text-tertiary text-[11px] font-semibold text-center">
									{m.content}
								</div>
							)
						}
						const isMeetday = m.senderType === "ADMIN"
						return (
							<div key={m.id} className={cn("flex flex-col max-w-[70%]", isMeetday ? "self-end items-end" : "self-start items-start")}>
								<span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary mb-0.5 px-1 font-heading">{labelFor(m.senderType)}</span>
								{m.mediaUrl && (
									/* eslint-disable-next-line @next/next/no-img-element */
									<img
										src={m.mediaUrl}
										alt="Shared image"
										onClick={() => window.open(m.mediaUrl!, "_blank")}
										className="max-w-[220px] max-h-[220px] rounded-2xl border border-border-default object-cover cursor-pointer mb-1"
									/>
								)}
								{m.content && (
									<div
										className={cn(
											"px-3.5 py-2 rounded-2xl text-body-sm break-words border border-black/10",
											m.senderType === "BRAND" && "bg-[#EE2C2C] text-white",
											m.senderType === "HOST" && "bg-[#FFC940] text-black",
											m.senderType === "ADMIN" && "bg-neutral-100 text-black",
											isMeetday ? "rounded-br-sm" : "rounded-bl-sm",
										)}
									>
										{m.content}
									</div>
								)}
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

			<div className="p-3 border-t-[3px] border-black flex items-center gap-2 shrink-0">
				<input type="file" accept="image/*" ref={fileInputRef} onChange={handleImagePick} className="hidden" />
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					disabled={uploadingImage}
					className="shrink-0 size-9 rounded-xl border-[3px] border-black flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50"
					aria-label="Attach image"
				>
					<ImageIcon size={16} className="text-black" />
				</button>
				<input
					value={input}
					onChange={e => setInput(e.target.value)}
					onKeyDown={e => {
						if (e.key === "Enter" && !e.shiftKey && input.trim()) {
							e.preventDefault()
							sendMutation.mutate({ content: input.trim() })
						}
					}}
					placeholder="Message as Meetday…"
					className="flex-1 rounded-2xl border-[3px] border-black bg-white px-4 py-2 text-sm font-semibold outline-none focus:bg-neutral-50"
				/>
				<Button onClick={() => input.trim() && sendMutation.mutate({ content: input.trim() })} disabled={sendMutation.isPending || !input.trim()}>
					{sendMutation.isPending ? "…" : "Send"}
				</Button>
			</div>
		</div>
	)
}
