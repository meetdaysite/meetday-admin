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
		if (!message.trim()) {
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
					ann.subject.toLowerCase().includes(q) ||
					ann.message.toLowerCase().includes(q) ||
					ann.recipientsSummary.toLowerCase().includes(q)
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
				header: () => <span className="whitespace-nowrap">Name</span>,
				cell: ({ row }) => (
					<div className="font-black text-black font-heading truncate w-full max-w-[120px] sm:max-w-[180px]">
						{row.original.subject}
					</div>
				),
			},
			{
				id: "recipients",
				header: () => <span className="whitespace-nowrap">To</span>,
				cell: ({ row }) => (
					<div className="max-w-[80px] sm:max-w-[120px] overflow-hidden truncate">
						<span className="text-xs font-bold text-[#EE2C2C] bg-red-50/50 px-2 py-0.5 rounded border border-red-100 truncate inline-block max-w-full">
							{row.original.recipientsSummary}
						</span>
					</div>
				),
			},
			{
				id: "dateTime",
				header: () => <span className="whitespace-nowrap">Date / Time</span>,
				cell: ({ row }) => {
					const dt = new Date(row.original.createdAt)
					const dateStr = dt.toLocaleDateString("en-IN", {
						day: "2-digit",
						month: "short",
					})
					const timeStr = dt.toLocaleTimeString("en-IN", {
						hour: "2-digit",
						minute: "2-digit",
						hour12: true,
					})
					return (
						<div className="flex flex-col w-[72px] shrink-0">
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
		<div className="p-6 space-y-6 max-w-7xl mx-auto">
			<PageHeader
				title="Announcements"
				description="Compose and broadcast announcements to hosts and brands in your network."
			/>

			<div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
				{/* Left Side: Composer Form */}
				<div className="md:col-span-5 flex flex-col gap-4">
					<div className="flex items-center gap-2 px-1">
						<Megaphone size={18} className="text-black" />
						<h2 className="text-xl font-black font-heading text-black">Announcements Composer</h2>
					</div>

					<div className="bg-white border-[3px] border-black rounded-[24px] p-6 flex flex-col gap-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<div className="flex flex-col gap-3">
							<label className="flex items-center gap-2 text-sm font-bold text-black select-none cursor-pointer">
								<input
									type="checkbox"
									checked={selectAll}
									onChange={e => toggleSelectAll(e.target.checked)}
									className="rounded-full border-2 border-black accent-[#EE2C2C] size-4 cursor-pointer focus:ring-0"
								/>
								Select All (Brands + Community)
							</label>

							{/* Brands group */}
							<div className="border-[3px] border-black rounded-2xl bg-white overflow-hidden">
								<div
									onClick={() => setBrandsExpanded(v => !v)}
									className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100 transition-colors border-b-[3px] border-black cursor-pointer select-none"
								>
									<label
										className="flex items-center gap-2 text-sm font-bold text-black cursor-pointer"
										onClick={e => e.stopPropagation()}
									>
										<input
											type="checkbox"
											checked={selectBrands}
											onChange={e => toggleBrands(e.target.checked)}
											className="rounded-full border-2 border-black accent-[#EE2C2C] size-4 cursor-pointer focus:ring-0"
										/>
										Brands
										{selectedBrandIds.size > 0 && !selectBrands && (
											<span className="text-xs font-semibold text-neutral-500">({selectedBrandIds.size} selected)</span>
										)}
									</label>
									<ChevronDown size={16} className={cn("transition-transform text-black", brandsExpanded && "rotate-180")} />
								</div>
								{brandsExpanded && (
									<div className="p-3 flex flex-col gap-2 bg-white border-b-2 border-black">
										<div className="relative mb-1">
											<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
											<input
												type="text"
												value={brandSearch}
												onChange={e => setBrandSearch(e.target.value)}
												placeholder="Search brands by name…"
												className="w-full rounded-2xl border-[3px] border-black bg-white pl-9 pr-3 py-2 text-sm font-semibold outline-none focus:bg-neutral-50 text-black"
											/>
										</div>
										<div className="max-h-40 overflow-y-auto flex flex-col gap-0.5 mt-2">
											{brandsQuery.isLoading ? (
												<p className="text-xs font-semibold text-neutral-500 py-2 text-center">Loading…</p>
											) : filteredBrands.length === 0 ? (
												<p className="text-xs font-semibold text-neutral-500 py-2 text-center">No brands found.</p>
											) : (
												filteredBrands.map(b => (
													<label key={b.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#FFC940]/15 text-xs font-semibold text-black cursor-pointer select-none transition-colors">
														<input
															type="checkbox"
															disabled={selectBrands}
															checked={selectBrands || selectedBrandIds.has(b.id)}
															onChange={() => toggleBrandId(b.id)}
															className="rounded-full border-2 border-black accent-[#EE2C2C] size-4 cursor-pointer focus:ring-0"
														/>
														<span className="flex flex-col min-w-0">
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

							{/* Community/Host group */}
							<div className="border-[3px] border-black rounded-2xl bg-white overflow-hidden">
								<div
									onClick={() => setCommunityExpanded(v => !v)}
									className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100 transition-colors border-b-[3px] border-black cursor-pointer select-none"
								>
									<label
										className="flex items-center gap-2 text-sm font-bold text-black cursor-pointer"
										onClick={e => e.stopPropagation()}
									>
										<input
											type="checkbox"
											checked={selectCommunity}
											onChange={e => toggleCommunity(e.target.checked)}
											className="rounded-full border-2 border-black accent-[#EE2C2C] size-4 cursor-pointer focus:ring-0"
										/>
										Community
										{selectedHostIds.size > 0 && !selectCommunity && (
											<span className="text-xs font-semibold text-neutral-500">({selectedHostIds.size} selected)</span>
										)}
									</label>
									<ChevronDown size={16} className={cn("transition-transform text-black", communityExpanded && "rotate-180")} />
								</div>
								{communityExpanded && (
									<div className="p-3 flex flex-col gap-2 bg-white">
										<div className="relative mb-1">
											<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
											<input
												type="text"
												value={communitySearch}
												onChange={e => setCommunitySearch(e.target.value)}
												placeholder="Search hosts by name…"
												className="w-full rounded-2xl border-[3px] border-black bg-white pl-9 pr-3 py-2 text-sm font-semibold outline-none focus:bg-neutral-50 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
											/>
										</div>
										<div className="max-h-40 overflow-y-auto flex flex-col gap-0.5 mt-2">
											{hostsQuery.isLoading ? (
												<p className="text-xs font-semibold text-neutral-500 py-2 text-center">Loading…</p>
											) : hostsQuery.isError ? (
												<p className="text-xs font-semibold text-red-600 py-2 text-center">Failed to load hosts.</p>
											) : filteredHosts.length === 0 ? (
												<p className="text-xs font-semibold text-neutral-500 py-2 text-center">No hosts found.</p>
											) : (
												filteredHosts.map(h => (
													<label key={h.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#FFC940]/15 text-xs font-semibold text-black cursor-pointer select-none transition-colors">
														<input
															type="checkbox"
															disabled={selectCommunity}
															checked={selectCommunity || selectedHostIds.has(h.id)}
															onChange={() => toggleHostId(h.id)}
															className="rounded-full border-2 border-black accent-[#EE2C2C] size-4 cursor-pointer focus:ring-0"
														/>
														<span className="flex flex-col min-w-0">
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

						<input
							type="text"
							value={subject}
							onChange={e => setSubject(e.target.value)}
							placeholder="Subject (optional)"
							className="w-full rounded-2xl border-[3px] border-black bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:bg-neutral-50 transition-colors placeholder:text-neutral-400 text-black animate-none"
						/>
						<textarea
							value={message}
							onChange={e => setMessage(e.target.value)}
							placeholder="Write your announcement…"
							rows={6}
							className="w-full rounded-2xl border-[3px] border-black bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:bg-neutral-50 transition-colors placeholder:text-neutral-400 text-black resize-none"
						/>

						<button
							onClick={handleSend}
							disabled={sendMutation.isPending}
							className="bg-[#FFC940] border-[3px] border-black text-black rounded-2xl px-6 py-2.5 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all select-none self-end cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{sendMutation.isPending ? "SENDING…" : `SEND${recipientCount > 0 ? ` (${recipientCount})` : ""}`}
						</button>
						<p className="text-[10px] font-semibold text-neutral-500 text-right -mt-2">
							This sends a real email to every selected recipient.
						</p>

						<ConfirmDialog
							open={confirmOpen}
							onClose={() => setConfirmOpen(false)}
							onConfirm={confirmSend}
							title="Send announcement"
							description={`This will send a real email to ${recipientCount} recipient(s). This cannot be undone.`}
							confirmLabel="Send"
							isLoading={sendMutation.isPending}
						/>
					</div>
				</div>

				{/* Right Side: Past Announcements List */}
				<div className="md:col-span-7 flex flex-col gap-4">
					<div className="flex items-center gap-2 px-1">
						<h2 className="text-xl font-black font-heading text-black">Past Announcements</h2>
					</div>

					{/* Filters: Search and Date picker */}
					<div className="flex flex-wrap gap-2 items-center">
						<div className="relative flex-1 min-w-[200px]">
							<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
							<input
								type="text"
								value={pastSearch}
								onChange={e => setPastSearch(e.target.value)}
								placeholder="Search past broadcasts…"
								className="w-full rounded-2xl border-[3px] border-black bg-white pl-9 pr-4 py-2 text-sm font-semibold outline-none focus:bg-neutral-50 text-black placeholder:text-neutral-400"
							/>
						</div>
						<div className="relative shrink-0">
							<input
								type="date"
								value={selectedDate}
								onChange={e => setSelectedDate(e.target.value)}
								className="w-40 rounded-2xl border-[3px] border-black bg-white px-3 py-2 text-sm font-semibold outline-none focus:bg-neutral-50 text-black cursor-pointer"
							/>
						</div>
						{(pastSearch || selectedDate) && (
							<button
								onClick={() => {
									setPastSearch("")
									setSelectedDate("")
								}}
								className="w-full sm:w-auto bg-[#FFC940] border-[3px] border-black text-black rounded-2xl px-4 py-2 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer select-none whitespace-nowrap"
							>
								SHOW ALL
							</button>
						)}
					</div>

					{/* Table Container */}
					<div className="overflow-y-auto max-h-[550px] pr-1">
						{pastAnnouncementsQuery.isLoading ? (
							<div className="py-12 text-center text-sm font-semibold text-neutral-500 bg-white border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
								Loading…
							</div>
						) : (
							<DataTable
								columns={columns}
								data={filteredPastAnnouncements}
								onRowClick={handleRowClick}
								emptyState={
									<div className="py-12 text-center text-sm font-semibold text-neutral-500 bg-white border-[3px] border-black rounded-[24px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
										No broadcasted announcements match the filters.
									</div>
								}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Details Modal */}
			{detailOpen && selectedAnn && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-lg bg-white border-[3px] border-black rounded-[24px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200">
						<h3 className="text-lg font-black font-heading text-black border-b-[3px] border-black pb-2.5 mb-4">
							{selectedAnn.subject}
						</h3>
						<div className="space-y-4">
							<p className="text-sm font-semibold text-neutral-800 break-words whitespace-pre-line leading-relaxed">
								{selectedAnn.message}
							</p>
							<div className="flex flex-col gap-2.5 pt-4 border-t-[3px] border-black/5 text-xs font-bold text-neutral-500">
								<div className="flex items-center gap-1.5">
									Date: <span className="text-black">{new Date(selectedAnn.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at {new Date(selectedAnn.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
								</div>
								<div className="flex items-center gap-1.5 text-[#EE2C2C] bg-red-50/50 self-start px-2 py-0.5 rounded border border-red-100">
									<Mail size={10} /> Recipients: {selectedAnn.recipientsSummary}
								</div>
							</div>
						</div>
						<div className="flex justify-end mt-6">
							<button
								onClick={() => setDetailOpen(false)}
								className="bg-white border-[3px] border-black text-black rounded-2xl px-5 py-2 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer select-none"
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
