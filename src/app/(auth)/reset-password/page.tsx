"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth"
import { CheckCircle2, Eye, EyeOff, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { firebaseAuth } from "@/lib/firebase/config"
import { useAuthStore } from "@/stores/auth.store"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"

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

function ResetPasswordContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const clearAuth = useAuthStore(s => s.clearAuth)

	const [stage, setStage] = useState<Stage>("validating")
	const [resetEmail, setResetEmail] = useState("")
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
				setResetEmail(email)
				setStage("valid")
			})
			.catch(() => {
				setStage("invalid")
			})
	}, [searchParams])

	async function onSubmit(values: PasswordValues) {
		try {
			await confirmPasswordReset(firebaseAuth, oobCode, values.password)

			// Guard against a lingering session in this same browser (e.g. the
			// reset link opened in a new tab of the account's own browser) —
			// Firebase persists auth state across tabs via IndexedDB.
			clearAuth()

			setStage("done")
			toast.success("Password reset! You can now sign in.")
			router.push("/login")
		} catch {
			toast.error("Failed to reset password. The link may have expired — request a new one.")
		}
	}

	return (
		<>
			{/* Validating */}
			{stage === "validating" && (
				<div className="flex flex-col items-center gap-4 py-10">
					<Loader2 size={32} className="animate-spin text-text-brand" />
					<p className="text-sm text-text-secondary">Validating your reset link…</p>
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
								This reset link is invalid or has already been used. Request a new one to continue.
							</p>
						</div>
					</div>
					<Button variant="secondary" className="w-full" onClick={() => router.push("/forgot-password")}>
						Request new link
					</Button>
				</div>
			)}

			{/* Reset password form */}
			{stage === "valid" && (
				<div className="space-y-8">
					<div className="space-y-1.5">
						<h1 className="text-[2rem] font-extrabold text-text-primary leading-tight">
							Reset your password
						</h1>
						<p className="text-sm text-text-secondary">
							Resetting password for{" "}
							<span className="font-medium text-text-primary">{resetEmail}</span>.
						</p>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
						<TextField
							label="New password"
							id="rp-password"
							type={showPassword ? "text" : "password"}
							autoComplete="new-password"
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
							label="Confirm new password"
							id="rp-confirm-password"
							type={showConfirm ? "text" : "password"}
							autoComplete="new-password"
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
							{isSubmitting ? "Resetting password…" : "Reset password"}
						</Button>
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
						<h2 className="text-2xl font-extrabold text-text-primary">
							Password reset!
						</h2>
						<p className="text-sm text-text-secondary">Redirecting you to sign in…</p>
					</div>
					<Loader2 size={18} className="animate-spin text-text-tertiary" />
				</div>
			)}
		</>
	)
}

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={
			<div className="flex flex-col items-center gap-4 py-10">
				<Loader2 size={32} className="animate-spin text-text-brand" />
				<p className="text-sm text-text-secondary">Loading…</p>
			</div>
		}>
			<ResetPasswordContent />
		</Suspense>
	)
}
