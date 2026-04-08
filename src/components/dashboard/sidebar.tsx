"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as Tooltip from "@radix-ui/react-tooltip"
import {
	LayoutDashboard,
	Clock,
	UserPlus,
	CalendarDays,
	ShieldCheck,
	Tag,
	Globe,
	MapPin,
	ChevronsLeft,
	ChevronsRight,
	LogOut,
	type LucideIcon,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"
import { useUIStore } from "@/stores/ui.store"
import { cn } from "@/lib/utils"
import type { Permission, Role } from "@/types"

// ─── Nav config ──────────────────────────────────────────────────────────────

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
			{ label: "Host Queue", href: "/hosts/queue", icon: Clock, permission: "host.approve" },
			{ label: "Invite Host", href: "/hosts/invite", icon: UserPlus, permission: "host.invite" },
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
]

// ─── Nav link ────────────────────────────────────────────────────────────────

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
			<Icon size={15} className="flex-shrink-0" />
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

// ─── City scope badge ─────────────────────────────────────────────────────────

function CityScopeBadge({
	cityScope,
	collapsed,
}: {
	cityScope: string | null
	role: Role | null
	collapsed: boolean
}) {
	const label = cityScope ?? "Global"
	const isGlobal = !cityScope
	const Icon = isGlobal ? Globe : MapPin

	if (collapsed) {
		return (
			<Tooltip.Root>
				<Tooltip.Trigger asChild>
					<div className="flex justify-center cursor-default">
						<div className="w-9 h-9 rounded-md bg-brand-red/10 flex items-center justify-center">
							<Icon size={14} className="text-brand-red" />
						</div>
					</div>
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="right"
						sideOffset={10}
						className="z-50 rounded-md bg-foreground px-2.5 py-1.5 text-xs text-white shadow-md"
					>
						Scope: {label}
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		)
	}

	return (
		<div className="flex items-center gap-2 px-2 py-1.5 mx-1 rounded-md bg-brand-red/5">
			<Icon size={13} className="text-brand-red flex-shrink-0" />
			<div className="min-w-0">
				<p className="text-[10px] font-medium text-neutral-light uppercase tracking-wider leading-none mb-0.5">
					Scope
				</p>
				<p className="text-xs font-medium text-foreground truncate">{label}</p>
			</div>
		</div>
	)
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({
	name,
	email,
	initials,
	collapsed,
	onSignOut,
}: {
	name: string
	email: string
	initials: string
	collapsed: boolean
	onSignOut: () => void
}) {
	if (collapsed) {
		return (
			<Tooltip.Root>
				<Tooltip.Trigger asChild>
					<button
						onClick={onSignOut}
						className="flex justify-center w-full group"
						title="Sign out"
					>
						<div className="w-9 h-9 rounded-full bg-brand-red text-white text-xs font-semibold flex items-center justify-center group-hover:bg-brand-red-deep transition-colors">
							{initials}
						</div>
					</button>
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="right"
						sideOffset={10}
						className="z-50 rounded-md bg-foreground px-2.5 py-1.5 text-xs text-white shadow-md"
					>
						{name} — Sign out
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		)
	}

	return (
		<div className="flex items-center gap-2.5 px-2 py-1.5 mx-1 rounded-md hover:bg-neutral-100 group transition-colors">
			<div className="w-7 h-7 rounded-full bg-brand-red text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
				{initials}
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-xs font-medium text-foreground truncate leading-none mb-0.5">{name}</p>
				<p className="text-[10px] text-neutral-light truncate leading-none">{email}</p>
			</div>
			<button
				onClick={onSignOut}
				className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-light hover:text-brand-red"
				title="Sign out"
			>
				<LogOut size={13} />
			</button>
		</div>
	)
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
	const pathname = usePathname()
	const router = useRouter()
	const { user, role, cityScope, clearAuth, hasPermission } = useAuthStore()
	const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUIStore()

	const collapsed = sidebarCollapsed

	function isActive(href: string) {
		return pathname === href || pathname.startsWith(href + "/")
	}

	function canSee(permission?: Permission) {
		if (!permission) return true
		return hasPermission(permission)
	}

	function handleSignOut() {
		clearAuth()
		router.push("/login")
	}

	const initials = user?.name
		? user.name
				.split(" ")
				.map(w => w[0])
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
					"fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-neutral-200",
					"transition-[width,transform] duration-200 ease-in-out",
					// Desktop
					"lg:relative lg:translate-x-0",
					collapsed ? "lg:w-[68px]" : "lg:w-60",
					// Mobile — always full width, translate in/out
					"w-60",
					sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
				)}
			>
				{/* Logo */}
				<div
					className={cn(
						"flex items-center h-14 flex-shrink-0 border-b border-neutral-200",
						collapsed ? "justify-center" : "px-5",
					)}
				>
					{collapsed ? (
						<Link
							href="/dashboard"
							className="w-8 h-8 rounded-md bg-brand-red flex items-center justify-center flex-shrink-0"
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
								{/* Section header */}
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

				{/* Bottom section */}
				<div className="flex-shrink-0 border-t border-neutral-200 pt-2 pb-3 space-y-1.5">
					<CityScopeBadge cityScope={cityScope} role={role} collapsed={collapsed} />
					<UserRow
						name={user?.name ?? "Admin"}
						email={user?.email ?? ""}
						initials={initials}
						collapsed={collapsed}
						onSignOut={handleSignOut}
					/>

					{/* Collapse toggle — desktop only */}
					{!collapsed ? (
						<button
							onClick={toggleSidebarCollapsed}
							className="hidden lg:flex w-full items-center gap-2 px-3 py-1.5 mx-1 rounded-md text-xs text-neutral-light hover:text-neutral-dark hover:bg-neutral-100 transition-colors"
							style={{ width: "calc(100% - 8px)" }}
						>
							<ChevronsLeft size={13} />
							<span>Collapse sidebar</span>
						</button>
					) : (
						<Tooltip.Root>
							<Tooltip.Trigger asChild>
								<button
									onClick={toggleSidebarCollapsed}
									className="hidden lg:flex justify-center w-9 h-9 mx-auto rounded-md text-neutral-light hover:text-neutral-dark hover:bg-neutral-100 transition-colors items-center"
								>
									<ChevronsRight size={13} />
								</button>
							</Tooltip.Trigger>
							<Tooltip.Portal>
								<Tooltip.Content
									side="right"
									sideOffset={10}
									className="z-50 rounded-md bg-foreground px-2.5 py-1.5 text-xs text-white shadow-md"
								>
									Expand sidebar
								</Tooltip.Content>
							</Tooltip.Portal>
						</Tooltip.Root>
					)}
				</div>
			</aside>
		</>
	)
}
