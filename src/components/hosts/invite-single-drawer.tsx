"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"

const schema = z.object({
	name:  z.string().min(1, "Name is required"),
	email: z.string().min(1, "Email is required").email({ message: "Enter a valid email" }),
	phone: z.string().optional(),
	city:  z.string().min(1, "City is required"),
})

type FormValues = z.infer<typeof schema>

type Props = {
	open: boolean
	onClose: () => void
	onOpenBulk: () => void
}

export function InviteSingleDrawer({ open, onClose, onOpenBulk }: Props) {
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

	function handleClose() {
		onClose()
		// reset after animation
		setTimeout(() => {
			setSent(false)
			reset()
		}, 300)
	}

	async function onSubmit(_values: FormValues) {
		// TODO: replace with real API call
		await new Promise((r) => setTimeout(r, 900))
		setSent(true)
	}

	return (
		<Drawer
			open={open}
			onClose={handleClose}
			title="Invite Host"
			description="Send an invitation email to a new host."
		>
			{sent ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
						<CheckCircle2 size={28} className="text-green-600" />
					</div>
					<h2 className="text-base font-semibold text-text-primary">Invitation sent</h2>
					<p className="mt-1 text-sm text-text-tertiary max-w-xs">
						The host will receive an email with a link to complete their profile.
					</p>
					<div className="mt-6 flex items-center gap-3">
						<Button
							onClick={() => {
								setSent(false)
								reset()
							}}
						>
							Invite another
						</Button>
						<Button
							variant="secondary"
							onClick={() => {
								handleClose()
								onOpenBulk()
							}}
						>
							Bulk upload
						</Button>
					</div>
				</div>
			) : (
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
					<TextField
						label="Full name"
						type="text"
						placeholder="Jane Doe"
						error={!!errors.name}
						helperText={errors.name?.message}
						{...register("name")}
					/>

					<TextField
						label="Email address"
						type="email"
						placeholder="jane@example.com"
						autoComplete="off"
						error={!!errors.email}
						helperText={errors.email?.message}
						{...register("email")}
					/>

					<TextField
						label="Phone"
						hint="Optional — used for WhatsApp outreach"
						type="tel"
						placeholder="+91 98765 43210"
						error={!!errors.phone}
						helperText={errors.phone?.message}
						{...register("phone")}
					/>

					<TextField
						label="City"
						type="text"
						placeholder="Mumbai"
						error={!!errors.city}
						helperText={errors.city?.message}
						{...register("city")}
					/>

					<DrawerFooter className="px-0 border-0 pt-4 justify-start">
						<Button
							type="submit"
							disabled={isSubmitting}
							leftIcon={isSubmitting ? <Loader2 size={13} className="animate-spin" /> : undefined}
						>
							Send invitation
						</Button>
						<Button type="button" variant="secondary" onClick={handleClose}>
							Cancel
						</Button>
					</DrawerFooter>
				</form>
			)}
		</Drawer>
	)
}
