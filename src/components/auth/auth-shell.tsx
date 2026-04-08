interface AuthShellProps {
	children: React.ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
	return (
		<div className="min-h-screen flex">
			{/* Left brand panel — desktop only */}
			<div className="hidden lg:flex w-[440px] xl:w-[500px] flex-shrink-0 bg-brand-red flex-col justify-between p-12 relative overflow-hidden">
				{/* Decorative rings */}
				<div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full border border-white/10 pointer-events-none" />
				<div className="absolute -bottom-20 -right-20 w-[320px] h-[320px] rounded-full border border-white/10 pointer-events-none" />

				{/* Logo */}
				<div className="flex items-baseline gap-2.5">
					<span className="font-hagrid text-white text-3xl font-extrabold tracking-tight">meetday</span>
					<span className="text-white/50 text-[11px] font-medium tracking-[0.2em] uppercase">admin</span>
				</div>

				{/* Tagline */}
				<div className="space-y-4 relative">
					<p className="font-hagrid text-white text-[2.6rem] xl:text-[3rem] font-extrabold leading-[1.1]">
						Managing great events,{" "}
						<span className="text-white/55">one city at a time.</span>
					</p>
					<p className="text-white/55 text-sm leading-relaxed max-w-[300px]">
						Internal operations tooling. Restricted to authorized Meetday personnel only.
					</p>
				</div>

				{/* Footer */}
				<div className="flex items-center gap-2 relative">
					<div className="w-1.5 h-1.5 rounded-full bg-white/35" />
					<span className="text-white/35 text-xs">Meetday Inc. © {new Date().getFullYear()}</span>
				</div>
			</div>

			{/* Right form area */}
			<div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background">
				{/* Mobile logo */}
				<div className="lg:hidden mb-10 w-full max-w-md">
					<span className="font-hagrid text-foreground text-2xl font-extrabold tracking-tight">meetday</span>
					<span className="ml-2 text-neutral-light text-[11px] font-medium tracking-[0.2em] uppercase">admin</span>
				</div>

				<div className="w-full max-w-md">{children}</div>
			</div>
		</div>
	)
}
