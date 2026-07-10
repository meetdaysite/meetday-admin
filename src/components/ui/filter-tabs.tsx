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
					className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium border transition-colors ${
						value === opt.value
							? "bg-surface-brand-soft text-text-brand hover:bg-red-100 border-border-focus/20"
							: "bg-neutral-50 text-text-primary hover:bg-neutral-100 border-border-default"
					}`}
				>
					{opt.label}
				</button>
			))}
		</div>
	)
}
