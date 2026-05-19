"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase/config"
import { apiClient } from "@/lib/api/client"
import { useAuthStore } from "@/stores/auth.store"
import type { Role } from "@/types"
import { TextField } from "@/components/ui/TextField"
import { Button } from "@/components/ui/Button"

type MeResponse = {
	id: string
	email: string
	phone: string | null
	firstName: string
	lastName: string
	avatarUrl: string | null
	isActive: boolean
	mustCompleteProfile: boolean
	role: Record<string, Role>
	cityScope?: string
}

const loginSchema = z.object({
	email: z.email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
	const router = useRouter()
	const setAuth = useAuthStore(s => s.setAuth)
	const [showPassword, setShowPassword] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
	})

	async function onSubmit(values: LoginValues) {
		try {
			const credential = await signInWithEmailAndPassword(firebaseAuth, values.email, values.password)
			const idToken = await credential.user.getIdToken()

			const { data } = await apiClient.get<MeResponse>("/auth/me", {
				headers: { Authorization: `Bearer ${idToken}` },
			})

			if (!data.isActive) {
				await signOut(firebaseAuth)
				toast.error("Your account is not yet active. Complete the invite link sent to your email.")
				return
			}

			setAuth(
				{ id: data.id, name: `${data.firstName} ${data.lastName}`, email: data.email },
				data?.role?.name,
				idToken,
				data.cityScope,
			)
			router.push("/dashboard")
		} catch {
			toast.error("Invalid credentials. Please try again.")
		}
	}

	return (
		<div className="space-y-8">
			<div className="space-y-1.5">
				<h1 className="text-[2rem] font-extrabold text-text-primary leading-tight">
					Welcome back
				</h1>
				<p className="text-text-secondary text-sm">Sign in to the Meetday Admin Panel.</p>
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

				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<label htmlFor="password" className="text-label-sm font-semibold text-text-primary">
							Password
						</label>
						<a
							href="#"
							className="text-xs text-text-brand hover:text-action-primary-hover transition-colors"
						>
							Forgot password?
						</a>
					</div>
					<TextField
						id="password"
						type={showPassword ? "text" : "password"}
						autoComplete="current-password"
						placeholder="••••••••"
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
				</div>

				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full"
					leftIcon={isSubmitting ? <Loader2 size={15} className="animate-spin" /> : undefined}
				>
					{isSubmitting ? "Signing in…" : "Sign in"}
				</Button>
			</form>

			<p className="text-center text-xs text-text-tertiary">
				Access is restricted to authorized personnel only.
			</p>
		</div>
	)
}
