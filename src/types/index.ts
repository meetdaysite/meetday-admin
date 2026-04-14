// Shape of every successful API response before the interceptor unwraps it
export type ApiResponse<T> = {
	success: boolean
	timestamp: string
	data: T
}

export type Role = "SUPER_ADMIN" | "CITY_ADMIN" | "MODERATOR" | "SUPPORT"

export type RoleDefinition = {
	id: string
	name: Role
	description: string
}

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

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"
export type KycStatus = "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "FAILED"
export type VerificationStatus = KycStatus
export type HostPlan = "DISCOVER" | "SELL" | "COMMUNITY"
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED"
export type BillingCycle = "MONTHLY" | "ANNUAL"
export type PayoutAccountStatus = "PENDING_ADMIN_REVIEW" | "DEACTIVATED"

export type HostSubscription = {
	plan: HostPlan
	status: SubscriptionStatus
	billingCycle: BillingCycle
	currentPeriodEnd: string
}

export type HostCategory = {
	hostProfileId: string
	categoryId: string
	category: {
		id: string
		name: string
		description: string
	}
}

export type PayoutAccount = {
	id: string
	accountHolderName: string
	maskedAccountNumber: string
	bankName: string
	accountType: string
	status: PayoutAccountStatus
	isVerified: boolean
}

export type HostDetail = {
	id: string
	displayName: string
	legalName: string | null
	hostType: string
	approvalStatus: ApprovalStatus
	currentPlan: HostPlan
	rejectionReason: string | null
	approvedAt: string | null
	kycStatus: KycStatus
	kycVerifiedAt: string | null
	kycFailureReason: string | null
	panVerificationStatus: VerificationStatus
	panVerificationReference: string | null
	bankVerificationStatus: VerificationStatus
	yearsOfExperience: number | null
	totalEventsPreviouslyHosted: number | null
	totalEventsHosted: number
	averageRating: number | null
	totalReviews: number
	operatingCities: string[]
	hostBio: string | null
	tagline: string | null
	languages: string[]
	socialLinks: { website?: string; instagram?: string } | null
	portfolioLinks: string[]
	address?: {
		street: string | null
		city: string
		state: string
		pincode: string
		country: string
	}
	user: {
		firstName: string
		lastName: string
		email: string | null
		phone: string | null
		isActive: boolean
	}
	categories: HostCategory[]
	subscriptions: HostSubscription[]
	payoutAccount: PayoutAccount | null
}

export type EventStatus = "PENDING" | "APPROVED" | "REJECTED" | "EDIT_REQUESTED"

export type CouponStatus = "ACTIVE" | "EXPIRED" | "DISABLED"

export type DiscountType = "PERCENTAGE" | "FLAT"

export type Admin = {
	id: string
	firstName: string
	lastName: string
	email: string
	isActive: boolean
	createdAt: string
	role: { name: Role }
	adminProfile: { managedCities: string[] } | null
}

export type Host = {
	id: string
	displayName: string
	hostType: string
	kycStatus: KycStatus
	approvalStatus: ApprovalStatus
	currentPlan: HostPlan
	operatingCities: string[]
	address?: {
		city: string
		state: string
		pincode: string
	}
	user: {
		firstName: string
		lastName: string
		email: string | null
	}
	categories: HostCategory[]
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

export type CouponTarget = "HOST" | "ATTENDEE"

export type CouponRedemption = {
	id: string
	originalFeeRate: number
	discountedFeeRate: number
	createdAt: string
	user?: {
		id: string
		firstName: string
		lastName: string
		email: string
	}
}

export type Coupon = {
	id: string
	code: string
	description?: string
	target: CouponTarget
	discountType: DiscountType
	discountValue: number
	usageCount?: number
	maxUsages: number | null       // null = unlimited total uses
	maxUsagesPerUser: number | null // null = unlimited per-user uses
	isActive: boolean
	redemptions: CouponRedemption[]
}

/** @deprecated Use CouponRedemption instead */
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
