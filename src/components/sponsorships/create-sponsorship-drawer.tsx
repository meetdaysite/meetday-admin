"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, X, FileText, Search } from "lucide-react"
import { toast } from "sonner"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { ImageUploadZone } from "@/components/communities/create/ui/image-upload-zone"
import { createSponsorship, updateSponsorship } from "@/lib/api/sponsorships"
import { getHosts } from "@/lib/api/hosts"
import { uploadSponsorshipDocument, uploadSponsorshipImage } from "@/lib/api/storage"
import { VenueAutocompleteInput } from "@/components/sponsorships/venue-autocomplete-input"
import { extractApiErrorMessage } from "@/lib/error-handler"
import type { SponsorshipDetail, SponsorTier } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

// Only the fields actually displayed/used here — matches both the full `Host` type
// (from the host picker) and `SponsorshipDetail.hostProfile` (when editing an existing proposal).
type HostRef = {
	id: string
	displayName: string
	user: { firstName: string; lastName: string; email: string | null }
}

type CreateSponsorshipDrawerProps = {
	open: boolean
	// When set, the drawer edits this existing proposal instead of creating a new one —
	// all fields are pre-filled and the submit calls the update endpoint.
	editingProposal?: SponsorshipDetail | null
	onUpdated?: (proposal: SponsorshipDetail) => void
	onClose: () => void
	onCreated: (proposal: SponsorshipDetail) => void
}

const ACCEPTED_DOC_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
]

const inputClass =
	"w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors disabled:opacity-50"
const labelClass = "block text-xs font-semibold text-text-secondary mb-1.5"

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateSponsorshipDrawer({
	open,
	onClose,
	onCreated,
	editingProposal,
	onUpdated,
}: CreateSponsorshipDrawerProps) {
	const isEditing = !!editingProposal
	const [selectedHost, setSelectedHost] = useState<HostRef | null>(null)
	const [hostPickerOpen, setHostPickerOpen] = useState(false)
	const [hostSearch, setHostSearch] = useState("")
	const [hosts, setHosts] = useState<HostRef[]>([])
	const [hostsLoading, setHostsLoading] = useState(false)

	const [name, setName] = useState("")
	const [about, setAbout] = useState("")
	const [imageKey, setImageKey] = useState<string | null>(null)
	const [imagePreview, setImagePreview] = useState<string | null>(null)
	const [eventDate, setEventDate] = useState("")
	const [eventEndDate, setEventEndDate] = useState("")
	const [venues, setVenues] = useState<string[]>([""])
	const [venueCities, setVenueCities] = useState<string[]>([""])
	const [ageGroup, setAgeGroup] = useState("")
	const [guestCount, setGuestCount] = useState("")

	const [audienceProfile, setAudienceProfile] = useState<string[]>([])
	const [newAudience, setNewAudience] = useState("")

	const [docKey, setDocKey] = useState<string | null>(null)
	const [docName, setDocName] = useState<string | null>(null)
	const [docType, setDocType] = useState<string | null>(null)
	const [docSize, setDocSize] = useState<number | null>(null)
	const [uploadingDoc, setUploadingDoc] = useState(false)

	const [sponsorTiers, setSponsorTiers] = useState<SponsorTier[]>([{ name: "", price: "" }])
	const [sponsorshipType, setSponsorshipType] = useState<"CASH" | "BARTER" | "BOTH">("CASH")

	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!hostPickerOpen) return
		setHostsLoading(true)
		const timeout = setTimeout(() => {
			getHosts({ search: hostSearch.trim() || undefined, limit: 20 })
				.then((r) => setHosts(r.hosts))
				.catch(() => toast.error("Failed to load hosts"))
				.finally(() => setHostsLoading(false))
		}, 300)
		return () => clearTimeout(timeout)
	}, [hostPickerOpen, hostSearch])

	// Pre-fill every field from the proposal being edited.
	useEffect(() => {
		if (!open || !editingProposal) return
		const p = editingProposal
		setSelectedHost(p.hostProfile)
		setName(p.name ?? "")
		setAbout(p.about ?? "")
		setImageKey(p.imageKey)
		setImagePreview(p.imageUrl)
		setEventDate(p.eventDate ? p.eventDate.slice(0, 10) : "")
		setEventEndDate(p.eventEndDate ? p.eventEndDate.slice(0, 10) : "")
		setVenues(p.venues.length > 0 ? p.venues : [""])
		setVenueCities(p.venueCities.length > 0 ? p.venueCities : [""])
		setAgeGroup(p.ageGroup ?? "")
		setGuestCount(p.guestCount ?? "")
		setAudienceProfile(p.audienceProfile)
		setDocKey(p.docKey)
		setDocName(p.docName)
		setDocType(p.docType)
		setDocSize(p.docSize)
		setSponsorshipType(p.sponsorshipType ?? "CASH")
		setSponsorTiers(p.sponsorTiers.length > 0 ? p.sponsorTiers : [{ name: "", price: "" }])
	}, [open, editingProposal])

	function reset() {
		setSelectedHost(null)
		setHostPickerOpen(false)
		setHostSearch("")
		setHosts([])
		setName("")
		setAbout("")
		setImageKey(null)
		setImagePreview(null)
		setEventDate("")
		setEventEndDate("")
		setVenues([""])
		setVenueCities([""])
		setAgeGroup("")
		setGuestCount("")
		setAudienceProfile([])
		setNewAudience("")
		setDocKey(null)
		setDocName(null)
		setDocType(null)
		setDocSize(null)
		setSponsorshipType("CASH")
		setSponsorTiers([{ name: "", price: "" }])
		setError(null)
	}

	function handleClose() {
		if (isLoading) return
		reset()
		onClose()
	}

	function addAudience() {
		const trimmed = newAudience.trim()
		if (trimmed && !audienceProfile.includes(trimmed)) {
			setAudienceProfile([...audienceProfile, trimmed])
			setNewAudience("")
		}
	}

	async function handleDocFile(file: File) {
		if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
			toast.error("Only PDF, Word, or PowerPoint files are allowed")
			return
		}
		if (file.size > 20 * 1024 * 1024) {
			toast.error("Document must be under 20 MB")
			return
		}
		setUploadingDoc(true)
		try {
			const key = await uploadSponsorshipDocument(file)
			setDocKey(key)
			setDocName(file.name)
			setDocType(file.type)
			setDocSize(file.size)
		} catch (err) {
			toast.error(extractApiErrorMessage(err, "Document upload failed. Please try again."))
		} finally {
			setUploadingDoc(false)
		}
	}

	function updateTier(index: number, field: keyof SponsorTier, value: string) {
		setSponsorTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)))
	}

	function addTier() {
		setSponsorTiers((prev) => [...prev, { name: "", price: "" }])
	}

	function removeTier(index: number) {
		setSponsorTiers((prev) => prev.filter((_, i) => i !== index))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)

		const validTiers = sponsorTiers.filter((t) => t.name.trim() && t.price.trim())

		if (!name.trim()) return setError("Name is required.")
		if (!about.trim()) return setError("About is required.")
		if (!imageKey) return setError("Cover image is required.")
		if (!eventDate) return setError("Event date is required.")
		if (!eventEndDate) return setError("Event end date is required.")
		if (eventEndDate < eventDate) return setError("End date cannot be before the start date.")
		if (venues.every((v) => !v.trim())) return setError("At least one venue is required.")
		if (venues.some((v, idx) => v.trim() && !venueCities[idx]?.trim())) return setError("Please add a city for every venue.")
		if (audienceProfile.length === 0) return setError("At least one audience profile tag is required.")
		if (!ageGroup.trim()) return setError("Age group is required.")
		if (!guestCount.trim()) return setError("Guest count is required.")
		if (!docKey || !docName || !docType || docSize == null) return setError("Pitch document is required.")
		if (sponsorshipType !== "BARTER" && validTiers.length === 0) return setError("At least one sponsor tier is required.")

		setIsLoading(true)
		try {
			const payload = {
				...(selectedHost && { hostProfileId: selectedHost.id }),
				name: name.trim(),
				about: about.trim(),
				imageKey,
				eventDate: new Date(eventDate).toISOString(),
				eventEndDate: new Date(eventEndDate).toISOString(),
				venues: venues.map((v) => v.trim()).filter(Boolean),
				venueCities: venues
					.map((v, idx) => (v.trim() ? venueCities[idx]?.trim() || "" : null))
					.filter((c): c is string => c !== null),
				audienceProfile,
				ageGroup: ageGroup.trim(),
				guestCount: guestCount.trim(),
				docKey,
				docName,
				docType,
				docSize,
				sponsorshipType,
				sponsorTiers: sponsorshipType === "BARTER" ? [] : validTiers,
			}
			if (isEditing && editingProposal) {
				const proposal = await updateSponsorship(editingProposal.id, payload)
				toast.success("Sponsorship proposal updated")
				onUpdated?.(proposal)
			} else {
				const proposal = await createSponsorship(payload)
				toast.success("Sponsorship proposal created and published")
				onCreated(proposal)
			}
			reset()
		} catch (err: unknown) {
			const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
			const status = axiosErr?.response?.status
			if (status === 403) {
				setError(`You don't have permission to ${isEditing ? "edit" : "create"} sponsorship proposals.`)
			} else {
				setError(axiosErr?.response?.data?.message ?? "Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}

	const description = isEditing
		? "Edit any field on this proposal. Changes are saved immediately, regardless of status."
		: selectedHost
			? `Published immediately under ${selectedHost.displayName || `${selectedHost.user.firstName} ${selectedHost.user.lastName}`} — no KYC or review required.`
			: "Published immediately under the Meetday Official host — no KYC or review required."

	return (
		<Drawer
			open={open}
			onClose={handleClose}
			title={isEditing ? "Edit Sponsorship Proposal" : "Create Sponsorship Proposal"}
			description={description}
			width="max-w-lg"
		>
			<form onSubmit={handleSubmit} className="space-y-5">
				<div>
					<label className={labelClass}>Publish under</label>
					{selectedHost ? (
						<div className="flex items-center justify-between gap-2 rounded-lg border border-border-default px-3 py-2 text-xs">
							<span className="truncate">
								<span className="font-semibold">
									{selectedHost.displayName || `${selectedHost.user.firstName} ${selectedHost.user.lastName}`}
								</span>
								{selectedHost.user.email && <span className="text-text-tertiary"> · {selectedHost.user.email}</span>}
							</span>
							<button
								type="button"
								onClick={() => setSelectedHost(null)}
								disabled={isLoading}
								className="shrink-0 text-xs font-semibold text-text-brand hover:underline disabled:opacity-50"
							>
								Change
							</button>
						</div>
					) : (
						<div className="space-y-2">
							<button
								type="button"
								onClick={() => setHostPickerOpen((v) => !v)}
								disabled={isLoading}
								className="flex w-full items-center justify-between rounded-lg border border-dashed border-border-default px-3 py-2 text-xs text-text-tertiary hover:bg-neutral-50 disabled:opacity-50"
							>
								Meetday Official (default) — click to attribute to a specific host instead
							</button>
							{hostPickerOpen && (
								<div className="rounded-lg border border-border-default overflow-hidden">
									<div className="relative border-b border-border-subtle">
										<Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
										<input
											type="text"
											value={hostSearch}
											onChange={(e) => setHostSearch(e.target.value)}
											placeholder="Search hosts by name or email…"
											className={`${inputClass} border-0 rounded-none pl-8`}
										/>
									</div>
									<div className="max-h-48 overflow-y-auto divide-y divide-border-subtle">
										{hostsLoading ? (
											<p className="px-3 py-3 text-xs text-text-tertiary text-center">Loading…</p>
										) : hosts.length === 0 ? (
											<p className="px-3 py-3 text-xs text-text-tertiary text-center">No hosts found.</p>
										) : (
											hosts.map((h) => (
												<button
													key={h.id}
													type="button"
													onClick={() => {
														setSelectedHost(h)
														setHostPickerOpen(false)
													}}
													className="w-full flex flex-col gap-0.5 px-3 py-2 text-left hover:bg-neutral-50 transition-colors"
												>
													<span className="text-xs font-semibold text-text-primary">
														{h.displayName || `${h.user.firstName} ${h.user.lastName}`}
													</span>
													<span className="text-[11px] text-text-tertiary">
														{h.user.email ?? "—"}
													</span>
												</button>
											))
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				<div>
					<label className={labelClass}>
						Name <span className="text-red-500" aria-hidden>*</span>
					</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g. Sunset Music Festival"
						disabled={isLoading}
						className={inputClass}
					/>
				</div>

				<div>
					<label className={labelClass}>
						About <span className="text-red-500" aria-hidden>*</span>
					</label>
					<textarea
						value={about}
						onChange={(e) => setAbout(e.target.value)}
						rows={3}
						disabled={isLoading}
						className={`${inputClass} resize-none`}
					/>
				</div>

				<ImageUploadZone
					value={imageKey}
					previewUrl={imagePreview}
					onChange={(key, url) => {
						setImageKey(key)
						setImagePreview(url)
					}}
					onClear={() => {
						setImageKey(null)
						setImagePreview(null)
					}}
					onUpload={uploadSponsorshipImage}
					label="Cover image"
					hint="JPEG, PNG, or WebP"
					aspectClass="aspect-video"
					shape="rect"
					required
				/>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className={labelClass}>
							Event date <span className="text-red-500" aria-hidden>*</span>
						</label>
						<input
							type="date"
							value={eventDate}
							onChange={(e) => setEventDate(e.target.value)}
							disabled={isLoading}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>
							Event end date <span className="text-red-500" aria-hidden>*</span>
						</label>
						<input
							type="date"
							value={eventEndDate}
							min={eventDate || undefined}
							onChange={(e) => setEventEndDate(e.target.value)}
							disabled={isLoading}
							className={inputClass}
						/>
					</div>
				</div>

				<div>
					<div className="flex items-center justify-between mb-1.5">
						<label className="block text-xs font-semibold text-text-secondary">
							Venue <span className="text-red-500" aria-hidden>*</span>
						</label>
						<button
							type="button"
							onClick={() => {
								setVenues([...venues, ""])
								setVenueCities([...venueCities, ""])
							}}
							disabled={isLoading}
							className="text-xs font-semibold text-text-brand hover:underline disabled:opacity-50"
						>
							+ Add venue
						</button>
					</div>
					<div className="space-y-2">
						{venues.map((v, idx) => (
							<div key={idx} className="flex gap-2 items-center">
								<div className="flex-1 min-w-0">
									<VenueAutocompleteInput
										value={v}
										disabled={isLoading}
										onChange={(val) => {
											const updated = [...venues]
											updated[idx] = val
											setVenues(updated)
										}}
										onPlaceSelect={(fields) => {
											const updated = [...venues]
											updated[idx] = fields.venueName || fields.fullAddress
											setVenues(updated)
											if (fields.city && !venueCities[idx]?.trim()) {
												const updatedCities = [...venueCities]
												updatedCities[idx] = fields.city
												setVenueCities(updatedCities)
											}
										}}
										placeholder="Venue"
										className={inputClass}
									/>
								</div>
								<div className="w-40 shrink-0">
									<input
										type="text"
										value={venueCities[idx] || ""}
										onChange={(e) => {
											const updated = [...venueCities]
											updated[idx] = e.target.value
											setVenueCities(updated)
										}}
										disabled={isLoading}
										placeholder="City"
										className={inputClass}
									/>
								</div>
								{venues.length > 1 && (
									<button
										type="button"
										onClick={() => {
											setVenues(venues.filter((_, i) => i !== idx))
											setVenueCities(venueCities.filter((_, i) => i !== idx))
										}}
										disabled={isLoading}
										className="text-red-500 hover:text-red-700 font-bold text-lg disabled:opacity-50"
									>
										✕
									</button>
								)}
							</div>
						))}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className={labelClass}>
							Age group <span className="text-red-500" aria-hidden>*</span>
						</label>
						<input
							type="text"
							value={ageGroup}
							onChange={(e) => setAgeGroup(e.target.value)}
							placeholder="e.g. 21-35"
							disabled={isLoading}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>
							Guest count <span className="text-red-500" aria-hidden>*</span>
						</label>
						<input
							type="text"
							value={guestCount}
							onChange={(e) => setGuestCount(e.target.value)}
							placeholder="e.g. 200-300"
							disabled={isLoading}
							className={inputClass}
						/>
					</div>
				</div>

				<div>
					<label className={labelClass}>
						Audience profile <span className="text-red-500" aria-hidden>*</span>
					</label>
					<div className="flex gap-2">
						<input
							type="text"
							value={newAudience}
							onChange={(e) => setNewAudience(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault()
									addAudience()
								}
							}}
							placeholder="e.g. Young professionals"
							disabled={isLoading}
							className={inputClass}
						/>
						<button
							type="button"
							onClick={addAudience}
							disabled={isLoading}
							className="shrink-0 rounded-lg border border-border-default px-3 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
						>
							Add
						</button>
					</div>
					{audienceProfile.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mt-2">
							{audienceProfile.map((aud, idx) => (
								<span
									key={idx}
									className="inline-flex items-center gap-1 px-2 py-0.5 rounded-badge text-[11px] font-medium bg-surface-brand-soft text-text-brand border border-border-brand"
								>
									{aud}
									<button type="button" onClick={() => setAudienceProfile(audienceProfile.filter((_, i) => i !== idx))}>
										<X size={10} />
									</button>
								</span>
							))}
						</div>
					)}
				</div>

				<div>
					<label className={labelClass}>
						Pitch document <span className="text-red-500" aria-hidden>*</span>
					</label>
					{docName ? (
						<div className="flex items-center justify-between gap-2 rounded-lg border border-border-default px-3 py-2 text-xs">
							<span className="flex items-center gap-1.5 truncate">
								<FileText size={14} className="shrink-0 text-text-tertiary" />
								{docName}
							</span>
							<button
								type="button"
								onClick={() => {
									setDocKey(null)
									setDocName(null)
									setDocType(null)
									setDocSize(null)
								}}
								disabled={isLoading}
							>
								<X size={14} />
							</button>
						</div>
					) : (
						<label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border-default px-3 py-4 text-xs text-text-tertiary cursor-pointer hover:bg-neutral-50">
							{uploadingDoc ? <Loader2 size={14} className="animate-spin" /> : "Upload PDF / Word / PPT"}
							<input
								type="file"
								accept={ACCEPTED_DOC_TYPES.join(",")}
								className="hidden"
								disabled={isLoading || uploadingDoc}
								onChange={(e) => {
									const file = e.target.files?.[0]
									if (file) handleDocFile(file)
									e.target.value = ""
								}}
							/>
						</label>
					)}
				</div>

				<div>
					<label className={labelClass}>
						Sponsorship type <span className="text-red-500" aria-hidden>*</span>
					</label>
					<div className="flex gap-2">
						{(["CASH", "BARTER", "BOTH"] as const).map((t) => (
							<button
								key={t}
								type="button"
								onClick={() => setSponsorshipType(t)}
								className={`flex-1 rounded-xl py-2 text-xs font-semibold border transition-colors ${
									sponsorshipType === t
										? "bg-text-brand text-white border-text-brand"
										: "bg-surface-card border-border-default text-text-secondary hover:border-border-strong"
								}`}
							>
								{t === "CASH" ? "Cash" : t === "BARTER" ? "Barter" : "Both"}
							</button>
						))}
					</div>
				</div>

				{sponsorshipType !== "BARTER" && (
					<div>
						<label className={labelClass}>
							Sponsor tiers <span className="text-red-500" aria-hidden>*</span>
						</label>
						<div className="space-y-2">
							{sponsorTiers.map((tier, idx) => (
								<div key={idx} className="flex gap-2">
									<input
										type="text"
										value={tier.name}
										onChange={(e) => updateTier(idx, "name", e.target.value)}
										placeholder="e.g. Gold Sponsor"
										disabled={isLoading}
										className={inputClass}
									/>
									<input
										type="text"
										value={tier.price}
										onChange={(e) => updateTier(idx, "price", e.target.value)}
										placeholder="e.g. 50000"
										disabled={isLoading}
										className={`${inputClass} max-w-[120px]`}
									/>
									<button
										type="button"
										onClick={() => removeTier(idx)}
										disabled={isLoading || sponsorTiers.length === 1}
										className="shrink-0 rounded-lg border border-border-default px-2 hover:bg-neutral-50 disabled:opacity-30"
									>
										<X size={14} />
									</button>
								</div>
							))}
						</div>
						<button
							type="button"
							onClick={addTier}
							disabled={isLoading}
							className="mt-2 flex items-center gap-1 text-xs font-semibold text-text-brand hover:underline disabled:opacity-50"
						>
							<Plus size={12} /> Add tier
						</button>
					</div>
				)}

				{error && (
					<div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs text-red-700">
						{error}
					</div>
				)}
			</form>

			<DrawerFooter className="justify-between">
				<button
					type="button"
					onClick={handleClose}
					disabled={isLoading}
					className="rounded-lg border border-border-default px-4 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					onClick={handleSubmit as unknown as React.MouseEventHandler}
					disabled={isLoading}
					className="flex items-center gap-1.5 rounded-lg bg-action-primary px-4 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading && <Loader2 size={13} className="animate-spin" />}
					{isEditing ? "Save changes" : "Create & Publish"}
				</button>
			</DrawerFooter>
		</Drawer>
	)
}
