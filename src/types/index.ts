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
	| "event.revision.review"
	| "sponsorship.approve"
	| "communityProfile.approve"
	| "coupon.create"
	| "coupon.view"
	| "moderation.read"
	| "moderation.action"
	| "category.manage"
	| "interest.manage"
	| "order.view"
	| "audit.read"
	| "community.manage"
	| "support.view"
	| "platform.config"

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
	communityName: string | null
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

export type EventStatus = "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "CANCELLED" | "COMPLETED"

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
	createdAt?: string
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

export type RefundPolicyType = "NO_REFUND" | "PARTIAL" | "FULL"

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
	endDate: string | null
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

// ─── Event revisions (edits to published events) ──────────────────────────────

export type RevisionStatus = "PENDING" | "APPROVED" | "REJECTED"

export type RevisionListItem = {
	id: string
	eventId: string
	touchesVenue: boolean
	submittedBy: string
	createdAt: string
	updatedAt: string
	event: {
		id: string
		title: string
		city: string
		status: EventStatus
		eventDate: string
		hostProfile: EventHostProfile
	}
}

export type RevisionsListResponse = {
	revisions: RevisionListItem[]
	total: number
	page: number
	limit: number
}

// Fields the revision endpoint accepts — a subset of EventDetail's editable fields.
export type RevisionFieldSet = Partial<{
	categoryId: string
	title: string
	description: string
	eventType: string
	languages: string[]
	tags: string[]
	whatToExpect: string[]
	whoShouldAttend: string[]
	specialInstructions: string
	venueName: string
	fullAddress: string
	city: string
}>

// `current` always includes the full touched tier (all Tier-2 venue fields when
// touchesVenue) plus media — decimal fields come back as strings from the DB.
export type RevisionCurrent = RevisionFieldSet & {
	latitude?: string
	longitude?: string
	media?: EventMediaItem[]
}

// `proposed` includes only the fields present in the pending revision, as
// originally submitted — numeric fields stay numbers, media only if touched.
export type RevisionProposed = RevisionFieldSet & {
	latitude?: number
	longitude?: number
	media?: { key: string; type: "COVER" | "GALLERY"; order: number; url: string }[]
}

export type RevisionReviewDetail = {
	eventId: string
	status: EventStatus
	touchesVenue: boolean
	hostProfile: EventHostProfile
	current: RevisionCurrent
	proposed: RevisionProposed
	revision: {
		id: string
		status: RevisionStatus
		submittedBy: string
		createdAt: string
		updatedAt: string
	}
}

// ─── Sponsorship proposals ─────────────────────────────────────────────────────

export type SponsorshipStatus = "DRAFT" | "UNDER_REVIEW" | "REJECTED" | "PUBLISHED"

export type SponsorTier = {
	name: string
	price: string
}

export type SponsorshipProposal = {
	id: string
	name: string | null
	city: string | null
	eventDate: string | null
	eventEndDate: string | null
	status: SponsorshipStatus
	submittedAt: string | null
	createdAt: string
	updatedAt: string
	pendingRevision: Record<string, unknown> | null
	hostProfile: EventHostProfile
}

export type SponsorshipsListResponse = {
	proposals: SponsorshipProposal[]
	total: number
	page: number
	limit: number
}

export type SponsorshipDetail = {
	id: string
	hostProfileId: string
	name: string | null
	about: string | null
	imageKey: string | null
	imageUrl: string | null
	eventDate: string | null
	eventEndDate: string | null
	venue: string | null
	venues: string[]
	city: string | null
	audienceProfile: string[]
	ageGroup: string | null
	guestCount: string | null
	docKey: string | null
	docUrl: string | null
	docName: string | null
	docType: string | null
	docSize: number | null
	sponsorTiers: SponsorTier[]
	status: SponsorshipStatus
	pendingRevision: (Record<string, unknown> & { imageUrl?: string | null; docUrl?: string | null }) | null
	adminRejectionRemark: string | null
	reviewedBy: string | null
	reviewedAt: string | null
	submittedAt: string | null
	createdAt: string
	updatedAt: string
	hostProfile: EventHostProfile
}

export type CreateSponsorshipPayload = {
	name: string
	about: string
	imageKey: string
	eventDate: string
	eventEndDate: string
	venues: string[]
	city: string
	audienceProfile: string[]
	ageGroup: string
	guestCount: string
	docKey: string
	docName: string
	docType: string
	docSize: number
	sponsorTiers: SponsorTier[]
}

// ─── Host community profiles ───────────────────────────────────────────────────

export type CommunityProfileCategory = { id: string; name: string }

export type CommunityProfile = {
	id: string
	name: string
	about: string
	logoKey: string
	size: string
	avgGuestCount: string
	experiencesPerYear: string
	approvalStatus: ApprovalStatus
	adminRejectionRemark: string | null
	reviewedAt: string | null
	createdAt: string
	updatedAt: string
	categories: CommunityProfileCategory[]
	hostProfile: {
		id: string
		displayName: string | null
		operatingCities: string[]
		user: { id: string; firstName: string; lastName: string; email: string | null }
	}
}

export type CommunityProfileDetail = CommunityProfile & { logoUrl: string | null }

export type CommunityProfilesListResponse = {
	profiles: CommunityProfile[]
	total: number
	page: number
	limit: number
}

export type SponsorshipInterest = {
	id: string
	createdAt: string
	brandProfile: {
		id: string
		brandName: string
		user: { email: string | null; phone: string | null }
	}
	sponsorshipProposal: {
		id: string
		name: string | null
		hostProfile: {
			displayName: string | null
			user: { firstName: string; lastName: string }
		}
	}
}

export type SponsorshipInterestsListResponse = {
	interests: SponsorshipInterest[]
	total: number
	page: number
	limit: number
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
	categoryMappings: InterestCategory[]
}

// ─── Communities ─────────────────────────────────────────────────────────────

export type CommunityStatus =
	| "DRAFT"
	| "PUBLISHED"
	| "ARCHIVED"
	| "ACTIVE"
	| "PAUSED"
	| "PENDING_ADMIN_REVIEW"
	| "SUSPENDED"
	| "REJECTED"

export type CommunityVisibility = "PUBLIC" | "PRIVATE" | "INVITE_ONLY"

export type Community = {
	id: string
	name: string
	slug: string
	type: CommunityType
	status: CommunityStatus
	primaryCity: string
	memberCount: number
	experienceCount: number
	createdAt: string
	publishedAt: string | null
	category: { id: string; name: string } | null
	iconUrl: string | null
}

export type CommunityQueueItem = {
	id: string
	name: string
	thumbnailUrl: string | null
	category: { id: string; name: string } | null
	visibility: CommunityVisibility
	memberCount: number
	submittedBy: { id: string; name: string }
	submittedAt: string
	status: CommunityStatus
}

// ─── Community Create ─────────────────────────────────────────────────────────

export type CommunityType = "MEETDAY_MANAGED_PUBLIC" | "HOST_LED" | "PRIVATE_INVITE_ONLY"
export type CommunityAccess = "PUBLIC" | "APPROVAL_REQUIRED" | "INVITE_ONLY"
export type CommunityMemberVisibility = "ALL_MEMBERS" | "AFTER_ATTENDING" | "HIDDEN"
export type CommunityFeedPosting = "ALL_MEMBERS" | "ATTENDED_MEMBERS_ONLY" | "ADMINS_ONLY"
export type CommunityChatPermission = "ALL_MEMBERS" | "ATTENDED_MEMBERS_ONLY" | "ADMIN_APPROVAL_REQUIRED"
export type CommunityDmPolicy = "EVERYONE" | "MUTUAL_ATTENDEES_ONLY" | "DISABLED"
export type CommunityPhotoSharing = "REQUIRE_CONSENT_REMINDER" | "OPEN" | "DISABLED"
export type AssignableCommunityRole = "OWNER" | "MANAGER" | "HOST" | "MODERATOR" | "MEMBER"

export interface CreateCommunityDraftRequest {
	name: string
	slug: string
	type: CommunityType
	description: string
	categoryId: string
	primaryCity: string
	coverImageKey: string
	iconKey: string
	interestTags: string[]
}

export interface UpdateCommunitySettingsRequest {
	chatEnabled: boolean
	feedEnabled: boolean
	announcementsEnabled: boolean
	memberDirectoryEnabled: boolean
	experiencesTabEnabled: boolean
	feedPosting: CommunityFeedPosting
	chat: CommunityChatPermission
	spamDetection: boolean
	toxicContentDetection: boolean
	linkFiltering: boolean
	duplicateContentDetection: boolean
	reportThreshold: number
	dmPolicy: CommunityDmPolicy
	photoSharing: CommunityPhotoSharing
}


export interface AssignCommunityMemberRequest {
	userId: string
	role: AssignableCommunityRole
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export type Review = {
	id: string
	rating: number
	content: string | null
	highlights: string[]
	isVisible: boolean
	createdAt: string
	event: { id: string; title: string }
	reviewer: { id: string; firstName: string; lastName: string; email: string } | null
}

// ─── Support Tickets ──────────────────────────────────────────────────────────

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT"
export type TicketCategory =
	| "REFUND_REQUEST"
	| "ACCOUNT_ISSUE"
	| "EVENT_ISSUE"
	| "PAYMENT_ISSUE"
	| "COMMUNITY_ISSUE"
	| "HOST_ISSUE"
	| "OTHER"
export type TicketEntityType = "USER" | "HOST" | "EVENT" | "ORDER" | "COMMUNITY"

export type SupportTicket = {
	id: string
	ticketNumber: string
	subject: string
	body: string
	category: TicketCategory
	priority: TicketPriority
	status: TicketStatus
	entityType: TicketEntityType | null
	entityId: string | null
	resolution: string | null
	resolvedAt: string | null
	createdAt: string
	updatedAt: string
	reporter: { id: string; firstName: string; lastName: string; email: string }
	assignee: { id: string; firstName: string; lastName: string } | null
	resolver: { id: string; firstName: string; lastName: string } | null
}
