import { cn } from "@/lib/utils"

type ErrorBannerProps = {
	children: React.ReactNode
	className?: string
}

export function ErrorBanner({ children, className }: ErrorBannerProps) {
	return (
		<div
			className={cn(
				"rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700",
				className,
			)}
		>
			{children}
		</div>
	)
}
