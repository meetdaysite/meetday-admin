"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import {
	getInterestById,
	createInterest,
	updateInterest,
	replaceInterestCategories,
} from "@/lib/api/interests"
import { getCategories } from "@/lib/api/categories"
import type { Category, Interest } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type InterestDrawerProps = {
	open: boolean
	onClose: () => void
	onSaved: (interest: Interest) => void
	/** Pass an interest to edit; omit for create mode */
	interest?: Interest | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InterestDrawer({ open, onClose, onSaved, interest }: InterestDrawerProps) {
	const isEdit = !!interest

	const [name, setName]               = useState("")
	const [description, setDescription] = useState("")
	const [image, setImage]             = useState("")

	// category multi-select state
	const [allCategories, setAllCategories]       = useState<Category[]>([])
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set())
	const [loadingDetail, setLoadingDetail]       = useState(false)

	const [isLoading, setIsLoading] = useState(false)
	const [error, setError]         = useState<string | null>(null)

	// On open: populate fields and (in edit mode) fetch detail + categories
	useEffect(() => {
		if (!open) return

		setName(interest?.name ?? "")
		setDescription(interest?.description ?? "")
		setImage(interest?.image ?? "")
		setError(null)

		if (isEdit && interest) {
			setLoadingDetail(true)
			Promise.all([getInterestById(interest.id), getCategories()])
				.then(([detail, cats]) => {
					setAllCategories(cats)
					setSelectedCategoryIds(new Set(detail.categories.map((c) => c.categoryId)))
				})
				.catch(() => {
					// non-fatal: category list degrades gracefully
				})
				.finally(() => setLoadingDetail(false))
		} else {
			// create mode: still load categories so they can be optionally assigned later
			// but keep UI simple — category assignment only available in edit mode
			setAllCategories([])
			setSelectedCategoryIds(new Set())
		}
	}, [open, interest, isEdit])

	function handleClose() {
		if (isLoading) return
		onClose()
	}

	function toggleCategory(id: string) {
		setSelectedCategoryIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!name.trim()) return
		setIsLoading(true)
		setError(null)
		try {
			let saved: Interest
			if (isEdit && interest) {
				saved = await updateInterest(interest.id, {
					name: name.trim(),
					description: description.trim() || undefined,
					image: image.trim() || undefined,
				})
				// replace category mappings
				await replaceInterestCategories(interest.id, Array.from(selectedCategoryIds))
			} else {
				saved = await createInterest({
					name: name.trim(),
					description: description.trim() || undefined,
					image: image.trim() || undefined,
				})
			}
			onSaved(saved)
		} catch (err: unknown) {
			const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
			const status = axiosErr?.response?.status
			if (status === 409) {
				setError("An interest with this name already exists.")
			} else if (status === 403) {
				setError("You don't have permission to manage interests.")
			} else {
				setError(axiosErr?.response?.data?.message ?? "Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Drawer
			open={open}
			onClose={handleClose}
			title={isEdit ? "Edit Interest" : "Create Interest"}
			description={
				isEdit
					? "Update the interest details and category mappings."
					: "Add a new interest that users can follow and hosts can associate with."
			}
		>
			<form onSubmit={handleSubmit} className="space-y-5">
				{/* Name */}
				<div>
					<label className="block text-xs font-semibold text-neutral-dark mb-1.5">
						Name <span className="text-red-500" aria-hidden>*</span>
					</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g. Founder's Huddle"
						disabled={isLoading}
						className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors disabled:opacity-50"
					/>
				</div>

				{/* Description */}
				<div>
					<label className="block text-xs font-semibold text-neutral-dark mb-1.5">
						Description <span className="text-neutral-light font-normal">(optional)</span>
					</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="e.g. For startup founders and entrepreneurs building the next big thing"
						rows={3}
						disabled={isLoading}
						className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors resize-none disabled:opacity-50"
					/>
				</div>

				{/* Image path */}
				<div>
					<label className="block text-xs font-semibold text-neutral-dark mb-1.5">
						Image path <span className="text-neutral-light font-normal">(optional)</span>
					</label>
					<input
						type="text"
						value={image}
						onChange={(e) => setImage(e.target.value)}
						placeholder="e.g. interests/founders-huddle.jpg"
						disabled={isLoading}
						className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-mono placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors disabled:opacity-50"
					/>
				</div>

				{/* Category mappings — edit mode only */}
				{isEdit && (
					<div>
						<label className="block text-xs font-semibold text-neutral-dark mb-1.5">
							Mapped categories
						</label>
						{loadingDetail ? (
							<div className="space-y-2">
								<Skeleton className="h-8 w-full rounded-lg" />
								<Skeleton className="h-8 w-3/4 rounded-lg" />
							</div>
						) : allCategories.length === 0 ? (
							<p className="text-xs text-neutral-light">No categories available.</p>
						) : (
							<div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden max-h-52 overflow-y-auto">
								{allCategories.map((cat) => {
									const checked = selectedCategoryIds.has(cat.id)
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
														? "bg-brand-red border-brand-red"
														: "border-neutral-300 bg-white"
												}`}
											>
												{checked && <Check size={10} className="text-white" strokeWidth={3} />}
											</span>
											<span className="text-xs text-foreground">{cat.name}</span>
										</button>
									)
								})}
							</div>
						)}
					</div>
				)}

				{/* Error */}
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
					className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					onClick={handleSubmit as unknown as React.MouseEventHandler}
					disabled={isLoading || !name.trim()}
					className="flex items-center gap-1.5 rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading && <Loader2 size={13} className="animate-spin" />}
					{isEdit ? "Save Changes" : "Create Interest"}
				</button>
			</DrawerFooter>
		</Drawer>
	)
}
