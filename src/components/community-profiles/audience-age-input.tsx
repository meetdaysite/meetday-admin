"use client"

import React, { useEffect, useState } from "react"
import { parseAudienceAge, formatAudienceAge } from "./audience-age-utils"

interface AudienceAgeInputProps {
	value: string
	onChange: (val: string) => void
	disabled?: boolean
	labelClass?: string
	inputClass?: string
}

export function AudienceAgeInput({
	value,
	onChange,
	disabled = false,
	labelClass,
	inputClass,
}: AudienceAgeInputProps) {
	const parsed = parseAudienceAge(value)
	const [minAge, setMinAge] = useState(parsed.minAge)
	const [maxAge, setMaxAge] = useState(parsed.maxAge)
	const [isAndAbove, setIsAndAbove] = useState(parsed.isAndAbove)

	useEffect(() => {
		const next = parseAudienceAge(value)
		setMinAge(next.minAge)
		setMaxAge(next.maxAge)
		setIsAndAbove(next.isAndAbove)
	}, [value])

	function triggerChange(nextMin: string, nextMax: string, nextAndAbove: boolean) {
		const formatted = formatAudienceAge(nextMin, nextMax, nextAndAbove)
		onChange(formatted)
	}

	const baseInput =
		inputClass ||
		"w-full rounded-xl border border-border-default bg-surface-card px-3.5 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong disabled:bg-surface-subtle"

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<label className={labelClass || "block text-xs font-medium text-text-secondary"}>
					Audience age
				</label>
				<span className="text-[11px] text-text-tertiary">Range (e.g. 18 to 25) or (e.g. 21 and above)</span>
			</div>

			<div className="flex items-center gap-2">
				<div className="flex-1">
					<input
						type="number"
						min="0"
						max="120"
						placeholder="Min age (18)"
						value={minAge}
						disabled={disabled}
						onChange={(e) => {
							const val = e.target.value
							setMinAge(val)
							triggerChange(val, maxAge, isAndAbove)
						}}
						className={baseInput}
					/>
				</div>

				{!isAndAbove && (
					<>
						<span className="text-xs font-medium text-text-tertiary">to</span>
						<div className="flex-1">
							<input
								type="number"
								min={minAge || "0"}
								max="120"
								placeholder="Max age (25)"
								value={maxAge}
								disabled={disabled}
								onChange={(e) => {
									const val = e.target.value
									setMaxAge(val)
									triggerChange(minAge, val, isAndAbove)
								}}
								className={baseInput}
							/>
						</div>
					</>
				)}

				<button
					type="button"
					disabled={disabled}
					onClick={() => {
						const nextAndAbove = !isAndAbove
						setIsAndAbove(nextAndAbove)
						if (nextAndAbove) setMaxAge("")
						triggerChange(minAge, nextAndAbove ? "" : maxAge, nextAndAbove)
					}}
					className={`h-9 px-3 rounded-xl text-xs font-medium transition-colors border shrink-0 flex items-center gap-1.5 ${
						isAndAbove
							? "bg-text-primary text-surface-card border-text-primary"
							: "bg-surface-card text-text-secondary border-border-default hover:bg-surface-subtle"
					}`}
				>
					<span className={`w-1.5 h-1.5 rounded-full ${isAndAbove ? "bg-white" : "bg-text-tertiary"}`} />
					and above
				</button>
			</div>

			{value && (
				<p className="text-[11px] text-text-secondary">
					Selected: <span className="font-medium text-text-primary">{value}</span>
				</p>
			)}
		</div>
	)
}
