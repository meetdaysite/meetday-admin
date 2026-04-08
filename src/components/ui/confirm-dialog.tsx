"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmDialogProps = {
	open: boolean
	onClose: () => void
	onConfirm: () => void
	title: string
	description: string
	confirmLabel?: string
	cancelLabel?: string
	destructive?: boolean
	isLoading?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConfirmDialog({
	open,
	onClose,
	onConfirm,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	destructive = false,
	isLoading = false,
}: ConfirmDialogProps) {
	return (
		<Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
				<Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl focus:outline-none">
					<Dialog.Title className="text-sm font-semibold text-foreground">
						{title}
					</Dialog.Title>
					<Dialog.Description className="mt-2 text-sm text-neutral-dark leading-relaxed">
						{description}
					</Dialog.Description>

					<div className="mt-6 flex items-center justify-end gap-3">
						<button
							onClick={onClose}
							disabled={isLoading}
							className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors disabled:opacity-50"
						>
							{cancelLabel}
						</button>
						<button
							onClick={onConfirm}
							disabled={isLoading}
							className={cn(
								"flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-70",
								destructive
									? "bg-red-600 hover:bg-red-700"
									: "bg-brand-red hover:bg-brand-red-deep",
							)}
						>
							{isLoading && <Loader2 size={13} className="animate-spin" />}
							{confirmLabel}
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
