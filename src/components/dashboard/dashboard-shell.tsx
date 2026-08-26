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
		<div className="min-h-screen flex bg-[#EE2C2C] p-0 lg:p-4 gap-0 lg:gap-4 overflow-hidden h-[100dvh]">
			<Sidebar />
			<div className="flex-1 flex flex-col min-w-0 bg-white lg:rounded-[36px] overflow-hidden h-full lg:h-[calc(100vh-2rem)]">
				{/* Mobile top bar */}
				<header className="lg:hidden shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-black/10">
					<span className="text-sm font-black text-[#EE2C2C] tracking-tight">Meetday Admin</span>
					<button
						onClick={() => setSidebarOpen(!sidebarOpen)}
						className="text-black p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
						aria-label="Open navigation menu"
					>
						<Menu size={20} />
					</button>
				</header>

				<main className="flex-1 overflow-y-auto min-h-0 flex flex-col">{children}</main>
			</div>
		</div>
	)
}
