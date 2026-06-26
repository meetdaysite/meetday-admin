"use client"

import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { useAuthInit } from "@/lib/hooks/use-auth-init"
import { useAuthStore } from "@/stores/auth.store"
import { SkeletonDashboardShell } from "@/components/ui/skeleton"

export function DashboardShell({ children }: { children: React.ReactNode }) {
	useAuthInit()
	const isInitializing = useAuthStore((s) => s.isInitializing)

	if (isInitializing) {
		return <SkeletonDashboardShell />
	}

	return (
		<div className="flex h-screen overflow-hidden bg-surface-page">
			<Sidebar />
			<div className="flex-1 flex flex-col overflow-hidden min-w-0">
				<Topbar />
				<main className="flex-1 overflow-y-auto">{children}</main>
			</div>
		</div>
	)
}
