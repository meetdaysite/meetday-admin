"use client"

import { useEffect, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, X } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { fetchAdminRoles } from "@/lib/api/roles"
import type { Role, RoleDefinition } from "@/types"

// ─── Schema ───────────────────────────────────────────────────────────────────

const inviteSchema = z
	.object({
		email: z.string().min(1, "Email is required").email("Enter a valid email"),
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().min(1, "Last name is required"),
		roleId: z.string().min(1, "Role is required"),
		roleName: z.string(),
		managedCities: z.array(z.string()),
	})
	.refine(
		(data) => {
			if (data.roleName === "CITY_ADMIN") return data.managedCities.length > 0
			return true
		},
		{ message: "At least one city is required for City Admin", path: ["managedCities"] },
	)

type InviteFormValues = z.infer<typeof inviteSchema>

// ─── Types ────────────────────────────────────────────────────────────────────

export type InviteAdminSubmitValues = {
	email: string
	firstName: string
	lastName: string
	roleId: string
	roleName: Role
	managedCities?: string[]
}

export type InviteAdminDrawerProps = {
	open: boolean
	onClose: () => void
	onSubmit: (values: InviteAdminSubmitValues) => Promise<void>
	isSubmitting?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLabel(name: string) {
	return name
		.split("_")
		.map((w) => w.charAt(0) + w.slice(1).toLowerCase())
		.join(" ")
}

// ─── City tag input ───────────────────────────────────────────────────────────

function CityTagInput({
	value,
	onChange,
	error,
}: {
	value: string[]
	onChange: (cities: string[]) => void
	error?: string
}) {
	const [draft, setDraft] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)

	function addCity(raw: string) {
		const city = raw.trim()
		if (!city || value.includes(city)) {
			setDraft("")
			return
		}
		onChange([...value, city])
		setDraft("")
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault()
			addCity(draft)
		} else if (e.key === "Backspace" && draft === "" && value.length > 0) {
			onChange(value.slice(0, -1))
		}
	}

	function removeCity(city: string) {
		onChange(value.filter((c) => c !== city))
	}

	return (
		<div>
			<div
				className="flex min-h-10 w-full flex-wrap gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 focus-within:border-brand-red focus-within:ring-2 focus-within:ring-brand-red/10 transition-colors cursor-text"
				onClick={() => inputRef.current?.focus()}
			>
				{value.map((city) => (
					<span
						key={city}
						className="inline-flex items-center gap-1 rounded-md bg-brand-red/8 px-2 py-0.5 text-[11px] font-semibold text-brand-red"
					>
						{city}
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation()
								removeCity(city)
							}}
							className="rounded-sm hover:bg-brand-red/20 transition-colors"
						>
							<X size={10} />
						</button>
					</span>
				))}
				<input
					ref={inputRef}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={() => addCity(draft)}
					placeholder={value.length === 0 ? "Type a city and press Enter" : ""}
					className="min-w-35 flex-1 bg-transparent text-sm placeholder:text-neutral-light outline-none"
				/>
			</div>
			{error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
			<p className="mt-1 text-[11px] text-neutral-light">
				Press Enter or comma to add each city.
			</p>
		</div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteAdminDrawer({
	open,
	onClose,
	onSubmit,
	isSubmitting = false,
}: InviteAdminDrawerProps) {
	const [roles, setRoles] = useState<RoleDefinition[]>([])
	const [rolesLoading, setRolesLoading] = useState(false)

	const {
		register,
		handleSubmit,
		watch,
		control,
		reset,
		setValue,
		formState: { errors },
	} = useForm<InviteFormValues>({
		resolver: zodResolver(inviteSchema),
		defaultValues: {
			email: "",
			firstName: "",
			lastName: "",
			roleId: "",
			roleName: "",
			managedCities: [],
		},
	})

	const roleName = watch("roleName")

	// Fetch roles when drawer opens
	useEffect(() => {
		if (!open) {
			reset()
			return
		}
		setRolesLoading(true)
		fetchAdminRoles()
			.then((data) => {
				setRoles(data)
				if (data[0]) {
					setValue("roleId", data[0].id)
					setValue("roleName", data[0].name)
				}
			})
			.finally(() => setRolesLoading(false))
	}, [open, reset, setValue])

	async function handleFormSubmit(values: InviteFormValues) {
		await onSubmit({
			email: values.email,
			firstName: values.firstName,
			lastName: values.lastName,
			roleId: values.roleId,
			roleName: values.roleName as Role,
			managedCities:
				values.roleName === "CITY_ADMIN" ? values.managedCities : undefined,
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
				{/* Name row */}
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<label className="block text-xs font-medium text-foreground">
							First name
						</label>
						<input
							{...register("firstName")}
							type="text"
							placeholder="Rahul"
							autoComplete="off"
							className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
						/>
						{errors.firstName && (
							<p className="text-[11px] text-red-600">{errors.firstName.message}</p>
						)}
					</div>
					<div className="space-y-1.5">
						<label className="block text-xs font-medium text-foreground">
							Last name
						</label>
						<input
							{...register("lastName")}
							type="text"
							placeholder="Sharma"
							autoComplete="off"
							className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm placeholder:text-neutral-light focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10 transition-colors"
						/>
						{errors.lastName && (
							<p className="text-[11px] text-red-600">{errors.lastName.message}</p>
						)}
					</div>
				</div>

				{/* Email */}
				<div className="space-y-1.5">
					<label className="block text-xs font-medium text-foreground">
						Email address
					</label>
					<input
						{...register("email")}
						type="email"
						placeholder="admin@meetday.in"
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

					{rolesLoading ? (
						<div className="flex items-center gap-2 py-4 text-xs text-neutral-light">
							<Loader2 size={13} className="animate-spin" />
							Loading roles…
						</div>
					) : (
						<div className="space-y-2">
							{roles.map((opt) => (
								<label
									key={opt.id}
									className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
										roleName === opt.name
											? "border-brand-red bg-brand-red/5"
											: "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
									}`}
								>
									<input
										type="radio"
										value={opt.id}
										checked={roleName === opt.name}
										onChange={() => {
											setValue("roleId", opt.id)
											setValue("roleName", opt.name)
											// Clear cities when switching away from CITY_ADMIN
											if (opt.name !== "CITY_ADMIN") {
												setValue("managedCities", [])
											}
										}}
										className="mt-0.5 accent-brand-red"
									/>
									<div>
										<p className="text-xs font-semibold text-foreground">
											{toLabel(opt.name)}
										</p>
										<p className="text-[11px] text-neutral-light leading-relaxed">
											{opt.description}
										</p>
									</div>
								</label>
							))}
						</div>
					)}

					{errors.roleId && (
						<p className="text-[11px] text-red-600">{errors.roleId.message}</p>
					)}
				</div>

				{/* Managed cities — shown only for CITY_ADMIN */}
				{roleName === "CITY_ADMIN" && (
					<div className="space-y-1.5">
						<label className="block text-xs font-medium text-foreground">
							Managed cities
						</label>
						<Controller
							name="managedCities"
							control={control}
							render={({ field }) => (
								<CityTagInput
									value={field.value}
									onChange={field.onChange}
									error={errors.managedCities?.message}
								/>
							)}
						/>
					</div>
				)}
			</form>

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
					disabled={isSubmitting || rolesLoading}
					className="flex items-center gap-1.5 rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors disabled:opacity-70"
				>
					{isSubmitting && <Loader2 size={13} className="animate-spin" />}
					Send invite
				</button>
			</DrawerFooter>
		</Drawer>
	)
}
