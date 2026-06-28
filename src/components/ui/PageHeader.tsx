type PageHeaderProps = {
	title: string
	description?: string
	buttons?: React.ReactNode
}

const PageHeader = ({ title, description, buttons }: PageHeaderProps) => {
	return (
		<div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
			<div className="flex flex-col">
				<h1 className="text-heading-sm tracking-[-0.02em] font-semibold text-text-primary">
					{title}
				</h1>
				{description && <p className="text-sm text-text-tertiary">{description}</p>}
			</div>
			{buttons && <div className="flex items-center gap-2">{buttons}</div>}
		</div>
	)
}

export default PageHeader
