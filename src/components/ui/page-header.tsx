type PageHeaderProps = {
	title: string
	count?: number | string
	children?: React.ReactNode
}

export function PageHeader({ title, count, children }: PageHeaderProps) {
	return (
		<div className="flex items-center gap-3">
			<h1 className="text-base font-semibold text-text-primary">{title}</h1>
			{count != null && (
				<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
					{count}
				</span>
			)}
			{children && <div className="ml-auto flex items-center gap-2">{children}</div>}
		</div>
	)
}
