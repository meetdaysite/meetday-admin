"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as Tooltip from "@radix-ui/react-tooltip"
import {
	LayoutDashboard,
	Clock,
	CalendarDays,
	ShieldCheck,
	Tag,
	UserCircle,
	type LucideIcon,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"
import { useUIStore } from "@/stores/ui.store"
import { cn } from "@/lib/utils"
import type { Permission } from "@/types"

// ─── Nav config ───────────────────────────────────────────────────────────────

type NavItem = {
	label: string
	href: string
	icon: LucideIcon
	permission?: Permission
}

type NavSection = {
	title?: string
	items: NavItem[]
}

const NAV: NavSection[] = [
	{
		items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
	},
	{
		title: "Hosts",
		items: [
			{ label: "Hosts", href: "/hosts/queue", icon: Clock, permission: "host.approve" },
		],
	},
	{
		title: "Events",
		items: [
			{ label: "Event Queue", href: "/events/queue", icon: CalendarDays, permission: "event.approve" },
		],
	},
	{
		title: "Management",
		items: [
			{ label: "Admins", href: "/admins", icon: ShieldCheck, permission: "admin.invite" },
			{ label: "Coupons", href: "/coupons", icon: Tag, permission: "coupon.view" },
		],
	},
	{
		title: "Account",
		items: [{ label: "My Profile", href: "/profile", icon: UserCircle }],
	},
]

// ─── Nav link ─────────────────────────────────────────────────────────────────

function NavLink({
	item,
	active,
	collapsed,
	onNavigate,
}: {
	item: NavItem
	active: boolean
	collapsed: boolean
	onNavigate: () => void
}) {
	const Icon = item.icon

	const link = (
		<Link
			href={item.href}
			onClick={onNavigate}
			className={cn(
				"flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors",
				collapsed ? "justify-center w-9 h-9 mx-auto" : "px-3 py-2 mx-1",
				active
					? "bg-brand-red/10 text-brand-red"
					: "text-neutral-dark hover:bg-neutral-100 hover:text-foreground",
			)}
		>
			<Icon size={15} className="shrink-0" />
			{!collapsed && <span>{item.label}</span>}
		</Link>
	)

	if (!collapsed) return link

	return (
		<Tooltip.Root>
			<Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
			<Tooltip.Portal>
				<Tooltip.Content
					side="right"
					sideOffset={10}
					className="z-50 rounded-md bg-foreground px-2.5 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95"
				>
					{item.label}
				</Tooltip.Content>
			</Tooltip.Portal>
		</Tooltip.Root>
	)
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
	const pathname = usePathname()
	const { hasPermission } = useAuthStore()
	const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUIStore()

	const collapsed = sidebarCollapsed

	function isActive(href: string) {
		return pathname === href || pathname.startsWith(href + "/")
	}

	function canSee(permission?: Permission) {
		if (!permission) return true
		return hasPermission(permission)
	}

	return (
		<>
			{/* Mobile backdrop */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Sidebar panel */}
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-neutral-200",
					"transition-[width,transform] duration-200 ease-in-out",
					"lg:relative lg:translate-x-0",
					collapsed ? "lg:w-17" : "lg:w-60",
					"w-60",
					sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
				)}
			>
				{/* Logo */}
				<div
					className={cn(
						"flex items-center h-14 shrink-0 border-b border-neutral-200",
						collapsed ? "justify-center" : "px-5",
					)}
				>
					{collapsed ? (
						<Link
							href="/dashboard"
							className="w-8 h-8 rounded-md bg-brand-red flex items-center justify-center shrink-0"
						>
							<span className="font-hagrid text-white text-sm font-extrabold leading-none">M</span>
						</Link>
					) : (
						<Link href="/dashboard" className="flex items-baseline gap-2 min-w-0">
							<span className="font-hagrid text-foreground text-lg font-extrabold tracking-tight">
								meetday
							</span>
							<span className="text-neutral-light text-[10px] font-medium tracking-[0.18em] uppercase">
								admin
							</span>
						</Link>
					)}
				</div>

				{/* Nav */}
				<nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
					{NAV.map((section, si) => {
						const visible = section.items.filter(item => canSee(item.permission))
						if (visible.length === 0) return null

						return (
							<div key={si} className={si > 0 ? "mt-3" : undefined}>
								{!collapsed && section.title && (
									<p className="px-4 pb-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-neutral-light">
										{section.title}
									</p>
								)}
								{collapsed && si > 0 && (
									<div className="mx-auto w-5 h-px bg-neutral-200 mb-3" />
								)}
								<div className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
									{visible.map(item => (
										<NavLink
											key={item.href}
											item={item}
											active={isActive(item.href)}
											collapsed={collapsed}
											onNavigate={() => setSidebarOpen(false)}
										/>
									))}
								</div>
							</div>
						)
					})}
				</nav>
			</aside>
		</>
	)
}
