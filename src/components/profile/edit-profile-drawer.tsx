"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"
import { AvatarUploadZone } from "@/components/profile/avatar-upload-zone"
import { updateAdminProfile, type AdminProfile } from "@/lib/api/profile"

const INDIAN_PHONE_REGEX = /^\+91[6-9]\d{9}$/

const schema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	phone: z
		.string()
		.optional()
		.refine(val => !val || INDIAN_PHONE_REGEX.test(val.replace(/\s+/g, "")), {
			message: "Enter a valid Indian number starting with +91 (e.g. +919876543210)",
		}),
})

type FormValues = z.infer<typeof schema>

type Props = {
	open: boolean
	profile: AdminProfile
	onClose: () => void
	onSaved: (profile: AdminProfile) => void
}

function getInitials(firstName: string, lastName: string): string {
	return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

export function EditProfileDrawer({ open, profile, onClose, onSaved }: Props) {
	const [avatarKey, setAvatarKey] = useState<string | undefined>(undefined)
	const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl)

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			firstName: profile.firstName,
			lastName: profile.lastName,
			phone: profile.phone ?? "",
		},
	})

	// Re-sync the form and avatar preview whenever the drawer is opened for a
	// (possibly updated) profile, rather than only on first mount.
	useEffect(() => {
		if (!open) return
		reset({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone ?? "" })
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setAvatarKey(undefined)
		setAvatarPreview(profile.avatarUrl)
	}, [open, profile, reset])

	function handleClose() {
		onClose()
	}

	async function onSubmit(values: FormValues) {
		try {
			const updated = await updateAdminProfile({
				firstName: values.firstName,
				lastName: values.lastName,
				phone: values.phone ? values.phone.replace(/\s+/g, "") : undefined,
				...(avatarKey && { avatarKey }),
			})
			toast.success("Profile updated.")
			onSaved(updated)
			onClose()
		} catch {
			toast.error("Failed to update profile. Please try again.")
		}
	}

	return (
		<Drawer open={open} onClose={handleClose} title="Edit profile" description="Update your admin profile details.">
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<div className="flex justify-center py-2">
					<AvatarUploadZone
						previewUrl={avatarPreview}
						initials={getInitials(profile.firstName, profile.lastName)}
						onChange={(key, preview) => {
							setAvatarKey(key)
							setAvatarPreview(preview)
						}}
						onClear={() => {
							setAvatarKey(undefined)
							setAvatarPreview(null)
						}}
					/>
				</div>

				<TextField
					label="First name"
					type="text"
					placeholder="Jane"
					error={!!errors.firstName}
					helperText={errors.firstName?.message}
					{...register("firstName")}
				/>

				<TextField
					label="Last name"
					type="text"
					placeholder="Doe"
					error={!!errors.lastName}
					helperText={errors.lastName?.message}
					{...register("lastName")}
				/>

				<TextField
					label="Phone"
					hint="Optional — must include +91"
					type="tel"
					placeholder="+91 98765 43210"
					error={!!errors.phone}
					helperText={errors.phone?.message}
					{...register("phone")}
				/>

				<DrawerFooter className="px-0 border-0 pt-4 justify-start gap-3">
					<Button
						type="submit"
						disabled={isSubmitting}
						leftIcon={isSubmitting ? <Loader2 size={13} className="animate-spin" /> : undefined}
						className="bg-[#FFC940] border-[3px] border-black text-black rounded-2xl px-4 py-2 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						{isSubmitting ? "Saving…" : "Save changes"}
					</Button>
					<Button
						type="button"
						variant="secondary"
						onClick={handleClose}
						className="bg-white border-[3px] border-black text-black rounded-2xl px-4 py-2 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						Cancel
					</Button>
				</DrawerFooter>
			</form>
		</Drawer>
	)
}
