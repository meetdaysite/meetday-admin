"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, Eye, EyeOff, Loader2, XCircle } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"
import { validateInviteToken, acceptInvite } from "@/lib/api/admins"

const acceptSchema = z
	.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string(),
	})
	.refine(data => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	})

type AcceptValues = z.infer<typeof acceptSchema>
type Stage = "validating" | "valid" | "invalid" | "success"

export default function InvitePage() {
	const { token } = useParams<{ token: string }>()
	const router = useRouter()
	const [stage, setStage] = useState<Stage>("validating")
	const [inviteEmail, setInviteEmail] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<AcceptValues>({ resolver: zodResolver(acceptSchema) })

	useEffect(() => {
		validateInviteToken(token)
			.then(info => {
				setInviteEmail(info.email)
				setStage("valid")
			})
			.catch(() => setStage("invalid"))
	}, [token])

	async function onSubmit(values: AcceptValues) {
		await acceptInvite(token, values.name, values.password)
		setStage("success")
	}

	return (
		<AuthShell>
			{/* Validating */}
			{stage === "validating" && (
				<div className="flex flex-col items-center gap-4 py-10">
					<Loader2 size={32} className="animate-spin text-text-brand" />
					<p className="text-sm text-text-secondary">Validating your invite link…</p>
				</div>
			)}

			{/* Invalid / expired */}
			{stage === "invalid" && (
				<div className="space-y-8">
					<div className="flex flex-col items-center gap-4 py-4">
						<div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
							<XCircle size={32} className="text-red-400" />
						</div>
						<div className="text-center space-y-1.5">
							<h2 className="text-2xl font-extrabold text-text-primary">Link expired</h2>
							<p className="text-sm text-text-secondary max-w-[320px]">
								This invite link is invalid or has already been used. Contact your administrator for a new one.
							</p>
						</div>
					</div>
					<Button variant="secondary" className="w-full" onClick={() => router.push("/login")}>
						Back to sign in
					</Button>
				</div>
			)}

			{/* Set password form */}
			{stage === "valid" && (
				<div className="space-y-8">
					<div className="space-y-1.5">
						<h1 className="text-[2rem] font-extrabold text-text-primary leading-tight">
							Accept invite
						</h1>
						<p className="text-sm text-text-secondary">
							You&apos;ve been invited as{" "}
							<span className="font-medium text-text-primary">{inviteEmail}</span>. Set a password to get started.
						</p>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
						<TextField
							label="Your name"
							id="name"
							type="text"
							autoComplete="name"
							placeholder="Jane Smith"
							error={!!errors.name}
							helperText={errors.name?.message}
							{...register("name")}
						/>

						<TextField
							label="Password"
							id="inv-password"
							type={showPassword ? "text" : "password"}
							placeholder="At least 8 characters"
							error={!!errors.password}
							helperText={errors.password?.message}
							rightIcon={
								<button
									type="button"
									onClick={() => setShowPassword(v => !v)}
									className="text-text-tertiary hover:text-text-secondary transition-colors"
									tabIndex={-1}
								>
									{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							}
							{...register("password")}
						/>

						<TextField
							label="Confirm password"
							id="confirm-password"
							type={showConfirm ? "text" : "password"}
							placeholder="Repeat your password"
							error={!!errors.confirmPassword}
							helperText={errors.confirmPassword?.message}
							rightIcon={
								<button
									type="button"
									onClick={() => setShowConfirm(v => !v)}
									className="text-text-tertiary hover:text-text-secondary transition-colors"
									tabIndex={-1}
								>
									{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							}
							{...register("confirmPassword")}
						/>

						<Button
							type="submit"
							disabled={isSubmitting}
							className="w-full"
							leftIcon={isSubmitting ? <Loader2 size={15} className="animate-spin" /> : undefined}
						>
							{isSubmitting ? "Activating account…" : "Activate account"}
						</Button>
					</form>
				</div>
			)}

			{/* Success */}
			{stage === "success" && (
				<div className="space-y-8">
					<div className="flex flex-col items-center gap-4 py-4">
						<div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
							<CheckCircle2 size={32} className="text-green-500" />
						</div>
						<div className="text-center space-y-1.5">
							<h2 className="text-2xl font-extrabold text-text-primary">You&apos;re all set!</h2>
							<p className="text-sm text-text-secondary">
								Your account has been activated. You can now sign in.
							</p>
						</div>
					</div>
					<Button className="w-full" onClick={() => router.push("/login")}>
						Go to sign in
					</Button>
				</div>
			)}
		</AuthShell>
	)
}
