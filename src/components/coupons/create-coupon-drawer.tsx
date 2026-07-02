"use client"

import { useEffect, useId, useState } from "react"
import { RefreshCw, Loader2 } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { createCoupon } from "@/lib/api/coupons"
import type { CouponTarget, DiscountType } from "@/types"
import axios from "axios"
import { toast } from "sonner"

//  Helpers

function generateCode(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const suffix = Array.from({ length: 6 }, () =>
		chars[Math.floor(Math.random() * chars.length)],
	).join("")
	return `MEET-${suffix}`
}

function inputCls(hasError?: boolean) {
	return `w-full rounded-lg border ${
		hasError ? "border-red-300" : "border-border-default"
	} bg-surface-canvas px-3 py-2.5 text-sm placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors`
}

function getApiErrorMessage(err: unknown): string {
	if (axios.isAxiosError(err)) {
		return err.response?.data?.message ?? err.message
	}
	return err instanceof Error ? err.message : "Something went wrong"
}

//  Types

export type CreateCouponDrawerProps = {
	open: boolean
	onClose: () => void
	onSuccess: () => void
}

//  Component

export function CreateCouponDrawer({ open, onClose, onSuccess }: CreateCouponDrawerProps) {
	const uid = useId()

	//  Form state 
	const [code, setCode]                         = useState("")
	const [autoGenerate, setAutoGenerate]         = useState(false)
	const [description, setDescription]           = useState("")
	const [target, setTarget]                     = useState<CouponTarget>("ATTENDEE")
	const [discountType, setDiscountType]         = useState<DiscountType>("PERCENTAGE")
	const [discountValue, setDiscountValue]       = useState("")
	const [maxUsages, setMaxUsages]               = useState("")
	const [maxUsagesPerUser, setMaxUsagesPerUser] = useState("")

	//  UI state 
	const [errors, setErrors]       = useState<Record<string, string>>({})
	const [isSubmitting, setSubmitting] = useState(false)

	// Reset form when drawer closes
	useEffect(() => {
		if (!open) {
			setCode("")
			setAutoGenerate(false)
			setDescription("")
			setTarget("ATTENDEE")
			setDiscountType("PERCENTAGE")
			setDiscountValue("")
			setMaxUsages("")
			setMaxUsagesPerUser("")
			setErrors({})
		}
	}, [open])

	function handleAutoGenerate() {
		setCode(generateCode())
		setAutoGenerate(true)
	}

	function handleCodeEdit(value: string) {
		setCode(value.toUpperCase())
		setAutoGenerate(false)
	}

	function validate(): boolean {
		const errs: Record<string, string> = {}

		if (!code.trim()) {
			errs.code = "Coupon code is required."
		} else if (!/^[A-Z0-9_-]{3,20}$/.test(code.trim())) {
			errs.code = "Code must be 3-20 chars: uppercase letters, numbers, - or _."
		}

		const val = Number(discountValue)
		if (!discountValue || isNaN(val) || val <= 0) {
			errs.discountValue = "Enter a valid positive number."
		} else if (discountType === "PERCENTAGE" && val > 100) {
			errs.discountValue = "Percentage cannot exceed 100."
		}

		if (maxUsages) {
			const v = Number(maxUsages)
			if (isNaN(v) || v < 1 || !Number.isInteger(v))
				errs.maxUsages = "Enter a valid positive integer, or leave blank for unlimited."
		}

		if (maxUsagesPerUser) {
			const v = Number(maxUsagesPerUser)
			if (isNaN(v) || v < 1 || !Number.isInteger(v))
				errs.maxUsagesPerUser = "Enter a valid positive integer, or leave blank for unlimited."
		}

		setErrors(errs)
		return Object.keys(errs).length === 0
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!validate()) return

		setSubmitting(true)
		try {
			const coupon = await createCoupon({
				code: code.trim(),
				...(description.trim() && { description: description.trim() }),
				target,
				discountType,
				discountValue: Number(discountValue),
				maxUsages: maxUsages ? Number(maxUsages) : null,
				maxUsagesPerUser: maxUsagesPerUser ? Number(maxUsagesPerUser) : null,
			})
			toast.success("Coupon created", {
				description: `${coupon.code} is now live and can be redeemed.`,
			})
			onClose()
			onSuccess()
		} catch (err) {
			const message = getApiErrorMessage(err)
			if (axios.isAxiosError(err) && err.response?.status === 409) {
				setErrors({ code: message || "A coupon with this code already exists." })
			} else {
				toast.error("Failed to create coupon", { description: message })
			}
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Drawer
			open={open}
			onClose={onClose}
			title="New Coupon"
			description="Create a new discount coupon for hosts or attendees."
			width="max-w-md"
		>
			<form id="create-coupon-form" onSubmit={handleSubmit} className="space-y-5">
				{/*  Code  */}
				<div className="space-y-1.5">
					<label htmlFor={`${uid}-code`} className="block text-xs font-medium text-text-primary">
						Coupon Code *
					</label>
					<div className="flex gap-2">
						<input
							id={`${uid}-code`}
							value={code}
							onChange={(e) => handleCodeEdit(e.target.value)}
							placeholder="e.g. SUMMER20"
							maxLength={20}
							className={`${inputCls(!!errors.code)} flex-1 font-mono tracking-wide`}
						/>
						<button
							type="button"
							onClick={handleAutoGenerate}
							title="Auto-generate code"
							className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-border-default px-3 py-2.5 text-xs font-semibold text-text-secondary hover:bg-neutral-50 transition-colors"
						>
							<RefreshCw size={12} className={autoGenerate ? "text-text-brand" : ""} />
							Auto
						</button>
					</div>
					{autoGenerate && (
						<p className="text-[11px] text-text-tertiary">Auto-generated. You can still edit it.</p>
					)}
					{errors.code && (
						<p className="text-[11px] text-red-600">{errors.code}</p>
					)}
				</div>

				{/*  Description  */}
				<div className="space-y-1.5">
					<label htmlFor={`${uid}-desc`} className="block text-xs font-medium text-text-primary">
						Description
					</label>
					<input
						id={`${uid}-desc`}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Internal note about this coupon's purpose"
						className={inputCls()}
					/>
				</div>

				{/*  Target  */}
				<div className="space-y-1.5">
					<label htmlFor={`${uid}-target`} className="block text-xs font-medium text-text-primary">
						Target *
					</label>
					<div className="grid grid-cols-2 gap-2">
						{(["ATTENDEE", "HOST"] as CouponTarget[]).map((t) => (
							<label
								key={t}
								className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition-colors ${
									target === t
										? "border-border-focus bg-surface-brand-soft"
										: "border-border-default hover:border-border-strong hover:bg-neutral-50"
								}`}
							>
								<input
									type="radio"
									checked={target === t}
									onChange={() => setTarget(t)}
									className="accent-brand-red"
								/>
								<div>
									<p className="text-xs font-semibold text-text-primary">
										{t === "ATTENDEE" ? "Attendee" : "Host"}
									</p>
									<p className="text-[11px] text-text-tertiary leading-relaxed">
										{t === "ATTENDEE" ? "Applied to attendee fees" : "Applied to host fees"}
									</p>
								</div>
							</label>
						))}
					</div>
				</div>

				{/*  Discount  */}
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<label htmlFor={`${uid}-type`} className="block text-xs font-medium text-text-primary">
							Discount Type *
						</label>
						<select
							id={`${uid}-type`}
							value={discountType}
							onChange={(e) => setDiscountType(e.target.value as DiscountType)}
							className={inputCls()}
						>
							<option value="PERCENTAGE">Percentage (%)</option>
							<option value="FLAT">Flat amount (र )</option>
						</select>
					</div>
					<div className="space-y-1.5">
						<label htmlFor={`${uid}-value`} className="block text-xs font-medium text-text-primary">
							{discountType === "PERCENTAGE" ? "Percentage *" : "Amount (र ) *"}
						</label>
						<input
							id={`${uid}-value`}
							type="number"
							min={1}
							max={discountType === "PERCENTAGE" ? 100 : undefined}
							step={discountType === "PERCENTAGE" ? 1 : 0.01}
							value={discountValue}
							onChange={(e) => setDiscountValue(e.target.value)}
							placeholder={discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 100"}
							className={inputCls(!!errors.discountValue)}
						/>
						{errors.discountValue && (
							<p className="text-[11px] text-red-600">{errors.discountValue}</p>
						)}
					</div>
				</div>

				{/*  Usage limits  */}
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<label htmlFor={`${uid}-maxUsages`} className="block text-xs font-medium text-text-primary">
							Total Usage Limit
						</label>
						<input
							id={`${uid}-maxUsages`}
							type="number"
							min={1}
							step={1}
							value={maxUsages}
							onChange={(e) => setMaxUsages(e.target.value)}
							placeholder="Unlimited"
							className={inputCls(!!errors.maxUsages)}
						/>
						{errors.maxUsages && (
							<p className="text-[11px] text-red-600">{errors.maxUsages}</p>
						)}
						<p className="text-[11px] text-text-tertiary">Max total redemptions.</p>
					</div>
					<div className="space-y-1.5">
						<label htmlFor={`${uid}-maxUsagesPerUser`} className="block text-xs font-medium text-text-primary">
							Limit Per User
						</label>
						<input
							id={`${uid}-maxUsagesPerUser`}
							type="number"
							min={1}
							step={1}
							value={maxUsagesPerUser}
							onChange={(e) => setMaxUsagesPerUser(e.target.value)}
							placeholder="Unlimited"
							className={inputCls(!!errors.maxUsagesPerUser)}
						/>
						{errors.maxUsagesPerUser && (
							<p className="text-[11px] text-red-600">{errors.maxUsagesPerUser}</p>
						)}
						<p className="text-[11px] text-text-tertiary">Max per single user.</p>
					</div>
				</div>
			</form>

			<DrawerFooter>
				<button
					type="button"
					onClick={onClose}
					disabled={isSubmitting}
					className="rounded-lg border border-border-default px-4 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition-colors disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					form="create-coupon-form"
					disabled={isSubmitting}
					className="flex items-center gap-1.5 rounded-lg bg-action-primary px-4 py-2 text-xs font-semibold text-white hover:bg-action-primary-hover transition-colors disabled:opacity-70"
				>
					{isSubmitting && <Loader2 size={13} className="animate-spin" />}
					Create Coupon
				</button>
			</DrawerFooter>
		</Drawer>
	)
}
