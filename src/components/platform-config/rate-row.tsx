"use client"

import { useState } from "react"
import { Pencil, Loader2, Check, X } from "lucide-react"
import { toast } from "sonner"
import { TextField } from "@/components/ui/TextField"

type RateRowProps = {
	label: string
	description: string
	value: number | null
	onSave: (value: number) => Promise<void>
}

function formatPercent(value: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "percent",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(value)
}

export function RateRow({ label, description, value, onSave }: RateRowProps) {
	const [editing, setEditing] = useState(false)
	const [draft, setDraft] = useState("")
	const [saving, setSaving] = useState(false)

	function startEdit() {
		setDraft(value != null ? String(value * 100) : "")
		setEditing(true)
	}

	function cancelEdit() {
		setEditing(false)
		setDraft("")
	}

	async function handleSave() {
		const percent = Number(draft)
		if (draft.trim() === "" || Number.isNaN(percent) || percent < 0 || percent > 100) {
			toast.error("Enter a percentage between 0 and 100 (e.g. 18 for 18%)")
			return
		}
		setSaving(true)
		try {
			await onSave(percent / 100)
			toast.success(`${label} updated.`)
			setEditing(false)
		} catch {
			toast.error(`Failed to update ${label.toLowerCase()}. Please try again.`)
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="flex items-center justify-between gap-4 py-4">
			<div className="min-w-0">
				<p className="text-sm font-semibold text-text-primary">{label}</p>
				<p className="mt-0.5 text-xs text-text-tertiary">{description}</p>
			</div>

			{editing ? (
				<div className="flex items-center gap-2 shrink-0">
					<TextField
						size="sm"
						type="number"
						step="0.01"
						min={0}
						max={100}
						autoFocus
						placeholder="18"
						value={draft}
						onChange={e => setDraft(e.target.value)}
						rightIcon={<span className="text-xs text-text-tertiary">%</span>}
						className="w-24"
					/>
					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="flex h-8 w-8 items-center justify-center rounded-lg bg-action-primary text-white hover:bg-action-primary-hover transition-colors disabled:opacity-60"
					>
						{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
					</button>
					<button
						type="button"
						onClick={cancelEdit}
						disabled={saving}
						className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-secondary hover:bg-neutral-50 transition-colors disabled:opacity-60"
					>
						<X size={14} />
					</button>
				</div>
			) : (
				<div className="flex items-center gap-3 shrink-0">
					<div className="text-right">
						<p className="text-sm font-semibold text-text-primary">
							{value != null ? formatPercent(value) : "Not set"}
						</p>
						{value != null && <p className="text-[11px] text-text-tertiary">{value}</p>}
					</div>
					<button
						type="button"
						onClick={startEdit}
						className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-secondary hover:bg-neutral-50 transition-colors"
					>
						<Pencil size={13} />
					</button>
				</div>
			)}
		</div>
	)
}
