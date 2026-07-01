"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, User, Tag, Calendar, Hash, FileText, CheckCircle, UserCheck, UserPlus } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { StatusBadge } from "@/components/ui/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getSupportTicketById, assignTicket, escalateTicket } from "@/lib/api/support-tickets"
import { getAdmins } from "@/lib/api/admins"
import { ResolveDialog, CloseDialog } from "@/components/support-tickets/ticket-action-dialogs"
import { useAuthStore } from "@/stores/auth.store"
import type { Admin, SupportTicket, TicketCategory, TicketPriority } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketDetailDrawerProps = {
	open: boolean
	onClose: () => void
	ticket: SupportTicket | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<TicketCategory, string> = {
	REFUND_REQUEST: "Refund Request",
	ACCOUNT_ISSUE: "Account Issue",
	EVENT_ISSUE: "Event Issue",
	PAYMENT_ISSUE: "Payment Issue",
	COMMUNITY_ISSUE: "Community Issue",
	HOST_ISSUE: "Host Issue",
	OTHER: "Other",
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
	return (
		<p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">
			{children}
		</p>
	)
}

function DetailRow({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ElementType
	label: string
	value: React.ReactNode
}) {
	return (
		<div className="flex items-start gap-3">
			<div className="mt-0.5 w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center shrink-0">
				<Icon size={13} className="text-text-secondary" />
			</div>
			<div className="min-w-0">
				<p className="text-[11px] text-text-tertiary">{label}</p>
				<div className="text-sm text-text-primary">{value}</div>
			</div>
		</div>
	)
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DrawerSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="flex gap-2">
				<Skeleton className="h-5 w-20 rounded-full" />
				<Skeleton className="h-5 w-16 rounded-full" />
			</div>
			<div className="space-y-3">
				<Skeleton className="h-3 w-16" />
				<Skeleton className="h-4 w-56" />
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-4 w-48" />
			</div>
			<div className="border-t border-border-subtle" />
			<div className="space-y-3">
				<Skeleton className="h-3 w-20" />
				<Skeleton className="h-16 w-full rounded-xl" />
			</div>
		</div>
	)
}

// ─── Assign Section ───────────────────────────────────────────────────────────

function AssignSection({
	ticket,
	onAssigned,
}: {
	ticket: SupportTicket
	onAssigned: (updated: SupportTicket) => void
}) {
	const currentUser = useAuthStore(s => s.user)
	const [admins, setAdmins] = useState<Admin[]>([])
	const [selectedId, setSelectedId] = useState("")
	const [assigning, setAssigning] = useState(false)
	const [assignError, setAssignError] = useState<string | null>(null)

	const isTerminal = ticket.status === "RESOLVED" || ticket.status === "CLOSED"

	useEffect(() => {
		getAdmins({ isActive: true, limit: 100 })
			.then(r => setAdmins(r.admins))
			.catch(() => {})
	}, [])

	const otherAdmins = admins.filter(a => a.id !== currentUser?.id)

	async function handleAssign(adminUserId: string) {
		if (!adminUserId || assigning) return
		setAssigning(true)
		setAssignError(null)
		try {
			const updated = await assignTicket(ticket.id, adminUserId)
			onAssigned(updated)
			setSelectedId("")
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			setAssignError(
				status === 400
					? "Cannot assign a resolved or closed ticket."
					: "Failed to assign ticket. Please try again.",
			)
		} finally {
			setAssigning(false)
		}
	}

	if (isTerminal) return null

	return (
		<>
			<div className="border-t border-border-subtle" />
			<div>
				<SectionLabel>Assign Ticket</SectionLabel>
				<div className="space-y-2.5">
					{/* Assign to me */}
					{currentUser && (
						<button
							onClick={() => handleAssign(currentUser.id)}
							disabled={assigning || ticket.assignee?.id === currentUser.id}
							className="w-full flex items-center justify-center gap-2 rounded-lg border border-border-default px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<UserPlus size={13} />
							{ticket.assignee?.id === currentUser.id ? "Already assigned to you" : "Assign to me"}
						</button>
					)}

					{/* Assign to another admin */}
					<div className="flex gap-2">
						<select
							value={selectedId}
							onChange={e => setSelectedId(e.target.value)}
							disabled={assigning || otherAdmins.length === 0}
							className="flex-1 rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-action-primary/30 disabled:opacity-50"
						>
							<option value="">Select an admin…</option>
							{otherAdmins.map(a => (
								<option key={a.id} value={a.id}>
									{a.firstName} {a.lastName} ({a.role.name.replace("_", " ")})
								</option>
							))}
						</select>
						<button
							onClick={() => handleAssign(selectedId)}
							disabled={!selectedId || assigning}
							className="rounded-lg bg-action-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-action-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{assigning ? "Assigning…" : "Assign"}
						</button>
					</div>

					{assignError && (
						<p className="text-[11px] text-red-500">{assignError}</p>
					)}
				</div>
			</div>
		</>
	)
}

// ─── Escalate Section ─────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: { label: string; value: TicketPriority }[] = [
	{ label: "Low", value: "LOW" },
	{ label: "Normal", value: "NORMAL" },
	{ label: "High", value: "HIGH" },
	{ label: "Urgent", value: "URGENT" },
]

function EscalateSection({
	ticket,
	onEscalated,
}: {
	ticket: SupportTicket
	onEscalated: (updated: SupportTicket) => void
}) {
	const [selectedPriority, setSelectedPriority] = useState<TicketPriority>(ticket.priority)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	if (ticket.status === "CLOSED") return null

	async function handleSave() {
		if (selectedPriority === ticket.priority || saving) return
		setSaving(true)
		setError(null)
		try {
			const updated = await escalateTicket(ticket.id, selectedPriority)
			onEscalated(updated)
			toast.success(`Priority updated to ${selectedPriority.charAt(0) + selectedPriority.slice(1).toLowerCase()}`)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			setError(
				status === 400
					? "Priority is already set to this value or ticket is closed."
					: "Failed to update priority. Please try again.",
			)
		} finally {
			setSaving(false)
		}
	}

	return (
		<>
			<div className="border-t border-border-subtle" />
			<div>
				<SectionLabel>Priority</SectionLabel>
				<div className="flex gap-2">
					<select
						value={selectedPriority}
						onChange={e => setSelectedPriority(e.target.value as TicketPriority)}
						disabled={saving}
						className="flex-1 rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-action-primary/30 disabled:opacity-50"
					>
						{PRIORITY_OPTIONS.map(o => (
							<option key={o.value} value={o.value}>{o.label}</option>
						))}
					</select>
					<button
						onClick={handleSave}
						disabled={selectedPriority === ticket.priority || saving}
						className="rounded-lg bg-action-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-action-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{saving ? "Saving…" : "Update"}
					</button>
				</div>
				{error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
			</div>
		</>
	)
}

// ─── Detail content ───────────────────────────────────────────────────────────

function TicketDetailContent({
	ticket,
	onAssigned,
}: {
	ticket: SupportTicket
	onAssigned: (updated: SupportTicket) => void
}) {
	const reporterName = `${ticket.reporter.firstName} ${ticket.reporter.lastName}`
	const assigneeName = ticket.assignee
		? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
		: null

	return (
		<div className="space-y-6">
			{/* Badges */}
			<div className="flex items-center gap-2 flex-wrap">
				<StatusBadge status={ticket.status} />
				<StatusBadge status={ticket.priority} />
			</div>

			{/* Ticket info */}
			<div>
				<SectionLabel>Ticket Info</SectionLabel>
				<div className="space-y-3.5">
					<DetailRow
						icon={Hash}
						label="Ticket Number"
						value={<span className="font-mono text-xs">{ticket.ticketNumber}</span>}
					/>
					<DetailRow icon={Tag} label="Category" value={CATEGORY_LABELS[ticket.category]} />
					<DetailRow
						icon={User}
						label="Reporter"
						value={
							<span>
								<span className="block">{reporterName}</span>
								<span className="text-[11px] text-text-tertiary">{ticket.reporter.email}</span>
							</span>
						}
					/>
					{assigneeName && (
						<DetailRow icon={UserCheck} label="Assigned To" value={assigneeName} />
					)}
					<DetailRow icon={Calendar} label="Created" value={formatDate(ticket.createdAt)} />
					<DetailRow icon={Calendar} label="Last Updated" value={formatDate(ticket.updatedAt)} />
					{ticket.resolvedAt && (
						<DetailRow icon={CheckCircle} label="Resolved" value={formatDate(ticket.resolvedAt)} />
					)}
				</div>
			</div>

			{/* Message body */}
			<div className="border-t border-border-subtle" />
			<div>
				<SectionLabel>Message</SectionLabel>
				<DetailRow
					icon={FileText}
					label="Body"
					value={
						<p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
							{ticket.body}
						</p>
					}
				/>
			</div>

			{/* Resolution */}
			{ticket.resolution && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Resolution</SectionLabel>
						<DetailRow
							icon={CheckCircle}
							label="Resolution Note"
							value={
								<p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
									{ticket.resolution}
								</p>
							}
						/>
					</div>
				</>
			)}

			{/* Linked entity */}
			{ticket.entityType && ticket.entityId && (
				<>
					<div className="border-t border-border-subtle" />
					<div>
						<SectionLabel>Linked Entity</SectionLabel>
						<DetailRow
							icon={Hash}
							label={ticket.entityType}
							value={<span className="font-mono text-xs">{ticket.entityId}</span>}
						/>
					</div>
				</>
			)}

			{/* Assign */}
			<AssignSection ticket={ticket} onAssigned={onAssigned} />

			{/* Escalate */}
			<EscalateSection ticket={ticket} onEscalated={onAssigned} />
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TicketDetailDrawer({ open, onClose, ticket }: TicketDetailDrawerProps) {
	const router = useRouter()
	const [detail, setDetail] = useState<SupportTicket | null>(null)
	const [fetchState, setFetchState] = useState<"loading" | "error" | "done">("loading")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [dialogAction, setDialogAction] = useState<"resolve" | "close" | null>(null)

	useEffect(() => {
		if (!open || !ticket) return
		let cancelled = false
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)

		getSupportTicketById(ticket.id)
			.then(data => {
				if (!cancelled) {
					setDetail(data)
					setFetchState("done")
				}
			})
			.catch((err: unknown) => {
				if (cancelled) return
				const status = (err as { response?: { status?: number } })?.response?.status
				if (status === 401) {
					router.replace("/login")
					return
				}
				setFetchState("error")
				if (status === 404) setErrorMessage("Ticket not found.")
				else setErrorMessage("Failed to load ticket details. Please try again.")
			})

		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, ticket?.id, router])

	function handleClose() {
		setDetail(null)
		setFetchState("loading")
		setErrorMessage(null)
		setDialogAction(null)
		onClose()
	}

	return (
		<Drawer
			open={open}
			onClose={handleClose}
			title={ticket ? ticket.ticketNumber : "Ticket Detail"}
			description={ticket ? ticket.subject : undefined}
			width="max-w-lg"
		>
			{fetchState === "loading" && <DrawerSkeleton />}

			{fetchState === "error" && (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<AlertTriangle size={28} className="mb-3 text-neutral-300" />
					<p className="text-sm font-medium text-text-primary">Something went wrong</p>
					<p className="mt-1 text-xs text-text-tertiary max-w-xs">{errorMessage}</p>
				</div>
			)}

			{fetchState === "done" && detail && (
				<TicketDetailContent ticket={detail} onAssigned={setDetail} />
			)}

			<DrawerFooter className="justify-between">
				<div className="flex items-center gap-2">
					{detail && detail.status !== "RESOLVED" && detail.status !== "CLOSED" && (
						<button
							onClick={() => setDialogAction("resolve")}
							className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
						>
							Mark Resolved
						</button>
					)}
					{detail && detail.status !== "CLOSED" && (
						<button
							onClick={() => setDialogAction("close")}
							className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
						>
							Close Ticket
						</button>
					)}
				</div>
				<button
					onClick={handleClose}
					className="rounded-lg border border-border-default px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors"
				>
					Dismiss
				</button>
			</DrawerFooter>

			<ResolveDialog
				open={dialogAction === "resolve"}
				ticket={detail}
				onClose={() => setDialogAction(null)}
				onResolved={updated => { setDetail(updated); setDialogAction(null) }}
			/>

			<CloseDialog
				open={dialogAction === "close"}
				ticket={detail}
				onClose={() => setDialogAction(null)}
				onClosed={updated => { setDetail(updated); setDialogAction(null) }}
			/>
		</Drawer>
	)
}
