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
				className={`rounded-2xl border-[3px] border-black bg-white px-3.5 h-10 text-sm font-semibold text-black placeholder:text-neutral-400 focus:bg-neutral-50 focus:outline-none transition-colors w-36${inputClassName ? ` ${inputClassName}` : ""}`}
			/>
			{showClear && (
				<button
					type="button"
					onClick={onClear}
					className="rounded-2xl border-[3px] border-black px-3.5 h-10 text-xs font-black uppercase tracking-wider bg-[#FFC940] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
				>
					Clear
				</button>
			)}
		</div>
	)
}
