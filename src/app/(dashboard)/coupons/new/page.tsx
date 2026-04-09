"use client"

import { useState, useId } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, AlertTriangle, Loader2, Check } from "lucide-react"
import { usePermission } from "@/lib/hooks/use-permission"
import type { CouponApplicability, DiscountType, Coupon } from "@/types"

// ─── Mock active coupons (same source of truth as list page) ─────────────────
// Imported inline so we can check for applicability conflicts without a real API.

const ACTIVE_COUPONS: Pick<Coupon, "id" | "code" | "applicability" | "cities" | "discountType">[] = [
	{
		id: "c1",
		code: "MEET20",
		applicability: "CITY",
		cities: ["Mumbai"],
		discountType: "PERCENTAGE",
	},
	{
		id: "c2",
		code: "FLAT50",
		applicability: "CITY",
		cities: ["Pune"],
		discountType: "FLAT",
	},
]

// ─── Available cities (would come from API) ───────────────────────────────────

const ALL_CITIES = ["Bangalore", "Chennai", "Delhi", "Hyderabad", "Mumbai", "Pune"]

// ─── Code generator ───────────────────────────────────────────────────────────

function generateCode(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const suffix = Array.from({ length: 6 }, () =>
		chars[Math.floor(Math.random() * chars.length)],
	).join("")
	return `MEET-${suffix}`
}

// ─── Conflict detection ───────────────────────────────────────────────────────

type ConflictWarning = {
	code: string
	reason: string
}

function detectConflicts(
	applicability: CouponApplicability,
	cities: string[],
): ConflictWarning[] {
	return ACTIVE_COUPONS.flatMap((existing) => {
		// ALL scope conflicts with everything
		if (applicability === "ALL" || existing.applicability === "ALL") {
			return [{ code: existing.code, reason: "applies to all cities & events" }]
		}
		// CITY scope conflicts if cities overlap
		if (applicability === "CITY" && existing.applicability === "CITY") {
			const overlap = cities.filter((c) => existing.cities.includes(c))
			if (overlap.length > 0) {
				return [{ code: existing.code, reason: `overlaps in ${overlap.join(", ")}` }]
			}
		}
		return []
	})
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
	return (
		<label htmlFor={htmlFor} className="block text-xs font-semibold text-foreground mb-1.5">
			{children}
		</label>
	)
}

function FieldHint({ children }: { children: React.ReactNode }) {
	return <p className="mt-1 text-[11px] text-neutral-light">{children}</p>
}

function inputCls(hasError?: boolean) {
	return `w-full rounded-lg border ${
		hasError ? "border-red-300" : "border-neutral-200"
	} bg-white px-3 py-2 text-xs placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewCouponPage() {
	const canCreate = usePermission("coupon.create")
	const router    = useRouter()
	const uid       = useId()

	// ── Form state ──
	const [code, setCode]                       = useState("")
	const [autoGenerate, setAutoGenerate]       = useState(false)
	const [description, setDescription]         = useState("")
	const [discountType, setDiscountType]       = useState<DiscountType>("PERCENTAGE")
	const [discountValue, setDiscountValue]     = useState("")
	const [applicability, setApplicability]     = useState<CouponApplicability>("ALL")
	const [selectedCities, setSelectedCities]   = useState<string[]>([])
	const [maxUses, setMaxUses]                 = useState("")
	const [expiresAt, setExpiresAt]             = useState("")

	// ── UI state ──
	const [errors, setErrors]   = useState<Record<string, string>>({})
	const [submitted, setSubmitted] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	// ── Live conflict check ──
	const conflicts = detectConflicts(applicability, selectedCities)

	// ── Auto-generate handler ──
	function handleAutoGenerate() {
		const generated = generateCode()
		setCode(generated)
		setAutoGenerate(true)
	}

	function handleCodeEdit(value: string) {
		setCode(value.toUpperCase())
		setAutoGenerate(false)
	}

	// ── City toggle ──
	function toggleCity(city: string) {
		setSelectedCities((prev) =>
			prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
		)
	}

	// ── Validation ──
	function validate(): boolean {
		const errs: Record<string, string> = {}
		if (!code.trim()) errs.code = "Coupon code is required."
		if (!/^[A-Z0-9_-]{3,20}$/.test(code.trim()))
			errs.code = "Code must be 3–20 chars: uppercase letters, numbers, - or _."
		const val = Number(discountValue)
		if (!discountValue || isNaN(val) || val <= 0)
			errs.discountValue = "Enter a valid positive number."
		if (discountType === "PERCENTAGE" && val > 100)
			errs.discountValue = "Percentage cannot exceed 100."
		if (applicability === "CITY" && selectedCities.length === 0)
			errs.cities = "Select at least one city."
		if (maxUses && (isNaN(Number(maxUses)) || Number(maxUses) < 1))
			errs.maxUses = "Max uses must be a positive integer."
		setErrors(errs)
		return Object.keys(errs).length === 0
	}

	// ── Submit ──
	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!validate()) return

		setIsLoading(true)
		// TODO: replace with real API call
		await new Promise((r) => setTimeout(r, 900))
		setIsLoading(false)
		setSubmitted(true)
		await new Promise((r) => setTimeout(r, 600))
		router.push("/coupons")
	}

	// ── Guard ──
	if (!canCreate) {
		return (
			<div className="p-6 max-w-2xl mx-auto">
				<p className="text-sm text-neutral-light">
					Only Super Admins can create coupons.
				</p>
			</div>
		)
	}

	return (
		<div className="p-6 max-w-2xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<button
					onClick={() => router.back()}
					className="rounded-lg p-1.5 text-neutral-light hover:bg-neutral-100 hover:text-neutral-dark transition-colors"
				>
					<ArrowLeft size={15} />
				</button>
				<h1 className="text-base font-semibold text-foreground">New Coupon</h1>
			</div>

			{/* Active conflict warning (shown when overlapping active coupons exist) */}
			{conflicts.length > 0 && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
					<AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
					<div className="space-y-1">
						<p className="text-xs font-semibold text-amber-800">
							Active coupon conflict detected
						</p>
						<ul className="space-y-0.5">
							{conflicts.map((c) => (
								<li key={c.code} className="text-[11px] text-amber-700">
									<span className="font-mono font-semibold">{c.code}</span> — {c.reason}
								</li>
							))}
						</ul>
						<p className="text-[11px] text-amber-700 mt-1">
							Having multiple active coupons for the same scope may confuse users. You
							can still create this coupon, but consider disabling the conflicting one
							first.
						</p>
					</div>
				</div>
			)}

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* ── Code ── */}
				<div>
					<Label htmlFor={`${uid}-code`}>Coupon Code *</Label>
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
							className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-dark hover:bg-neutral-50 transition-colors"
							title="Auto-generate code"
						>
							<RefreshCw size={12} className={autoGenerate ? "text-brand-red" : ""} />
							Auto-generate
						</button>
					</div>
					{autoGenerate && (
						<FieldHint>Code was auto-generated. You can still edit it.</FieldHint>
					)}
					{errors.code && (
						<p className="mt-1 text-[11px] text-red-600">{errors.code}</p>
					)}
				</div>

				{/* ── Description ── */}
				<div>
					<Label htmlFor={`${uid}-desc`}>Description</Label>
					<input
						id={`${uid}-desc`}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Internal note about this coupon's purpose"
						className={inputCls()}
					/>
				</div>

				{/* ── Discount ── */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label htmlFor={`${uid}-type`}>Discount Type *</Label>
						<select
							id={`${uid}-type`}
							value={discountType}
							onChange={(e) => setDiscountType(e.target.value as DiscountType)}
							className={inputCls()}
						>
							<option value="PERCENTAGE">Percentage (%)</option>
							<option value="FLAT">Flat amount (₹)</option>
						</select>
					</div>
					<div>
						<Label htmlFor={`${uid}-value`}>
							{discountType === "PERCENTAGE" ? "Percentage *" : "Amount (₹) *"}
						</Label>
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
							<p className="mt-1 text-[11px] text-red-600">{errors.discountValue}</p>
						)}
					</div>
				</div>

				{/* ── Applicability ── */}
				<div className="space-y-3">
					<div>
						<Label htmlFor={`${uid}-scope`}>Applicability *</Label>
						<select
							id={`${uid}-scope`}
							value={applicability}
							onChange={(e) => {
								setApplicability(e.target.value as CouponApplicability)
								setSelectedCities([])
							}}
							className={inputCls()}
						>
							<option value="ALL">All cities & events</option>
							<option value="CITY">Specific cities</option>
							<option value="EVENT">Specific events</option>
						</select>
					</div>

					{applicability === "CITY" && (
						<div>
							<p className="text-xs font-semibold text-foreground mb-2">Select cities *</p>
							<div className="flex flex-wrap gap-2">
								{ALL_CITIES.map((city) => {
									const selected = selectedCities.includes(city)
									return (
										<button
											key={city}
											type="button"
											onClick={() => toggleCity(city)}
											className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border ${
												selected
													? "bg-brand-red text-white border-brand-red"
													: "bg-white text-neutral-dark border-neutral-200 hover:border-brand-red/50"
											}`}
										>
											{selected && <Check size={10} />}
											{city}
										</button>
									)
								})}
							</div>
							{errors.cities && (
								<p className="mt-1.5 text-[11px] text-red-600">{errors.cities}</p>
							)}
						</div>
					)}

					{applicability === "EVENT" && (
						<div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
							<p className="text-xs text-neutral-dark">
								Event-specific coupon linking is not yet available in this interface.
								The coupon will be created and can be linked to events via the API.
							</p>
						</div>
					)}
				</div>

				{/* ── Limits ── */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label htmlFor={`${uid}-max`}>Max Uses</Label>
						<input
							id={`${uid}-max`}
							type="number"
							min={1}
							step={1}
							value={maxUses}
							onChange={(e) => setMaxUses(e.target.value)}
							placeholder="Leave blank for unlimited"
							className={inputCls(!!errors.maxUses)}
						/>
						{errors.maxUses && (
							<p className="mt-1 text-[11px] text-red-600">{errors.maxUses}</p>
						)}
					</div>
					<div>
						<Label htmlFor={`${uid}-expires`}>Expiry Date</Label>
						<input
							id={`${uid}-expires`}
							type="date"
							value={expiresAt}
							min={new Date().toISOString().split("T")[0]}
							onChange={(e) => setExpiresAt(e.target.value)}
							className={inputCls()}
						/>
						<FieldHint>Leave blank for no expiry.</FieldHint>
					</div>
				</div>

				{/* ── Actions ── */}
				<div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100">
					<button
						type="button"
						onClick={() => router.back()}
						disabled={isLoading}
						className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isLoading || submitted}
						className="inline-flex items-center gap-1.5 rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors disabled:opacity-70"
					>
						{isLoading && <Loader2 size={12} className="animate-spin" />}
						{submitted && <Check size={12} />}
						{submitted ? "Created!" : "Create Coupon"}
					</button>
				</div>
			</form>
		</div>
	)
}
