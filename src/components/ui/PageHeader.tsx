type PageHeaderProps = {
	title: string
	description?: string
	buttons?: React.ReactNode
}

const PageHeader = ({ title, description, buttons }: PageHeaderProps) => {
	return (
		<div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
			<div className="flex flex-col">
				<h1 className="text-[32px] font-black font-heading text-black tracking-tight leading-none">
					{title}
				</h1>
				{description && <p className="text-sm font-semibold text-black/50 mt-1">{description}</p>}
			</div>
			{buttons && <div className="flex items-center gap-2">{buttons}</div>}
		</div>
	)
}

export default PageHeader
