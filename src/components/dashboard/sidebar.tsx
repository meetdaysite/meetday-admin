"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as Tooltip from "@radix-ui/react-tooltip"
import {
	LayoutDashboard,
	Clock,
	CalendarDays,
	CalendarRange,
	ShieldCheck,
	Tag,
	UserCircle,
	LayoutGrid,
	ShoppingBag,
	ScrollText,
	Star,
	Sparkles,
	Users,
	type LucideIcon,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"
import { useUIStore } from "@/stores/ui.store"
import { cn } from "@/lib/utils"
import type { Permission } from "@/types"

// Nav config

type NavItem = {
	label: string
	href: string
	icon: LucideIcon
	permission?: Permission
	exact?: boolean
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
			{ label: "Host Queue", href: "/hosts/queue", icon: Clock, permission: "host.approve" },
			{ label: "All Hosts", href: "/hosts", icon: Users, permission: "host.approve", exact: true },
		],
	},
	{
		title: "Events",
		items: [
			{ label: "Event Queue", href: "/events/queue", icon: CalendarDays, permission: "event.approve" },
			{
				label: "All Events",
				href: "/events",
				icon: CalendarRange,
				permission: "event.approve",
				exact: true,
			},
		],
	},
	{
		title: "Communities",
		items: [
			{
				label: "All Communities",
				href: "/communities",
				icon: Users,
				permission: "community.manage",
				exact: true,
			},
		],
	},
	{
		title: "Management",
		items: [
			{ label: "Admins", href: "/admins", icon: ShieldCheck, permission: "admin.invite" },
			{ label: "Coupons", href: "/coupons", icon: Tag, permission: "coupon.view" },
			{ label: "Categories", href: "/categories", icon: LayoutGrid, permission: "category.manage" },
			{ label: "Interests", href: "/interests", icon: Sparkles, permission: "interest.manage" },
			{ label: "Orders", href: "/orders", icon: ShoppingBag, permission: "order.view" },
		],
	},
	{
		title: "Moderation",
		items: [
			{ label: "Reviews", href: "/reviews", icon: Star, permission: "moderation.read" },
			{ label: "Audit Logs", href: "/audit-logs", icon: ScrollText, permission: "audit.read" },
		],
	},
	{
		title: "Account",
		items: [{ label: "My Profile", href: "/profile", icon: UserCircle }],
	},
]

// Nav link

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
					? "bg-surface-brand-soft text-text-brand"
					: "text-text-primary hover:bg-surface-brand-soft hover:text-text-brand",
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
					className="z-50 rounded-md bg-text-primary px-2.5 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95"
				>
					{item.label}
				</Tooltip.Content>
			</Tooltip.Portal>
		</Tooltip.Root>
	)
}

// Sidebar

export function Sidebar() {
	const pathname = usePathname()
	const { hasPermission } = useAuthStore()
	const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUIStore()

	const collapsed = sidebarCollapsed

	function isActive(item: NavItem) {
		if (item.exact) return pathname === item.href
		return pathname === item.href || pathname.startsWith(item.href + "/")
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
					"fixed inset-y-0 left-0 z-50 flex flex-col bg-surface-canvas border-r border-border-default",
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
						"flex items-center h-14 shrink-0 border-b border-border-default",
						collapsed ? "justify-center" : "px-5",
					)}
				>
					{collapsed ? (
						<Link href="/dashboard" className="shrink-0">
							<Image
								src="/favicon.ico"
								alt="Meetday"
								width={30}
								height={30}
								className="object-contain"
							/>
						</Link>
					) : (
						<Link href="/dashboard" className="min-w-0">
							<Image
								src="/brand_logo.svg"
								alt="Meetday"
								width={120}
								height={32}
								className="object-contain"
							/>
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
									<p className="px-4 pb-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted">
										{section.title}
									</p>
								)}
								{collapsed && si > 0 && (
									<div className="mx-auto w-5 h-px bg-border-default mb-3" />
								)}
								<div className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
									{visible.map(item => (
										<NavLink
											key={item.href}
											item={item}
											active={isActive(item)}
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
