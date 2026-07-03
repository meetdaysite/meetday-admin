"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Percent } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { Skeleton } from "@/components/ui/skeleton"
import { RateRow } from "@/components/platform-config/rate-row"
import { usePermission } from "@/lib/hooks/use-permission"
import { getPlatformConfig, updateGstRate, type PlatformConfig } from "@/lib/api/platform-config"
// Subscription plan fees — commented out for now, see handleSavePlanFeeRate below
// import { updatePlanFeeRate } from "@/lib/api/platform-config"
// import type { HostPlan } from "@/types"

// Helpers

// const PLAN_LABELS: Record<HostPlan, string> = {
// 	DISCOVER: "Discover",
// 	SELL: "Sell",
// 	COMMUNITY: "Community",
// }
//
// const PLANS: HostPlan[] = ["DISCOVER", "SELL", "COMMUNITY"]

function parseRate(config: PlatformConfig, key: string): number | null {
	const raw = config[key]
	if (raw == null) return null
	const parsed = Number(raw)
	return Number.isNaN(parsed) ? null : parsed
}

// Skeleton

function PlatformConfigSkeleton() {
	return (
		<div className="p-6 space-y-6 max-w-2xl mx-auto animate-pulse">
			<div className="h-5 w-40 bg-neutral-200 rounded" />
			<div className="bg-surface-card rounded-xl border border-border-default p-6 space-y-4">
				<Skeleton className="h-4 w-32" />
				<div className="divide-y divide-border-subtle">
					<div className="py-4 flex items-center justify-between">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-8 w-20 rounded-lg" />
					</div>
				</div>
			</div>
		</div>
	)
}

// Page

type PageState = "loading" | "done" | "error" | "access-denied"

export default function PlatformConfigPage() {
	const router = useRouter()
	const canView = usePermission("platform.config")

	const [state, setState] = useState<PageState>("loading")
	const [config, setConfig] = useState<PlatformConfig>({})
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	useEffect(() => {
		if (!canView) return

		let cancelled = false

		// eslint-disable-next-line react-hooks/set-state-in-effect
		setState("loading")
		setErrorMessage(null)

		getPlatformConfig()
			.then(data => {
				if (cancelled) return
				setConfig(data)
				setState("done")
			})
			.catch((err: unknown) => {
				if (cancelled) return
				const status = (err as { response?: { status?: number } })?.response?.status
				if (status === 401) {
					router.replace("/login")
					return
				}
				if (status === 403) {
					setState("access-denied")
					return
				}
				setErrorMessage("Something went wrong. Please try again.")
				setState("error")
			})

		return () => {
			cancelled = true
		}
	}, [canView, router])

	async function handleSaveGstRate(value: number) {
		const { gstRate } = await updateGstRate(value)
		setConfig(prev => ({ ...prev, gst_rate: String(gstRate) }))
	}

	// Subscription plan fees — commented out for now
	// async function handleSavePlanFeeRate(plan: HostPlan, value: number) {
	// 	await updatePlanFeeRate(plan, value)
	// 	setConfig(prev => ({ ...prev, [`${plan.toLowerCase()}_fee_rate`]: String(value) }))
	// }

	if (!canView) {
		return <PermissionGuard message="Platform configuration is accessible to Super Admins only." />
	}

	if (state === "loading") return <PlatformConfigSkeleton />

	if (state === "access-denied") {
		return <PermissionGuard message="Platform configuration is accessible to Super Admins only." />
	}

	if (state === "error") {
		return (
			<div className="p-6 max-w-2xl mx-auto">
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<AlertTriangle size={32} className="mb-3 text-neutral-300" />
					<p className="text-sm font-semibold text-text-primary">Something went wrong</p>
					<p className="mt-1 text-xs text-text-tertiary">
						{errorMessage ?? "Unable to load platform config."}
					</p>
				</div>
			</div>
		)
	}

	const gstRate = parseRate(config, "gst_rate")

	return (
		<div className="p-6 space-y-6 max-w-2xl mx-auto">
			<PageHeader
				title="Platform Config"
				description="Manage platform-wide tax rate."
			/>

			{/* GST */}
			<div className="bg-surface-card rounded-xl border border-border-default overflow-hidden">
				<div className="p-6 flex items-center gap-3 border-b border-border-subtle">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-brand-soft text-text-brand shrink-0">
						<Percent size={16} />
					</div>
					<div>
						<p className="text-sm font-semibold text-text-primary">Tax</p>
						<p className="text-xs text-text-tertiary">GST applied to all new orders.</p>
					</div>
				</div>
				<div className="px-6 divide-y divide-border-subtle">
					<RateRow
						label="GST Rate"
						description="Applied to all new orders platform-wide."
						value={gstRate}
						onSave={handleSaveGstRate}
					/>
				</div>
			</div>

			{/* Subscription plan fees — commented out for now
			<div className="bg-surface-card rounded-xl border border-border-default overflow-hidden">
				<div className="p-6 flex items-center gap-3 border-b border-border-subtle">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-brand-soft text-text-brand shrink-0">
						<Wallet size={16} />
					</div>
					<div>
						<p className="text-sm font-semibold text-text-primary">Subscription Plan Fees</p>
						<p className="text-xs text-text-tertiary">
							Platform fee rate charged to hosts on each subscription plan.
						</p>
					</div>
				</div>
				<div className="px-6 divide-y divide-border-subtle">
					{PLANS.map(plan => (
						<RateRow
							key={plan}
							label={`${PLAN_LABELS[plan]} Plan`}
							description={`Platform fee rate for the ${PLAN_LABELS[plan]} subscription plan.`}
							value={parseRate(config, `${plan.toLowerCase()}_fee_rate`)}
							onSave={value => handleSavePlanFeeRate(plan, value)}
						/>
					))}
				</div>
			</div>
			*/}
		</div>
	)
}
