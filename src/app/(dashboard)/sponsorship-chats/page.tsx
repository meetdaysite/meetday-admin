"use client"

import { useEffect, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import PageHeader from "@/components/ui/PageHeader"
import {
	getSponsorshipChats,
	getSponsorshipChatMessages,
	sendSponsorshipChatMessage,
	type SponsorshipChatStatus,
	type SponsorshipChatMessage,
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
		queryFn: () => getSponsorshipChats(statusFilter),
		refetchInterval: THREADS_POLL_MS,
	})

	const threads = threadsQuery.data ?? []
	const selectedThread = threads.find(t => t.id === selectedId) ?? null

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader title="Ongoing Chats" description="Every Host \u2194 Brand chat thread \u2014 view or step in as Meetday." />

			<div className="h-[calc(100vh-220px)] min-h-[500px] border border-border-default rounded-action overflow-hidden flex bg-surface-card">
				{/* Thread list */}
				<div className="w-80 shrink-0 border-r border-border-default flex flex-col">
					<div className="flex border-b border-border-default">
						{([undefined, "REQUESTED", "ACCEPTED"] as (SponsorshipChatStatus | undefined)[]).map(s => (
							<button
								key={s ?? "ALL"}
								onClick={() => setStatusFilter(s)}
								className={cn(
									"flex-1 py-2.5 text-xs font-semibold transition-colors",
									statusFilter === s ? "bg-action-primary text-white" : "text-text-tertiary hover:bg-neutral-50",
								)}
							>
								{s === "REQUESTED" ? "Requested" : s === "ACCEPTED" ? "Accepted" : "All"}
							</button>
						))}
					</div>
					<div className="flex-1 overflow-y-auto">
						{threadsQuery.isLoading ? (
							<p className="text-caption text-text-tertiary text-center py-8">Loading\u2026</p>
						) : threads.length === 0 ? (
							<p className="text-caption text-text-tertiary text-center py-8 px-4">No chat threads yet.</p>
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
										<p className="text-body-sm font-semibold text-text-primary truncate">{t.brandName}</p>
										<span className="text-caption text-text-tertiary shrink-0">{timeAgo(t.lastMessageAt ?? t.createdAt)}</span>
									</div>
									<p className="text-caption text-text-tertiary truncate mt-0.5">{t.communityName} \u2014 {t.proposalName}</p>
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
	thread: { id: string; brandName: string; communityName: string; proposalName: string; chatStatus: SponsorshipChatStatus }
}) {
	const queryClient = useQueryClient()
	const [input, setInput] = useState("")
	const bottomRef = useRef<HTMLDivElement>(null)

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
		mutationFn: (content: string) => sendSponsorshipChatMessage(thread.id, content),
		onSuccess: () => {
			setInput("")
			queryClient.invalidateQueries({ queryKey: ["admin-sponsorship-chat-messages", thread.id] })
			queryClient.invalidateQueries({ queryKey: ["admin-sponsorship-chats"] })
		},
		onError: () => toast.error("Failed to send message."),
	})

	function labelFor(senderType: SponsorshipChatMessage["senderType"]) {
		if (senderType === "HOST") return "Community"
		if (senderType === "BRAND") return "Brand"
		return "Meetday"
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="px-5 py-3 border-b border-border-default shrink-0">
				<p className="text-body-sm font-semibold text-text-primary">{thread.brandName} \u2194 {thread.communityName}</p>
				<p className="text-caption text-text-tertiary">{thread.proposalName}</p>
			</div>

			<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
				{messagesQuery.isLoading ? (
					<p className="text-caption text-text-tertiary text-center">Loading\u2026</p>
				) : messages.length === 0 ? (
					<p className="text-caption text-text-tertiary text-center m-auto">
						{thread.chatStatus === "REQUESTED" ? "The community hasn't accepted this request yet." : "No messages yet."}
					</p>
				) : (
					messages.map(m => {
						const isMeetday = m.senderType === "ADMIN"
						return (
							<div key={m.id} className={cn("flex flex-col max-w-[70%]", isMeetday ? "self-end items-end" : "self-start items-start")}>
								<span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary mb-0.5 px-1">{labelFor(m.senderType)}</span>
								<div
									className={cn(
										"px-3.5 py-2 rounded-2xl text-body-sm break-words",
										isMeetday ? "bg-action-primary text-white rounded-br-sm" : "bg-neutral-100 text-text-primary rounded-bl-sm",
									)}
								>
									{m.content}
								</div>
							</div>
						)
					})
				)}
				<div ref={bottomRef} />
			</div>

			<div className="p-3 border-t border-border-default flex items-center gap-2 shrink-0">
				<input
					value={input}
					onChange={e => setInput(e.target.value)}
					onKeyDown={e => {
						if (e.key === "Enter" && !e.shiftKey && input.trim()) {
							e.preventDefault()
							sendMutation.mutate(input.trim())
						}
					}}
					placeholder="Message as Meetday\u2026"
					className="flex-1 rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm outline-none focus:border-border-focus"
				/>
				<Button onClick={() => input.trim() && sendMutation.mutate(input.trim())} disabled={sendMutation.isPending || !input.trim()}>
					{sendMutation.isPending ? "\u2026" : "Send"}
				</Button>
			</div>
		</div>
	)
}
