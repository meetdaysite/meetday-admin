"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import {
	getCommunityCollaborationChatMessages,
	sendCommunityCollaborationChatMessage,
	type CommunityCollaborationChatThread,
} from "@/lib/api/community-collaboration-chats"

export function AdminCommunityCollaborationChatPanel({ thread, onBack }: { thread: CommunityCollaborationChatThread; onBack: () => void }) {
	const queryClient = useQueryClient()
	const [input, setInput] = useState("")
	const messagesQuery = useQuery({
		queryKey: ["admin-community-collaboration-messages", thread.id],
		queryFn: () => getCommunityCollaborationChatMessages(thread.id),
		refetchInterval: 4000,
	})
	const sendMutation = useMutation({
		mutationFn: () => sendCommunityCollaborationChatMessage(thread.id, { content: input.trim() }),
		onSuccess: () => {
			setInput("")
			void queryClient.invalidateQueries({ queryKey: ["admin-community-collaboration-messages", thread.id] })
			void queryClient.invalidateQueries({ queryKey: ["admin-community-collaboration-chats"] })
		},
		onError: () => toast.error("Failed to send message."),
	})
	const messages = messagesQuery.data?.messages ?? []

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex items-center gap-3 border-b-[3px] border-black bg-white px-4 py-3">
				<button type="button" onClick={onBack} className="md:hidden" aria-label="Back"><ArrowLeft size={18} /></button>
				<div className="min-w-0">
					<p className="truncate text-sm font-black text-black">{thread.requesterCommunityName} ↔ {thread.targetCommunityName}</p>
					<p className="text-[11px] font-semibold text-black/50">Community-to-community chat</p>
				</div>
			</div>
			<div className="flex-1 space-y-2 overflow-y-auto p-4">
				{messagesQuery.isLoading ? <p className="py-8 text-center text-sm text-black/40">Loading…</p> : messages.length === 0 ? <p className="py-8 text-center text-sm text-black/40">No messages yet.</p> : messages.map((message) => (
					<div key={message.id} className={`max-w-[80%] rounded-xl border-2 border-black px-3 py-2 text-sm ${message.senderType === "ADMIN" ? "ml-auto bg-[#FFC940]" : "bg-white"}`}>
						<p className="mb-1 text-[10px] font-black uppercase text-black/50">{message.senderType === "ADMIN" ? "Meetday" : message.senderType === "REQUESTER" ? thread.requesterCommunityName : thread.targetCommunityName}</p>
						<p className="whitespace-pre-wrap break-words text-black">{message.deletedAt ? "This message was deleted" : message.content}</p>
					</div>
				))}
			</div>
			<form onSubmit={(event) => { event.preventDefault(); if (input.trim() && !sendMutation.isPending) sendMutation.mutate() }} className="flex gap-2 border-t-[3px] border-black bg-white p-3">
				<input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Write a message…" className="min-w-0 flex-1 rounded-xl border-2 border-black px-3 py-2 text-sm outline-none" />
				<button type="submit" disabled={!input.trim() || sendMutation.isPending} className="rounded-xl border-2 border-black bg-[#FFC940] px-4 py-2 text-xs font-black disabled:opacity-50">Send</button>
			</form>
		</div>
	)
}
