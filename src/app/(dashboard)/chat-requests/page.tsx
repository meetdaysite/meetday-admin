"use client"

import { useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
	Clock,
	RotateCw,
	Search,
	X,
	ArrowRight,
	Inbox,
	Eye,
	CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import {
	getSponsorshipChats,
	type SponsorshipChatThread,
} from "@/lib/api/sponsorship-chats"
import { Drawer } from "@/components/ui/drawer"
import { getSponsorshipChatMessages } from "@/lib/api/sponsorship-chats"

const POLL_MS = 8000

function formatDateTime(iso: string | null) {
	if (!iso) return "—"
	return new Date(iso).toLocaleString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	})
}

function timeAgo(iso: string | null) {
	if (!iso) return ""
	const diffMs = Date.now() - new Date(iso).getTime()
	const mins = Math.floor(diffMs / 60000)
	if (mins < 1) return "just now"
	if (mins < 60) return `${mins}m ago`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	return `${days}d ago`
}

function RequestDetailDrawer({
	thread,
	onClose,
}: {
	thread: SponsorshipChatThread
	onClose: () => void
}) {
	const messagesQuery = useQuery({
		queryKey: ["admin-sponsorship-chat-messages", thread.id],
		queryFn: () => getSponsorshipChatMessages(thread.id),
	})
	const messages = messagesQuery.data?.messages ?? []

	const isCampaign = thread.type === "CAMPAIGN" || Boolean(thread.campaignId)

	const senderName = thread.senderName ?? (isCampaign ? thread.communityName : thread.brandName)
	const senderRole = thread.senderRole ?? (isCampaign ? "HOST" : "BRAND")
	const senderLogoUrl = thread.senderLogoUrl ?? (isCampaign ? thread.communityLogoUrl : thread.brandLogoUrl)

	const receiverName = thread.receiverName ?? (isCampaign ? thread.brandName : thread.communityName)
	const receiverRole = thread.receiverRole ?? (isCampaign ? "BRAND" : "HOST")
	const receiverLogoUrl = thread.receiverLogoUrl ?? (isCampaign ? thread.brandLogoUrl : thread.communityLogoUrl)

	const targetTitle = thread.targetName || (isCampaign ? thread.campaignName : thread.proposalName) || "—"

	return (
		<Drawer
			open={true}
			onClose={onClose}
			title={isCampaign ? "Campaign Application" : "Sponsorship Request"}
			description={`Requested on ${formatDateTime(thread.createdAt)}`}
			width="max-w-lg"
		>
			<div className="space-y-5 p-6 text-body-sm">
				{/* Sender & Receiver Card */}
				<div className="rounded-2xl border-[2px] border-neutral-200 bg-neutral-50/70 p-4 space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
							Connection Request
						</span>
						<span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
							<Clock className="size-3" />
							<span>Pending Acceptance</span>
						</span>
					</div>

					<div className="flex items-center justify-between gap-3 pt-1">
						{/* Sender */}
						<div className="flex items-center gap-2.5 min-w-0">
							<div className="size-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs font-bold text-xs">
								{senderLogoUrl ? (
									<img src={senderLogoUrl} alt={senderName ?? "Sender"} className="w-full h-full object-cover" />
								) : (
									(senderName ?? "S").charAt(0).toUpperCase()
								)}
							</div>
							<div className="min-w-0">
								<p className="text-caption font-bold text-text-tertiary uppercase tracking-wider">
									{senderRole === "BRAND" ? "Brand (Sender)" : "Community (Applicant)"}
								</p>
								<p className="font-bold text-text-primary text-body-sm truncate">{senderName}</p>
							</div>
						</div>

						{/* Direction */}
						<div className="size-8 rounded-full bg-neutral-200/80 text-neutral-600 flex items-center justify-center shrink-0">
							<ArrowRight className="size-4" />
						</div>

						{/* Receiver */}
						<div className="flex items-center gap-2.5 min-w-0 justify-end text-right">
							<div className="min-w-0">
								<p className="text-caption font-bold text-text-tertiary uppercase tracking-wider">
									{receiverRole === "BRAND" ? "Brand (Recipient)" : "Community (Recipient)"}
								</p>
								<p className="font-bold text-text-primary text-body-sm truncate">{receiverName}</p>
							</div>
							<div className="size-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs font-bold text-xs">
								{receiverLogoUrl ? (
									<img src={receiverLogoUrl} alt={receiverName ?? "Receiver"} className="w-full h-full object-cover" />
								) : (
									(receiverName ?? "R").charAt(0).toUpperCase()
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Target Campaign / Proposal */}
				<div className="rounded-xl border border-border-default bg-white p-4 space-y-1">
					<p className="text-caption font-bold text-text-tertiary uppercase tracking-wider">
						{isCampaign ? "Target Campaign" : "Target Proposal"}
					</p>
					<p className="text-body-md font-bold text-text-primary">
						{targetTitle}
					</p>
				</div>

				{/* Initial Messages / Pitch */}
				<div className="space-y-2">
					<p className="text-caption font-bold text-text-tertiary uppercase tracking-wider">
						Message History ({messages.length})
					</p>
					{messagesQuery.isLoading ? (
						<p className="text-caption text-text-tertiary py-4 text-center">Loading message history…</p>
					) : messages.length === 0 ? (
						<div className="rounded-xl border border-border-subtle bg-neutral-50 p-4 text-center text-caption text-text-tertiary">
							No introductory messages sent with this request.
						</div>
					) : (
						<div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
							{messages.map((m) => (
								<div key={m.id} className="rounded-xl border border-border-default bg-white p-3 space-y-1">
									<div className="flex items-center justify-between text-caption text-text-tertiary">
										<span className="font-semibold text-text-primary">{m.senderType}</span>
										<span>{formatDateTime(m.createdAt)}</span>
									</div>
									<p className="text-body-sm text-text-primary whitespace-pre-wrap">{m.content}</p>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Info note */}
				<div className="rounded-xl bg-blue-50 border border-blue-200/80 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
					<CheckCircle2 className="size-4 text-blue-600 shrink-0 mt-0.5" />
					<p>
						Once accepted by the recipient, this chat automatically transitions into <strong>Ongoing Chats</strong> where live multi-party messaging and deal locking occur.
					</p>
				</div>
			</div>
		</Drawer>
	)
}

export default function ChatRequestsPage() {
	const queryClient = useQueryClient()
	const [activeTab, setActiveTab] = useState<"SPONSORSHIP" | "CAMPAIGN">("SPONSORSHIP")
	const [searchQuery, setSearchQuery] = useState("")
	const [inspectThread, setInspectThread] = useState<SponsorshipChatThread | null>(null)

	// Fetch all pending requests across both types
	const requestsQuery = useQuery({
		queryKey: ["admin-sponsorship-chat-requests"],
		queryFn: () => getSponsorshipChats("REQUESTED"),
		refetchInterval: POLL_MS,
	})

	const allRequests = requestsQuery.data ?? []

	// Categorize into Sponsorships vs Campaigns
	const tabRequests = allRequests.filter((t) => {
		const isCampaign = t.type === "CAMPAIGN" || Boolean(t.campaignId) || (!t.proposalId && !t.proposalName && Boolean(t.campaignName))
		return activeTab === "CAMPAIGN" ? isCampaign : !isCampaign
	})

	// Filter by search query
	const filteredRequests = useMemo(() => {
		return tabRequests.filter((t) => {
			if (!searchQuery.trim()) return true
			const q = searchQuery.toLowerCase()
			return (
				t.brandName?.toLowerCase().includes(q) ||
				t.communityName?.toLowerCase().includes(q) ||
				(t.senderName && t.senderName.toLowerCase().includes(q)) ||
				(t.receiverName && t.receiverName.toLowerCase().includes(q)) ||
				(t.proposalName && t.proposalName.toLowerCase().includes(q)) ||
				(t.campaignName && t.campaignName.toLowerCase().includes(q)) ||
				(t.targetName && t.targetName.toLowerCase().includes(q))
			)
		})
	}, [tabRequests, searchQuery])

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto w-full">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<h1 className="text-xl font-bold text-text-primary tracking-tight">Chat Requests</h1>
					<p className="text-xs text-text-secondary mt-0.5">
						Inbound connection requests between Communities and Brands awaiting acceptance.
					</p>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<Button
						variant="secondary"
						size="sm"
						onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-sponsorship-chat-requests"] })}
						disabled={requestsQuery.isFetching}
						leftIcon={<RotateCw className={cn("size-3.5", requestsQuery.isFetching && "animate-spin")} />}
					>
						Refresh
					</Button>
				</div>
			</div>

			{/* Main Card Container */}
			<div className="border border-border-default rounded-action overflow-hidden bg-surface-card w-full">
				{/* Dual Tabs & Search Toolbar */}
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-border-default bg-neutral-50/60 px-4 py-2.5 gap-3 w-full">
					{/* Dual Tabs: Sponsorships & Campaigns */}
					<div className="flex items-center gap-1.5">
						{(
							[
								{ key: "SPONSORSHIP", label: "Sponsorships" },
								{ key: "CAMPAIGN", label: "Campaigns" },
							] as const
						).map((tab) => {
							const isActive = activeTab === tab.key
							const count = allRequests.filter((t) => {
								const isCampaign = t.type === "CAMPAIGN" || Boolean(t.campaignId) || (!t.proposalId && !t.proposalName && Boolean(t.campaignName))
								return tab.key === "CAMPAIGN" ? isCampaign : !isCampaign
							}).length

							return (
								<button
									key={tab.key}
									onClick={() => setActiveTab(tab.key)}
									className={cn(
										"inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
										isActive
											? "bg-[#FFC940] text-black border border-black/80 shadow-2xs"
											: "bg-white text-text-secondary hover:text-text-primary hover:bg-neutral-100/80 border border-border-default",
									)}
								>
									<span>{tab.label}</span>
									<span className={cn(
										"px-1.5 py-0.2 rounded-full text-[10px] font-black",
										isActive ? "bg-black text-white" : "bg-neutral-200 text-neutral-700",
									)}>
										{count}
									</span>
								</button>
							)
						})}
					</div>

					{/* Search Box */}
					<div className="relative">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary pointer-events-none" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder={activeTab === "SPONSORSHIP" ? "Search sender, proposal…" : "Search applicant, campaign…"}
							className="pl-8 pr-7 py-1 text-xs rounded-md border border-border-default bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focused w-full sm:w-64"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
							>
								<X className="size-3" />
							</button>
						)}
					</div>
				</div>

				{/* Table / List View */}
				<div className="overflow-x-auto w-full">
					<table className="w-full min-w-full text-left table-auto">
						<thead>
							<tr className="border-b border-border-default text-caption text-text-tertiary bg-neutral-50/40">
								<th className="px-4 py-2.5 font-semibold min-w-[200px]">Sent By (Sender)</th>
								<th className="px-4 py-2.5 font-semibold min-w-[200px]">Sent To (Recipient)</th>
								<th className="px-4 py-2.5 font-semibold min-w-[200px]">
									{activeTab === "SPONSORSHIP" ? "Target Proposal" : "Target Campaign"}
								</th>
								<th className="px-4 py-2.5 font-semibold min-w-[140px]">Date &amp; Time</th>
								<th className="px-4 py-2.5 font-semibold min-w-[140px]">Status</th>
								<th className="px-4 py-2.5 font-semibold min-w-[100px] text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border-subtle">
							{requestsQuery.isLoading ? (
								<tr>
									<td colSpan={6} className="text-center py-12 text-caption text-text-tertiary">
										Loading requests…
									</td>
								</tr>
							) : filteredRequests.length === 0 ? (
								<tr>
									<td colSpan={6} className="text-center py-12 text-caption text-text-tertiary">
										<div className="flex flex-col items-center justify-center gap-1.5">
											<Inbox className="size-8 text-neutral-300" />
											<p className="font-semibold text-text-secondary text-xs">
												{searchQuery
													? "No chat requests match your search."
													: `No pending ${activeTab === "SPONSORSHIP" ? "sponsorship" : "campaign"} requests.`}
											</p>
											<p className="text-[11px] text-text-tertiary">
												New connection requests sent between brands and communities will appear here.
											</p>
										</div>
									</td>
								</tr>
							) : (
								filteredRequests.map((row) => {
									const isCampaign = row.type === "CAMPAIGN" || Boolean(row.campaignId)

									const senderName = row.senderName ?? (isCampaign ? row.communityName : row.brandName)
									const senderRole = row.senderRole ?? (isCampaign ? "HOST" : "BRAND")
									const senderLogoUrl = row.senderLogoUrl ?? (isCampaign ? row.communityLogoUrl : row.brandLogoUrl)

									const receiverName = row.receiverName ?? (isCampaign ? row.brandName : row.communityName)
									const receiverRole = row.receiverRole ?? (isCampaign ? "BRAND" : "HOST")
									const receiverLogoUrl = row.receiverLogoUrl ?? (isCampaign ? row.brandLogoUrl : row.communityLogoUrl)

									const targetTitle = row.targetName || (isCampaign ? row.campaignName : row.proposalName) || "—"

									return (
										<tr key={row.id} className="hover:bg-neutral-50/70 transition-colors group">
											{/* Sent By */}
											<td className="px-4 py-3 text-xs">
												<div className="flex items-center gap-2.5">
													<div className="size-9 rounded-xl border border-neutral-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs font-bold text-xs text-text-secondary">
														{senderLogoUrl ? (
															<img src={senderLogoUrl} alt={senderName ?? "Sender"} className="w-full h-full object-cover" />
														) : (
															(senderName ?? "S").charAt(0).toUpperCase()
														)}
													</div>
													<div className="min-w-0">
														<p className="font-semibold text-text-primary truncate">{senderName}</p>
														<span className="inline-block text-[10px] font-medium px-1.5 py-0.2 rounded bg-neutral-100 text-text-secondary">
															{senderRole === "BRAND" ? "Brand" : "Community"}
														</span>
													</div>
												</div>
											</td>

											{/* Sent To */}
											<td className="px-4 py-3 text-xs">
												<div className="flex items-center gap-2.5">
													<div className="size-9 rounded-xl border border-neutral-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs font-bold text-xs text-text-secondary">
														{receiverLogoUrl ? (
															<img src={receiverLogoUrl} alt={receiverName ?? "Receiver"} className="w-full h-full object-cover" />
														) : (
															(receiverName ?? "R").charAt(0).toUpperCase()
														)}
													</div>
													<div className="min-w-0">
														<p className="font-semibold text-text-primary truncate">{receiverName}</p>
														<span className="inline-block text-[10px] font-medium px-1.5 py-0.2 rounded bg-neutral-100 text-text-secondary">
															{receiverRole === "BRAND" ? "Brand" : "Community"}
														</span>
													</div>
												</div>
											</td>

											{/* Target Item */}
											<td className="px-4 py-3 text-xs max-w-[240px]">
												<p className="font-semibold text-text-primary truncate" title={targetTitle}>
													{targetTitle}
												</p>
												<p className="text-[11px] text-text-tertiary">
													{isCampaign ? "Campaign Application" : "Proposal Sponsorship"}
												</p>
											</td>

											{/* Timestamp */}
											<td className="px-4 py-3 text-xs">
												<div className="flex flex-col">
													<span className="font-medium text-text-primary">{formatDateTime(row.createdAt)}</span>
													<span className="text-[11px] text-text-tertiary">{timeAgo(row.createdAt)}</span>
												</div>
											</td>

											{/* Status */}
											<td className="px-4 py-3 text-xs">
												<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
													<Clock className="size-3 shrink-0" />
													<span>Awaiting Accept</span>
												</span>
											</td>

											{/* Action */}
											<td className="px-4 py-3 text-right whitespace-nowrap">
												<button
													type="button"
													onClick={() => setInspectThread(row)}
													className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md text-text-primary bg-white hover:bg-neutral-100 border border-border-default transition-colors shadow-2xs cursor-pointer"
												>
													<Eye className="size-3.5 text-text-secondary" />
													<span>View Details</span>
												</button>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Detail Drawer */}
			{inspectThread && (
				<RequestDetailDrawer
					thread={inspectThread}
					onClose={() => setInspectThread(null)}
				/>
			)}
		</div>
	)
}
