"use client"

import { ClearableInput } from "@/components/ui/clearable-input"
import { DataView } from "@/components/ui/data-view"
import { FilterSelect } from "@/components/ui/filter-select"
import { ChipCell, DateCell, StatusCell, TwoLineCell } from "@/components/ui/table-cells"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { SearchInput } from "@/components/ui/search-input"
import { getSpacePartnersReps, type SpacePartnerRep, type SpaceProfileStatus } from "@/lib/api/space-profiles"
import { formatDate } from "@/lib/formatters"
import { usePaginatedFetch } from "@/lib/hooks/use-paginated-fetch"
import { usePermission } from "@/lib/hooks/use-permission"
import { type ColumnDef } from "@tanstack/react-table"
import { useCallback, useMemo, useState } from "react"

const PAGE_LIMIT = 20

type ProfileStatusFilter = SpaceProfileStatus | "ALL"

const PROFILE_STATUS_TABS: { label: string; value: ProfileStatusFilter }[] = [
	{ label: "All", value: "ALL" },
	{ label: "Not Activated", value: "NOT_ACTIVATED" },
	{ label: "Pending", value: "PENDING" },
	{ label: "Approved", value: "APPROVED" },
	{ label: "Rejected", value: "REJECTED" },
	{ label: "Suspended", value: "SUSPENDED" },
]

export default function SpacePartnersPage() {
	const canApprove = usePermission("spaceProfile.approve")

	const [page, setPage] = useState(1)
	const [profileStatusFilter, setProfileStatusFilter] = useState<ProfileStatusFilter>("ALL")
	const [cityInput, setCityInput] = useState("")
	const [cityFilter, setCityFilter] = useState("")
	const [search, setSearch] = useState("")

	const fetcher = useCallback(
		() =>
			getSpacePartnersReps({
				page,
				limit: PAGE_LIMIT,
				...(profileStatusFilter !== "ALL" && { profileStatus: profileStatusFilter }),
				...(cityFilter && { city: cityFilter }),
			}).then(r => ({ items: r.spacePartners, total: r.total })),
		[page, profileStatusFilter, cityFilter],
	)

	const {
		items: spacePartners,
		total,
		isLoading,
		error,
	} = usePaginatedFetch(fetcher, "Failed to load space partners")

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		if (!q) return spacePartners
		return spacePartners.filter(
			s =>
				s.businessName.toLowerCase().includes(q) ||
				s.user.email.toLowerCase().includes(q) ||
				`${s.user.firstName} ${s.user.lastName}`.toLowerCase().includes(q),
		)
	}, [spacePartners, search])

	const columns = useMemo<ColumnDef<SpacePartnerRep>[]>(
		() => [
			{
				id: "space",
				header: "Space Partner",
				cell: ({ row }) => {
					const s = row.original
					return (
						<TwoLineCell
							primary={s.businessName}
							secondary={`${s.user.firstName} ${s.user.lastName} · ${s.user.email}`}
						/>
					)
				},
			},
			{
				id: "cities",
				header: "Cities",
				cell: ({ row }) => {
					const cities = row.original.operatingCities
					if (!cities?.length) return <span className="text-[11px] text-text-tertiary">—</span>
					return (
						<span className="text-xs text-text-primary">
							{cities.slice(0, 2).join(", ")}
							{cities.length > 2 && (
								<span className="text-text-tertiary"> +{cities.length - 2}</span>
							)}
						</span>
					)
				},
			},
			{
				id: "phone",
				header: "Phone",
				cell: ({ row }) => row.original.phone
					? <ChipCell>{row.original.phone}</ChipCell>
					: <span className="text-[11px] text-text-tertiary">—</span>,
			},
			{
				id: "profileStatus",
				header: "Community Space Profile",
				cell: ({ row }) => <StatusCell status={row.original.profileStatus} />,
			},
			{
				id: "joined",
				header: "Joined",
				cell: ({ row }) => <DateCell value={row.original.createdAt} format={formatDate} secondary />,
			},
		],
		[],
	)

	const totalPages = Math.ceil(total / PAGE_LIMIT)

	if (!canApprove) return <PermissionGuard message="You don't have permission to view space partners." />

	return (
		<div className="p-6 space-y-5 max-w-7xl mx-auto">
			<PageHeader
				title="Community Space Reps"
				description="View all space partner accounts on the platform."
			/>

			<div className="flex items-center gap-2 flex-wrap">
				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search by name or email…"
					className="flex-1 min-w-48 max-w-xs"
				/>

				<FilterSelect
					value={profileStatusFilter}
					onChange={v => {
						setProfileStatusFilter(v as ProfileStatusFilter)
						setPage(1)
					}}
					options={PROFILE_STATUS_TABS}
				/>

				<form onSubmit={e => { e.preventDefault(); setPage(1); setCityFilter(cityInput.trim()) }}>
					<ClearableInput
						value={cityInput}
						onChange={setCityInput}
						showClear={!!cityFilter}
						onClear={() => {
							setCityInput("")
							setCityFilter("")
							setPage(1)
						}}
						placeholder="Filter by city…"
					/>
				</form>
			</div>

			<DataView
				error={error}
				isLoading={isLoading}
				columns={columns}
				data={filtered}
				emptyMessage="No space partners match the current filters."
				pagination={{ page, totalPages, total, pageSize: PAGE_LIMIT, onPageChange: setPage }}
			/>
		</div>
	)
}
