"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { createCategory, updateCategory } from "@/lib/api/categories"
import type { Category } from "@/types"

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type CategoryDrawerProps = {
	open: boolean
	onClose: () => void
	onSaved: (category: Category) => void
	/** Pass a category to edit; omit for create mode */
	category?: Category | null
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function CategoryDrawer({ open, onClose, onSaved, category }: CategoryDrawerProps) {
	const isEdit = !!category

	const [name, setName]               = useState("")
	const [description, setDescription] = useState("")
	const [isActive, setIsActive]       = useState(true)
	const [isLoading, setIsLoading]     = useState(false)
	const [error, setError]             = useState<string | null>(null)

	useEffect(() => {
		if (open) {
			setName(category?.name ?? "")
			setDescription(category?.description ?? "")
			setIsActive(category?.isActive ?? true)
			setError(null)
		}
	}, [open, category])

	function handleClose() {
		if (isLoading) return
		onClose()
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!name.trim()) return
		setIsLoading(true)
		setError(null)
		try {
			let saved: Category
			if (isEdit && category) {
				saved = await updateCategory(category.id, {
					name: name.trim(),
					description: description.trim() || undefined,
					isActive,
				})
			} else {
				saved = await createCategory({
					name: name.trim(),
					description: description.trim() || undefined,
				})
			}
			onSaved(saved)
		} catch (err: unknown) {
			const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
			const status = axiosErr?.response?.status
			if (status === 409) {
				setError("A category with this name already exists.")
			} else if (status === 403) {
				setError("You don't have permission to manage categories.")
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
			title={isEdit ? "Edit Category" : "Create Category"}
			description={
				isEdit
					? "Update the category name, description, or active status."
					: "Add a new experience category for hosts to select."
			}
		>
			<form onSubmit={handleSubmit} className="space-y-5">
				{/* Name */}
				<div>
					<label className="block text-xs font-semibold text-text-secondary mb-1.5">
						Name <span className="text-red-500" aria-hidden>*</span>
					</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g. Food & Drink"
						disabled={isLoading}
						className="w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors disabled:opacity-50"
					/>
				</div>

				{/* Description */}
				<div>
					<label className="block text-xs font-semibold text-text-secondary mb-1.5">
						Description <span className="text-text-tertiary font-normal">(optional)</span>
					</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="e.g. Dining experiences, food tours, and culinary workshops"
						rows={3}
						disabled={isLoading}
						className="w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors resize-none disabled:opacity-50"
					/>
				</div>

				{/* isActive toggle (edit mode only) */}
				{isEdit && (
					<div className="flex items-center justify-between rounded-xl border border-border-default px-4 py-3">
						<div>
							<p className="text-xs font-semibold text-text-primary">Active</p>
							<p className="text-[11px] text-text-tertiary mt-0.5">
								Inactive categories are hidden from hosts and attendees.
							</p>
						</div>
						<button
							type="button"
							onClick={() => setIsActive((v) => !v)}
							disabled={isLoading}
							className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
								isActive ? "bg-action-primary" : "bg-neutral-300"
							}`}
						>
							<span
								className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
									isActive ? "translate-x-4.5" : "translate-x-0.5"
								}`}
							/>
						</button>
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
					className="rounded-lg border border-border-default px-4 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					onClick={handleSubmit as unknown as React.MouseEventHandler}
					disabled={isLoading || !name.trim()}
					className="flex items-center gap-1.5 rounded-lg bg-action-primary px-4 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading && <Loader2 size={13} className="animate-spin" />}
					{isEdit ? "Save Changes" : "Create Category"}
				</button>
			</DrawerFooter>
		</Drawer>
	)
}
