"use client"

import { useEffect, useState } from "react"
import { Loader2, ChevronLeft, Search, Mail, Pencil, X, Upload } from "lucide-react"
import { toast } from "sonner"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageUploadZone } from "@/components/communities/create/ui/image-upload-zone"
import { getEligibleHosts, createCommunityProfile, updateCommunityProfile } from "@/lib/api/community-profiles"
import { getCategories } from "@/lib/api/categories"
import { uploadCommunityProfileLogo, uploadCommunityPastEventImage, uploadCommunityBrandLogo } from "@/lib/api/storage"
import type { Category, CommunityProfileDetail, EligibleHost } from "@/types"

// ─── Types ────────────────────────────────────────────

// One past-event entry being edited — images can be a mix of already-uploaded keys (editing an
// existing profile) and newly picked local files (uploaded on submit).
type PastEventDraft = {
	name: string
	description: string
	images: { key?: string; url: string; file?: File }[]
}

const emptyPastEventDraft = (): PastEventDraft => ({ name: "", description: "", images: [] })

type BrandWorkedWithDraft = {
	brandName: string
	logoKey?: string
	logoUrl?: string
	logoFile?: File
}

const emptyBrandWorkedWithDraft = (): BrandWorkedWithDraft => ({ brandName: "" })

// ─── Types ─────────────────────────────────────────────────────────────────

type CreateCommunityProfileDrawerProps = {
	open: boolean
	onClose: () => void
	onCreated: (profile: CommunityProfileDetail) => void
	// When set, the drawer edits this existing profile instead of creating a new one —
	// skips host selection, pre-fills every field, and submit calls the update endpoint.
	editingProfile?: CommunityProfileDetail | null
	onUpdated?: (profile: CommunityProfileDetail) => void
}

const inputClass =
	"w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors disabled:opacity-50"
const labelClass = "block text-xs font-semibold text-text-secondary mb-1.5"

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateCommunityProfileDrawer({
	open,
	onClose,
	onCreated,
	editingProfile,
	onUpdated,
}: CreateCommunityProfileDrawerProps) {
	const isEditing = !!editingProfile
	const [step, setStep] = useState<"select-host" | "form">("select-host")
	const [selectedHost, setSelectedHost] = useState<EligibleHost | null>(null)

	// Host picker state
	const [search, setSearch] = useState("")
	const [hosts, setHosts] = useState<EligibleHost[]>([])
	const [hostsLoading, setHostsLoading] = useState(false)

	// Form state
	const [name, setName] = useState("")
	const [about, setAbout] = useState("")
	const [logoKey, setLogoKey] = useState<string | null>(null)
	const [logoPreview, setLogoPreview] = useState<string | null>(null)
	const [secondaryImageKey, setSecondaryImageKey] = useState<string | null>(null)
	const [secondaryImagePreview, setSecondaryImagePreview] = useState<string | null>(null)
	const [size, setSize] = useState("")
	const [avgGuestCount, setAvgGuestCount] = useState("")
	const [experiencesPerYear, setExperiencesPerYear] = useState("")
	const [categories, setCategories] = useState<Category[]>([])
	const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set())
	const [instagram, setInstagram] = useState("")
	const [linkedin, setLinkedin] = useState("")
	const [youtube, setYoutube] = useState("")
	const [website, setWebsite] = useState("")
	const [pastEvents, setPastEvents] = useState<PastEventDraft[]>([])
	const [brandsWorkedWith, setBrandsWorkedWith] = useState<BrandWorkedWithDraft[]>([])

	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!open || isEditing) return
		setHostsLoading(true)
		const timeout = setTimeout(() => {
			getEligibleHosts({ search: search.trim() || undefined })
				.then((r) => setHosts(r.hosts))
				.catch(() => toast.error("Failed to load hosts"))
				.finally(() => setHostsLoading(false))
		}, 300)
		return () => clearTimeout(timeout)
	}, [open, isEditing, search])

	useEffect(() => {
		if (!open || step !== "form") return
		getCategories()
			.then(setCategories)
			.catch(() => toast.error("Failed to load categories"))
	}, [open, step])

	// Pre-fill every field from the profile being edited, skipping host selection.
	useEffect(() => {
		if (!open || !editingProfile) return
		const p = editingProfile
		setStep("form")
		setSelectedHost(p.hostProfile)
		setName(p.name)
		setAbout(p.about)
		setLogoKey(p.logoKey)
		setLogoPreview(p.logoUrl)
		setSecondaryImageKey(null)
		setSecondaryImagePreview(p.secondaryImageUrl)
		setSize(p.size)
		setAvgGuestCount(p.avgGuestCount)
		setExperiencesPerYear(p.experiencesPerYear)
		setCategoryIds(new Set(p.categories.map((c) => c.id)))
		setInstagram(p.hostProfile.socialLinks?.instagram ?? "")
		setLinkedin(p.hostProfile.socialLinks?.linkedin ?? "")
		setYoutube(p.hostProfile.socialLinks?.youtube ?? "")
		setWebsite(p.hostProfile.socialLinks?.website ?? "")
		setPastEvents(
			(p.pastEvents ?? []).map((e) => ({
				name: e.name ?? "",
				description: e.description ?? "",
				images: e.imageKeys.map((key, i) => ({ key, url: e.imageUrls[i] ?? "" })),
			})),
		)
		setBrandsWorkedWith(
			(p.brandsWorkedWith ?? []).map((b) => ({
				brandName: b.brandName ?? "",
				logoKey: b.logoKey ?? undefined,
				logoUrl: b.logoUrl ?? undefined,
			})),
		)
	}, [open, editingProfile])

	function reset() {
		setStep("select-host")
		setSelectedHost(null)
		setSearch("")
		setHosts([])
		setName("")
		setAbout("")
		setLogoKey(null)
		setLogoPreview(null)
		setSecondaryImageKey(null)
		setSecondaryImagePreview(null)
		setSize("")
		setAvgGuestCount("")
		setExperiencesPerYear("")
		setCategoryIds(new Set())
		setInstagram("")
		setLinkedin("")
		setYoutube("")
		setWebsite("")
		setPastEvents([])
		setBrandsWorkedWith([])
		setError(null)
	}

	function handleClose() {
		if (isLoading) return
		reset()
		onClose()
	}

	function selectHost(host: EligibleHost) {
		setSelectedHost(host)
		setStep("form")
	}

	function toggleCategory(id: string) {
		setCategoryIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	function addPastEvent() {
		setPastEvents((prev) => [...prev, emptyPastEventDraft()])
	}

	function removePastEvent(index: number) {
		setPastEvents((prev) => prev.filter((_, i) => i !== index))
	}

	function updatePastEvent(index: number, field: "name" | "description", value: string) {
		setPastEvents((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
	}

	function addPastEventImage(index: number, file: File) {
		const url = URL.createObjectURL(file)
		setPastEvents((prev) =>
			prev.map((e, i) =>
				i === index && e.images.length < 2
					? { ...e, images: [...e.images, { url, file }] }
					: e,
			),
		)
	}

	function removePastEventImage(eventIndex: number, imageIndex: number) {
		setPastEvents((prev) =>
			prev.map((e, i) =>
				i === eventIndex
					? { ...e, images: e.images.filter((_, j) => j !== imageIndex) }
					: e,
			),
		)
	}

	function addBrandWorkedWith() {
		setBrandsWorkedWith((prev) => [...prev, emptyBrandWorkedWithDraft()])
	}

	function removeBrandWorkedWith(index: number) {
		setBrandsWorkedWith((prev) => prev.filter((_, i) => i !== index))
	}

	function updateBrandWorkedWithName(index: number, value: string) {
		setBrandsWorkedWith((prev) => prev.map((b, i) => (i === index ? { ...b, brandName: value } : b)))
	}

	function updateBrandWorkedWithLogo(index: number, file: File) {
		const url = URL.createObjectURL(file)
		setBrandsWorkedWith((prev) =>
			prev.map((b, i) => (i === index ? { ...b, logoUrl: url, logoFile: file, logoKey: undefined } : b)),
		)
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)

		if (!selectedHost) {
			setError("Please select a host.")
			return
		}
		if (!name.trim()) {
			setError("Community name is required.")
			return
		}
		if (!about.trim()) {
			setError("About is required.")
			return
		}
		if (!logoKey) {
			setError("Logo is required.")
			return
		}
		if (!size.trim()) {
			setError("Community size is required.")
			return
		}
		if (!avgGuestCount.trim()) {
			setError("Average guest count is required.")
			return
		}
		if (!experiencesPerYear.trim()) {
			setError("Experiences per year is required.")
			return
		}
		if (categoryIds.size === 0) {
			setError("At least one category is required.")
			return
		}

		setIsLoading(true)
		const socialLinksInput = {
			instagram: instagram.trim() || undefined,
			linkedin: linkedin.trim() || undefined,
			youtube: youtube.trim() || undefined,
			website: website.trim() || undefined,
		}
		const socialLinks = Object.values(socialLinksInput).some(Boolean) ? socialLinksInput : undefined
		try {
			const pastEventsPayload = await Promise.all(
				pastEvents.map(async (event) => ({
					name: event.name.trim() || undefined,
					description: event.description.trim() || undefined,
					imageKeys: await Promise.all(
						event.images.map((img) => (img.key ? img.key : uploadCommunityPastEventImage(img.file!, selectedHost.id))),
					),
				})),
			)

			const brandsWorkedWithPayload = await Promise.all(
				brandsWorkedWith
					.filter((b) => b.brandName.trim() || b.logoFile || b.logoKey)
					.map(async (b) => ({
						brandName: b.brandName.trim() || undefined,
						logoKey: b.logoFile ? await uploadCommunityBrandLogo(b.logoFile) : b.logoKey,
					})),
			)

			if (isEditing && editingProfile) {
				const profile = await updateCommunityProfile(editingProfile.id, {
					name: name.trim(),
					about: about.trim(),
					logoKey,
					secondaryImageKey: secondaryImageKey ?? undefined,
					size: size.trim(),
					avgGuestCount: avgGuestCount.trim(),
					experiencesPerYear: experiencesPerYear.trim(),
					categoryIds: Array.from(categoryIds),
					socialLinks,
					pastEvents: pastEventsPayload,
					brandsWorkedWith: brandsWorkedWithPayload,
				})
				toast.success("Community profile updated")
				onUpdated?.(profile)
			} else {
				const profile = await createCommunityProfile({
					hostProfileId: selectedHost.id,
					name: name.trim(),
					about: about.trim(),
					logoKey,
					...(secondaryImageKey && { secondaryImageKey }),
					size: size.trim(),
					avgGuestCount: avgGuestCount.trim(),
					experiencesPerYear: experiencesPerYear.trim(),
					categoryIds: Array.from(categoryIds),
					socialLinks,
					pastEvents: pastEventsPayload,
					brandsWorkedWith: brandsWorkedWithPayload,
				})
				toast.success("Community profile created and activated")
				onCreated(profile)
			}
			reset()
		} catch (err: unknown) {
			const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
			const status = axiosErr?.response?.status
			if (status === 403) {
				setError(`You don't have permission to ${isEditing ? "edit" : "create"} community profiles.`)
			} else if (status === 409) {
				setError("This host already has a community profile.")
			} else {
				setError(axiosErr?.response?.data?.message ?? "Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}

	const title = isEditing ? "Edit Community Profile" : step === "select-host" ? "Add Community Profile" : "Community Profile Details"
	const description = isEditing
		? "Edit any field on this profile. Changes are saved immediately, regardless of approval status."
		: step === "select-host"
			? "Pick a host who doesn't have a community profile yet."
			: `Creating for ${selectedHost?.displayName ?? `${selectedHost?.user.firstName} ${selectedHost?.user.lastName}`}. Activated immediately — no review needed.`

	return (
		<Drawer open={open} onClose={handleClose} title={title} description={description} width="max-w-lg">
			{step === "select-host" ? (
				<div className="space-y-3">
					<div className="relative">
						<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search by name or email…"
							className={`${inputClass} pl-8`}
						/>
					</div>

					{hostsLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-14 w-full rounded-lg" />
							<Skeleton className="h-14 w-full rounded-lg" />
							<Skeleton className="h-14 w-full rounded-lg" />
						</div>
					) : hosts.length === 0 ? (
						<p className="text-xs text-text-tertiary py-6 text-center">
							No hosts without a community profile match your search.
						</p>
					) : (
						<div className="rounded-xl border border-border-default divide-y divide-border-subtle overflow-hidden max-h-96 overflow-y-auto">
							{hosts.map((host) => (
								<button
									key={host.id}
									type="button"
									onClick={() => selectHost(host)}
									className="w-full flex flex-col gap-0.5 px-3.5 py-2.5 text-left hover:bg-neutral-50 transition-colors"
								>
									<span className="text-sm font-semibold text-text-primary">
										{host.displayName ?? `${host.user.firstName} ${host.user.lastName}`}
									</span>
									<span className="flex items-center gap-1 text-[11px] text-text-tertiary">
										<Mail size={11} /> {host.user.email ?? "—"}
									</span>
								</button>
							))}
						</div>
					)}
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-5">
					{!isEditing && (
						<button
							type="button"
							onClick={() => setStep("select-host")}
							disabled={isLoading}
							className="flex items-center gap-1 text-xs font-semibold text-text-brand hover:underline disabled:opacity-50"
						>
							<ChevronLeft size={13} /> Choose a different host
						</button>
					)}

					<div>
						<label className={labelClass}>
							Community name <span className="text-red-500" aria-hidden>*</span>
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Bangalore Founders Circle"
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
						value={logoKey}
						previewUrl={logoPreview}
						onChange={(key, url) => {
							setLogoKey(key)
							setLogoPreview(url)
						}}
						onClear={() => {
							setLogoKey(null)
							setLogoPreview(null)
						}}
						onUpload={uploadCommunityProfileLogo}
						label="Logo"
						hint="JPEG, PNG, or WebP"
						aspectClass="aspect-square"
						shape="circle"
						required
					/>

					<ImageUploadZone
						value={secondaryImageKey}
						previewUrl={secondaryImagePreview}
						onChange={(key, url) => {
							setSecondaryImageKey(key)
							setSecondaryImagePreview(url)
						}}
						onClear={() => {
							setSecondaryImageKey(null)
							setSecondaryImagePreview(null)
						}}
						onUpload={uploadCommunityProfileLogo}
						label="Poster / banner (optional)"
						hint="JPEG, PNG, or WebP"
						aspectClass="aspect-[4/5]"
						shape="rect"
					/>

					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<label className={labelClass}>Past Events (optional)</label>
							<span className="text-[11px] text-text-tertiary">Showcase up to 2 images per event</span>
						</div>
						{pastEvents.map((event, i) => (
							<div key={i} className="flex flex-col gap-2 p-3 rounded-lg border border-border-default bg-surface-canvas">
								<div className="flex items-center justify-between">
									<span className="text-[10px] font-semibold text-text-tertiary uppercase">Event {i + 1}</span>
									<button
										type="button"
										onClick={() => removePastEvent(i)}
										disabled={isLoading}
										className="text-xs font-semibold text-text-tertiary hover:text-red-600 transition-colors disabled:opacity-50"
									>
										Remove
									</button>
								</div>
								<input
									type="text"
									value={event.name}
									onChange={(e) => updatePastEvent(i, "name", e.target.value)}
									placeholder="Event name (optional)"
									disabled={isLoading}
									className={inputClass}
								/>
								<textarea
									value={event.description}
									onChange={(e) => updatePastEvent(i, "description", e.target.value)}
									placeholder="Event description (optional)"
									rows={2}
									disabled={isLoading}
									className={`${inputClass} resize-none`}
								/>
								<div className="flex items-center gap-2">
									{event.images.map((img, j) => (
										<div key={j} className="relative size-16 rounded-lg border border-border-default overflow-hidden shrink-0">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={img.url} alt="Past event" className="size-full object-cover" />
											<button
												type="button"
												onClick={() => removePastEventImage(i, j)}
												aria-label="Remove image"
												className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center leading-none"
											>
												×
											</button>
										</div>
									))}
									{event.images.length < 2 && (
										<label className="size-16 rounded-lg border border-dashed border-border-strong flex items-center justify-center shrink-0 cursor-pointer hover:bg-neutral-50">
											<input
												type="file"
												accept="image/*"
												className="hidden"
												disabled={isLoading}
												onChange={(e) => {
													const file = e.target.files?.[0]
													e.target.value = ""
													if (file) addPastEventImage(i, file)
												}}
											/>
											<span className="text-[10px] text-text-tertiary">+ Add</span>
										</label>
									)}
								</div>
							</div>
						))}
						<button
							type="button"
							onClick={addPastEvent}
							disabled={isLoading}
							className="self-start text-xs font-semibold text-text-brand hover:underline disabled:opacity-50"
						>
							+ Add past event
						</button>
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<label className={labelClass}>Brands Worked With</label>
							<span className="text-[11px] text-text-tertiary">Brand name + logo</span>
						</div>
						{brandsWorkedWith.map((brand, i) => (
							<div key={i} className="relative flex items-center gap-2.5 p-2.5 pr-8 rounded-lg border border-border-default bg-surface-canvas">
								<label className="group relative size-11 rounded-lg border border-dashed border-border-strong overflow-hidden shrink-0 bg-neutral-50 flex items-center justify-center cursor-pointer hover:border-text-primary transition-colors">
									<input
										type="file"
										accept="image/*"
										className="hidden"
										disabled={isLoading}
										onChange={(e) => {
											const file = e.target.files?.[0]
											e.target.value = ""
											if (file) updateBrandWorkedWithLogo(i, file)
										}}
									/>
									{brand.logoUrl ? (
										<>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={brand.logoUrl} alt={brand.brandName || "Brand"} className="size-full object-cover" />
											<div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
												<Pencil size={14} className="text-white" />
											</div>
										</>
									) : (
										<Upload size={14} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
									)}
								</label>
								<input
									type="text"
									value={brand.brandName}
									onChange={(e) => updateBrandWorkedWithName(i, e.target.value)}
									placeholder="Brand name"
									disabled={isLoading}
									className={`${inputClass} flex-1`}
								/>
								<button
									type="button"
									onClick={() => removeBrandWorkedWith(i)}
									disabled={isLoading}
									aria-label="Remove brand"
									className="absolute top-2 right-2 size-5 rounded-full text-text-tertiary hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
								>
									<X size={13} />
								</button>
							</div>
						))}
						<button
							type="button"
							onClick={addBrandWorkedWith}
							disabled={isLoading}
							className="self-start text-xs font-semibold text-text-brand hover:underline disabled:opacity-50"
						>
							+ Add
						</button>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div>
							<label className={labelClass}>
								Size <span className="text-red-500" aria-hidden>*</span>
							</label>
							<input
								type="text"
								value={size}
								onChange={(e) => setSize(e.target.value)}
								placeholder="250"
								disabled={isLoading}
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>
								Avg. guests <span className="text-red-500" aria-hidden>*</span>
							</label>
							<input
								type="text"
								value={avgGuestCount}
								onChange={(e) => setAvgGuestCount(e.target.value)}
								placeholder="60"
								disabled={isLoading}
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>
								Experiences/yr <span className="text-red-500" aria-hidden>*</span>
							</label>
							<input
								type="text"
								value={experiencesPerYear}
								onChange={(e) => setExperiencesPerYear(e.target.value)}
								placeholder="12"
								disabled={isLoading}
								className={inputClass}
							/>
						</div>
					</div>

					<div>
						<label className={labelClass}>
							Categories <span className="text-red-500" aria-hidden>*</span>
						</label>
						{categories.length === 0 ? (
							<p className="text-xs text-text-tertiary">Loading categories…</p>
						) : (
							<div className="rounded-xl border border-border-default divide-y divide-border-subtle overflow-hidden max-h-48 overflow-y-auto">
								{categories.map((cat) => {
									const checked = categoryIds.has(cat.id)
									return (
										<button
											key={cat.id}
											type="button"
											onClick={() => toggleCategory(cat.id)}
											disabled={isLoading}
											className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-neutral-50 transition-colors disabled:opacity-50"
										>
											<span
												className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
													checked
														? "bg-action-primary border-action-primary"
														: "border-border-strong bg-surface-canvas"
												}`}
											>
												{checked && <span className="h-2 w-2 rounded-sm bg-white" />}
											</span>
											<span className="text-sm">{cat.name}</span>
										</button>
									)
								})}
							</div>
						)}
					</div>

					<div>
						<label className={labelClass}>Social links</label>
						<div className="space-y-2">
							<input
								type="text"
								value={instagram}
								onChange={(e) => setInstagram(e.target.value)}
								placeholder="Instagram — instagram.com/handle"
								disabled={isLoading}
								className={inputClass}
							/>
							<input
								type="text"
								value={linkedin}
								onChange={(e) => setLinkedin(e.target.value)}
								placeholder="LinkedIn — linkedin.com/in/profile"
								disabled={isLoading}
								className={inputClass}
							/>
							<input
								type="text"
								value={youtube}
								onChange={(e) => setYoutube(e.target.value)}
								placeholder="YouTube — youtube.com/@channel"
								disabled={isLoading}
								className={inputClass}
							/>
							<input
								type="text"
								value={website}
								onChange={(e) => setWebsite(e.target.value)}
								placeholder="Website — yourwebsite.com"
								disabled={isLoading}
								className={inputClass}
							/>
						</div>
					</div>

					{error && <p className="text-xs text-red-600">{error}</p>}

					<DrawerFooter>
						<button
							type="button"
							onClick={handleClose}
							disabled={isLoading}
							className="rounded-lg border border-border-default px-4 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isLoading}
							className="flex items-center gap-1.5 rounded-lg bg-action-primary px-4 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading && <Loader2 size={12} className="animate-spin" />}
							{isEditing ? "Save changes" : "Create & Activate"}
						</button>
					</DrawerFooter>
				</form>
			)}
		</Drawer>
	)
}
