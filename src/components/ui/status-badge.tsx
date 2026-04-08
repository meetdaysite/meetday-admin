import { cn } from "@/lib/utils"
import type { HostStatus, EventStatus, InviteStatus, CouponStatus } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeStatus = HostStatus | EventStatus | InviteStatus | CouponStatus

// ─── Config ───────────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<BadgeStatus, { label: string; className: string }> = {
	PENDING:        { label: "Pending",       className: "bg-amber-50 text-amber-700" },
	APPROVED:       { label: "Approved",      className: "bg-green-50 text-green-700" },
	ACCEPTED:       { label: "Accepted",      className: "bg-green-50 text-green-700" },
	ACTIVE:         { label: "Active",        className: "bg-green-50 text-green-700" },
	REJECTED:       { label: "Rejected",      className: "bg-red-50 text-red-600" },
	REVOKED:        { label: "Revoked",       className: "bg-red-50 text-red-600" },
	INFO_REQUESTED: { label: "Info Requested", className: "bg-sky-50 text-sky-700" },
	EDIT_REQUESTED: { label: "Edit Requested", className: "bg-sky-50 text-sky-700" },
	EXPIRED:        { label: "Expired",       className: "bg-neutral-100 text-neutral-dark" },
	DISABLED:       { label: "Disabled",      className: "bg-neutral-100 text-neutral-dark" },
}

// ─── Component ────────────────────────────────────────────────────────────────

export type StatusBadgeProps = {
	status: BadgeStatus
	className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const cfg = BADGE_CONFIG[status]
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
