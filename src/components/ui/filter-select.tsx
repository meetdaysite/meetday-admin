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
			className={`rounded-2xl border-[3px] border-black bg-white px-3 h-10 text-sm font-semibold text-black focus:bg-neutral-50 focus:outline-none transition-colors cursor-pointer${className ? ` ${className}` : ""}`}
		>
			{options.map(o => (
				<option key={o.value} value={o.value}>
					{o.label}
				</option>
			))}
		</select>
	)
}
