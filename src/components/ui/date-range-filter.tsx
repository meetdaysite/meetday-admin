type DateRangeFilterProps = {
	from: string
	to: string
	onFromChange: (v: string) => void
	onToChange: (v: string) => void
}

export function DateRangeFilter({ from, to, onFromChange, onToChange }: DateRangeFilterProps) {
	return (
		<>
			<input
				type="date"
				value={from}
				onChange={e => onFromChange(e.target.value)}
				className="rounded-lg border border-border-default bg-surface-canvas px-3 h-10 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
			/>
			<span className="text-xs text-text-tertiary">to</span>
			<input
				type="date"
				value={to}
				onChange={e => onToChange(e.target.value)}
				className="rounded-lg border border-border-default bg-surface-canvas px-3 h-10 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors"
			/>
		</>
	)
}
