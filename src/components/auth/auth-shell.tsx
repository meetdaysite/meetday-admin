import Image from "next/image"

interface AuthShellProps {
	children: React.ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
	return (
		<div className="min-h-screen flex">
			{/* Left brand panel â€” desktop only */}
			<div className="hidden lg:flex w-110 xl:w-125 shrink-0 bg-action-primary flex-col justify-between p-12 relative overflow-hidden">
				{/* Decorative rings */}
				<div className="absolute -bottom-40 -right-40 w-120 h-120 rounded-full border border-white/10 pointer-events-none" />
				<div className="absolute -bottom-20 -right-20 w-[320px] h-80 rounded-full border border-white/10 pointer-events-none" />

				{/* Logo */}
				<Image src="/brand_logo.svg" alt="Meetday" width={160} height={43} className="brightness-0 invert" />

				{/* Tagline */}
				<div className="space-y-4 relative">
					<p className="text-white text-[2.6rem] xl:text-[3rem] font-extrabold leading-[1.1]">
						Managing great events,{" "}
						<span className="text-white/55">one city at a time.</span>
					</p>
					<p className="text-white/55 text-sm leading-relaxed max-w-75">
						Internal operations tooling. Restricted to authorized Meetday personnel only.
					</p>
				</div>

				{/* Footer */}
				<div className="flex items-center gap-2 relative">
					<div className="w-1.5 h-1.5 rounded-full bg-white/35" />
					<span className="text-white/35 text-xs">Meetday Inc. Â© {new Date().getFullYear()}</span>
				</div>
			</div>

			{/* Right form area */}
			<div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-surface-page">
				{/* Mobile logo */}
				<div className="lg:hidden mb-10 w-full max-w-md">
					<Image src="/brand_logo.svg" alt="Meetday" width={140} height={38} />
				</div>

				<div className="w-full max-w-md">{children}</div>
			</div>
		</div>
	)
}
