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
	FileEdit,
	ShieldCheck,
	Tag,
	UserCircle,
	LayoutGrid,
	ShoppingBag,
	ScrollText,
	Star,
	Sparkles,
	Users,
	LifeBuoy,
	Settings,
	HandCoins,
	BadgeCheck,
	ChevronDown,
	ChevronRight,
	Megaphone,
	MessagesSquare,
	Handshake,
	Headset,
	Rocket,
	type LucideIcon,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"
import { useUIStore } from "@/stores/ui.store"
import { cn } from "@/lib/utils"
import { useSidebarBadgeCounts, type SidebarBadgeKey } from "@/lib/hooks/use-sidebar-badges"
import type { Permission } from "@/types"
import { useState, useEffect } from "react"

// Nav config

type SubItem = {
	label: string
	href: string
	permission?: Permission
	exact?: boolean
	badgeKey?: SidebarBadgeKey
	icon?: LucideIcon
}

type NavItem = {
	label: string
	href?: string
	icon: LucideIcon
	permission?: Permission
	exact?: boolean
	badgeKey?: SidebarBadgeKey
	subItems?: SubItem[]
}

const NAV: NavItem[] = [
	{
		label: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
		exact: true,
	},
	{
		label: "Communities",
		icon: BadgeCheck,
		subItems: [
			{
				label: "Community Profile Queue",
				href: "/community-profiles/queue",
				permission: "communityProfile.approve",
				badgeKey: "communityProfileQueue",
			},
			{
				label: "Community Profile Revisions",
				href: "/community-profiles/revisions",
				permission: "communityProfile.approve",
				badgeKey: "communityProfileRevisions",
			},
			{
				label: "All Community Profiles",
				href: "/community-profiles",
				permission: "communityProfile.approve",
				exact: true,
			},
			{
				label: "Community Reps",
				href: "/hosts",
				permission: "host.approve",
				exact: true,
			},
		],
	},
	{
		label: "Sponsorships",
		icon: HandCoins,
		subItems: [
			{
				label: "Sponsorship Queue",
				href: "/sponsorships/queue",
				permission: "sponsorship.approve",
				badgeKey: "sponsorshipQueue",
			},
			{
				label: "All Sponsorships",
				href: "/sponsorships",
				permission: "sponsorship.approve",
				exact: true,
			},
			{
				label: "Revisions",
				href: "/sponsorships/revisions",
				permission: "sponsorship.approve",
				badgeKey: "sponsorshipRevisions",
			},
		],
	},
	{
		label: "Deals",
		icon: Handshake,
		subItems: [
			{
				label: "Sponsorship Deals",
				href: "/sponsorship-deals",
			},
			{
				label: "Campaign Deals",
				href: "/campaign-deals",
			},
			{
				label: "Payments",
				href: "/sponsorship-payments",
			},
		],
	},
	{
		label: "Brands",
		icon: Sparkles,
		subItems: [
			{
				label: "Brand Queue",
				href: "/brands/queue",
				permission: "sponsorship.approve",
				badgeKey: "brandQueue",
			},
			{
				label: "All Brands",
				href: "/brands",
				permission: "sponsorship.approve",
				exact: true,
			},
			{
				label: "Brand Interests",
				href: "/brands/interests",
				permission: "sponsorship.approve",
			},
		],
	},
	{
		label: "Campaigns",
		icon: Rocket,
		subItems: [
			{
				label: "Campaign Queue",
				href: "/campaigns/queue",
				permission: "sponsorship.approve",
				badgeKey: "campaignQueue",
			},
			{
				label: "All Campaigns",
				href: "/campaigns",
				permission: "sponsorship.approve",
				exact: true,
			},
		],
	},
	{
		label: "Chats",
		icon: MessagesSquare,
		subItems: [
			{
				label: "Ongoing Chats",
				href: "/sponsorship-chats",
				badgeKey: "pendingChats",
				icon: MessagesSquare,
			},
			{
				label: "Meetday Chats",
				href: "/meetday-chats",
				badgeKey: "meetdayChats",
				icon: Headset,
			},
		],
	},
]

const BOTTOM_NAV: NavItem[] = [
	{
		label: "Announcements",
		href: "/announcements",
		icon: Megaphone,
	},
	{
		label: "Audit Logs",
		href: "/audit-logs",
		icon: ScrollText,
		permission: "audit.read",
	},
	{
		label: "Support Tickets",
		href: "/support-tickets",
		icon: LifeBuoy,
		permission: "support.view",
		badgeKey: "supportTickets",
	},
]

// Nav link

function NavBadge({ count, collapsed }: { count: number; collapsed: boolean }) {
	const display = count > 99 ? "99+" : count

	if (collapsed) {
		return (
			<span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FFC940] px-1 text-[9px] font-bold leading-none text-black">
				{display}
			</span>
		)
	}

	return (
		<span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#FFC940] px-1.5 text-[10px] font-bold leading-none text-black">
			{display}
		</span>
	)
}

function NavLink({
	label,
	href,
	icon: Icon,
	active,
	collapsed,
	onNavigate,
	badgeCount,
	isSubItem = false,
}: {
	label: string
	href: string
	icon?: LucideIcon
	active: boolean
	collapsed: boolean
	onNavigate: () => void
	badgeCount?: number
	isSubItem?: boolean
}) {
	const showBadge = typeof badgeCount === "number" && badgeCount > 0

	const link = (
		<Link
			href={href}
			onClick={onNavigate}
			className={cn(
				"flex items-center gap-2.5 rounded-md text-sm font-normal transition-colors",
				collapsed ? "relative justify-center w-9 h-9 mx-auto" : isSubItem ? "pl-8 pr-3 py-1.5 mx-1 text-xs" : "px-3 py-2 mx-1",
				active
					? "bg-[#D12525] text-white font-medium"
					: "text-white/90 hover:bg-[#D12525]/50 hover:text-white",
			)}
		>
			{Icon && <Icon size={isSubItem ? 13 : 15} className="shrink-0" />}
			{!collapsed && (
				<span className="flex flex-1 items-center justify-between gap-2">
					{label}
					{showBadge && <NavBadge count={badgeCount} collapsed={false} />}
				</span>
			)}
			{collapsed && showBadge && <NavBadge count={badgeCount} collapsed />}
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
					{label}
					{showBadge && ` (${badgeCount > 99 ? "99+" : badgeCount})`}
				</Tooltip.Content>
			</Tooltip.Portal>
		</Tooltip.Root>
	)
}

// Sidebar

export function Sidebar() {
	const pathname = usePathname()
	const { hasPermission, user } = useAuthStore()
	const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUIStore()
	const badgeCounts = useSidebarBadgeCounts()
	const [expanded, setExpanded] = useState<Record<string, boolean>>({})

	const collapsed = sidebarCollapsed

	useEffect(() => {
		let activeLabel: string | undefined
		NAV.forEach((item) => {
			if (item.subItems) {
				const hasActiveSub = item.subItems.some((sub) => {
					if (sub.exact) return pathname === sub.href
					return pathname === sub.href || pathname.startsWith(sub.href + "/")
				})
				if (hasActiveSub) activeLabel = item.label
			}
		})
		if (activeLabel) {
			setExpanded({ [activeLabel]: true })
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname])

	function isActive(item: NavItem | SubItem) {
		if (item.exact) return pathname === item.href
		return pathname === item.href || pathname.startsWith(item.href + "/")
	}

	function canSee(permission?: Permission) {
		if (!permission) return true
		return hasPermission(permission)
	}

	function getParentBadgeCount(item: NavItem) {
		if (!item.subItems) return 0
		return item.subItems.reduce((acc, sub) => {
			const count = sub.badgeKey ? badgeCounts[sub.badgeKey] ?? 0 : 0
			return acc + count
		}, 0)
	}

	function toggleExpand(label: string) {
		setExpanded((prev) => {
			const isCurrentlyOpen = prev[label]
			// Close all groups, then open the clicked one (unless it was already open)
			const next: Record<string, boolean> = {}
			if (!isCurrentlyOpen) next[label] = true
			return next
		})
	}

	const initials = user?.name
		? user.name
				.split(" ")
				.map((w: string) => w[0])
				.join("")
				.slice(0, 2)
				.toUpperCase()
		: "?"

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
					"fixed inset-y-0 left-0 z-50 flex flex-col bg-[#EE2C2C] text-white border-none",
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
						"flex items-center justify-center h-14 shrink-0 border-none",
						collapsed ? "" : "px-5",
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
								style={{ filter: "brightness(0) invert(1)" }}
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
								style={{ filter: "brightness(0) invert(1)" }}
							/>
						</Link>
					)}
				</div>

				{/* Nav */}
				<nav className="flex-1 overflow-y-auto py-3 space-y-1">
					{NAV.map((item) => {
						// Filter sub-items by permission
						const visibleSubItems = item.subItems?.filter(sub => canSee(sub.permission))
						const hasVisibleSubs = visibleSubItems && visibleSubItems.length > 0

						if (!hasVisibleSubs && !item.href) return null
						if (!canSee(item.permission)) return null

						const badgeCount = item.badgeKey
							? badgeCounts[item.badgeKey]
							: getParentBadgeCount(item)

						// Render collapsible parent
						if (hasVisibleSubs) {
							const isExpanded = expanded[item.label]
							const hasActiveSub = visibleSubItems.some(sub => isActive(sub))
							const Icon = item.icon

							const header = (
								<button
									onClick={() => toggleExpand(item.label)}
									className={cn(
										"w-[calc(100%-8px)] flex items-center gap-2.5 rounded-md text-sm font-normal transition-colors text-left",
										collapsed ? "relative justify-center w-9 h-9 mx-auto" : "px-3 py-2 mx-1",
										hasActiveSub && !isExpanded
											? "bg-[#D12525]/60 text-white"
											: "text-white/90 hover:bg-[#D12525]/50 hover:text-white",
									)}
								>
									<Icon size={15} className="shrink-0" />
									{!collapsed && (
										<span className="flex flex-1 items-center justify-between gap-2">
											{item.label}
											<span className="flex items-center gap-1.5">
												{typeof badgeCount === "number" && badgeCount > 0 && (
													<NavBadge count={badgeCount} collapsed={false} />
												)}
												{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
											</span>
										</span>
									)}
									{collapsed && typeof badgeCount === "number" && badgeCount > 0 && (
										<NavBadge count={badgeCount} collapsed />
									)}
								</button>
							)

							return (
								<div key={item.label} className="space-y-0.5">
									{collapsed ? (
										<Tooltip.Root>
											<Tooltip.Trigger asChild>{header}</Tooltip.Trigger>
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
									) : (
										header
									)}

									{isExpanded && !collapsed && (
										<div className="space-y-0.5 transition-all">
											{visibleSubItems.map((sub) => (
												<NavLink
													key={sub.href}
													label={sub.label}
													href={sub.href}
													icon={sub.icon}
													active={isActive(sub)}
													collapsed={collapsed}
													onNavigate={() => setSidebarOpen(false)}
													badgeCount={sub.badgeKey ? badgeCounts[sub.badgeKey] : undefined}
													isSubItem={true}
												/>
											))}
										</div>
									)}
								</div>
							)
						}

						// Render simple single link
						return (
							<NavLink
								key={item.href}
								label={item.label}
								href={item.href!}
								icon={item.icon}
								active={isActive(item)}
								collapsed={collapsed}
								onNavigate={() => setSidebarOpen(false)}
								badgeCount={badgeCount}
							/>
						)
					})}
				</nav>

				{/* Fixed Bottom Navigation Links */}
				<div className={cn("border-t border-white/10 pt-2 space-y-1 shrink-0", collapsed ? "flex flex-col items-center pb-2" : "pb-1")}>
					{BOTTOM_NAV.filter(item => canSee(item.permission)).map((item) => {
						const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : undefined
						return (
							<NavLink
								key={item.href}
								label={item.label}
								href={item.href!}
								icon={item.icon}
								active={isActive(item)}
								collapsed={collapsed}
								onNavigate={() => setSidebarOpen(false)}
								badgeCount={badgeCount}
							/>
						)
					})}
				</div>

				{/* Bottom User Profile Button / Pill */}
				{user && (
					<div className={cn("border-t border-white/10 shrink-0", collapsed ? "py-4 flex justify-center" : "p-4")}>
						{collapsed ? (
							<Tooltip.Root>
								<Tooltip.Trigger asChild>
									<Link
										href="/profile"
										className="flex items-center justify-center size-10 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all select-none"
									>
										<div className="size-6 rounded-full bg-white border-2 border-black flex items-center justify-center shrink-0 font-bold text-[10px] text-black">
											{initials}
										</div>
									</Link>
								</Tooltip.Trigger>
								<Tooltip.Portal>
									<Tooltip.Content
										side="right"
										sideOffset={10}
										className="z-50 rounded-md bg-text-primary px-2.5 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95"
									>
										My Profile
									</Tooltip.Content>
								</Tooltip.Portal>
							</Tooltip.Root>
						) : (
							<Link
								href="/profile"
								onClick={() => setSidebarOpen(false)}
								className="flex items-center gap-2.5 px-4 py-2.5 bg-[#FFC940] text-black border-[3px] border-black rounded-2xl font-semibold text-sm tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all select-none relative overflow-hidden"
							>
								<div className="size-7 rounded-full bg-white border-2 border-black flex items-center justify-center shrink-0 font-bold text-xs text-black">
									{initials}
								</div>
								<span className="flex-1 truncate">{user.name}</span>
								<div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/20 skew-x-[25deg] pointer-events-none" />
							</Link>
						)}
					</div>
				)}
			</aside>
		</>
	)
}

