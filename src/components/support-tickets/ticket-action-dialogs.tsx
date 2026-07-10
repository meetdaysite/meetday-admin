"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Loader2 } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { resolveTicket, closeTicket } from "@/lib/api/support-tickets"
import type { SupportTicket } from "@/types"

// ─── Resolve Dialog ───────────────────────────────────────────────────────────

type ResolveDialogProps = {
	open: boolean
	ticket: SupportTicket | null
	onClose: () => void
	onResolved: (updated: SupportTicket) => void
}

export function ResolveDialog({ open, ticket, onClose, onResolved }: ResolveDialogProps) {
	const [resolution, setResolution] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const charCount = resolution.trim().length
	const isValid = charCount >= 10 && charCount <= 2000

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!ticket || !isValid || submitting) return
		setSubmitting(true)
		setError(null)
		try {
			const updated = await resolveTicket(ticket.id, resolution.trim())
			onResolved(updated)
			setResolution("")
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			setError(
				status === 400
					? "This ticket is already resolved or closed."
					: "Failed to resolve ticket. Please try again.",
			)
		} finally {
			setSubmitting(false)
		}
	}

	function handleClose() {
		if (submitting) return
		setResolution("")
		setError(null)
		onClose()
	}

	return (
		<Dialog.Root open={open} onOpenChange={v => !v && handleClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
				<Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface-card p-6 shadow-xl focus:outline-none">
					<Dialog.Title className="text-sm font-semibold text-text-primary">
						Resolve Ticket
					</Dialog.Title>
					<Dialog.Description className="mt-1 text-xs text-text-secondary">
						{ticket?.ticketNumber} — provide a resolution note that will be recorded against this ticket.
					</Dialog.Description>

					<form onSubmit={handleSubmit} className="mt-4 space-y-3">
						<div>
							<textarea
								value={resolution}
								onChange={e => setResolution(e.target.value)}
								placeholder="Describe what action was taken, the root cause, and any follow-up the reporter should expect…"
								rows={5}
								maxLength={2000}
								className="w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-action-primary/30 resize-none"
							/>
							<p className={`mt-1 text-right text-[11px] ${charCount > 2000 ? "text-red-500" : "text-text-tertiary"}`}>
								{charCount} / 2000 {charCount < 10 && charCount > 0 && <span className="text-amber-500">(min 10)</span>}
							</p>
						</div>

						{error && <p className="text-[11px] text-red-500">{error}</p>}

						<div className="flex items-center justify-end gap-3 pt-1">
							<button
								type="button"
								onClick={handleClose}
								disabled={submitting}
								className="rounded-action border border-border-default px-4 py-2 text-xs font-semibold text-text-primary hover:bg-action-secondary-hover transition-colors disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={!isValid || submitting}
								className="flex items-center gap-1.5 rounded-action bg-action-primary px-4 py-2 text-xs font-semibold text-white hover:bg-action-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{submitting && <Loader2 size={13} className="animate-spin" />}
								Mark Resolved
							</button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}

// ─── Close Dialog ─────────────────────────────────────────────────────────────

type CloseDialogProps = {
	open: boolean
	ticket: SupportTicket | null
	onClose: () => void
	onClosed: (updated: SupportTicket) => void
}

export function CloseDialog({ open, ticket, onClose, onClosed }: CloseDialogProps) {
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleConfirm() {
		if (!ticket || submitting) return
		setSubmitting(true)
		setError(null)
		try {
			const updated = await closeTicket(ticket.id)
			onClosed(updated)
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status
			setError(
				status === 400
					? "This ticket is already closed."
					: "Failed to close ticket. Please try again.",
			)
			setSubmitting(false)
		}
	}

	function handleClose() {
		if (submitting) return
		setError(null)
		onClose()
	}

	return (
		<>
			<ConfirmDialog
				open={open && !error}
				onClose={handleClose}
				onConfirm={handleConfirm}
				title="Close Ticket"
				description={`Close ${ticket?.ticketNumber ?? "this ticket"}? This is a terminal state — the ticket cannot be reopened or reassigned once closed.`}
				confirmLabel="Close Ticket"
				destructive
				isLoading={submitting}
			/>
			{/* Error fallback shown as a separate dialog */}
			{error && (
				<ConfirmDialog
					open
					onClose={handleClose}
					onConfirm={handleClose}
					title="Could Not Close Ticket"
					description={error}
					confirmLabel="OK"
					cancelLabel=""
				/>
			)}
		</>
	)
}
