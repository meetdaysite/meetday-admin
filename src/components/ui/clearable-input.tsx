type ClearableInputProps = {
	value: string
	onChange: (v: string) => void
	showClear: boolean
	onClear: () => void
	placeholder?: string
	inputClassName?: string
}

export function ClearableInput({
	value,
	onChange,
	showClear,
	onClear,
	placeholder,
	inputClassName,
}: ClearableInputProps) {
	return (
		<div className="flex items-center gap-1.5">
			<input
				type="text"
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
				className={`rounded-lg border border-border-default bg-surface-canvas px-3 h-10 text-xs text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors w-36 ${inputClassName ? ` ${inputClassName}` : ""}`}
			/>
			{showClear && (
				<button
					type="button"
					onClick={onClear}
					className="rounded-lg border border-border-default px-2.5 h-10 text-xs text-text-primary hover:bg-neutral-50 transition-colors"
				>
					Clear
				</button>
			)}
		</div>
	)
}
