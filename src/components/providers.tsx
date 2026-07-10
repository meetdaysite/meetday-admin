"use client"

import { useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip"
import { useState } from "react"
import { Toaster } from "sonner"
import { useAuthStore } from "@/stores/auth.store"

export function Providers({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		const unsub = useAuthStore.persist.onFinishHydration((state) => {
			if (!state?.token) {
				useAuthStore.getState().setInitialized()
			}
		})
		useAuthStore.persist.rehydrate()
		return unsub
	}, [])

	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 1000 * 60,
						retry: 1,
					},
				},
			}),
	)

	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider delayDuration={300} skipDelayDuration={100}>
				{children}
			</TooltipProvider>
			<Toaster
				position="top-right"
				toastOptions={{
					style: {
						background: "var(--surface-canvas)",
						color: "#171717",       /* TODO: confirm — close to --text-primary (#111111) but not exact old token */
						border: "1px solid #bcbcbc", /* TODO: confirm — not a defined old token; candidate: var(--border-default) */
					},
				}}
			/>
		</QueryClientProvider>
	)
}
