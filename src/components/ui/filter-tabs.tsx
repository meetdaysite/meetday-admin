type FilterTabsProps<T extends string> = {
	options: { label: string; value: T }[]
	value: T
	onChange: (value: T) => void
}

export function FilterTabs<T extends string>({ options, value, onChange }: FilterTabsProps<T>) {
	return (
		<div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
			{options.map(opt => (
				<button
					key={opt.value}
					onClick={() => onChange(opt.value)}
					className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
						value === opt.value
							? "bg-action-primary text-white"
							: "bg-neutral-100 text-text-secondary hover:bg-neutral-200"
					}`}
				>
					{opt.label}
				</button>
			))}
		</div>
	)
}
