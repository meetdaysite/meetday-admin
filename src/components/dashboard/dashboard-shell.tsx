"use client"

import { Sidebar } from "./sidebar"
import { useAuthInit } from "@/lib/hooks/use-auth-init"
import { useAuthStore } from "@/stores/auth.store"
import { SkeletonDashboardShell } from "@/components/ui/skeleton"
import { useUIStore } from "@/stores/ui.store"
import { Menu } from "lucide-react"

export function DashboardShell({ children }: { children: React.ReactNode }) {
	useAuthInit()
	const isInitializing = useAuthStore((s) => s.isInitializing)
	const { sidebarOpen, setSidebarOpen } = useUIStore()

	if (isInitializing) {
		return <SkeletonDashboardShell />
	}

	return (
		<div className="min-h-screen flex bg-[#EE2C2C] p-4 gap-4 overflow-hidden h-screen">
			<Sidebar />
			<div className="flex-1 flex flex-col min-w-0 bg-white rounded-[36px] overflow-hidden h-[calc(100vh-2rem)]">
				{/* Mobile top bar */}
				<header className="lg:hidden shrink-0 flex items-center justify-between px-4 py-3 bg-surface-card border-b border-border-default">
					<span className="text-sm font-bold text-[#EE2C2C]">Meetday Admin</span>
					<button
						onClick={() => setSidebarOpen(!sidebarOpen)}
						className="text-text-primary p-1.5 rounded hover:bg-neutral-100 transition-colors"
						aria-label="Open navigation menu"
					>
						<Menu size={18} />
					</button>
				</header>

				<main className="flex-1 overflow-y-auto mr-2 my-2 px-8 py-10">{children}</main>
			</div>
		</div>
	)
}
