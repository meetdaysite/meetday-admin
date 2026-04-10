"use client"

import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { useAuthInit } from "@/lib/hooks/use-auth-init"

export function DashboardShell({ children }: { children: React.ReactNode }) {
	useAuthInit()
	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<Sidebar />
			<div className="flex-1 flex flex-col overflow-hidden min-w-0">
				<Topbar />
				<main className="flex-1 overflow-y-auto">{children}</main>
			</div>
		</div>
	)
}
