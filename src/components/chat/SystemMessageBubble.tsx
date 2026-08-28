import React from "react"
import { Check, Lock, FileText, AlertTriangle, CreditCard, ClipboardCheck } from "lucide-react"

export function SystemMessageBubble({ content }: { content: string }) {
	const lower = content.toLowerCase()

	// 1. Report Approved / Deal Closed
	if (
		lower.includes("report approved") ||
		lower.includes("deliverables approved") ||
		lower.includes("deal is closed") ||
		lower.includes("closed") ||
		(lower.includes("approved") && (lower.includes("deliverables") || lower.includes("report")))
	) {
		return (
			<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2.5 rounded-2xl bg-[#ECFDF5] border border-black/15 text-[#065F46] flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
				<div className="size-6 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
					<Check size={14} strokeWidth={2.5} />
				</div>
				<span className="leading-snug">
					Congratulations! The <strong className="font-bold">deal is officially closed</strong>!
				</span>
			</div>
		)
	}

	// 2. Deliverables Report Revision Requested (Check before generic report submitted)
	if (
		(lower.includes("deliverables") || lower.includes("report")) &&
		(lower.includes("revision") || lower.includes("requested change") || lower.includes("requested changes"))
	) {
		return (
			<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2.5 rounded-2xl bg-[#FFFBEB] border border-black/15 text-[#92400E] flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
				<div className="size-6 rounded-full bg-[#FFC940] text-black flex items-center justify-center shrink-0">
					<AlertTriangle size={13} strokeWidth={2.5} />
				</div>
				<span className="leading-snug">
					<strong className="font-bold">Revision was requested</strong> on the deliverables report.
				</span>
			</div>
		)
	}

	// 3. Deliverables Report Submitted
	if (
		lower.includes("submitted the deliverables") ||
		lower.includes("submitted the report") ||
		(lower.includes("submitted") && (lower.includes("deliverables") || lower.includes("report")))
	) {
		return (
			<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2.5 rounded-2xl bg-[#FEF2F2] border border-black/15 text-[#991B1B] flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
				<div className="size-6 rounded-full bg-[#EE2C2C] text-white flex items-center justify-center shrink-0">
					<ClipboardCheck size={13} strokeWidth={2.5} />
				</div>
				<span className="leading-snug">
					The <strong className="font-bold">deliverables report</strong> was submitted for review.
				</span>
			</div>
		)
	}

	// 4. Deal Locked / Approved
	if (
		lower.includes("locked") ||
		lower.includes("deal confirmed") ||
		lower.includes("deal approved") ||
		lower.includes("approved")
	) {
		return (
			<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2.5 rounded-2xl bg-[#ECFDF5] border border-black/15 text-[#065F46] flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
				<div className="size-6 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
					<Lock size={13} strokeWidth={2.5} />
				</div>
				<span className="leading-snug">
					The <strong className="font-bold">deal is officially locked</strong> and confirmed!
				</span>
			</div>
		)
	}

	// 5. Deal Proposal Created / Shared
	if (
		lower.includes("created") ||
		lower.includes("proposal") ||
		lower.includes("shared") ||
		lower.includes("deal terms")
	) {
		return (
			<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2.5 rounded-2xl bg-[#FEF2F2] border border-black/15 text-[#991B1B] flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
				<div className="size-6 rounded-full bg-[#EE2C2C] text-white flex items-center justify-center shrink-0">
					<FileText size={13} strokeWidth={2.5} />
				</div>
				<span className="leading-snug">
					A new <strong className="font-bold">deal proposal</strong> was shared for approval.
				</span>
			</div>
		)
	}

	// 6. Proposal Changes Requested
	if (lower.includes("changes") || lower.includes("requested change") || lower.includes("revision")) {
		return (
			<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2.5 rounded-2xl bg-[#FFFBEB] border border-black/15 text-[#92400E] flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
				<div className="size-6 rounded-full bg-[#FFC940] text-black flex items-center justify-center shrink-0">
					<AlertTriangle size={13} strokeWidth={2.5} />
				</div>
				<span className="leading-snug">
					<strong className="font-bold">Changes were requested</strong> on the proposal.
				</span>
			</div>
		)
	}

	// 7. Payment Made
	if (lower.includes("paid") || lower.includes("payment")) {
		return (
			<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2.5 rounded-2xl bg-[#F0FDF4] border border-black/15 text-[#15803D] flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
				<div className="size-6 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
					<CreditCard size={13} strokeWidth={2.5} />
				</div>
				<span className="leading-snug">
					<strong className="font-bold">Payment completed</strong> successfully!
				</span>
			</div>
		)
	}

	// 8. Generic Fallback
	const cleaned = content.replace(/^[📝✏️🎉🔒💳🔁⚠️📄✅🎟️\s]+/, "").trim()
	return (
		<div className="self-center max-w-[95%] sm:max-w-[85%] my-2 px-4 py-2 rounded-2xl bg-neutral-100 border border-black/15 text-black/80 text-xs sm:text-sm font-bold text-center">
			{cleaned}
		</div>
	)
}
