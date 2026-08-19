"use client"

import { useEffect, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import PageHeader from "@/components/ui/PageHeader"
import { uploadMeetdayChatImage } from "@/lib/api/storage"
import {
	getMeetdayChats,
	getMeetdayChatMessages,
	sendMeetdayChatMessage,
	type MeetdayChatThread,
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

	const threads = threadsQuery.data ?? []
	const selectedThread = threads.find(t => t.id === selectedId) ?? null

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader title="Meetday Chats" description="Direct support chats from Hosts and Brands — reply as Meetday." />

			<div className="h-[calc(100vh-220px)] min-h-[500px] border border-border-default rounded-action overflow-hidden flex bg-surface-card">
				{/* Thread list */}
				<div className="w-80 shrink-0 border-r border-border-default flex flex-col">
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
										"w-full text-left px-4 py-3 border-b border-border-subtle transition-colors",
										selectedId === t.id ? "bg-neutral-100" : "hover:bg-neutral-50",
									)}
								>
									<div className="flex items-center justify-between gap-2">
										<p className="text-body-sm font-semibold text-text-primary truncate">{t.userName}</p>
										<span className="text-caption text-text-tertiary shrink-0">{timeAgo(t.lastMessageAt ?? t.createdAt)}</span>
									</div>
									<p className="text-caption text-text-tertiary truncate mt-0.5">{t.userEmail}{t.userRole ? ` · ${t.userRole}` : ""}</p>
									<div className="flex items-center justify-between gap-2 mt-1">
										{t.lastMessagePreview && <p className="text-caption text-text-tertiary truncate">{t.lastMessagePreview}</p>}
										{t.unreadCount > 0 && (
											<span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-action-primary text-white text-[10px] font-semibold flex items-center justify-center">
												{t.unreadCount > 9 ? "9+" : t.unreadCount}
											</span>
										)}
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
						<MeetdayAdminChatPanel key={selectedThread.id} thread={selectedThread} />
					)}
				</div>
			</div>
		</div>
	)
}

function MeetdayAdminChatPanel({ thread }: { thread: MeetdayChatThread }) {
	const queryClient = useQueryClient()
	const [input, setInput] = useState("")
	const [uploadingImage, setUploadingImage] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

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
		mutationFn: (payload: { content?: string; mediaKey?: string }) => sendMeetdayChatMessage(thread.id, payload),
		onSuccess: () => {
			setInput("")
			queryClient.invalidateQueries({ queryKey: ["admin-meetday-chat-messages", thread.id] })
			queryClient.invalidateQueries({ queryKey: ["admin-meetday-chats"] })
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
			const mediaKey = await uploadMeetdayChatImage(file, thread.userId)
			sendMutation.mutate({ mediaKey })
		} catch {
			toast.error("Failed to send image.")
		} finally {
			setUploadingImage(false)
		}
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="px-5 py-3 border-b border-border-default shrink-0">
				<p className="text-body-sm font-semibold text-text-primary">{thread.userName}</p>
				<p className="text-caption text-text-tertiary">{thread.userEmail}{thread.userRole ? ` · ${thread.userRole}` : ""}</p>
			</div>

			<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
				{messagesQuery.isLoading ? (
					<p className="text-caption text-text-tertiary text-center">Loading…</p>
				) : messages.length === 0 ? (
					<p className="text-caption text-text-tertiary text-center m-auto">No messages yet.</p>
				) : (
					messages.map(m => {
						const isMeetday = m.senderType === "ADMIN"
						return (
							<div key={m.id} className={cn("flex flex-col max-w-[70%]", isMeetday ? "self-end items-end" : "self-start items-start")}>
								<span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary mb-0.5 px-1">
									{isMeetday ? "Meetday" : thread.userName}
								</span>
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
											"px-3.5 py-2 rounded-2xl text-body-sm break-words",
											isMeetday ? "bg-action-primary text-white rounded-br-sm" : "bg-neutral-100 text-text-primary rounded-bl-sm",
										)}
									>
										{m.content}
									</div>
								)}
							</div>
						)
					})
				)}
				<div ref={bottomRef} />
			</div>

			<div className="p-3 border-t border-border-default flex items-center gap-2 shrink-0">
				<input type="file" accept="image/*" ref={fileInputRef} onChange={handleImagePick} className="hidden" />
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					disabled={uploadingImage}
					className="shrink-0 size-9 rounded-lg border border-border-default flex items-center justify-center hover:bg-neutral-50 disabled:opacity-50"
					aria-label="Attach image"
				>
					<ImageIcon size={16} className="text-text-tertiary" />
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
					className="flex-1 rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm outline-none focus:border-border-focus"
				/>
				<Button onClick={() => input.trim() && sendMutation.mutate({ content: input.trim() })} disabled={sendMutation.isPending || !input.trim()}>
					{sendMutation.isPending ? "…" : "Send"}
				</Button>
			</div>
		</div>
	)
}
