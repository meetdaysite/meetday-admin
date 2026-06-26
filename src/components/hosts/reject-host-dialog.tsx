"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { Loader2 } from "lucide-react"
import { useState } from "react"

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type RejectHostDialogProps = {
	open: boolean
	onClose: () => void
	/** Async â€” reject and re-throw on API error so the dialog stays open */
	onConfirm: (reason: string) => Promise<void>
	hostName: string
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function RejectHostDialog({
	open,
	onClose,
	onConfirm,
	hostName,
}: RejectHostDialogProps) {
	const [reason, setReason] = useState("")
	const [isLoading, setIsLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!reason.trim()) return
		setIsLoading(true)
		try {
			await onConfirm(reason.trim())
			setReason("")
		} finally {
			setIsLoading(false)
		}
	}

	function handleClose() {
		if (isLoading) return
		setReason("")
		onClose()
	}

	return (
		<Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-60 bg-black/40" />
				<Dialog.Content className="fixed left-1/2 top-1/2 z-60 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface-card p-6 shadow-xl focus:outline-none">
					<Dialog.Title className="text-sm font-semibold text-text-primary">
						Reject Host
					</Dialog.Title>
					<Dialog.Description className="mt-1.5 text-xs text-text-secondary leading-relaxed">
						Provide a reason for rejecting{" "}
						<span className="font-medium text-text-primary">{hostName}</span>. This will
						be stored and shown to the host.
					</Dialog.Description>

					<form onSubmit={handleSubmit} className="mt-4 space-y-4">
						<div>
							<label className="block text-[11px] font-semibold text-text-secondary mb-1.5">
								Rejection reason{" "}
								<span className="text-red-500" aria-hidden>*</span>
							</label>
							<textarea
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="e.g. KYC documents are incomplete or unclear…"
								rows={4}
								disabled={isLoading}
								autoFocus
								className="w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors resize-none disabled:opacity-50"
							/>
						</div>

						<div className="flex items-center justify-end gap-3">
							<button
								type="button"
								onClick={handleClose}
								disabled={isLoading}
								className="rounded-lg border border-border-default px-4 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isLoading || !reason.trim()}
								className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading && <Loader2 size={13} className="animate-spin" />}
								Reject Host
							</button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
