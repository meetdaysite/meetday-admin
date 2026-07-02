import type { Role } from "@/types"

// ─── Admin panel roles ────────────────────────────────────────────────────────

export const ROLE_STYLE: Record<Role, string> = {
	SUPER_ADMIN: "bg-violet-50 text-violet-700",
	CITY_ADMIN: "bg-blue-50 text-blue-700",
	MODERATOR: "bg-amber-50 text-amber-700",
	SUPPORT: "bg-teal-50 text-teal-700",
}

export const ROLE_LABEL: Record<Role, string> = {
	SUPER_ADMIN: "Super Admin",
	CITY_ADMIN: "City Admin",
	MODERATOR: "Moderator",
	SUPPORT: "Support",
}

// ─── Community manager roles ──────────────────────────────────────────────────
// Keys are the display strings returned by the community API ("Owner", "Manager", "Moderator")

export const COMMUNITY_MANAGER_ROLE_BADGE: Record<string, string> = {
	Owner: "bg-green-100 text-green-700",
	Manager: "bg-blue-100 text-blue-700",
	Moderator: "bg-purple-100 text-purple-700",
}
