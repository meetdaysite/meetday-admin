import { cn } from "@/lib/utils"
import type { HostStatus, KycStatus, EventStatus, InviteStatus, CouponStatus, SubscriptionStatus, PayoutAccountStatus } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeStatus = HostStatus | KycStatus | EventStatus | InviteStatus | CouponStatus | SubscriptionStatus | PayoutAccountStatus

// ─── Config ───────────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<BadgeStatus, { label: string; className: string }> = {
	PENDING:              { label: "Pending",            className: "bg-amber-50 text-amber-700" },
	APPROVED:             { label: "Approved",           className: "bg-green-50 text-green-700" },
	ACCEPTED:             { label: "Accepted",           className: "bg-green-50 text-green-700" },
	ACTIVE:               { label: "Active",             className: "bg-green-50 text-green-700" },
	REJECTED:             { label: "Rejected",           className: "bg-red-50 text-red-600" },
	REVOKED:              { label: "Revoked",            className: "bg-red-50 text-red-600" },
	INFO_REQUESTED:       { label: "Info Requested",     className: "bg-sky-50 text-sky-700" },
	EDIT_REQUESTED:       { label: "Edit Requested",     className: "bg-sky-50 text-sky-700" },
	EXPIRED:              { label: "Expired",            className: "bg-neutral-100 text-neutral-dark" },
	DISABLED:             { label: "Disabled",           className: "bg-neutral-100 text-neutral-dark" },
	VERIFIED:             { label: "Verified",           className: "bg-green-50 text-green-700" },
	FAILED:               { label: "Failed",             className: "bg-red-50 text-red-600" },
	NOT_SUBMITTED:        { label: "Not Submitted",      className: "bg-neutral-100 text-neutral-dark" },
	CANCELLED:            { label: "Cancelled",          className: "bg-red-50 text-red-600" },
	PENDING_ADMIN_REVIEW: { label: "Pending Review",     className: "bg-amber-50 text-amber-700" },
	DEACTIVATED:          { label: "Deactivated",        className: "bg-neutral-100 text-neutral-dark" },
}

// ─── Component ────────────────────────────────────────────────────────────────

export type StatusBadgeProps = {
	status: BadgeStatus
	className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const cfg = BADGE_CONFIG[status] ?? {
		label: status.replace(/_/g, " "),
		className: "bg-neutral-100 text-neutral-dark",
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
