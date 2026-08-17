"use client"

import { useEffect, useState } from "react"
import { Loader2, ChevronLeft, Search, Mail } from "lucide-react"
import { toast } from "sonner"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageUploadZone } from "@/components/communities/create/ui/image-upload-zone"
import { getEligibleHosts, createCommunityProfile, updateCommunityProfile } from "@/lib/api/community-profiles"
import { getCategories } from "@/lib/api/categories"
import { uploadCommunityProfileLogo } from "@/lib/api/storage"
import type { Category, CommunityProfileDetail, EligibleHost } from "@/types"

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

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		if (!selectedHost) return

		if (!name.trim()) return setError("Name is required.")
		if (!about.trim()) return setError("About is required.")
		if (!logoKey) return setError("Logo is required.")
		if (!size.trim()) return setError("Community size is required.")
		if (!avgGuestCount.trim()) return setError("Average guest count is required.")
		if (!experiencesPerYear.trim()) return setError("Experiences/year is required.")
		if (categoryIds.size === 0) return setError("At least one category is required.")

		setIsLoading(true)
		try {
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
