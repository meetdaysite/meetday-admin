"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { AnimatePresence, motion } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrawerProps = {
	open: boolean
	onClose: () => void
	title: string
	description?: string
	children: React.ReactNode
	width?: string
}

// ─── Drawer footer ────────────────────────────────────────────────────────────

export function DrawerFooter({
	className,
	children,
}: {
	className?: string
	children: React.ReactNode
}) {
	return (
		<div
			className={cn(
				"flex items-center justify-end gap-3 border-t border-border-subtle py-4 shrink-0 mt-6",
				className,
			)}
		>
			{children}
		</div>
	)
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export function Drawer({
	open,
	onClose,
	title,
	description,
	children,
	width = "max-w-md",
}: DrawerProps) {
	return (
		<Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
			<Dialog.Portal>
				<AnimatePresence>
					{open && (
						<>
							<Dialog.Overlay asChild forceMount>
								<motion.div
									className="fixed inset-0 z-50 bg-black/40"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.2 }}
								/>
							</Dialog.Overlay>

							<Dialog.Content asChild forceMount>
								<motion.div
									className={cn(
										"fixed right-0 inset-y-0 z-50 flex flex-col bg-surface-canvas shadow-2xl w-full",
										width,
									)}
									initial={{ x: "100%" }}
									animate={{ x: 0 }}
									exit={{ x: "100%" }}
									transition={{ type: "spring", damping: 30, stiffness: 300 }}
								>
									{/* Header */}
									<div className="flex items-start justify-between border-b border-border-subtle px-6 py-5 shrink-0">
										<div>
											<Dialog.Title className="text-heading-sm font-semibold text-text-primary">
												{title}
											</Dialog.Title>
											{description && (
												<Dialog.Description className="mt-1 text-label-md text-text-tertiary">
													{description}
												</Dialog.Description>
											)}
										</div>
										<button
											onClick={onClose}
											className="rounded-action p-1.5 text-icon-primary hover:bg-surface-card-muted hover:text-icon-primary transition-colors"
											aria-label="Close drawer"
										>
											<X size={16} />
										</button>
									</div>

									{/* Body */}
									<div className="flex-1 overflow-y-auto px-6 py-5">
										{children}
									</div>
								</motion.div>
							</Dialog.Content>
						</>
					)}
				</AnimatePresence>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
