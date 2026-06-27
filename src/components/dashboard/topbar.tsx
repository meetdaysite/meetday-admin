"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, ChevronsLeft, ChevronsRight, LogOut } from "lucide-react"
import * as Tooltip from "@radix-ui/react-tooltip"
import { useUIStore } from "@/stores/ui.store"
import { useAuthStore } from "@/stores/auth.store"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export function Topbar() {
	const router = useRouter()
	const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUIStore()
	const { user, clearAuth } = useAuthStore()
	const [confirmOpen, setConfirmOpen] = useState(false)

	function handleSignOut() {
		clearAuth()
		router.push("/login")
	}

	const initials = user?.name
		? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
		: "?"

	return (
		<>
		<header className="h-14 shrink-0 flex items-center gap-2 px-4 bg-surface-canvas border-b border-border-default">
			{/* Mobile hamburger */}
			<button
				onClick={() => setSidebarOpen(!sidebarOpen)}
				className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-neutral-100 transition-colors"
				aria-label="Toggle sidebar"
			>
				<Menu size={18} />
			</button>

			{/* Desktop collapse toggle */}
			<Tooltip.Root>
				<Tooltip.Trigger asChild>
					<button
						onClick={toggleSidebarCollapsed}
						className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md text-text-tertiary hover:bg-neutral-100 hover:text-text-secondary transition-colors"
						aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
					>
						{sidebarCollapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
					</button>
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="bottom"
						sideOffset={6}
						className="z-50 rounded-md bg-text-primary px-2.5 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95"
					>
						{sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			{/* Spacer */}
			<div className="flex-1" />

			{/* User info + logout */}
			<div className="flex items-center gap-2">
				<div className="hidden sm:flex flex-col items-end leading-none">
					<span className="text-xs font-medium text-text-primary">{user?.name ?? "Admin"}</span>
					{user?.email && (
						<span className="text-[10px] text-text-tertiary mt-0.5">{user.email}</span>
					)}
				</div>
				<div className="w-7 h-7 rounded-full bg-action-primary text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
					{initials}
				</div>
				<Tooltip.Root>
					<Tooltip.Trigger asChild>
						<button
							onClick={() => setConfirmOpen(true)}
							className="flex items-center justify-center w-8 h-8 rounded-md text-text-tertiary hover:bg-neutral-100 hover:text-text-brand transition-colors"
							aria-label="Sign out"
						>
							<LogOut size={15} />
						</button>
					</Tooltip.Trigger>
					<Tooltip.Portal>
						<Tooltip.Content
							side="bottom"
							sideOffset={6}
							className="z-50 rounded-md bg-text-primary px-2.5 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95"
						>
							Sign out
						</Tooltip.Content>
					</Tooltip.Portal>
				</Tooltip.Root>
			</div>
		</header>

		<ConfirmDialog
			open={confirmOpen}
			onClose={() => setConfirmOpen(false)}
			onConfirm={handleSignOut}
			title="Sign out"
			description="Are you sure you want to sign out?"
			confirmLabel="Sign out"
		/>
		</>
	)
}
