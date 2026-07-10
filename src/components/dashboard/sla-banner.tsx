"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, X, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type SlaBannerProps = {
	hostsOverdue: number
	eventsOverdue: number
	/** SLA threshold in hours shown to user */
	thresholdHours?: number
}

export function SlaBanner({ hostsOverdue, eventsOverdue, thresholdHours = 48 }: SlaBannerProps) {
	const [dismissed, setDismissed] = useState(false)

	const total = hostsOverdue + eventsOverdue
	if (total === 0 || dismissed) return null

	const parts: string[] = []
	if (hostsOverdue > 0)
		parts.push(`${hostsOverdue} host${hostsOverdue > 1 ? "s" : ""}`)
	if (eventsOverdue > 0)
		parts.push(`${eventsOverdue} event${eventsOverdue > 1 ? "s" : ""}`)

	const primaryHref = hostsOverdue > 0 ? "/hosts/queue" : "/events/queue"

	return (
		<div
			role="alert"
			className={cn(
				"flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3",
				"text-sm text-amber-900",
			)}
		>
			<AlertTriangle
				size={16}
				className="mt-0.5 shrink-0 text-amber-500"
				aria-hidden
			/>

			<div className="flex-1 min-w-0">
				<p className="font-semibold leading-snug">
					SLA alert — {parts.join(" and ")}{" "}
					{total === 1 ? "has been" : "have been"} pending for over {thresholdHours}h
				</p>
				<p className="mt-0.5 text-xs text-amber-700">
					Review now to stay within SLA.{" "}
					<Link
						href={primaryHref}
						className="inline-flex items-center gap-0.5 font-medium underline underline-offset-2 hover:text-amber-900 transition-colors"
					>
						Go to queue <ArrowRight size={11} />
					</Link>
				</p>
			</div>

			<button
				onClick={() => setDismissed(true)}
				aria-label="Dismiss SLA warning"
				className="shrink-0 rounded p-0.5 text-amber-500 hover:bg-amber-100 hover:text-amber-800 transition-colors"
			>
				<X size={14} />
			</button>
		</div>
	)
}
