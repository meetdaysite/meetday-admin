"use client"

import Link from "next/link"
import Image from "next/image"
import { Sidebar } from "./sidebar"
import { useAuthInit } from "@/lib/hooks/use-auth-init"
import { usePresenceSocket } from "@/lib/hooks/use-presence-socket"
import { useAuthStore } from "@/stores/auth.store"
import { SkeletonDashboardShell } from "@/components/ui/skeleton"
import { useUIStore } from "@/stores/ui.store"
import { Menu } from "lucide-react"

export function DashboardShell({ children }: { children: React.ReactNode }) {
	useAuthInit()
	usePresenceSocket()
	const isInitializing = useAuthStore((s) => s.isInitializing)
	const role = useAuthStore((s) => s.role)
	const { sidebarOpen, setSidebarOpen } = useUIStore()

	const homeHref = role === "MODERATOR" ? "/sponsorship-chats" : "/dashboard"

	if (isInitializing) {
		return <SkeletonDashboardShell />
	}

	return (
		<div className="min-h-screen flex bg-[#EE2C2C] p-2 sm:p-4 gap-2 sm:gap-4 overflow-hidden h-screen">
			<Sidebar />
			<div className="flex-1 flex flex-col min-w-0 bg-white rounded-[24px] sm:rounded-[36px] overflow-hidden h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)]">
				{/* Mobile top bar */}
				<header className="lg:hidden shrink-0 relative flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-b border-black/10 min-h-[52px]">
					{/* Navbar Button on the Left */}
					<button
						onClick={() => setSidebarOpen(!sidebarOpen)}
						className="text-black p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer z-10"
						aria-label="Open navigation menu"
					>
						<Menu size={22} />
					</button>

					{/* Centered Clickable Meetday Logo */}
					<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
						<Link
							href={homeHref}
							className="pointer-events-auto flex items-center justify-center hover:opacity-85 transition-opacity py-1"
							aria-label="Go to Dashboard"
						>
							<Image
								src="/brand_logo.svg"
								alt="Meetday"
								width={120}
								height={32}
								className="h-7.5 sm:h-8 w-auto object-contain"
								priority
							/>
						</Link>
					</div>

					{/* Right Spacer for balanced centering */}
					<div className="w-8 h-8 pointer-events-none" />
				</header>

				<main className="flex-1 overflow-y-auto min-h-0 flex flex-col w-full">{children}</main>
			</div>
		</div>
	)
}
