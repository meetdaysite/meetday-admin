import { cn } from "@/lib/utils"
import type { HostStatus, KycStatus, EventStatus, InviteStatus, CouponStatus, SubscriptionStatus, PayoutAccountStatus, ApprovalStatus } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeStatus = HostStatus | KycStatus | EventStatus | InviteStatus | CouponStatus | SubscriptionStatus | PayoutAccountStatus | ApprovalStatus

// ─── Config ───────────────────────────────────────────────────────────────────

const BADGE_CONFIG: Partial<Record<string, { label: string; className: string }>> = {
	PENDING:              { label: "Pending",            className: "bg-amber-50 text-amber-700" },
	APPROVED:             { label: "Approved",           className: "bg-green-50 text-green-700" },
	ACCEPTED:             { label: "Accepted",           className: "bg-green-50 text-green-700" },
	ACTIVE:               { label: "Active",             className: "bg-green-50 text-green-700" },
	REJECTED:             { label: "Rejected",           className: "bg-red-50 text-red-600" },
	REVOKED:              { label: "Revoked",            className: "bg-red-50 text-red-600" },
	SUSPENDED:            { label: "Suspended",          className: "bg-orange-50 text-orange-700" },
	INFO_REQUESTED:       { label: "Info Requested",     className: "bg-sky-50 text-sky-700" },
	EDIT_REQUESTED:       { label: "Edit Requested",     className: "bg-sky-50 text-sky-700" },
	UNDER_REVIEW:         { label: "Under Review",       className: "bg-amber-50 text-amber-700" },
	PUBLISHED:            { label: "Published",          className: "bg-green-50 text-green-700" },
	DRAFT:                { label: "Draft",              className: "bg-neutral-100 text-text-secondary" },
	EXPIRED:             { label: "Expired",            className: "bg-neutral-100 text-text-secondary" },
	DISABLED:            { label: "Disabled",           className: "bg-neutral-100 text-text-secondary" },
	VERIFIED:             { label: "Verified",           className: "bg-green-50 text-green-700" },
	FAILED:               { label: "Failed",             className: "bg-red-50 text-red-600" },
	NOT_SUBMITTED:        { label: "Not Submitted",      className: "bg-neutral-100 text-text-secondary" },
	CANCELLED:            { label: "Cancelled",          className: "bg-red-50 text-red-600" },
	PENDING_ADMIN_REVIEW: { label: "Pending Review",     className: "bg-amber-50 text-amber-700" },
	DEACTIVATED:          { label: "Deactivated",        className: "bg-neutral-100 text-text-secondary" },
	PENDING_PAYMENT:      { label: "Pending Payment",    className: "bg-amber-50 text-amber-700" },
	CONFIRMED:            { label: "Confirmed",          className: "bg-green-50 text-green-700" },
	REFUNDED:             { label: "Refunded",           className: "bg-sky-50 text-sky-700" },
}

// ─── Component ────────────────────────────────────────────────────────────────

export type StatusBadgeProps = {
	status: BadgeStatus | string
	className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const cfg = (status != null && BADGE_CONFIG[status]) ? BADGE_CONFIG[status]! : {
		label: (status ?? "").replace(/_/g, " "),
		className: "bg-neutral-100 text-text-secondary",
	}
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
				cfg.className,
				className,
			)}
		>
			{cfg.label}
		</span>
	)
}
