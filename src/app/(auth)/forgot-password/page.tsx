"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { sendPasswordResetEmail } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase/config"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"

const forgotPasswordSchema = z.object({
	email: z.email("Invalid email address"),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
	const router = useRouter()
	const [sent, setSent] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ForgotPasswordValues>({
		resolver: zodResolver(forgotPasswordSchema),
	})

	async function onSubmit(values: ForgotPasswordValues) {
		try {
			await sendPasswordResetEmail(firebaseAuth, values.email)
		} catch (err) {
			// Firebase throws auth/user-not-found for unregistered emails — don't reveal that.
			const code = (err as { code?: string })?.code
			if (code !== "auth/user-not-found") {
				toast.error("Something went wrong. Please try again.")
				return
			}
		}
		setSent(true)
	}

	if (sent) {
		return (
			<div className="space-y-8">
				<div className="flex flex-col items-center gap-4 py-4">
					<div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
						<CheckCircle2 size={32} className="text-green-500" />
					</div>
					<div className="text-center space-y-1.5">
						<h2 className="text-2xl font-extrabold text-text-primary">Check your inbox</h2>
						<p className="text-sm text-text-secondary max-w-[320px]">
							If an account exists for that email, we&apos;ve sent a link to reset your password.
						</p>
					</div>
				</div>
				<Button variant="secondary" className="w-full" onClick={() => router.push("/login")}>
					Back to sign in
				</Button>
			</div>
		)
	}

	return (
		<div className="space-y-8">
			<div className="space-y-1.5">
				<h1 className="text-[2rem] font-extrabold text-text-primary leading-tight">
					Forgot password?
				</h1>
				<p className="text-text-secondary text-sm">
					Enter your email and we&apos;ll send you a link to reset your password.
				</p>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
				<TextField
					label="Email address"
					type="email"
					autoComplete="email"
					placeholder="you@meetday.com"
					error={!!errors.email}
					helperText={errors.email?.message}
					{...register("email")}
				/>

				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full"
					leftIcon={isSubmitting ? <Loader2 size={15} className="animate-spin" /> : undefined}
				>
					{isSubmitting ? "Sending link…" : "Send reset link"}
				</Button>
			</form>

			<p className="text-center text-xs text-text-tertiary">
				Remembered your password?{" "}
				<Link href="/login" className="text-text-brand hover:text-action-primary-hover transition-colors">
					Back to sign in
				</Link>
			</p>
		</div>
	)
}
