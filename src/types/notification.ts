export type NotificationType =
	| "event_approved"
	| "event_rejected"
	| "event_under_review"
	| "event_review_requested"
	| "event_cancelled"
	| "event_revision_pending"
	| "event_revision_pending_venue"
	| "booking_confirmed"
	| "booking_cancelled"
	| "subscription_upgraded"
	| "subscription_expiring"
	| "sponsorship_deal_locked"

export type Notification = {
	id: string
	type: NotificationType
	title: string
	body: string
	createdAt: string
	isRead: boolean
}
