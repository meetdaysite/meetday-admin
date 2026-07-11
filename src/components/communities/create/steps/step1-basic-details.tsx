"use client"

import { useEffect, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"
import { getCategories } from "@/lib/api/categories"
import { getInterests } from "@/lib/api/interests"
import { uploadCommunityImage } from "@/lib/api/storage"
import { createCommunityDraft, updateCommunityDraft } from "@/lib/api/communities"
import { useCreateCommunityStore } from "@/stores/create-community.store"
import { CommunityTypeCard, type CommunityTypeOption } from "../ui/community-type-card"
import { ImageUploadZone } from "../ui/image-upload-zone"
import { TagMultiSelect, type TagOption } from "../ui/tag-multi-select"
import type { CommunityType, Category } from "@/types"

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
	name: z.string().min(3, "Name must be at least 3 characters").max(100),
	slug: z
		.string()
		.min(3, "Slug must be at least 3 characters")
		.max(100)
		.regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
	description: z.string().min(20, "Description must be at least 20 characters").max(300),
	categoryId: z.string().min(1, "Please select a category"),
	primaryCity: z.string().min(1, "Primary city is required"),
	type: z.enum(["MEETDAY_MANAGED_PUBLIC", "HOST_LED", "PRIVATE_INVITE_ONLY"] as const),
	interestTags: z
		.array(z.object({ id: z.string(), label: z.string() }))
		.min(1, "Select at least one interest tag"),
	// TODO: make coverImageKey and iconKey .min(1, "...required") once image upload API is fixed
	coverImageKey: z.string(),
	iconKey: z.string(),
})

type FormValues = z.infer<typeof schema>

// ─── Community type options ───────────────────────────────────────────────────

const TYPE_OPTIONS: CommunityTypeOption[] = [
	{
		value: "MEETDAY_MANAGED_PUBLIC",
		label: "Meetday Managed Public Community",
		description: "Open for everyone to discover and join.",
	},
	{
		value: "HOST_LED",
		label: "Host Led Community",
		description: "Managed by a host or organization.",
	},
	{
		value: "PRIVATE_INVITE_ONLY",
		label: "Private Invite Only",
		description: "Invite-only community with private access.",
	},
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(name: string) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 100)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Step1BasicDetails() {
	const store = useCreateCommunityStore()
	const [categories, setCategories] = useState<Category[]>([])
	const [catLoading, setCatLoading] = useState(true)
	const [interestOptions, setInterestOptions] = useState<TagOption[]>([])
	const [interestsLoading, setInterestsLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [slugManual, setSlugManual] = useState(false)
	const [coverPreview, setCoverPreview] = useState<string | null>(store.step1Data?.coverImageUrl ?? null)
	const [iconPreview, setIconPreview] = useState<string | null>(store.step1Data?.iconUrl ?? null)
	const [slugCopied, setSlugCopied] = useState(false)
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

	const defaults = store.step1Data

	const {
		register,
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: defaults?.name ?? "",
			slug: defaults?.slug ?? "",
			description: defaults?.description ?? "",
			categoryId: defaults?.categoryId ?? "",
			primaryCity: defaults?.primaryCity ?? "",
			type: defaults?.type ?? "MEETDAY_MANAGED_PUBLIC",
			interestTags: [],
			coverImageKey: defaults?.coverImageKey ?? "",
			iconKey: defaults?.iconKey ?? "",
		},
	})

	const watchedName = watch("name")
	const watchedSlug = watch("slug")
	const watchedDesc = watch("description")
	const watchedType = watch("type")
	const watchedCity = watch("primaryCity")
	const watchedTags = watch("interestTags")

	// Auto-generate slug from name
	useEffect(() => {
		if (slugManual) return
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => {
			setValue("slug", toSlug(watchedName), { shouldValidate: false })
		}, 300)
	}, [watchedName, slugManual, setValue])

	// Live preview sync
	useEffect(() => {
		store.updatePreview({
			name: watchedName,
			slug: watchedSlug,
			description: watchedDesc,
			type: watchedType as CommunityType,
			primaryCity: watchedCity || null,
			interestTags: watchedTags.map(t => t.label),
		})
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [watchedName, watchedSlug, watchedDesc, watchedType, watchedCity, watchedTags])

	useEffect(() => {
		getCategories()
			.then(setCategories)
			.catch(() => toast.error("Failed to load categories"))
			.finally(() => setCatLoading(false))
	}, [])

	useEffect(() => {
		getInterests()
			.then(data => {
				const opts = data.map(i => ({ id: i.id, label: i.name }))
				setInterestOptions(opts)
				// Restore selections if navigating back
				if (defaults?.interestTags?.length) {
					const restored = opts.filter(o => defaults.interestTags.includes(o.label))
					if (restored.length) setValue("interestTags", restored)
				}
			})
			.catch(() => toast.error("Failed to load interests"))
			.finally(() => setInterestsLoading(false))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const onSubmit = async (data: FormValues) => {
		setSubmitting(true)
		try {
			const categoryName = categories.find(c => c.id === data.categoryId)?.name ?? ""
			const tagNames = data.interestTags.map(t => t.label)
			const payload = {
				name: data.name,
				slug: data.slug,
				type: data.type,
				description: data.description,
				categoryId: data.categoryId,
				primaryCity: data.primaryCity,
				coverImageKey: data.coverImageKey,
				iconKey: data.iconKey,
				interestTags: tagNames,
			}
			const existingId = store.communityId
			if (existingId) {
				await updateCommunityDraft(existingId, payload)
			} else {
				const { id } = await createCommunityDraft(payload)
				store.setCommunityId(id)
			}
			store.setStep1Data({
				name: data.name,
				slug: data.slug,
				description: data.description,
				type: data.type,
				categoryId: data.categoryId,
				categoryName,
				primaryCity: data.primaryCity,
				interestTags: tagNames,
				coverImageKey: data.coverImageKey,
				iconKey: data.iconKey,
				coverImageUrl: coverPreview,
				iconUrl: iconPreview,
			})
			store.updatePreview({ categoryName, coverImageUrl: coverPreview, iconUrl: iconPreview })
			store.nextStep()
		} catch {
			toast.error("Failed to save community details. Please try again.")
		} finally {
			setSubmitting(false)
		}
	}

	const copySlug = () => {
		navigator.clipboard.writeText(`meetday.ai/communities/${watchedSlug}`)
		setSlugCopied(true)
		setTimeout(() => setSlugCopied(false), 2000)
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
			<div className="rounded-panel border border-border-subtle bg-surface-canvas p-6 shadow-card flex flex-col gap-5">
				{/* Name */}
				<div className="flex flex-col gap-1.5">
					<TextField
						label="Community Name"
						required
						placeholder="e.g. Meetday Music Nights"
						error={!!errors.name}
						helperText={errors.name?.message}
						{...register("name")}
					/>
				</div>

				{/* Slug */}
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center justify-between">
						<label className="text-label-sm font-semibold text-text-primary">
							Community URL (Slug) <span className="text-text-danger">*</span>
						</label>
					</div>
					<div className="flex items-center gap-2">
						<div className="flex-1">
							<TextField
								placeholder="meetday-music-nights"
								error={!!errors.slug}
								helperText={
									errors.slug?.message ?? "Use lowercase letters, numbers and hyphens only."
								}
								{...register("slug", {
									onChange: () => setSlugManual(true),
								})}
							/>
						</div>
					</div>
					{watchedSlug && (
						<div className="flex items-center gap-2 rounded-input bg-surface-card border border-border-subtle px-3 py-2">
							<span className="text-caption text-text-secondary flex-1 truncate">
								meetday.ai/communities/{watchedSlug}
							</span>
							<button
								type="button"
								onClick={copySlug}
								className="shrink-0 text-icon-secondary hover:text-icon-primary transition-colors"
							>
								{slugCopied ? (
									<Check size={13} className="text-[#16a34a]" />
								) : (
									<Copy size={13} />
								)}
							</button>
						</div>
					)}
				</div>

				{/* Description */}
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center justify-between">
						<label className="text-label-sm font-semibold text-text-primary">
							Description <span className="text-text-danger">*</span>
						</label>
					</div>
					<div className="relative">
						<textarea
							placeholder="Describe your community..."
							rows={4}
							className={cn(
								"w-full resize-none rounded-input border bg-surface-canvas px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted transition-colors",
								errors.description
									? "border-border-brand bg-surface-brand-soft focus:border-border-focus"
									: "border-border-default hover:border-border-strong focus:border-border-focused",
							)}
							maxLength={300}
							{...register("description")}
						/>
						<span className="absolute bottom-2 right-3 text-caption text-text-secondary">
							{watchedDesc?.length ?? 0} / 300
						</span>
					</div>
					{errors.description && (
						<p className="text-caption text-text-danger">{errors.description.message}</p>
					)}
				</div>

				{/* Category + City */}
				<div className="grid grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-label-sm font-semibold text-text-primary">
							Category <span className="text-text-danger">*</span>
						</label>
						<Controller
							name="categoryId"
							control={control}
							render={({ field }) => (
								<select
									{...field}
									disabled={catLoading}
									className={cn(
										"h-(--size-input-md) w-full rounded-input border bg-surface-canvas px-4 text-sm text-text-primary outline-none transition-colors appearance-none",
										errors.categoryId
											? "border-border-brand"
											: "border-border-default hover:border-border-strong focus:border-border-focused",
									)}
								>
									<option value="">{catLoading ? "Loading..." : "Select category"}</option>
									{categories.map(c => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</select>
							)}
						/>
						{errors.categoryId && (
							<p className="text-caption text-text-danger">{errors.categoryId.message}</p>
						)}
					</div>

					<div className="flex flex-col gap-1.5">
						<TextField
							label="Primary City"
							required
							placeholder="e.g. Kolkata"
							error={!!errors.primaryCity}
							helperText={errors.primaryCity?.message}
							{...register("primaryCity")}
						/>
					</div>
				</div>

				{/* Community Type */}
				<div className="flex flex-col gap-2">
					<label className="text-label-sm font-semibold text-text-primary">
						Community Type <span className="text-text-danger">*</span>
					</label>
					<Controller
						name="type"
						control={control}
						render={({ field }) => (
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
								{TYPE_OPTIONS.map(opt => (
									<CommunityTypeCard
										key={opt.value}
										option={opt}
										selected={field.value === opt.value}
										onSelect={field.onChange}
									/>
								))}
							</div>
						)}
					/>
				</div>

				{/* Interest Tags */}
				<div className="flex flex-col gap-1.5">
					<label className="text-label-sm font-semibold text-text-primary">
						Interest Tags <span className="text-text-danger">*</span>
					</label>
					<Controller
						name="interestTags"
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
					{errors.interestTags && (
						<p className="text-caption text-text-danger">{errors.interestTags.message}</p>
					)}
				</div>

				{/* Images */}
				<div className="grid grid-cols-2 gap-6">
					<Controller
						name="coverImageKey"
						control={control}
						render={({ field }) => (
							<ImageUploadZone
								value={field.value || null}
								previewUrl={coverPreview}
								onChange={(key, url) => {
									field.onChange(key)
									setCoverPreview(url)
									store.updatePreview({ coverImageUrl: url })
								}}
								onClear={() => {
									field.onChange("")
									setCoverPreview(null)
									store.updatePreview({ coverImageUrl: null })
								}}
								onUpload={(file) => uploadCommunityImage(file, "COVER")}
								label="Upload Cover Image"
								hint="Recommended: 1920×720 px"
								aspectClass="aspect-video"
								shape="rect"
								required
							/>
						)}
					/>
					{errors.coverImageKey && (
						<p className="text-caption text-text-danger">{errors.coverImageKey.message}</p>
					)}

					<Controller
						name="iconKey"
						control={control}
						render={({ field }) => (
							<ImageUploadZone
								value={field.value || null}
								previewUrl={iconPreview}
								onChange={(key, url) => {
									field.onChange(key)
									setIconPreview(url)
									store.updatePreview({ iconUrl: url })
								}}
								onClear={() => {
									field.onChange("")
									setIconPreview(null)
									store.updatePreview({ iconUrl: null })
								}}
								onUpload={(file) => uploadCommunityImage(file, "ICON")}
								label="Upload Community Icon"
								hint="Recommended: 512×512 px"
								aspectClass="aspect-square"
								shape="circle"
								required
							/>
						)}
					/>
					{errors.iconKey && (
						<p className="text-caption text-text-danger">{errors.iconKey.message}</p>
					)}
				</div>
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between">
				<Button
					type="button"
					variant="secondary"
					size="md"
					radius="md"
					onClick={() => useCreateCommunityStore.getState().reset()}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					variant="primary"
					size="md"
					radius="md"
					disabled={submitting}
					rightIcon={submitting ? <Loader2 size={15} className="animate-spin" /> : undefined}
				>
					{submitting ? "Creating..." : "Continue →"}
				</Button>
			</div>
		</form>
	)
}
