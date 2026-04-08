"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import type { Role } from "@/types"

// ─── Schema ───────────────────────────────────────────────────────────────────

const inviteSchema = z
	.object({
		email: z.string().min(1, "Email is required").email("Enter a valid email"),
		role: z.enum(["SUPER_ADMIN", "CITY_ADMIN", "MODERATOR", "SUPPORT"]),
		cityScope: z.string().optional(),
	})
	.refine(
		(data) => {
			if (data.role === "CITY_ADMIN") return !!data.cityScope?.trim()
			return true
		},
		{ message: "City is required for City Admin role", path: ["cityScope"] },
	)

type InviteFormValues = z.infer<typeof inviteSchema>

// ─── Role options ─────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
	{
		value: "SUPER_ADMIN",
		label: "Super Admin",
		description: "Full access across all cities",
	},
	{
		value: "CITY_ADMIN",
		label: "City Admin",
		description: "Manage hosts and events in one city",
	},
	{
		value: "MODERATOR",
		label: "Moderator",
		description: "Review and moderate content",
	},
	{
		value: "SUPPORT",
		label: "Support",
		description: "Read-only moderation access",
	},
]

// ─── Types ────────────────────────────────────────────────────────────────────

export type InviteAdminDrawerProps = {
	open: boolean
	onClose: () => void
	onSubmit: (values: { email: string; role: Role; cityScope?: string }) => Promise<void>
	isSubmitting?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteAdminDrawer({
	open,
	onClose,
	onSubmit,
	isSubmitting = false,
}: InviteAdminDrawerProps) {
	const {
		register,
		handleSubmit,
		watch,
		control,
		reset,
		formState: { errors },
	} = useForm<InviteFormValues>({
		resolver: zodResolver(inviteSchema),
		defaultValues: { email: "", role: "MODERATOR", cityScope: "" },
	})

	const selectedRole = watch("role")

	// Reset form when drawer closes
	useEffect(() => {
		if (!open) reset()
	}, [open, reset])

	async function handleFormSubmit(values: InviteFormValues) {
		await onSubmit({
			email: values.email,
			role: values.role as Role,
			cityScope: values.role === "CITY_ADMIN" ? values.cityScope : undefined,
		})
	}

	return (
		<Drawer
			open={open}
			onClose={onClose}
			title="Invite Admin"
			description="An email invitation will be sent to the address below."
		>
			<form
				id="invite-admin-form"
				onSubmit={handleSubmit(handleFormSubmit)}
				className="space-y-5"
			>
				{/* Email */}
				<div className="space-y-1.5">
					<label className="block text-xs font-medium text-foreground">
						Email address
					</label>
					<input
						{...register("email")}
						type="email"
						placeholder="admin@example.com"
						autoComplete="off"
						className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
					/>
					{errors.email && (
						<p className="text-[11px] text-red-600">{errors.email.message}</p>
					)}
				</div>

				{/* Role */}
				<div className="space-y-1.5">
					<label className="block text-xs font-medium text-foreground">Role</label>
					<div className="space-y-2">
						<Controller
							name="role"
							control={control}
							render={({ field }) => (
								<>
									{ROLE_OPTIONS.map((opt) => (
										<label
											key={opt.value}
											className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
												field.value === opt.value
													? "border-brand-red bg-brand-red/5"
													: "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
											}`}
										>
											<input
												type="radio"
												value={opt.value}
												checked={field.value === opt.value}
												onChange={() => field.onChange(opt.value)}
												className="mt-0.5 accent-brand-red"
											/>
											<div>
												<p className="text-xs font-semibold text-foreground">
													{opt.label}
												</p>
												<p className="text-[11px] text-neutral-light leading-relaxed">
													{opt.description}
												</p>
											</div>
										</label>
									))}
								</>
							)}
						/>
					</div>
					{errors.role && (
						<p className="text-[11px] text-red-600">{errors.role.message}</p>
					)}
				</div>

				{/* City scope — shown only for CITY_ADMIN */}
				{selectedRole === "CITY_ADMIN" && (
					<div className="space-y-1.5">
						<label className="block text-xs font-medium text-foreground">
							City scope
						</label>
						<input
							{...register("cityScope")}
							type="text"
							placeholder="e.g. Mumbai"
							className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
						/>
						<p className="text-[11px] text-neutral-light">
							This admin will only manage content in the specified city.
						</p>
						{errors.cityScope && (
							<p className="text-[11px] text-red-600">{errors.cityScope.message}</p>
						)}
					</div>
				)}
			</form>

			{/* Footer lives outside the form scroll area */}
			<DrawerFooter>
				<button
					type="button"
					onClick={onClose}
					disabled={isSubmitting}
					className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					form="invite-admin-form"
					disabled={isSubmitting}
					className="flex items-center gap-1.5 rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors disabled:opacity-70"
				>
					{isSubmitting && <Loader2 size={13} className="animate-spin" />}
					Send invite
				</button>
			</DrawerFooter>
		</Drawer>
	)
}
