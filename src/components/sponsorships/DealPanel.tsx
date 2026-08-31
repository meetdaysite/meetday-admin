"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
	type SponsorshipDeal,
	type SponsorshipDealReport,
	isReportApproved,
	getDealPaymentDisplayStatus,
	getSponsorshipDealReport,
	getSponsorshipDealReportPdfUrl,
	getSponsorshipDealInvoiceUrl,
	type DealPaymentDisplayStatus,
} from "@/lib/api/sponsorship-chats"
import { ImageLightbox } from "@/components/ui/ImageLightbox"
import { isPdfMediaUrl, cn } from "@/lib/utils"

const STATUS_LABEL: Record<SponsorshipDeal["status"], string> = {
	PENDING_APPROVAL: "Pending Approval",
	CHANGES_REQUESTED: "Changes Requested",
	APPROVED: "🔒 Locked",
}

const STATUS_COLOR: Record<SponsorshipDeal["status"], string> = {
	PENDING_APPROVAL: "bg-[#FFC940] text-black",
	CHANGES_REQUESTED: "bg-[#EE2C2C] text-white",
	APPROVED: "bg-black text-white",
}

function formatAmount(amount: string | number) {
	return `₹${Number(amount).toLocaleString("en-IN")}`
}

export const PAYMENT_STATUS_LABEL: Record<DealPaymentDisplayStatus, string> = {
	PENDING: "Pending",
	PAID: "Paid",
	EXPIRED: "Expired",
}

export const PAYMENT_STATUS_COLOR: Record<DealPaymentDisplayStatus, string> = {
	PENDING: "bg-neutral-200 text-black/60",
	PAID: "bg-green-600 text-white",
	EXPIRED: "bg-[#EE2C2C] text-white",
}

// ── Deal Banner pinned below the chat header ─────────────────────────────

export function DealBanner({
	deal,
	onView,
	onReport,
	hasReport,
	report,
}: {
	deal: SponsorshipDeal | null
	onView: () => void
	onReport?: () => void
	hasReport?: boolean
	report?: SponsorshipDealReport | null
}) {
	if (!deal) return null

	const isClosed = isReportApproved(report)

	return (
		<div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b-[3px] border-black bg-neutral-50 flex items-center justify-between gap-3 shrink-0">
			<div className="min-w-0 flex items-center gap-2">
				<span
					className={cn(
						"px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] inline-flex items-center gap-1.5",
						isClosed ? "bg-black text-white" : STATUS_COLOR[deal.status],
					)}
				>
					{isClosed ? (
						<>
							<span className="inline-flex items-center justify-center size-3.5 rounded-full bg-[#10B981] text-white shrink-0">
								<svg className="size-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</span>
							<span>Closed</span>
						</>
					) : (
						STATUS_LABEL[deal.status]
					)}
				</span>
				{deal.status === "APPROVED" && (
					<span
						className={cn(
							"px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
							PAYMENT_STATUS_COLOR[getDealPaymentDisplayStatus(deal)],
						)}
					>
						{PAYMENT_STATUS_LABEL[getDealPaymentDisplayStatus(deal)]}
					</span>
				)}
				<p className="text-xs font-black text-black truncate">
					{deal.projectName} · {formatAmount(deal.sponsorshipAmount)}
				</p>
			</div>
			<div className="flex items-center gap-2.5 shrink-0">
				<button
					type="button"
					onClick={onView}
					className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EE2C2C] hover:bg-[#d42525] text-white font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:scale-95 transition-transform cursor-pointer select-none"
				>
					<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
						<circle cx="12" cy="12" r="3" />
					</svg>
					<span>View Deal</span>
				</button>
				{deal.status === "APPROVED" && hasReport && (
					<button
						type="button"
						onClick={onReport}
						className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFC940] hover:bg-[#ffbe1a] text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer select-none"
					>
						<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="16" y1="13" x2="8" y2="13" />
							<line x1="16" y1="17" x2="8" y2="17" />
						</svg>
						<span>View Report</span>
					</button>
				)}
			</div>
		</div>
	)
}

// ── Deal Details Modal ────────────────────────────────────────────────────

export function DealDetailsModal({
	interestId,
	deal,
	onClose,
}: {
	interestId: string
	deal: SponsorshipDeal
	onClose: () => void
}) {
	const [downloadingInvoice, setDownloadingInvoice] = useState(false)

	async function handleDownloadInvoice() {
		setDownloadingInvoice(true)
		try {
			const url = await getSponsorshipDealInvoiceUrl(interestId)
			window.open(url, "_blank")
		} catch {
			toast.error("Failed to fetch invoice URL.")
		} finally {
			setDownloadingInvoice(false)
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0 bg-neutral-50">
					<div className="flex items-center gap-2.5">
						<p className="text-lg font-black text-black">Deal Details</p>
						<span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase", STATUS_COLOR[deal.status])}>
							{STATUS_LABEL[deal.status]}
						</span>
					</div>
					<button
						onClick={onClose}
						className="size-8 rounded-full hover:bg-neutral-200 flex items-center justify-center text-xl font-black text-black/40 hover:text-black transition-colors"
						aria-label="Close"
					>
						×
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 text-sm">
					<Row label="Project Name" value={deal.projectName} />
					<div className="grid grid-cols-2 gap-3">
						<Row
							label="Start Date"
							value={
								deal.startDate
									? new Date(deal.startDate).toLocaleDateString("en-IN", {
											day: "numeric",
											month: "long",
											year: "numeric",
									  })
									: "—"
							}
						/>
						<Row
							label="End Date"
							value={
								deal.endDate
									? new Date(deal.endDate).toLocaleDateString("en-IN", {
											day: "numeric",
											month: "long",
											year: "numeric",
									  })
									: "—"
							}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<Row label="Time" value={deal.time || "—"} />
						<Row label="Venue" value={deal.venue || "—"} />
					</div>
					<div className="grid grid-cols-2 gap-3">
						<Row label="Sponsorship Amount" value={formatAmount(deal.sponsorshipAmount)} />
						<Row label="Barter Elements" value={deal.barterElements || "None"} />
					</div>
					{deal.sponsorshipCategory && <Row label="Category" value={deal.sponsorshipCategory} />}
					<Row label="Deliverables" value={deal.deliverables} multiline />
					{deal.otherTerms && <Row label="Other Terms" value={deal.otherTerms} multiline />}
					{deal.additionalNotes && <Row label="Additional Notes" value={deal.additionalNotes} multiline />}

					{deal.status === "APPROVED" && (
						<div className="rounded-2xl border-[3px] border-black bg-[#FFFBEB] p-4 flex flex-col gap-2 mt-2">
							<div className="flex items-center justify-between">
								<span className="text-xs font-black uppercase text-black/60">Payment Status</span>
								<span
									className={cn(
										"px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border-2 border-black",
										PAYMENT_STATUS_COLOR[getDealPaymentDisplayStatus(deal)],
									)}
								>
									{PAYMENT_STATUS_LABEL[getDealPaymentDisplayStatus(deal)]}
								</span>
							</div>

							{deal.totalAmount != null && (
								<div className="pt-2 border-t border-black/10 flex flex-col gap-1 text-xs">
									<div className="flex justify-between text-black/60">
										<span>Base Amount</span>
										<span>{formatAmount(deal.sponsorshipAmount)}</span>
									</div>
									{deal.transactionFeeAmount != null && Number(deal.transactionFeeAmount) > 0 && (
										<div className="flex justify-between text-black/60">
											<span>Processing Fee</span>
											<span>{formatAmount(deal.transactionFeeAmount)}</span>
										</div>
									)}
									{deal.taxAmount != null && Number(deal.taxAmount) > 0 && (
										<div className="flex justify-between text-black/60">
											<span>GST</span>
											<span>{formatAmount(deal.taxAmount)}</span>
										</div>
									)}
									<div className="flex justify-between font-black text-black pt-1 border-t border-black/10 text-sm">
										<span>Total</span>
										<span>{formatAmount(deal.totalAmount)}</span>
									</div>
								</div>
							)}

							{deal.paymentStatus === "PAID" && (
								<button
									type="button"
									onClick={handleDownloadInvoice}
									disabled={downloadingInvoice}
									className="mt-2 w-full py-2 rounded-xl bg-black text-white font-black text-xs uppercase tracking-wide hover:bg-neutral-800 transition-colors disabled:opacity-50"
								>
									{downloadingInvoice ? "Loading Receipt…" : "Download Receipt / Invoice"}
								</button>
							)}
						</div>
					)}
				</div>

				<div className="px-6 py-4 border-t-[3px] border-black flex justify-end shrink-0 bg-neutral-50">
					<button
						type="button"
						onClick={onClose}
						className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	)
}

// ── Deal Deliverables Report Modal ─────────────────────────────────────────

export function DealReportModal({
	interestId,
	onClose,
}: {
	interestId: string
	onClose: () => void
}) {
	const [report, setReport] = useState<SponsorshipDealReport | null>(null)
	const [loading, setLoading] = useState(true)
	const [viewingImage, setViewingImage] = useState<string | null>(null)
	const [downloadingPdf, setDownloadingPdf] = useState(false)

	useEffect(() => {
		let cancelled = false
		async function fetchReport() {
			try {
				const res = await getSponsorshipDealReport(interestId)
				if (!cancelled) {
					setReport(res)
				}
			} catch {
				toast.error("Failed to load deliverables report.")
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		fetchReport()
		return () => {
			cancelled = true
		}
	}, [interestId])

	async function handleDownloadPdf() {
		setDownloadingPdf(true)
		try {
			const url = await getSponsorshipDealReportPdfUrl(interestId)
			window.open(url, "_blank")
		} catch {
			toast.error("Failed to generate report PDF.")
		} finally {
			setDownloadingPdf(false)
		}
	}

	const parsedSummary = report?.summary ? safeJsonParse(report.summary) : null
	const reportStatus = report?.status || parsedSummary?.status || "PENDING"

	const STATUS_BADGES: Record<string, { label: string; color: string }> = {
		PENDING: { label: "Pending Approval", color: "bg-amber-50 text-amber-700 border-amber-300" },
		APPROVED: { label: "Approved", color: "bg-green-50 text-green-700 border-green-300" },
		REVISION_REQUESTED: { label: "Revision Requested", color: "bg-red-50 text-red-700 border-red-300" },
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className="bg-white rounded-[24px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
				<div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black shrink-0 bg-neutral-50">
					<div className="flex items-center gap-3">
						<p className="text-lg font-black text-black">Deliverables Report</p>
						{report && (
							<span
								className={cn(
									"px-2.5 py-0.5 border-2 rounded-full text-[9px] font-black uppercase tracking-wide",
									STATUS_BADGES[reportStatus]?.color ?? "bg-neutral-100 text-neutral-700 border-neutral-300",
								)}
							>
								{STATUS_BADGES[reportStatus]?.label ?? reportStatus}
							</span>
						)}
					</div>
					<div className="flex items-center gap-3 shrink-0">
						{report && (
							<button
								type="button"
								onClick={handleDownloadPdf}
								disabled={downloadingPdf}
								className="text-[10px] font-black uppercase text-black/60 hover:text-black underline underline-offset-2 cursor-pointer"
							>
								{downloadingPdf ? "Generating…" : "Download PDF"}
							</button>
						)}
						<button
							onClick={onClose}
							className="size-8 rounded-full hover:bg-neutral-200 flex items-center justify-center text-xl font-black text-black/40 hover:text-black transition-colors"
							aria-label="Close"
						>
							×
						</button>
					</div>
				</div>

				{loading ? (
					<div className="px-6 py-12 text-center text-sm font-semibold text-black/40">Loading report…</div>
				) : !report ? (
					<div className="px-6 py-12 text-center text-sm font-semibold text-black/40">
						The community hasn&apos;t submitted a deliverables report yet.
					</div>
				) : (
					<div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4 text-sm">
						{report.revisionNote && (
							<div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 text-xs font-semibold text-red-800">
								<p className="font-bold text-red-900 mb-0.5">Revision Requested:</p>
								{report.revisionNote}
							</div>
						)}

						<div className="grid grid-cols-2 gap-3">
							<Row label="Project Name" value={report.projectName || parsedSummary?.projectName || "—"} />
							<Row label="Event Date" value={report.eventDate || parsedSummary?.eventDate || "—"} />
						</div>

						<div className="grid grid-cols-2 gap-3">
							<Row label="Venue" value={report.venue || parsedSummary?.venue || "—"} />
							<Row label="Time" value={report.time || parsedSummary?.time || "—"} />
						</div>

						<div className="grid grid-cols-2 gap-3">
							<Row label="Guest Count" value={report.guestCount || parsedSummary?.guestCount || "—"} />
							<Row label="Age Range" value={report.ageRange || parsedSummary?.ageRange || "—"} />
						</div>

						{/* Deliverables Checklist */}
						{(() => {
							const list: string[] = report.deliverables || parsedSummary?.deliverables || []
							if (list.length === 0) return null
							return (
								<div className="flex flex-col gap-1.5">
									<span className="text-[11px] font-black uppercase text-black/50">Deliverables Completed</span>
									<div className="flex flex-col gap-1">
										{list.map((d, i) => (
											<div key={i} className="flex items-center gap-2 text-xs font-semibold text-black bg-neutral-50 px-3 py-1.5 rounded-lg border border-black/10">
												<span className="text-green-600 font-black">✓</span>
												<span>{d}</span>
											</div>
										))}
									</div>
								</div>
							)
						})()}

						{/* Video & Social Links */}
						{(() => {
							const videos: string[] = report.videoLinks || parsedSummary?.videoLinks || []
							const socials: string[] = report.socialLinks || parsedSummary?.socialLinks || []
							if (videos.length === 0 && socials.length === 0) return null
							return (
								<div className="flex flex-col gap-2">
									{videos.length > 0 && (
										<div>
											<span className="text-[11px] font-black uppercase text-black/50">Video Proof Links</span>
											<div className="flex flex-col gap-1 mt-1">
												{videos.map((v, i) => (
													<a
														key={i}
														href={v}
														target="_blank"
														rel="noopener noreferrer"
														className="text-xs text-blue-600 underline font-medium truncate block"
													>
														{v}
													</a>
												))}
											</div>
										</div>
									)}
									{socials.length > 0 && (
										<div>
											<span className="text-[11px] font-black uppercase text-black/50">Social Media Links</span>
											<div className="flex flex-col gap-1 mt-1">
												{socials.map((s, i) => (
													<a
														key={i}
														href={s}
														target="_blank"
														rel="noopener noreferrer"
														className="text-xs text-blue-600 underline font-medium truncate block"
													>
														{s}
													</a>
												))}
											</div>
										</div>
									)}
								</div>
							)
						})()}

						{/* Proof Media Files */}
						{report.proofUrls && report.proofUrls.length > 0 && (
							<div className="flex flex-col gap-1.5">
								<span className="text-[11px] font-black uppercase text-black/50">Proof Photos & Files</span>
								<div className="grid grid-cols-3 gap-2">
									{report.proofUrls.map((url, i) => (
										isPdfMediaUrl(url) ? (
											<a
												key={i}
												href={url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-black"
											>
												📄 PDF Proof
											</a>
										) : (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												key={i}
												src={url}
												alt={`Proof ${i + 1}`}
												onClick={() => setViewingImage(url)}
												className="aspect-square rounded-xl border-2 border-black object-cover cursor-pointer hover:opacity-90 transition-opacity"
											/>
										)
									))}
								</div>
							</div>
						)}

						{report.notes && <Row label="Additional Notes" value={report.notes} multiline />}
					</div>
				)}

				<div className="px-6 py-4 border-t-[3px] border-black flex justify-end shrink-0 bg-neutral-50">
					<button
						type="button"
						onClick={onClose}
						className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer"
					>
						Close
					</button>
				</div>
			</div>

			{viewingImage && <ImageLightbox url={viewingImage} onClose={() => setViewingImage(null)} />}
		</div>
	)
}

// ── Helpers ───────────────────────────────────────────────────────────────

function Row({ label, value, multiline = false }: { label: string; value: React.ReactNode; multiline?: boolean }) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-[10px] font-black uppercase tracking-wider text-black/50">{label}</span>
			{multiline ? (
				<p className="font-semibold text-black leading-relaxed whitespace-pre-wrap bg-neutral-50 p-2.5 rounded-xl border border-black/10 text-xs">
					{value}
				</p>
			) : (
				<span className="font-bold text-black text-xs">{value}</span>
			)}
		</div>
	)
}

function safeJsonParse(jsonString: string) {
	try {
		return JSON.parse(jsonString)
	} catch {
		return null
	}
}
