﻿"use client"

import { ClearableInput } from "@/components/ui/clearable-input"
import { DataView } from "@/components/ui/data-view"
import { DateRangeFilter } from "@/components/ui/date-range-filter"
import { FilterSelect } from "@/components/ui/filter-select"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { getAuditLogs, type GetAuditLogsParams } from "@/lib/api/audit-logs"
import { actionColor } from "@/lib/constants/action-colors"
import { actionLabel, formatDateTime } from "@/lib/formatters"
import { ChipCell, DateCell, TwoLineCell } from "@/components/ui/table-cells"
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
	const [entityIdFilter, setEntityIdFilter] = useState("")
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

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	const columns = useMemo<ColumnDef<AuditLog>[]>(
		() => [
			{
				id: "action",
				header: "Action",
				cell: ({ row }) => (
					<ChipCell className={actionColor(row.original.action)}>
						{actionLabel(row.original.action)}
					</ChipCell>
				),
			},
			{
				id: "actor",
				header: "Actor",
				cell: ({ row }) => {
					const actor = row.original.actor
					if (!actor) return <span className="text-[11px] text-text-tertiary">System</span>
					return (
						<TwoLineCell
							primary={`${actor.firstName} ${actor.lastName}`}
							secondary={actor.email}
						/>
					)
				},
			},
			{
				id: "entity",
				header: "Entity",
				cell: ({ row }) => {
					const l = row.original
					if (!l.entityType && !l.entityId) return <span className="text-[11px] text-text-tertiary">-</span>
					return <TwoLineCell primary={l.entityType ?? ""} secondary={l.entityId} />
				},
			},
			{
				id: "timestamp",
				header: "Timestamp",
				cell: ({ row }) => (
					<DateCell value={row.original.createdAt} format={formatDateTime} secondary />
				),
			},
		],
		[],
	)

	if (!canRead) return <PermissionGuard message="You don't have permission to view audit logs." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			{/* Header */}
			<PageHeader title="Audit Logs" description="View a log of all actions performed in the system." />

			{/* Filters */}
			<div className="flex items-center gap-2 flex-wrap">
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search action, actor, entity…"
					className="flex-1 min-w-48 max-w-xs"
				/>

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

				<ClearableInput
					value={actorIdFilter}
					onChange={v => {
						setActorIdFilter(v)
						setPage(1)
					}}
					showClear={!!actorIdFilter}
					onClear={() => {
						setActorIdFilter("")
						setPage(1)
					}}
					placeholder="Actor ID…"
				/>

				<ClearableInput
					value={entityIdFilter}
					onChange={v => {
						setEntityIdFilter(v)
						setPage(1)
					}}
					showClear={!!entityIdFilter}
					onClear={() => {
						setEntityIdFilter("")
						setPage(1)
					}}
					placeholder="Entity ID…"
				/>

				<ClearableInput
					value={entityTypeFilter}
					onChange={v => {
						setEntityTypeFilter(v)
						setPage(1)
					}}
					showClear={!!entityTypeFilter}
					onClear={() => {
						setEntityTypeFilter("")
						setPage(1)
					}}
					placeholder="Entity type…"
				/>
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
