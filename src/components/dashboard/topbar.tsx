"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { useUIStore } from "@/stores/ui.store"

const ROUTE_LABELS: Record<string, string> = {
	"/dashboard": "Dashboard",
	"/admins": "Admins",
	"/hosts": "Hosts",
	"/hosts/queue": "Host Queue",
	"/hosts/invite": "Invite Host",
	"/hosts/invite/bulk": "Bulk Invite",
	"/events": "Events",
	"/events/queue": "Event Queue",
	"/coupons": "Coupons",
	"/coupons/new": "New Coupon",
}

function getPageTitle(pathname: string): string {
	// Try exact match first, then try stripping trailing segment for dynamic routes
	if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
	const parent = pathname.split("/").slice(0, -1).join("/")
	if (ROUTE_LABELS[parent]) return ROUTE_LABELS[parent]
	return "Meetday Admin"
}

export function Topbar() {
	const pathname = usePathname()
	const { sidebarOpen, setSidebarOpen } = useUIStore()

	return (
		<header className="h-14 flex-shrink-0 flex items-center gap-3 px-4 sm:px-6 bg-white border-b border-neutral-200">
			{/* Mobile hamburger */}
			<button
				onClick={() => setSidebarOpen(!sidebarOpen)}
				className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-neutral-dark hover:bg-neutral-100 hover:text-foreground transition-colors"
				aria-label="Toggle sidebar"
			>
				<Menu size={18} />
			</button>

			{/* Page title */}
			<h1 className="text-sm font-semibold text-foreground tracking-tight">
				{getPageTitle(pathname)}
			</h1>
		</header>
	)
}
