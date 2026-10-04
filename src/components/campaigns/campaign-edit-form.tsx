"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { TextField } from "@/components/ui/TextField"
import type { Campaign, CampaignUpdatePayload } from "@/types"

type CampaignEditFormProps = {
	campaign: Campaign
	onCancel: () => void
	onSubmit: (payload: CampaignUpdatePayload) => Promise<void>
}

function toDateInput(value: string) {
	return value ? value.slice(0, 10) : ""
}

function splitList(value: string) {
	return value.split(",").map(item => item.trim()).filter(Boolean)
}

export function CampaignEditForm({ campaign, onCancel, onSubmit }: CampaignEditFormProps) {
	const [name, setName] = useState(campaign.name)
	const [goal, setGoal] = useState(campaign.goal)
	const [locations, setLocations] = useState(campaign.locations.join(", "))
	const [audience, setAudience] = useState(campaign.audience.join(", "))
	const [startDate, setStartDate] = useState(toDateInput(campaign.startDate))
	const [endDate, setEndDate] = useState(toDateInput(campaign.endDate))
	const [offerType, setOfferType] = useState<Campaign["offerType"]>(campaign.offerType)
	const [budgetAmount, setBudgetAmount] = useState(String(campaign.budgetAmount ?? 0))
	const [budgetCurrency, setBudgetCurrency] = useState(campaign.budgetCurrency)
	const [barterElements, setBarterElements] = useState(campaign.barterElements ?? "")
	const [description, setDescription] = useState(campaign.description ?? "")
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		const amount = Number(budgetAmount)
		const nextLocations = splitList(locations)
		if (!name.trim() || !goal.trim() || !startDate || !endDate || !nextLocations.length) {
			setError("Name, goal, run dates, and at least one location are required.")
			return
		}
		if (endDate < startDate) {
			setError("End date cannot be before start date.")
			return
		}
		if (!Number.isFinite(amount) || amount < 0) {
			setError("Budget must be a valid non-negative amount.")
			return
		}

		setError(null)
		setSaving(true)
		try {
			await onSubmit({
				name: name.trim(),
				goal: goal.trim(),
				locations: nextLocations,
				audience: splitList(audience),
				startDate: new Date(`${startDate}T00:00:00.000Z`).toISOString(),
				endDate: new Date(`${endDate}T00:00:00.000Z`).toISOString(),
				offerType,
				budgetAmount: amount,
				budgetCurrency: budgetCurrency.trim() || "INR",
				barterElements: barterElements.trim(),
				description: description.trim(),
			})
		} finally {
			setSaving(false)
		}
	}

	return (
		<form id="campaign-edit-form" onSubmit={handleSubmit} className="space-y-4">
			<TextField label="Campaign Name" value={name} onChange={e => setName(e.target.value)} required />
			<TextField label="Campaign Goal" value={goal} onChange={e => setGoal(e.target.value)} required />
			<TextField
				label="Target Locations"
				hint="Comma separated"
				value={locations}
				onChange={e => setLocations(e.target.value)}
				required
			/>
			<TextField
				label="Target Audience"
				hint="Comma separated"
				value={audience}
				onChange={e => setAudience(e.target.value)}
			/>
			<div className="grid grid-cols-2 gap-3">
				<TextField label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
				<TextField
					label="End Date"
					type="date"
					min={startDate || undefined}
					value={endDate}
					onChange={e => setEndDate(e.target.value)}
					required
				/>
			</div>
			<div className="grid grid-cols-3 gap-3">
				<label className="flex flex-col gap-1.5 text-label-sm font-semibold text-text-primary">
					Offer Type
					<select
						value={offerType}
						onChange={e => setOfferType(e.target.value as Campaign["offerType"])}
						className="h-[var(--size-input-md)] rounded-input border border-border-default bg-surface-canvas px-3 text-sm font-normal"
					>
						<option value="CASH">Cash</option>
						<option value="BARTER">Barter</option>
						<option value="BOTH">Both</option>
					</select>
				</label>
				<TextField
					label="Budget"
					type="number"
					min="0"
					value={budgetAmount}
					onChange={e => setBudgetAmount(e.target.value)}
				/>
				<TextField label="Currency" value={budgetCurrency} onChange={e => setBudgetCurrency(e.target.value)} />
			</div>
			<label className="flex flex-col gap-1.5 text-label-sm font-semibold text-text-primary">
				Barter Elements
				<textarea
					value={barterElements}
					onChange={e => setBarterElements(e.target.value)}
					rows={3}
					className="rounded-input border border-border-default bg-surface-canvas px-3 py-2 text-sm font-normal"
				/>
			</label>
			<label className="flex flex-col gap-1.5 text-label-sm font-semibold text-text-primary">
				Description
				<textarea
					value={description}
					onChange={e => setDescription(e.target.value)}
					rows={5}
					className="rounded-input border border-border-default bg-surface-canvas px-3 py-2 text-sm font-normal"
				/>
			</label>
			{error && <p className="text-xs font-medium text-red-600">{error}</p>}
			<div className="flex justify-end gap-2 pt-2">
				<button
					type="button"
					onClick={onCancel}
					disabled={saving}
					className="rounded-lg border border-border-default px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={saving}
					className="flex items-center gap-1.5 rounded-lg bg-action-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover disabled:opacity-70"
				>
					{saving && <Loader2 size={12} className="animate-spin" />}
					Save Changes
				</button>
			</div>
		</form>
	)
}
