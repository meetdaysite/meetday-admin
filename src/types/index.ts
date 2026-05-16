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
	| "category.manage"
	| "interest.manage"
	| "order.view"
	| "audit.read"

export type InviteStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED"

export type HostStatus = "PENDING" | "APPROVED" | "REJECTED" | "INFO_REQUESTED"

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
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

export type EventStatus = "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "CANCELLED"

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
	sold?: number
}

export type EventHostProfile = {
	id: string
	displayName: string
	user: {
		id: string
		firstName: string
		lastName: string
		email: string
	}
}

export type EventMediaItem = {
	id: string
	eventId: string
	url: string
	type: "COVER" | "GALLERY"
	order: number
	createdAt: string
}

export type EventTicket = {
	id: string
	eventId: string
	name: string
	price: string
	totalCapacity: number
	soldCount: number
	maxPerPerson: number
	description: string | null
	saleStartDate: string
	saleEndDate: string
	createdAt: string
	updatedAt: string
}

export type RefundPolicyType = "NO_REFUND" | "PARTIAL_REFUND" | "FULL_REFUND"

export type EventRefundPolicy = {
	id: string
	eventId: string
	type: RefundPolicyType
	cutoffHours: number | null
	refundPercent: number | null
	refundTo: string
}

export type Event = {
	id: string
	title: string
	eventType: string
	eventDate: string
	city: string
	isFree: boolean
	status?: EventStatus        // absent in pending-events response
	updatedAt?: string          // present in pending-events, absent in all-events
	createdAt?: string          // present in all-events, absent in pending-events
	submittedAt?: string | null // present in all-events
	category: { id: string; name: string } | null
	hostProfile: EventHostProfile
}

export type EventDetail = Omit<Event, "status" | "updatedAt"> & {
	status: EventStatus
	updatedAt: string
	description: string | null
	startTime: string | null
	endTime: string | null
	venueName: string | null
	fullAddress: string | null
	languages: string[]
	tags: string[]
	whatToExpect: string[]
	whoShouldAttend: string[]
	visibility: string
	ageRestriction: string | null
	specialInstructions: string | null
	vibeSummary: string | null
	crowdPulse: string | null
	platformFeeWaived: boolean
	adminRejectionRemark: string | null
	reviewedBy: string | null
	reviewedAt: string | null
	cancelledAt: string | null
	cancellationReason: string | null
	media: EventMediaItem[]
	tickets: EventTicket[]
	refundPolicy: EventRefundPolicy | null
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

// ─── Category ─────────────────────────────────────────────────────────────────

export type Category = {
	id: string
	name: string
	description: string | null
	isActive: boolean
	createdAt: string
	updatedAt?: string
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "REFUNDED"

export type Order = {
	id: string
	bookingId: string
	status: OrderStatus
	createdAt: string
	user: { id: string; firstName: string; lastName: string; email: string }
	event: { id: string; title: string; city: string }
}

export type OrderAttendee = {
	id: string
	firstName: string
	lastName: string
	email: string
	ticketCode: string
	tierName: string
}

export type OrderDetail = Order & {
	totalAmount: number
	platformFee: number
	hostPayout: number
	couponCode: string | null
	discountAmount: number
	attendees: OrderAttendee[]
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export type AuditLog = {
	id: string
	action: string
	actorId: string | null
	actor: { id: string; firstName: string; lastName: string; email: string } | null
	entityType: string | null
	entityId: string | null
	metadata: Record<string, unknown> | null
	createdAt: string
}

// ─── Interests ────────────────────────────────────────────────────────────────

export type Interest = {
	id: string
	name: string
	slug: string
	description: string | null
	image: string | null
	createdAt: string
	updatedAt?: string
}

export type InterestCategory = {
	interestId: string
	categoryId: string
	category: { id: string; name: string }
}

export type InterestDetail = Interest & {
	categories: InterestCategory[]
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export type Review = {
	id: string
	rating: number
	content: string | null
	isVisible: boolean
	createdAt: string
	event: { id: string; title: string; city: string }
	reviewer: { id: string; firstName: string; lastName: string; email: string }
}
