﻿"use client"

import { DataView } from "@/components/ui/data-view"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { FilterSelect } from "@/components/ui/filter-select"
import { PageHeader } from "@/components/ui/page-header"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { getAuditLogs, type GetAuditLogsParams } from "@/lib/api/audit-logs"
import { actionColor } from "@/lib/constants/action-colors"
import { actionLabel, formatDateTime } from "@/lib/formatters"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import type { AuditLog } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { useCallback, useMemo, useState } from "react"

// Constants

const PAGE_LIMIT = 50

const AUDIT_ACTIONS = [
	"USER_REGISTERED",
	"USER_LOGGED_IN",
	"USER_DELETED",
	"USER_RESTORED",
	"KYC_SUBMITTED",
	"KYC_APPROVED",
	"KYC_REJECTED",
	"KYC_RESUBMITTED",
	"PAYOUT_ACCOUNT_ADDED",
	"PAYOUT_ACCOUNT_APPROVED",
	"PAYOUT_ACCOUNT_DEACTIVATED",
	"EVENT_CREATED",
	"EVENT_SUBMITTED_FOR_REVIEW",
	"EVENT_APPROVED",
	"EVENT_REJECTED",
	"EVENT_PUBLISHED",
	"EVENT_CANCELLED",
	"ORDER_CREATED",
	"ORDER_CONFIRMED",
	"ORDER_CANCELLED",
	"REFUND_INITIATED",
	"REFUND_COMPLETED",
	"SUBSCRIPTION_CREATED",
	"SUBSCRIPTION_UPGRADED",
	"SUBSCRIPTION_CANCELLED",
	"ADMIN_HOST_SUSPENDED",
	"ADMIN_HOST_RESTORED",
	"ADMIN_PLAN_PRICE_CHANGED",
	"SCANNER_SESSION_CREATED",
	"SCANNER_SESSION_EXPIRED",
	"TICKET_SCANNED",
	"DUPLICATE_SCAN_ATTEMPT",
	"DATA_EXPORT_REQUESTED",
	"DATA_DELETION_REQUESTED",
] as const

// Helpers

// Page

export default function AuditLogsPage() {
	const canRead = usePermission("audit.read")

	const [page, setPage] = useState(1)
	const [actionFilter, setActionFilter] = useState("")
	const [entityTypeFilter, setEntityTypeFilter] = useState("")
	const [entityIdInput, setEntityIdInput] = useState("")
	const [entityIdFilter, setEntityIdFilter] = useState("")
	const [actorIdInput, setActorIdInput] = useState("")
	const [actorIdFilter, setActorIdFilter] = useState("")
	const [fromDate, setFromDate] = useState("")
	const [toDate, setToDate] = useState("")
	const [search, setSearch] = useState("")

	const fetcher = useCallback(() => {
		const params: GetAuditLogsParams = { page, limit: PAGE_LIMIT }
		if (actionFilter) params.action = actionFilter
		if (entityTypeFilter) params.entityType = entityTypeFilter
		if (entityIdFilter) params.entityId = entityIdFilter
		if (actorIdFilter) params.actorId = actorIdFilter
		if (fromDate) params.from = fromDate
		if (toDate) params.to = toDate
		return getAuditLogs(params).then(r => ({ items: r.data, total: r.total ?? r.data.length }))
	}, [page, actionFilter, entityTypeFilter, entityIdFilter, actorIdFilter, fromDate, toDate])

	const { items: logs, total, isLoading, error } = usePaginatedFetch(fetcher, "Failed to load audit logs")

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return logs
		return logs.filter(
			l =>
				l.action.toLowerCase().includes(q) ||
				(l.actor?.email ?? "").toLowerCase().includes(q) ||
				(l.entityId ?? "").toLowerCase().includes(q) ||
				(l.entityType ?? "").toLowerCase().includes(q),
		)
	}, [logs, search])

	function handleEntitySearch(e: React.FormEvent) {
		e.preventDefault()
		setPage(1)
		setEntityIdFilter(entityIdInput.trim())
		setActorIdFilter(actorIdInput.trim())
	}

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	const columns = useMemo<ColumnDef<AuditLog>[]>(
		() => [
			{
				id: "action",
				header: "Action",
				cell: ({ row }) => (
					<span
						className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${actionColor(row.original.action)}`}
					>
						{actionLabel(row.original.action)}
					</span>
				),
			},
			{
				id: "actor",
				header: "Actor",
				cell: ({ row }) => {
					const actor = row.original.actor
					if (!actor) return <span className="text-[11px] text-text-tertiary">System</span>
					return (
						<div>
							<p className="text-xs font-semibold text-text-primary leading-none mb-0.5">
								{actor.firstName} {actor.lastName}
							</p>
							<p className="text-[11px] text-text-tertiary">{actor.email}</p>
						</div>
					)
				},
			},
			{
				id: "entity",
				header: "Entity",
				cell: ({ row }) => {
					const l = row.original
					if (!l.entityType && !l.entityId) {
						return <span className="text-[11px] text-text-tertiary">-</span>
					}
					return (
						<div>
							{l.entityType && (
								<p className="text-[11px] font-semibold text-text-secondary">
									{l.entityType}
								</p>
							)}
							{l.entityId && (
								<p className="text-[11px] font-mono text-text-tertiary truncate max-w-30">
									{l.entityId}
								</p>
							)}
						</div>
					)
				},
			},
			{
				id: "timestamp",
				header: "Timestamp",
				cell: ({ row }) => (
					<span className="text-xs text-text-secondary whitespace-nowrap">
						{formatDateTime(row.original.createdAt)}
					</span>
				),
			},
		],
		[],
	)

	if (!canRead) return <PermissionGuard message="You don't have permission to view audit logs." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader title="Audit Logs" count={total} />

			{/* Filters */}
			<div className="space-y-3">
				{/* Row 1: action + entity type + date range */}
				<div className="flex items-center gap-2 flex-wrap">
					<FilterSelect
						value={actionFilter}
						onChange={v => {
							setActionFilter(v)
							setPage(1)
						}}
						options={[
							{ value: "", label: "All actions" },
							...AUDIT_ACTIONS.map(a => ({ value: a, label: actionLabel(a) })),
						]}
						className="max-w-55"
					/>

					<input
						type="text"
						value={entityTypeFilter}
						onChange={e => {
							setEntityTypeFilter(e.target.value)
							setPage(1)
						}}
						placeholder="Entity type…"
						className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors w-32"
					/>

					<DateRangeFilter
						from={fromDate}
						to={toDate}
						onFromChange={v => {
							setFromDate(v)
							setPage(1)
						}}
						onToChange={v => {
							setToDate(v)
							setPage(1)
						}}
					/>
				</div>

				{/* Row 2: actor ID + entity ID + search */}
				<form onSubmit={handleEntitySearch} className="flex items-center gap-2 flex-wrap">
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search action, actor, entity…"
						className="flex-1 min-w-48 max-w-xs"
					/>
					<input
						type="text"
						value={actorIdInput}
						onChange={e => setActorIdInput(e.target.value)}
						placeholder="Actor ID…"
						className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs placeholder:text-text-tertiary font-mono focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors w-40"
					/>
					<input
						type="text"
						value={entityIdInput}
						onChange={e => setEntityIdInput(e.target.value)}
						placeholder="Entity ID…"
						className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs placeholder:text-text-tertiary font-mono focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors w-40"
					/>
					<button
						type="submit"
						className="rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors"
					>
						Apply
					</button>
					{(actorIdFilter || entityIdFilter) && (
						<button
							type="button"
							onClick={() => {
								setActorIdInput("")
								setActorIdFilter("")
								setEntityIdInput("")
								setEntityIdFilter("")
								setPage(1)
							}}
							className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
						>
							Clear
						</button>
					)}
				</form>
			</div>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No audit log entries match the current filters."
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>
		</div>
	)
}
