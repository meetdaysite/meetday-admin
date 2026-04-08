"use client"

import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

export function DashboardShell({ children }: { children: React.ReactNode }) {
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
