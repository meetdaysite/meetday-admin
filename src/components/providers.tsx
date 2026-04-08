"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip"
import { useState } from "react"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
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
						background: "#fafafa",
						color: "#171717",
						border: "1px solid #bcbcbc",
					},
				}}
			/>
		</QueryClientProvider>
	)
}
