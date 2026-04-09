"use client"

import { useState } from "react"
import { Loader2, MapPin, Phone, Mail, Calendar, Clock, AlertCircle } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { StatusBadge } from "@/components/ui/status-badge"
import type { Host } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type HostAction = "approve" | "reject" | "request_info"

export type HostReviewDrawerProps = {
	open: boolean
	onClose: () => void
	host: Host | null
	onAction: (hostId: string, action: HostAction, message?: string) => Promise<void>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
	return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function getDays(date: Date): number {
	return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function daysAgoLabel(days: number): string {
	if (days === 0) return "Today"
	if (days === 1) return "Yesterday"
	return `${days} days ago`
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ElementType
	label: string
	value: string
}) {
	return (
		<div className="flex items-start gap-3">
			<div className="mt-0.5 w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center shrink-0">
				<Icon size={13} className="text-neutral-dark" />
			</div>
			<div>
				<p className="text-[11px] text-neutral-light">{label}</p>
				<p className="text-sm text-foreground">{value}</p>
			</div>
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HostReviewDrawer({ open, onClose, host, onAction }: HostReviewDrawerProps) {
	const [mode, setMode] = useState<"view" | "request_info">("view")
	const [infoMessage, setInfoMessage] = useState("")
	const [isLoading, setIsLoading] = useState<HostAction | null>(null)

	function handleClose() {
		setMode("view")
		setInfoMessage("")
		setIsLoading(null)
		onClose()
	}

	async function handleAction(action: HostAction, message?: string) {
		if (!host) return
		setIsLoading(action)
		try {
			await onAction(host.id, action, message)
			handleClose()
		} finally {
			setIsLoading(null)
		}
	}

	const days = host ? getDays(host.invitedAt) : 0
	const canAct = host?.status === "PENDING" || host?.status === "INFO_REQUESTED"
	const isBusy = isLoading !== null

	return (
		<Drawer
			open={open}
			onClose={handleClose}
			title={host?.name ?? ""}
			description={host?.email}
			width="max-w-lg"
		>
			{host && (
				<div className="space-y-6">
					{/* Status + age warning */}
					<div className="flex items-center gap-2 flex-wrap">
						<StatusBadge status={host.status} />
						{host.status === "PENDING" && days >= 7 && (
							<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
								<Clock size={10} />
								{daysAgoLabel(days)}
							</span>
						)}
					</div>

					{/* Host details */}
					<div className="space-y-4">
						<DetailRow icon={Mail} label="Email" value={host.email} />
						{host.phone && <DetailRow icon={Phone} label="Phone" value={host.phone} />}
						<DetailRow icon={MapPin} label="City" value={host.city} />
						<DetailRow
							icon={Calendar}
							label="Applied"
							value={`${formatDate(host.invitedAt)} · ${daysAgoLabel(days)}`}
						/>
					</div>

					{/* Request info form */}
					{mode === "request_info" && (
						<div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
							<div className="flex items-center gap-1.5">
								<AlertCircle size={13} className="text-amber-600" />
								<p className="text-xs font-semibold text-amber-700">Request additional info</p>
							</div>
							<div className="space-y-1.5">
								<label className="block text-xs font-medium text-foreground">
									Message to host
								</label>
								<textarea
									value={infoMessage}
									onChange={(e) => setInfoMessage(e.target.value)}
									placeholder="Please provide your event hosting experience, references, or any other relevant information..."
									rows={4}
									className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors resize-none"
								/>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Footer */}
			<DrawerFooter className={canAct ? "justify-between" : "justify-end"}>
				{mode === "view" && canAct && (
					<>
						<button
							onClick={() => setMode("request_info")}
							disabled={isBusy}
							className="rounded-lg border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors disabled:opacity-50"
						>
							Request Info
						</button>
						<div className="flex items-center gap-2">
							<button
								onClick={() => handleAction("reject")}
								disabled={isBusy}
								className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
							>
								{isLoading === "reject" && <Loader2 size={12} className="animate-spin" />}
								Reject
							</button>
							<button
								onClick={() => handleAction("approve")}
								disabled={isBusy}
								className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors disabled:opacity-70"
							>
								{isLoading === "approve" && <Loader2 size={12} className="animate-spin" />}
								Approve
							</button>
						</div>
					</>
				)}

				{mode === "request_info" && (
					<>
						<button
							onClick={() => { setMode("view"); setInfoMessage("") }}
							disabled={isBusy}
							className="rounded-lg border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							onClick={() => handleAction("request_info", infoMessage)}
							disabled={isBusy || !infoMessage.trim()}
							className="flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors disabled:opacity-70"
						>
							{isLoading === "request_info" && <Loader2 size={12} className="animate-spin" />}
							Send Request
						</button>
					</>
				)}

				{!canAct && mode !== "request_info" && (
					<button
						onClick={handleClose}
						className="rounded-lg border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors"
					>
						Close
					</button>
				)}
			</DrawerFooter>
		</Drawer>
	)
}
