type FilterSelectOption<T extends string> = {
	label: string
	value: T
}

type FilterSelectProps<T extends string> = {
	value: T
	onChange: (value: T) => void
	options: FilterSelectOption<T>[]
	className?: string
}

export function FilterSelect<T extends string>({
	value,
	onChange,
	options,
	className,
}: FilterSelectProps<T>) {
	return (
		<select
			value={value}
			onChange={e => onChange(e.target.value as T)}
			className={`rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors${className ? ` ${className}` : ""}`}
		>
			{options.map(o => (
				<option key={o.value} value={o.value}>
					{o.label}
				</option>
			))}
		</select>
	)
}
