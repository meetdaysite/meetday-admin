"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { MapPin, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { getInterests } from "@/lib/api/interests"
import {
	replaceCommunityInterests,
	setCommunityCities,
	attachCommunityEvent,
	resyncCommunityEvents,
} from "@/lib/api/communities"
import { useCreateCommunityStore } from "@/stores/create-community.store"
import { TagMultiSelect, type TagOption } from "../ui/tag-multi-select"
import { TagTextInput } from "../ui/tag-text-input"
import { EventSearchAttach, type AttachedEvent } from "../ui/event-search-attach"
import type { Step3Snapshot } from "@/stores/create-community.store"

type FormValues = {
	interestIds: TagOption[]
	cities: string[]
	primaryCity: string
	manualEvents: AttachedEvent[]
}

export function Step3ExperienceMapping() {
	const store = useCreateCommunityStore()
	const [interestOptions, setInterestOptions] = useState<TagOption[]>([])
	const [interestsLoading, setInterestsLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)

	const snap = store.step3Snapshot
	const step1 = store.step1Data

	const { control, handleSubmit, watch, setValue } = useForm<FormValues>({
		defaultValues: {
			interestIds: snap?.interests.map(i => ({ id: i.id, label: i.name })) ?? [],
			cities: snap?.cities ?? (step1?.primaryCity ? [step1.primaryCity] : []),
			primaryCity: snap?.primaryCity ?? step1?.primaryCity ?? "",
			manualEvents: snap?.manualEvents ?? [],
		},
	})

	const watchedCities = watch("cities")
	const watchedPrimary = watch("primaryCity")
	const watchedEvents = watch("manualEvents")

	// Keep primaryCity in sync — if removed from cities list, default to first city
	useEffect(() => {
		if (watchedCities.length > 0 && !watchedCities.includes(watchedPrimary)) {
			setValue("primaryCity", watchedCities[0])
		}
		if (watchedCities.length === 0) {
			setValue("primaryCity", "")
		}
	}, [watchedCities, watchedPrimary, setValue])

	useEffect(() => {
		getInterests()
			.then(data => setInterestOptions(data.map(i => ({ id: i.id, label: i.name }))))
			.catch(() => toast.error("Failed to load interests"))
			.finally(() => setInterestsLoading(false))
	}, [])

	const onSubmit = async (data: FormValues) => {
		if (!store.communityId) return
		if (data.interestIds.length === 0) {
			toast.error("Select at least one community interest")
			return
		}
		if (data.cities.length === 0) {
			toast.error("Add at least one city")
			return
		}

		setSubmitting(true)
		try {
			// Step 3.1 + 3.2 in parallel
			await Promise.all([
				replaceCommunityInterests(
					store.communityId,
					data.interestIds.map(i => i.id),
				),
				setCommunityCities(store.communityId, {
					primaryCity: data.primaryCity || data.cities[0],
					communityCities: data.cities,
				}),
			])

			// Step 3.4 — attach manual events (parallel, best-effort)
			if (data.manualEvents.length > 0) {
				const results = await Promise.allSettled(
					data.manualEvents.map(e => attachCommunityEvent(store.communityId!, e.id)),
				)
				const failed = results.filter(r => r.status === "rejected").length
				if (failed > 0) toast.warning(`${failed} event(s) could not be attached — they were skipped.`)
			}

			// Step 3.5 — always resync
			await resyncCommunityEvents(store.communityId)

			const interests = await getInterests()
			const selectedInterests = interests.filter(i => data.interestIds.some(t => t.id === i.id))

			store.setStep3Snapshot({
				interests: selectedInterests,
				primaryCity: data.primaryCity || data.cities[0],
				cities: data.cities,
				manualEvents: data.manualEvents,
			})
			store.nextStep()
		} catch {
			toast.error("Failed to save experience mapping. Please try again.")
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
			{/* 1. Community Interests */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<h2 className="text-label-md font-semibold text-text-primary mb-1">1. Community Interests</h2>
				<p className="text-caption text-text-secondary mb-4">
					Select the interests that best describe this community.
				</p>
				<Controller
					name="interestIds"
					control={control}
					render={({ field }) => (
						<TagMultiSelect
							options={interestOptions}
							value={field.value}
							onChange={field.onChange}
							placeholder="Search interests..."
							loading={interestsLoading}
						/>
					)}
				/>
				<div className="mt-2 flex items-center gap-1.5 text-caption text-text-secondary">
					<MapPin size={11} />
					Events with these interests will be matched to this community.
				</div>
			</div>

			{/* 2. Community Cities */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<h2 className="text-label-md font-semibold text-text-primary mb-1">2. Community Cities</h2>
				<p className="text-caption text-text-secondary mb-4">
					Choose the cities where this community is relevant.
				</p>

				<Controller
					name="cities"
					control={control}
					render={({ field }) => (
						<TagTextInput
							value={field.value}
							onChange={field.onChange}
							placeholder="Type a city and press Enter..."
							icon={<MapPin size={10} />}
						/>
					)}
				/>

				{watchedCities.length > 1 && (
					<div className="mt-3 flex flex-col gap-1.5">
						<p className="text-caption font-medium text-text-secondary">Primary city</p>
						<Controller
							name="primaryCity"
							control={control}
							render={({ field }) => (
								<div className="flex flex-wrap gap-2">
									{watchedCities.map(city => (
										<button
											key={city}
											type="button"
											onClick={() => field.onChange(city)}
											className={`flex items-center gap-1.5 rounded-badge border px-3 py-1 text-caption font-medium transition-colors ${
												field.value === city
													? "border-action-primary bg-surface-brand-soft text-text-brand"
													: "border-border-default bg-surface-canvas text-text-secondary hover:border-border-strong"
											}`}
										>
											<MapPin size={10} />
											{city}
											{field.value === city && <span className="text-[10px]">★</span>}
										</button>
									))}
								</div>
							)}
						/>
						<p className="text-caption text-text-secondary">Click a city to set it as primary.</p>
					</div>
				)}

				<div className="mt-2 flex items-center gap-1.5 text-caption text-text-secondary">
					<MapPin size={11} />
					Events happening in these cities will be matched.
				</div>
			</div>

			{/* 3. Auto-matching */}
			<div className="rounded-panel border border-[#e8f5e9] bg-[#f0fdf4] p-5 shadow-card">
				<div className="flex items-start gap-3">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dcfce7]">
						<Sparkles size={14} className="text-[#16a34a]" />
					</div>
					<div>
						<p className="text-label-sm font-semibold text-[#16a34a]">
							Auto-matching is always on
						</p>
						<p className="text-caption text-[#166534] mt-0.5">
							After saving this step, Meetday will automatically compute matching events based
							on the interests and cities you selected above. Any event with at least one
							matching interest happening in one of the selected cities will appear in this
							community.
						</p>
					</div>
				</div>
			</div>

			{/* 4. Manually Added Events */}
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card">
				<div className="flex items-center justify-between mb-1">
					<h2 className="text-label-md font-semibold text-text-primary">
						3. Manually Added Events{" "}
						<span className="text-text-secondary font-normal">(Optional)</span>
					</h2>
				</div>
				<p className="text-caption text-text-secondary mb-4">
					Add specific events that should always be part of this community.
				</p>
				<Controller
					name="manualEvents"
					control={control}
					render={({ field }) => (
						<EventSearchAttach value={field.value} onChange={field.onChange} />
					)}
				/>
				{watchedEvents.length > 0 && (
					<p className="mt-2 text-caption text-text-secondary">
						These events will always be shown in this community, even if they don&apos;t match the
						rules above.
					</p>
				)}
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between">
				<Button
					type="button"
					variant="secondary"
					size="md"
					radius="md"
					onClick={() => store.prevStep()}
				>
					← Back
				</Button>
				<Button
					type="submit"
					variant="primary"
					size="md"
					radius="md"
					disabled={submitting}
					rightIcon={submitting ? <Loader2 size={15} className="animate-spin" /> : undefined}
				>
					{submitting ? "Saving..." : "Continue →"}
				</Button>
			</div>
		</form>
	)
}
