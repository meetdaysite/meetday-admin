import { cn } from "@/lib/utils"
import type { HostStatus, KycStatus, EventStatus, InviteStatus, CouponStatus, SubscriptionStatus, PayoutAccountStatus, ApprovalStatus } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeStatus = HostStatus | KycStatus | EventStatus | InviteStatus | CouponStatus | SubscriptionStatus | PayoutAccountStatus | ApprovalStatus

// ─── Config ───────────────────────────────────────────────────────────────────

const BADGE_CONFIG: Partial<Record<string, { label: string; className: string }>> = {
	PENDING:              { label: "Pending",            className: "bg-amber-50 text-amber-700 border-amber-200" },
	APPROVED:             { label: "Approved",           className: "bg-green-50 text-green-700 border-green-200" },
	ACCEPTED:             { label: "Accepted",           className: "bg-green-50 text-green-700 border-green-200" },
	ACTIVE:               { label: "Active",             className: "bg-green-50 text-green-700 border-green-200" },
	REJECTED:             { label: "Rejected",           className: "bg-red-50 text-red-600 border-red-200" },
	REVOKED:              { label: "Revoked",            className: "bg-red-50 text-red-600 border-red-200" },
	SUSPENDED:            { label: "Suspended",          className: "bg-orange-50 text-orange-700 border-orange-200" },
	INFO_REQUESTED:       { label: "Info Requested",     className: "bg-sky-50 text-sky-700 border-sky-200" },
	EDIT_REQUESTED:       { label: "Edit Requested",     className: "bg-sky-50 text-sky-700 border-sky-200" },
	UNDER_REVIEW:         { label: "Under Review",       className: "bg-amber-50 text-amber-700 border-amber-200" },
	PUBLISHED:            { label: "Published",          className: "bg-green-50 text-green-700 border-green-200" },
	DRAFT:                { label: "Draft",              className: "bg-neutral-100 text-text-secondary border-neutral-200" },
	EXPIRED:              { label: "Expired",            className: "bg-neutral-100 text-text-secondary border-neutral-200" },
	DISABLED:             { label: "Disabled",           className: "bg-neutral-100 text-text-secondary border-neutral-200" },
	VERIFIED:             { label: "Verified",           className: "bg-green-50 text-green-700 border-green-200" },
	FAILED:               { label: "Failed",             className: "bg-red-50 text-red-600 border-red-200" },
	NOT_SUBMITTED:        { label: "Not Submitted",      className: "bg-neutral-100 text-text-secondary border-neutral-200" },
	CANCELLED:            { label: "Cancelled",          className: "bg-red-50 text-red-600 border-red-200" },
	PENDING_ADMIN_REVIEW: { label: "Pending Review",     className: "bg-amber-50 text-amber-700 border-amber-200" },
	DEACTIVATED:          { label: "Deactivated",        className: "bg-neutral-100 text-text-secondary border-neutral-200" },
	PAUSED:               { label: "Paused",             className: "bg-neutral-100 text-text-secondary border-neutral-200" },
	PENDING_PAYMENT:      { label: "Pending Payment",    className: "bg-amber-50 text-amber-700 border-amber-200" },
	CONFIRMED:            { label: "Confirmed",          className: "bg-green-50 text-green-700 border-green-200" },
	REFUNDED:             { label: "Refunded",           className: "bg-sky-50 text-sky-700 border-sky-200" },
}

// ─── Component ────────────────────────────────────────────────────────────────

export type StatusBadgeProps = {
	status: BadgeStatus | string
	className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const cfg = (status != null && BADGE_CONFIG[status]) ? BADGE_CONFIG[status]! : {
		label: (status ?? "").replace(/_/g, " "),
		className: "bg-neutral-100 text-text-secondary border-neutral-200",
	}
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold",
				cfg.className,
				className,
			)}
		>
			{cfg.label}
		</span>
	)
}
