"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, CheckCircle2, Loader2 } from "lucide-react"
import { usePermission } from "@/lib/hooks/use-permission"

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
	name:  z.string().min(1, "Name is required"),
	email: z.string().min(1, "Email is required").email({ message: "Enter a valid email" }),
	phone: z.string().optional(),
	city:  z.string().min(1, "City is required"),
})

type FormValues = z.infer<typeof schema>

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
	"w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm placeholder:text-neutral-light " +
	"focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
	label,
	hint,
	error,
	children,
}: {
	label: string
	hint?: string
	error?: string
	children: React.ReactNode
}) {
	return (
		<div className="space-y-1.5">
			<label className="block text-xs font-medium text-foreground">{label}</label>
			{children}
			{hint && !error && <p className="text-[11px] text-neutral-light">{hint}</p>}
			{error && <p className="text-[11px] text-red-600">{error}</p>}
		</div>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HostInvitePage() {
	const canInvite = usePermission("host.invite")
	const [sent, setSent] = useState(false)

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { name: "", email: "", phone: "", city: "" },
	})

	async function onSubmit(_values: FormValues) {
		// TODO: replace with real API call
		await new Promise((r) => setTimeout(r, 900))
		setSent(true)
	}

	if (!canInvite) {
		return (
			<div className="p-6 max-w-7xl mx-auto">
				<p className="text-sm text-neutral-light">You don't have permission to invite hosts.</p>
			</div>
		)
	}

	// ── Success state ──────────────────────────────────────────────────────────

	if (sent) {
		return (
			<div className="p-6 max-w-7xl mx-auto">
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
						<CheckCircle2 size={28} className="text-green-600" />
					</div>
					<h2 className="text-base font-semibold text-foreground">Invitation sent</h2>
					<p className="mt-1 text-sm text-neutral-light max-w-xs">
						The host will receive an email with a link to complete their profile.
					</p>
					<div className="mt-6 flex items-center gap-3">
						<button
							onClick={() => {
								setSent(false)
								reset()
							}}
							className="rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors"
						>
							Invite another
						</button>
						<Link
							href="/hosts/invite/bulk"
							className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors"
						>
							Bulk upload
						</Link>
					</div>
				</div>
			</div>
		)
	}

	// ── Form ───────────────────────────────────────────────────────────────────

	return (
		<div className="p-6 space-y-6 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h1 className="text-base font-semibold text-foreground">Invite Host</h1>
				<Link
					href="/hosts/invite/bulk"
					className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors"
				>
					<Upload size={13} />
					Bulk upload
				</Link>
			</div>

			{/* Card */}
			<div className="rounded-xl border border-neutral-200 bg-white p-6 max-w-md">
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
					<Field label="Full name" error={errors.name?.message}>
						<input
							{...register("name")}
							type="text"
							placeholder="Jane Doe"
							className={inputCls}
						/>
					</Field>

					<Field label="Email address" error={errors.email?.message}>
						<input
							{...register("email")}
							type="email"
							placeholder="jane@example.com"
							autoComplete="off"
							className={inputCls}
						/>
					</Field>

					<Field
						label="Phone"
						hint="Optional — used for WhatsApp outreach"
						error={errors.phone?.message}
					>
						<input
							{...register("phone")}
							type="tel"
							placeholder="+91 98765 43210"
							className={inputCls}
						/>
					</Field>

					<Field label="City" error={errors.city?.message}>
						<input
							{...register("city")}
							type="text"
							placeholder="Mumbai"
							className={inputCls}
						/>
					</Field>

					<div className="pt-1">
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex items-center gap-1.5 rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors disabled:opacity-70"
						>
							{isSubmitting && <Loader2 size={13} className="animate-spin" />}
							Send invitation
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
