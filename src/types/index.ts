export type Role = "SUPER_ADMIN" | "CITY_ADMIN" | "MODERATOR" | "SUPPORT"

export type Permission =
	| "admin.invite"
	| "host.invite"
	| "host.approve"
	| "event.approve"
	| "coupon.create"
	| "coupon.view"
	| "moderation.read"
	| "moderation.action"

export type InviteStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED"

export type HostStatus = "PENDING" | "APPROVED" | "REJECTED" | "INFO_REQUESTED"

export type EventStatus = "PENDING" | "APPROVED" | "REJECTED" | "EDIT_REQUESTED"

export type CouponStatus = "ACTIVE" | "EXPIRED" | "DISABLED"

export type DiscountType = "PERCENTAGE" | "FLAT"

export type Admin = {
	id: string
	name: string
	email: string
	role: Role
	cityScope: string | null
	status: InviteStatus
	invitedAt: Date
	joinedAt: Date | null
}
