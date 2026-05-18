"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { verifyPasswordResetCode, confirmPasswordReset, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { CheckCircle2, Eye, EyeOff, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { firebaseAuth } from "@/lib/firebase/config"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

const passwordSchema = z
	.object({
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string(),
	})
	.refine(data => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	})

type PasswordValues = z.infer<typeof passwordSchema>
type Stage = "validating" | "valid" | "invalid" | "done"

function SetPasswordContent() {
	const searchParams = useSearchParams()
	const router = useRouter()

	const [stage, setStage] = useState<Stage>("validating")
	const [inviteEmail, setInviteEmail] = useState("")
	const [oobCode, setOobCode] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

	useEffect(() => {
		const mode = searchParams.get("mode")
		const code = searchParams.get("oobCode")

		if (mode !== "resetPassword" || !code) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setStage("invalid")
			return
		}

		setOobCode(code)

		verifyPasswordResetCode(firebaseAuth, code)
			.then(email => {
				setInviteEmail(email)
				setStage("valid")
			})
			.catch(() => {
				setStage("invalid")
			})
	}, [searchParams])

	async function onSubmit(values: PasswordValues) {
		try {
			await confirmPasswordReset(firebaseAuth, oobCode, values.password)

			const credential = await signInWithEmailAndPassword(firebaseAuth, inviteEmail, values.password)
			const idToken = await credential.user.getIdToken()
			await signOut(firebaseAuth)

			await apiClient.post("/auth/activate", {}, {
				headers: { Authorization: `Bearer ${idToken}` },
			})

			setStage("done")
			toast.success("Password set! Your account is now active.")
			router.push("/login")
		} catch {
			toast.error("Failed to activate account. The link may have expired — request a new invite.")
		}
	}

	return (
		<>
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
								This invite link is invalid or has already been used. Contact your administrator for a
								new one.
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
							Set your password
						</h1>
						<p className="text-sm text-neutral-dark">
							Setting up account for{" "}
							<span className="font-medium text-foreground">{inviteEmail}</span>.
						</p>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
						{/* Password */}
						<div className="space-y-1.5">
							<label htmlFor="cp-password" className="block text-sm font-medium text-foreground">
								Password
							</label>
							<div className="relative">
								<input
									id="cp-password"
									type={showPassword ? "text" : "password"}
									autoComplete="new-password"
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
							{errors.password && (
								<p className="text-xs text-red-500">{errors.password.message}</p>
							)}
						</div>

						{/* Confirm password */}
						<div className="space-y-1.5">
							<label
								htmlFor="cp-confirm-password"
								className="block text-sm font-medium text-foreground"
							>
								Confirm password
							</label>
							<div className="relative">
								<input
									id="cp-confirm-password"
									type={showConfirm ? "text" : "password"}
									autoComplete="new-password"
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

			{/* Done — brief success shown before redirect to login */}
			{stage === "done" && (
				<div className="flex flex-col items-center gap-4 py-10">
					<div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
						<CheckCircle2 size={32} className="text-green-500" />
					</div>
					<div className="text-center space-y-1.5">
						<h2 className="font-hagrid text-2xl font-extrabold text-foreground">
							Password set!
						</h2>
						<p className="text-sm text-neutral-dark">Redirecting you to sign in…</p>
					</div>
					<Loader2 size={18} className="animate-spin text-neutral-light" />
				</div>
			)}
		</>
	)
}

export default function SetPasswordPage() {
	return (
		<Suspense fallback={
			<div className="flex flex-col items-center gap-4 py-10">
				<Loader2 size={32} className="animate-spin text-brand-red" />
				<p className="text-sm text-neutral-dark">Loading…</p>
			</div>
		}>
			<SetPasswordContent />
		</Suspense>
	)
}
