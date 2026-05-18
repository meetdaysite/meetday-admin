"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, Eye, EyeOff, Loader2, XCircle } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { cn } from "@/lib/utils"

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
		// Mock token validation — replace with API call
		const timer = setTimeout(() => {
			if (token && token.length > 5) {
				setInviteEmail("invited@meetday.com")
				setStage("valid")
			} else {
				setStage("invalid")
			}
		}, 1200)
		return () => clearTimeout(timer)
	}, [token])

	async function onSubmit(values: AcceptValues) {
		// Mock — replace with real API call
		await new Promise(resolve => setTimeout(resolve, 900))
		console.log("Accept invite:", { token, name: values.name })
		setStage("success")
	}

	return (
		<AuthShell>
			{/* Validating */}
			{stage === "validating" && (
				<div className="flex flex-col items-center gap-4 py-10">
					<Loader2 size={32} className="animate-spin text-brand-red" />
					<p className="text-sm text-neutral-dark">Validating your invite link…</p>
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
							<h2 className="font-hagrid text-2xl font-extrabold text-foreground">Link expired</h2>
							<p className="text-sm text-neutral-dark max-w-[320px]">
								This invite link is invalid or has already been used. Contact your administrator for a new one.
							</p>
						</div>
					</div>
					<button
						onClick={() => router.push("/login")}
						className="w-full h-11 rounded-md border border-neutral-light text-sm font-medium text-foreground hover:bg-neutral-100 transition-colors"
					>
						Back to sign in
					</button>
				</div>
			)}

			{/* Set password form */}
			{stage === "valid" && (
				<div className="space-y-8">
					<div className="space-y-1.5">
						<h1 className="font-hagrid text-[2rem] font-extrabold text-foreground leading-tight">
							Accept invite
						</h1>
						<p className="text-sm text-neutral-dark">
							You&apos;ve been invited as{" "}
							<span className="font-medium text-foreground">{inviteEmail}</span>. Set a password to get started.
						</p>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
						{/* Name */}
						<div className="space-y-1.5">
							<label htmlFor="name" className="block text-sm font-medium text-foreground">
								Your name
							</label>
							<input
								id="name"
								type="text"
								autoComplete="name"
								placeholder="Jane Smith"
								className={cn(
									"w-full h-11 px-4 rounded-md border bg-white text-sm text-foreground",
									"placeholder:text-neutral-light",
									"focus:outline-none focus:ring-2 focus:ring-brand-red/25 focus:border-brand-red",
									"transition-colors",
									errors.name ? "border-red-400" : "border-neutral-light",
								)}
								{...register("name")}
							/>
							{errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
						</div>

						{/* Password */}
						<div className="space-y-1.5">
							<label htmlFor="inv-password" className="block text-sm font-medium text-foreground">
								Password
							</label>
							<div className="relative">
								<input
									id="inv-password"
									type={showPassword ? "text" : "password"}
									placeholder="At least 8 characters"
									className={cn(
										"w-full h-11 pl-4 pr-11 rounded-md border bg-white text-sm text-foreground",
										"placeholder:text-neutral-light",
										"focus:outline-none focus:ring-2 focus:ring-brand-red/25 focus:border-brand-red",
										"transition-colors",
										errors.password ? "border-red-400" : "border-neutral-light",
									)}
									{...register("password")}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(v => !v)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-light hover:text-neutral-dark transition-colors"
									tabIndex={-1}
								>
									{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							</div>
							{errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
						</div>

						{/* Confirm password */}
						<div className="space-y-1.5">
							<label htmlFor="confirm-password" className="block text-sm font-medium text-foreground">
								Confirm password
							</label>
							<div className="relative">
								<input
									id="confirm-password"
									type={showConfirm ? "text" : "password"}
									placeholder="Repeat your password"
									className={cn(
										"w-full h-11 pl-4 pr-11 rounded-md border bg-white text-sm text-foreground",
										"placeholder:text-neutral-light",
										"focus:outline-none focus:ring-2 focus:ring-brand-red/25 focus:border-brand-red",
										"transition-colors",
										errors.confirmPassword ? "border-red-400" : "border-neutral-light",
									)}
									{...register("confirmPassword")}
								/>
								<button
									type="button"
									onClick={() => setShowConfirm(v => !v)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-light hover:text-neutral-dark transition-colors"
									tabIndex={-1}
								>
									{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							</div>
							{errors.confirmPassword && (
								<p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
							)}
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className={cn(
								"w-full h-11 rounded-md bg-brand-red text-white text-sm font-semibold",
								"hover:bg-brand-red-deep active:scale-[0.99] transition-all",
								"flex items-center justify-center gap-2",
								"disabled:opacity-60 disabled:cursor-not-allowed",
							)}
						>
							{isSubmitting ? (
								<>
									<Loader2 size={15} className="animate-spin" />
									Activating account…
								</>
							) : (
								"Activate account"
							)}
						</button>
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
							<h2 className="font-hagrid text-2xl font-extrabold text-foreground">You&apos;re all set!</h2>
							<p className="text-sm text-neutral-dark">
								Your account has been activated. You can now sign in.
							</p>
						</div>
					</div>
					<button
						onClick={() => router.push("/login")}
						className={cn(
							"w-full h-11 rounded-md bg-brand-red text-white text-sm font-semibold",
							"hover:bg-brand-red-deep transition-colors",
						)}
					>
						Go to sign in
					</button>
				</div>
			)}
		</AuthShell>
	)
}
