// Shape of every successful API response before the interceptor unwraps it
export type ApiResponse<T> = {
	success: boolean
	timestamp: string
	data: T
}

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

export type Host = {
	id: string
	name: string
	email: string
	phone: string | null
	city: string
	status: HostStatus
	invitedAt: Date
}

export type TicketTier = {
	id: string
	name: string
	price: number // 0 = free
	capacity: number
}

export type Event = {
	id: string
	title: string
	hostName: string
	hostEmail: string
	city: string
	date: Date
	coverImage: string | null
	status: EventStatus
	ticketTiers: TicketTier[]
	submittedAt: Date
}

export type BulkHostRow = {
	_index: number
	name: string
	email: string
	phone: string
	city: string
	_valid: boolean
	_errors: string[]
}

export type CouponApplicability = "ALL" | "CITY" | "EVENT"

export type Coupon = {
	id: string
	code: string
	description: string | null
	discountType: DiscountType
	discountValue: number       // percentage (0–100) or flat INR amount
	applicability: CouponApplicability
	cities: string[]            // populated when applicability === "CITY"
	eventIds: string[]          // populated when applicability === "EVENT"
	maxUses: number | null      // null = unlimited
	usedCount: number
	expiresAt: Date | null
	status: CouponStatus
	createdAt: Date
	createdBy: string
}

export type CouponUsage = {
	id: string
	couponId: string
	userName: string
	userEmail: string
	eventTitle: string
	city: string
	usedAt: Date
	orderAmount: number
	discountAmount: number
}
