"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"
import { Megaphone, ChevronDown, Search, Mail } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { sendAnnouncement, getAnnouncements, type Announcement } from "@/lib/api/announcements"
import { getBrands } from "@/lib/api/brands"
import { getHosts } from "@/lib/api/hosts"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/data-table"
import { type ColumnDef } from "@tanstack/react-table"

import { RichTextEditor } from "@/components/ui/RichTextEditor"

export default function AnnouncementsPage() {
	const queryClient = useQueryClient()
	const [selectAll, setSelectAll] = useState(false)
	const [selectBrands, setSelectBrands] = useState(false)
	const [selectCommunity, setSelectCommunity] = useState(false)
	const [brandsExpanded, setBrandsExpanded] = useState(false)
	const [communityExpanded, setCommunityExpanded] = useState(false)
	const [brandSearch, setBrandSearch] = useState("")
	const [communitySearch, setCommunitySearch] = useState("")
	const [selectedBrandIds, setSelectedBrandIds] = useState<Set<string>>(new Set())
	const [selectedHostIds, setSelectedHostIds] = useState<Set<string>>(new Set())
	const [subject, setSubject] = useState("")
	const [message, setMessage] = useState("")
	const [confirmOpen, setConfirmOpen] = useState(false)

	// Past Announcements Search & Filters
	const pastAnnouncementsQuery = useQuery({
		queryKey: ["announcements", "list"],
		queryFn: () => getAnnouncements({ limit: 100 }).then(r => r.announcements),
	})
	const [pastSearch, setPastSearch] = useState("")
	const [selectedDate, setSelectedDate] = useState("")
	const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null)
	const [detailOpen, setDetailOpen] = useState(false)

	// Fetched lazily — only once a group is expanded to search/pick specific recipients.
	const brandsQuery = useQuery({
		queryKey: ["announcement", "brands-list"],
		queryFn: () => getBrands({ limit: 100 }).then(r => r.brands),
		enabled: brandsExpanded,
	})
	const hostsQuery = useQuery({
		queryKey: ["announcement", "hosts-list"],
		queryFn: () => getHosts({ limit: 100 }).then(r => r.hosts),
		enabled: communityExpanded,
	})

	function toggleSelectAll(checked: boolean) {
		setSelectAll(checked)
		setSelectBrands(checked)
		setSelectCommunity(checked)
	}

	function toggleBrands(checked: boolean) {
		setSelectBrands(checked)
		if (!checked) setSelectAll(false)
	}

	function toggleCommunity(checked: boolean) {
		setSelectCommunity(checked)
		if (!checked) setSelectAll(false)
	}

	function toggleBrandId(id: string) {
		setSelectedBrandIds(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	function toggleHostId(id: string) {
		setSelectedHostIds(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const filteredBrands = useMemo(() => {
		const q = brandSearch.trim().toLowerCase()
		const list = brandsQuery.data ?? []
		if (!q) return list
		return list.filter(b => b.brandName?.toLowerCase().includes(q))
	}, [brandsQuery.data, brandSearch])

	const filteredHosts = useMemo(() => {
		const q = communitySearch.trim().toLowerCase()
		const list = hostsQuery.data ?? []
		if (!q) return list
		return list.filter(h => h.displayName?.toLowerCase().includes(q))
	}, [hostsQuery.data, communitySearch])

	const recipientCount =
		(selectBrands ? (brandsQuery.data?.length ?? 0) : selectedBrandIds.size) +
		(selectCommunity ? (hostsQuery.data?.length ?? 0) : selectedHostIds.size)

	const sendMutation = useMutation({
		mutationFn: sendAnnouncement,
		onSuccess: (data) => {
			toast.success(`Announcement queued to ${data.queued} recipient(s).`)
			queryClient.invalidateQueries({ queryKey: ["announcements", "list"] })

			setConfirmOpen(false)
			setMessage("")
			setSubject("")
			setSelectAll(false)
			setSelectBrands(false)
			setSelectCommunity(false)
			setSelectedBrandIds(new Set())
			setSelectedHostIds(new Set())
		},
		onError: (err) => {
			const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined
			toast.error(typeof msg === "string" ? msg : "Failed to send announcement.")
		},
	})

	function handleSend() {
		if (!message.trim() || message === "<p><br></p>") {
			toast.error("Write a message first.")
			return
		}
		if (!selectBrands && !selectCommunity && selectedBrandIds.size === 0 && selectedHostIds.size === 0) {
			toast.error("Select at least one recipient.")
			return
		}
		setConfirmOpen(true)
	}

	function confirmSend() {
		const recipientsSummary = selectAll
			? "All Brands & Community"
			: [
					selectBrands ? "All Brands" : selectedBrandIds.size ? `${selectedBrandIds.size} Brand(s)` : null,
					selectCommunity ? "All Community" : selectedHostIds.size ? `${selectedHostIds.size} Host(s)` : null,
				]
					.filter(Boolean)
					.join(", ")

		sendMutation.mutate({
			allBrands: selectBrands,
			allCommunity: selectCommunity,
			brandIds: selectBrands ? undefined : Array.from(selectedBrandIds),
			hostIds: selectCommunity ? undefined : Array.from(selectedHostIds),
			subject: subject.trim() || undefined,
			message: message.trim(),
			recipientsSummary,
		})
	}

	// Filter past announcements
	const filteredPastAnnouncements = useMemo(() => {
		let list = pastAnnouncementsQuery.data ?? []
		const q = pastSearch.trim().toLowerCase()
		if (q) {
			list = list.filter(
				ann =>
					ann.subject?.toLowerCase().includes(q) ||
					ann.message?.toLowerCase().includes(q) ||
					ann.recipientsSummary?.toLowerCase().includes(q)
			)
		}
		if (selectedDate) {
			list = list.filter(ann => ann.createdAt.startsWith(selectedDate))
		}
		return list
	}, [pastAnnouncementsQuery.data, pastSearch, selectedDate])

	// DataTable Columns Setup
	const columns = useMemo<ColumnDef<Announcement>[]>(
		() => [
			{
				id: "subject",
				header: () => <span className="whitespace-nowrap font-bold">Subject / Name</span>,
				cell: ({ row }) => (
					<div className="font-black text-black font-heading truncate w-full max-w-[280px]">
						{row.original.subject || <span className="text-neutral-400 italic">No subject</span>}
					</div>
				),
			},
			{
				id: "recipients",
				header: () => <span className="whitespace-nowrap font-bold">Recipients</span>,
				cell: ({ row }) => (
					<div className="max-w-[200px] overflow-hidden truncate">
						<span className="text-xs font-bold text-[#EE2C2C] bg-red-50 px-2.5 py-1 rounded-full border border-red-200 truncate inline-block max-w-full">
							{row.original.recipientsSummary}
						</span>
					</div>
				),
			},
			{
				id: "dateTime",
				header: () => <span className="whitespace-nowrap font-bold">Sent Date & Time</span>,
				cell: ({ row }) => {
					const dt = new Date(row.original.createdAt)
					const dateStr = dt.toLocaleDateString("en-IN", {
						day: "2-digit",
						month: "short",
						year: "numeric",
					})
					const timeStr = dt.toLocaleTimeString("en-IN", {
						hour: "2-digit",
						minute: "2-digit",
						hour12: true,
					})
					return (
						<div className="flex flex-col">
							<span className="text-xs font-black text-black font-heading whitespace-nowrap">{dateStr}</span>
							<span className="text-[10px] font-bold text-neutral-500 whitespace-nowrap">{timeStr}</span>
						</div>
					)
				},
			},
		],
		[]
	)

	function handleRowClick(row: Announcement) {
		setSelectedAnn(row)
		setDetailOpen(true)
	}

	return (
		<div className="p-4 sm:p-6 space-y-8 max-w-7xl mx-auto w-full">
			<PageHeader
				title="Announcements"
				description="Compose, format, and broadcast email announcements to hosts and brands in your network."
			/>

			{/* ── FULL-WIDTH ANNOUNCEMENT COMPOSER ───────────────────────── */}
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between px-1">
					<div className="flex items-center gap-2.5">
						<div className="size-8 rounded-xl bg-[#EE2C2C] text-white border-2 border-black flex items-center justify-center shadow-xs">
							<Megaphone size={16} />
						</div>
						<h2 className="text-xl sm:text-2xl font-black font-heading text-black">Announcement Composer</h2>
					</div>
				</div>

				<div className="bg-white border-[3px] border-black rounded-[24px] p-5 sm:p-7 flex flex-col gap-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
					{/* 1. Recipient Selector */}
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between gap-2">
							<span className="text-xs font-black uppercase tracking-wider text-black/60">
								1. Select Target Audience
							</span>
							<span className={cn(
								"text-xs font-black px-2.5 py-0.5 rounded-full border border-black/20 transition-all",
								recipientCount > 0 ? "bg-[#FFC940] text-black" : "bg-neutral-100 text-neutral-500"
							)}>
								{recipientCount} recipient{recipientCount === 1 ? "" : "s"} selected
							</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
							{/* Select All Card */}
							<label className={cn(
								"flex items-center gap-3 p-3.5 rounded-2xl border-[3px] border-black cursor-pointer select-none transition-all",
								selectAll ? "bg-[#FFC940]/25 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-neutral-50/60 hover:bg-neutral-100/80"
							)}>
								<input
									type="checkbox"
									checked={selectAll}
									onChange={e => toggleSelectAll(e.target.checked)}
									className="rounded-full border-2 border-black accent-[#EE2C2C] size-4.5 cursor-pointer focus:ring-0"
								/>
								<div className="min-w-0">
									<p className="text-xs sm:text-sm font-black text-black leading-tight">All Audience</p>
									<p className="text-[11px] font-semibold text-neutral-500 truncate mt-0.5">Brands + Community Hosts</p>
								</div>
							</label>

							{/* Brands Group */}
							<div className="border-[3px] border-black rounded-2xl bg-white overflow-hidden">
								<div
									onClick={() => setBrandsExpanded(v => !v)}
									className="flex items-center justify-between px-3.5 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors border-b-[2px] border-black/15 cursor-pointer select-none"
								>
									<label
										className="flex items-center gap-2.5 text-xs sm:text-sm font-black text-black cursor-pointer min-w-0"
										onClick={e => e.stopPropagation()}
									>
										<input
											type="checkbox"
											checked={selectBrands}
											onChange={e => toggleBrands(e.target.checked)}
											className="rounded-full border-2 border-black accent-[#EE2C2C] size-4.5 cursor-pointer focus:ring-0 shrink-0"
										/>
										<span className="truncate">Brands</span>
										{selectedBrandIds.size > 0 && !selectBrands && (
											<span className="text-[10px] font-bold bg-[#EE2C2C] text-white px-2 py-0.5 rounded-full shrink-0">
												{selectedBrandIds.size}
											</span>
										)}
									</label>
									<ChevronDown size={16} className={cn("transition-transform text-black shrink-0", brandsExpanded && "rotate-180")} />
								</div>
								{brandsExpanded && (
									<div className="p-3 flex flex-col gap-2 bg-white">
										<div className="relative">
											<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
											<input
												type="text"
												value={brandSearch}
												onChange={e => setBrandSearch(e.target.value)}
												placeholder="Search brands…"
												className="w-full rounded-xl border-2 border-black bg-white pl-8 pr-3 py-1.5 text-xs font-semibold outline-none focus:bg-neutral-50 text-black placeholder:text-neutral-400"
											/>
										</div>
										<div className="max-h-40 overflow-y-auto flex flex-col gap-0.5 mt-1 pr-1">
											{brandsQuery.isLoading ? (
												<p className="text-xs font-semibold text-neutral-500 py-2 text-center">Loading brands…</p>
											) : filteredBrands.length === 0 ? (
												<p className="text-xs font-semibold text-neutral-500 py-2 text-center">No brands found.</p>
											) : (
												filteredBrands.map(b => (
													<label key={b.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#FFC940]/15 text-xs font-semibold text-black cursor-pointer select-none transition-colors">
														<input
															type="checkbox"
															disabled={selectBrands}
															checked={selectBrands || selectedBrandIds.has(b.id)}
															onChange={() => toggleBrandId(b.id)}
															className="rounded-full border-2 border-black accent-[#EE2C2C] size-3.5 cursor-pointer focus:ring-0 shrink-0"
														/>
														<span className="flex flex-col min-w-0 flex-1">
															<span className="truncate">{b.brandName}</span>
															<span className="text-[10px] text-neutral-500 truncate">{b.user.email}</span>
														</span>
													</label>
												))
											)}
										</div>
									</div>
								)}
							</div>

							{/* Community/Host Group */}
							<div className="border-[3px] border-black rounded-2xl bg-white overflow-hidden">
								<div
									onClick={() => setCommunityExpanded(v => !v)}
									className="flex items-center justify-between px-3.5 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors border-b-[2px] border-black/15 cursor-pointer select-none"
								>
									<label
										className="flex items-center gap-2.5 text-xs sm:text-sm font-black text-black cursor-pointer min-w-0"
										onClick={e => e.stopPropagation()}
									>
										<input
											type="checkbox"
											checked={selectCommunity}
											onChange={e => toggleCommunity(e.target.checked)}
											className="rounded-full border-2 border-black accent-[#EE2C2C] size-4.5 cursor-pointer focus:ring-0 shrink-0"
										/>
										<span className="truncate">Community (Hosts)</span>
										{selectedHostIds.size > 0 && !selectCommunity && (
											<span className="text-[10px] font-bold bg-[#EE2C2C] text-white px-2 py-0.5 rounded-full shrink-0">
												{selectedHostIds.size}
											</span>
										)}
									</label>
									<ChevronDown size={16} className={cn("transition-transform text-black shrink-0", communityExpanded && "rotate-180")} />
								</div>
								{communityExpanded && (
									<div className="p-3 flex flex-col gap-2 bg-white">
										<div className="relative">
											<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
											<input
												type="text"
												value={communitySearch}
												onChange={e => setCommunitySearch(e.target.value)}
												placeholder="Search hosts…"
												className="w-full rounded-xl border-2 border-black bg-white pl-8 pr-3 py-1.5 text-xs font-semibold outline-none focus:bg-neutral-50 text-black placeholder:text-neutral-400"
											/>
										</div>
										<div className="max-h-40 overflow-y-auto flex flex-col gap-0.5 mt-1 pr-1">
											{hostsQuery.isLoading ? (
												<p className="text-xs font-semibold text-neutral-500 py-2 text-center">Loading hosts…</p>
											) : hostsQuery.isError ? (
												<p className="text-xs font-semibold text-red-600 py-2 text-center">Failed to load hosts.</p>
											) : filteredHosts.length === 0 ? (
												<p className="text-xs font-semibold text-neutral-500 py-2 text-center">No hosts found.</p>
											) : (
												filteredHosts.map(h => (
													<label key={h.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#FFC940]/15 text-xs font-semibold text-black cursor-pointer select-none transition-colors">
														<input
															type="checkbox"
															disabled={selectCommunity}
															checked={selectCommunity || selectedHostIds.has(h.id)}
															onChange={() => toggleHostId(h.id)}
															className="rounded-full border-2 border-black accent-[#EE2C2C] size-3.5 cursor-pointer focus:ring-0 shrink-0"
														/>
														<span className="flex flex-col min-w-0 flex-1">
															<span className="truncate">{h.displayName}</span>
															<span className="text-[10px] text-neutral-500 truncate">{h.user.email}</span>
														</span>
													</label>
												))
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* 2. Subject Line */}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-black uppercase tracking-wider text-black/60">
							2. Announcement Subject (Optional)
						</label>
						<input
							type="text"
							value={subject}
							onChange={e => setSubject(e.target.value)}
							placeholder="e.g. Important Platform Updates & New Sponsorship Opportunities"
							className="w-full rounded-2xl border-[3px] border-black bg-white px-4 py-3 text-sm sm:text-base font-bold outline-none focus:bg-neutral-50 transition-colors placeholder:text-neutral-400 text-black"
						/>
					</div>

					{/* 3. Rich Text Message Composer */}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-black uppercase tracking-wider text-black/60">
							3. Message Content & Formatting
						</label>
						<RichTextEditor
							value={message}
							onChange={setMessage}
							placeholder="Write your announcement message here… Use the toolbar to style your text with bold, italics, lists, headings, and alignments."
							minHeight="260px"
						/>
					</div>

					{/* 4. Bottom Action Bar */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t-[2px] border-black/10">
						<p className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
							<Mail size={14} className="text-[#EE2C2C] shrink-0" />
							<span>Delivers a styled email notification to all {recipientCount} chosen recipient(s).</span>
						</p>

						<div className="flex items-center justify-end gap-3 shrink-0">
							<button
								type="button"
								onClick={() => {
									if (window.confirm("Clear all composer fields?")) {
										setMessage("")
										setSubject("")
										setSelectAll(false)
										setSelectBrands(false)
										setSelectCommunity(false)
										setSelectedBrandIds(new Set())
										setSelectedHostIds(new Set())
									}
								}}
								className="px-4 py-2.5 rounded-2xl border-2 border-black/20 bg-white hover:bg-neutral-100 text-xs font-black text-black/70 transition-colors cursor-pointer"
							>
								Clear
							</button>

							<button
								type="button"
								onClick={handleSend}
								disabled={sendMutation.isPending}
								className="bg-[#FFC940] hover:bg-[#ffbe1a] border-[3px] border-black text-black rounded-2xl px-6 py-2.5 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] transition-all select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							>
								{sendMutation.isPending ? "SENDING BROADCAST…" : `SEND BROADCAST${recipientCount > 0 ? ` (${recipientCount})` : ""}`}
							</button>
						</div>
					</div>

					<ConfirmDialog
						open={confirmOpen}
						onClose={() => setConfirmOpen(false)}
						onConfirm={confirmSend}
						title="Broadcast announcement"
						description={`This will send an email broadcast to ${recipientCount} recipient(s). This cannot be undone.`}
						confirmLabel="Send Broadcast"
						isLoading={sendMutation.isPending}
					/>
				</div>
			</div>

			{/* ── FULL-WIDTH PAST ANNOUNCEMENTS ───────────────────────────── */}
			<div className="flex flex-col gap-4 pt-4 border-t-[3px] border-black/10">
				<div className="flex items-center justify-between px-1">
					<h2 className="text-xl sm:text-2xl font-black font-heading text-black">Past Announcements History</h2>
					<span className="text-xs font-bold text-neutral-500">
						{filteredPastAnnouncements.length} broadcast{filteredPastAnnouncements.length === 1 ? "" : "s"}
					</span>
				</div>

				{/* Filters: Search and Date picker */}
				<div className="flex flex-wrap gap-3 items-center">
					<div className="relative flex-1 min-w-[240px]">
						<Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
						<input
							type="text"
							value={pastSearch}
							onChange={e => setPastSearch(e.target.value)}
							placeholder="Search past broadcasts by subject, content, or recipients…"
							className="w-full rounded-2xl border-[3px] border-black bg-white pl-10 pr-4 py-2.5 text-sm font-semibold outline-none focus:bg-neutral-50 text-black placeholder:text-neutral-400 shadow-xs"
						/>
					</div>
					<div className="relative shrink-0">
						<input
							type="date"
							value={selectedDate}
							onChange={e => setSelectedDate(e.target.value)}
							className="rounded-2xl border-[3px] border-black bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:bg-neutral-50 text-black cursor-pointer shadow-xs"
						/>
					</div>
					{(pastSearch || selectedDate) && (
						<button
							onClick={() => {
								setPastSearch("")
								setSelectedDate("")
							}}
							className="bg-[#FFC940] border-[3px] border-black text-black rounded-2xl px-4 py-2.5 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer select-none whitespace-nowrap"
						>
							SHOW ALL
						</button>
					)}
				</div>

				{/* Table Container */}
				<div className="overflow-hidden border-[3px] border-black rounded-[24px] bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					{pastAnnouncementsQuery.isLoading ? (
						<div className="py-16 text-center text-sm font-semibold text-neutral-500">
							Loading past announcements…
						</div>
					) : (
						<DataTable
							columns={columns}
							data={filteredPastAnnouncements}
							onRowClick={handleRowClick}
							emptyState={
								<div className="py-16 text-center text-sm font-semibold text-neutral-500">
									No broadcasted announcements match the filters.
								</div>
							}
						/>
					)}
				</div>
			</div>

			{/* Details Modal */}
			{detailOpen && selectedAnn && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
					<div className="w-full max-w-2xl bg-white border-[3px] border-black rounded-[24px] p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] flex flex-col">
						<div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4 shrink-0">
							<h3 className="text-xl font-black font-heading text-black truncate pr-4">
								{selectedAnn.subject || "Announcement Details"}
							</h3>
							<button
								onClick={() => setDetailOpen(false)}
								className="size-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-lg font-black text-black/50 hover:text-black transition-colors shrink-0"
								aria-label="Close"
							>
								×
							</button>
						</div>

						<div className="flex-1 overflow-y-auto space-y-4 pr-1">
							{/* Formatted Content */}
							<div
								dangerouslySetInnerHTML={{ __html: selectedAnn.message }}
								className={cn(
									"text-sm sm:text-base text-neutral-800 leading-relaxed bg-neutral-50/70 p-5 rounded-2xl border-2 border-black/10",
									"[&_h1]:text-2xl [&_h1]:font-black [&_h1]:font-heading [&_h1]:mb-3 [&_h1]:text-black",
									"[&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:font-heading [&_h2]:mb-2.5 [&_h2]:text-black",
									"[&_h3]:text-lg [&_h3]:font-bold [&_h3]:font-heading [&_h3]:mb-2 [&_h3]:text-black",
									"[&_p]:mb-3 [&_p]:leading-relaxed",
									"[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul_li]:mb-1",
									"[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol_li]:mb-1",
									"[&_blockquote]:border-l-4 [&_blockquote]:border-[#EE2C2C] [&_blockquote]:bg-red-50/50 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:italic",
									"[&_a]:text-[#EE2C2C] [&_a]:underline [&_a]:font-bold",
									"[&_hr]:border-t-2 [&_hr]:border-black/10 [&_hr]:my-4",
								)}
							/>

							<div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-[2px] border-black/10 text-xs font-bold text-neutral-500">
								<div className="flex items-center gap-1.5">
									<span>Sent on:</span>
									<span className="text-black font-extrabold">
										{new Date(selectedAnn.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at {new Date(selectedAnn.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
									</span>
								</div>
								<div className="flex items-center gap-1.5 text-[#EE2C2C] bg-red-50 px-3 py-1 rounded-full border border-red-200">
									<Mail size={12} />
									<span>To: {selectedAnn.recipientsSummary}</span>
								</div>
							</div>
						</div>

						<div className="flex justify-end pt-4 border-t-[2px] border-black/10 mt-4 shrink-0">
							<button
								onClick={() => setDetailOpen(false)}
								className="bg-white border-[3px] border-black text-black rounded-2xl px-6 py-2.5 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer select-none"
							>
								CLOSE
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
