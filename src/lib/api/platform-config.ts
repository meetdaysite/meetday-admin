import { apiClient } from "./client"
import type { HostPlan } from "@/types"

export type PlatformConfig = Record<string, string>

export async function getPlatformConfig(): Promise<PlatformConfig> {
	const { data } = await apiClient.get<PlatformConfig>("/admin/platform-config")
	return data
}

export async function updateGstRate(gstRate: number): Promise<{ gstRate: number }> {
	const { data } = await apiClient.patch<{ gstRate: number }>("/admin/platform-config/gst-rate", { gstRate })
	return data
}

export type PlanFeeRate = {
	plan: HostPlan
	platformFeeRate: number
}

export async function updatePlanFeeRate(plan: HostPlan, feeRate: number): Promise<PlanFeeRate> {
	const { data } = await apiClient.patch<PlanFeeRate>(`/admin/subscription-plans/${plan}/fee-rate`, { feeRate })
	return data
}
