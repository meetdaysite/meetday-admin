"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Copy, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"
import { getCategories } from "@/lib/api/categories"
import { getInterests } from "@/lib/api/interests"
import { uploadCommunityImage } from "@/lib/api/storage"
import {
	getCommunityById,
	updateCommunity,
	type CommunityDetailData,
} from "@/lib/api/communities"
import { CommunityTypeCard, type CommunityTypeOption } from "@/components/communities/create/ui/community-type-card"
import { ImageUploadZone } from "@/components/communities/create/ui/image-upload-zone"
import { TagMultiSelect, type TagOption } from "@/components/communities/create/ui/tag-multi-select"
import { usePermission } from "@/lib/hooks/use-permission"
import type { Category, CommunityAccess } from "@/types"

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
	name: z.string().min(3, "Name must be at least 3 characters").max(100),
	slug: z
		.string()
		.min(3, "Slug must be at least 3 characters")
		.max(100)
		.regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
	description: z.string().min(20, "Description must be at least 20 characters").max(300),
	categoryId: z.string().optional(),
	type: z.enum(["MEETDAY_MANAGED_PUBLIC", "HOST_LED", "PRIVATE_INVITE_ONLY"] as const),
	access: z.enum(["PUBLIC", "APPROVAL_REQUIRED", "INVITE_ONLY"] as const),
	memberVisibility: z.enum(["ALL_MEMBERS", "AFTER_ATTENDING", "HIDDEN"] as const),
	interestTags: z.array(z.object({ id: z.string(), label: z.string() })),
	coverImageKey: z.string(),
	iconKey: z.string(),
	autoAddMatchingEvents: z.boolean(),
})

type FormValues = z.infer<typeof schema>

// ─── Constants ────────────────────────────────────────────────────────────────

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

const ACCESS_OPTIONS: { value: CommunityAccess; label: string; description: string }[] = [
	{ value: "PUBLIC", label: "Public", description: "Anyone can join without approval." },
	{ value: "APPROVAL_REQUIRED", label: "Approval Required", description: "Admin must approve each member." },
	{ value: "INVITE_ONLY", label: "Invite Only", description: "Members can only join via invite." },
]

const MEMBER_VISIBILITY_OPTIONS: { value: FormValues["memberVisibility"]; label: string }[] = [
	{ value: "ALL_MEMBERS", label: "All members" },
	{ value: "AFTER_ATTENDING", label: "After attending an event" },
	{ value: "HIDDEN", label: "Hidden" },
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

function extractApiMessage(err: unknown, fallback: string): string {
	return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EditCommunityPage() {
	const params = useParams()
	const router = useRouter()
	const id = params.id as string
	const canManage = usePermission("community.manage")

	const [community, setCommunity] = useState<CommunityDetailData | null>(null)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [isLoadingCommunity, setIsLoadingCommunity] = useState(true)

	const [categories, setCategories] = useState<Category[]>([])
	const [catLoading, setCatLoading] = useState(true)
	const [interestOptions, setInterestOptions] = useState<TagOption[]>([])
	const [interestsLoading, setInterestsLoading] = useState(true)

	const [submitting, setSubmitting] = useState(false)
	const [slugManual, setSlugManual] = useState(true)
	const [coverPreview, setCoverPreview] = useState<string | null>(null)
	const [iconPreview, setIconPreview] = useState<string | null>(null)
	const [slugCopied, setSlugCopied] = useState(false)
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

	const {
		register,
		control,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			slug: "",
			description: "",
			categoryId: "",
			type: "MEETDAY_MANAGED_PUBLIC",
			access: "PUBLIC",
			memberVisibility: "ALL_MEMBERS",
			interestTags: [],
			coverImageKey: "",
			iconKey: "",
			autoAddMatchingEvents: true,
		},
	})

	const watchedName = watch("name")
	const watchedSlug = watch("slug")
	const watchedDesc = watch("description")

	// Auto-slug only when name changes and user hasn't manually edited the slug
	useEffect(() => {
		if (slugManual) return
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => {
			setValue("slug", toSlug(watchedName), { shouldValidate: false })
		}, 300)
	}, [watchedName, slugManual, setValue])

	// Load community for pre-fill
	const loadCommunity = useCallback(async () => {
		setIsLoadingCommunity(true)
		setLoadError(null)
		try {
			const data = await getCommunityById(id)
			setCommunity(data)
			setCoverPreview(data.thumbnailUrl)
			setIconPreview(data.iconUrl)
			reset({
				name: data.name,
				slug: data.slug,
				description: data.description ?? "",
				categoryId: "",
				type: data.type,
				access: data.access,
				memberVisibility: "ALL_MEMBERS",
				interestTags: [],
				coverImageKey: "",
				iconKey: "",
				autoAddMatchingEvents: true,
			})
		} catch {
			setLoadError("Failed to load community.")
		} finally {
			setIsLoadingCommunity(false)
		}
	}, [id, reset])

	useEffect(() => { loadCommunity() }, [loadCommunity])

	// Load reference data
	useEffect(() => {
		getCategories()
			.then(setCategories)
			.catch(() => toast.error("Failed to load categories"))
			.finally(() => setCatLoading(false))
		getInterests()
			.then(data => setInterestOptions(data.map(i => ({ id: i.id, label: i.name }))))
			.catch(() => toast.error("Failed to load interests"))
			.finally(() => setInterestsLoading(false))
	}, [])

	const onSubmit = async (data: FormValues) => {
		setSubmitting(true)
		try {
			const payload: Parameters<typeof updateCommunity>[1] = {
				name: data.name,
				slug: data.slug,
				type: data.type,
				description: data.description,
				access: data.access,
				memberVisibility: data.memberVisibility,
				autoAddMatchingEvents: data.autoAddMatchingEvents,
				interestTags: data.interestTags.map(t => t.label),
			}
			if (data.categoryId) payload.categoryId = data.categoryId
			if (data.coverImageKey) payload.coverImageKey = data.coverImageKey
			if (data.iconKey) payload.iconKey = data.iconKey

			await updateCommunity(id, payload)
			toast.success("Community updated successfully")
			router.push(`/communities/${id}`)
		} catch (err: unknown) {
			toast.error(extractApiMessage(err, "Failed to update community"))
		} finally {
			setSubmitting(false)
		}
	}

	const copySlug = () => {
		navigator.clipboard.writeText(`meetday.ai/communities/${watchedSlug}`)
		setSlugCopied(true)
		setTimeout(() => setSlugCopied(false), 2000)
	}

	if (!canManage) return null

	if (isLoadingCommunity) {
		return (
			<div className="flex h-64 items-center justify-center">
				<span className="text-sm text-text-tertiary">Loading…</span>
			</div>
		)
	}

	if (loadError || !community) {
		return (
			<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
				{loadError ?? "Community not found."}
			</div>
		)
	}

	return (
		<div className="flex min-h-full flex-col bg-surface-page">
			{/* Page header */}
			<div className="border-b border-border-subtle bg-surface-canvas px-6 py-4">
				<div className="flex items-center gap-3 mb-1">
					<button
						type="button"
						onClick={() => router.push(`/communities/${id}`)}
						className="flex items-center gap-1.5 text-caption text-text-secondary hover:text-text-secondary transition-colors"
					>
						<ArrowLeft size={14} />
						Back to Community
					</button>
				</div>
				<h1 className="text-xl font-bold text-text-primary">Edit Community</h1>
				<p className="text-sm text-text-secondary mt-0.5">
					Update the details for <span className="font-medium">{community.name}</span>
				</p>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-6">
				<div className="max-w-3xl mx-auto flex flex-col gap-6">
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
							<TextField
								placeholder="meetday-music-nights"
								error={!!errors.slug}
								helperText={errors.slug?.message ?? "Use lowercase letters, numbers and hyphens only."}
								{...register("slug", {
									onChange: () => setSlugManual(true),
								})}
							/>
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
							<label className="text-label-sm font-semibold text-text-primary">
								Description <span className="text-text-danger">*</span>
							</label>
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

						{/* Category */}
						<div className="flex flex-col gap-1.5">
							<label className="text-label-sm font-semibold text-text-primary">Category</label>
							<Controller
								name="categoryId"
								control={control}
								render={({ field }) => (
									<select
										{...field}
										disabled={catLoading}
										className={cn(
											"h-(--size-input-md) w-full rounded-input border bg-surface-canvas px-4 text-sm text-text-primary outline-none transition-colors appearance-none",
											"border-border-default hover:border-border-strong focus:border-border-focused",
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
							<p className="text-caption text-text-tertiary">
								Category cannot be pre-filled — select to update or leave blank to keep unchanged.
							</p>
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

						{/* Access + Member Visibility */}
						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-label-sm font-semibold text-text-primary">
									Access <span className="text-text-danger">*</span>
								</label>
								<Controller
									name="access"
									control={control}
									render={({ field }) => (
										<select
											{...field}
											className="h-(--size-input-md) w-full rounded-input border border-border-default bg-surface-canvas px-4 text-sm text-text-primary outline-none transition-colors appearance-none hover:border-border-strong focus:border-border-focused"
										>
											{ACCESS_OPTIONS.map(o => (
												<option key={o.value} value={o.value}>{o.label}</option>
											))}
										</select>
									)}
								/>
								{errors.access && (
									<p className="text-caption text-text-danger">{errors.access.message}</p>
								)}
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-label-sm font-semibold text-text-primary">
									Member Visibility
								</label>
								<Controller
									name="memberVisibility"
									control={control}
									render={({ field }) => (
										<select
											{...field}
											className="h-(--size-input-md) w-full rounded-input border border-border-default bg-surface-canvas px-4 text-sm text-text-primary outline-none transition-colors appearance-none hover:border-border-strong focus:border-border-focused"
										>
											{MEMBER_VISIBILITY_OPTIONS.map(o => (
												<option key={o.value} value={o.value}>{o.label}</option>
											))}
										</select>
									)}
								/>
							</div>
						</div>

						{/* Interest Tags */}
						<div className="flex flex-col gap-1.5">
							<label className="text-label-sm font-semibold text-text-primary">Interest Tags</label>
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
							<p className="text-caption text-text-tertiary">
								Interest tags cannot be pre-filled — select to update or leave blank to keep unchanged.
							</p>
						</div>

						{/* Auto Add Matching Events */}
						<div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-page px-4 py-3">
							<div>
								<p className="text-sm font-medium text-text-primary">Auto-add Matching Events</p>
								<p className="text-xs text-text-tertiary mt-0.5">
									Automatically attach events that match this community&apos;s tags and city.
								</p>
							</div>
							<Controller
								name="autoAddMatchingEvents"
								control={control}
								render={({ field }) => (
									<button
										type="button"
										role="switch"
										aria-checked={field.value}
										onClick={() => field.onChange(!field.value)}
										className={cn(
											"relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
											field.value ? "bg-action-primary" : "bg-neutral-200",
										)}
									>
										<span
											className={cn(
												"pointer-events-none inline-block h-4 w-4 translate-y-0 rounded-full bg-white shadow ring-0 transition-transform",
												field.value ? "translate-x-4" : "translate-x-0",
											)}
										/>
									</button>
								)}
							/>
						</div>

						{/* Images */}
						<div className="grid grid-cols-2 gap-6">
							<div className="flex flex-col gap-1.5">
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
											}}
											onClear={() => {
												field.onChange("")
												setCoverPreview(null)
											}}
											onUpload={(file) => uploadCommunityImage(file, "COVER")}
											label="Cover Image"
											hint="Recommended: 1920×720 px"
											aspectClass="aspect-video"
											shape="rect"
										/>
									)}
								/>
								<p className="text-caption text-text-tertiary">Upload to replace the existing cover image.</p>
							</div>

							<div className="flex flex-col gap-1.5">
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
											}}
											onClear={() => {
												field.onChange("")
												setIconPreview(null)
											}}
											onUpload={(file) => uploadCommunityImage(file, "ICON")}
											label="Community Icon"
											hint="Recommended: 512×512 px"
											aspectClass="aspect-square"
											shape="circle"
										/>
									)}
								/>
								<p className="text-caption text-text-tertiary">Upload to replace the existing icon.</p>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between">
						<Button
							type="button"
							variant="secondary"
							size="md"
							radius="md"
							onClick={() => router.push(`/communities/${id}`)}
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
							{submitting ? "Saving…" : "Save Changes"}
						</Button>
					</div>
				</div>
			</form>
		</div>
	)
}
