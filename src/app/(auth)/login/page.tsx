"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth.store"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
	email: z.string().email("Invalid email address"),
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
			// Mock — replace with real API call
			await new Promise(resolve => setTimeout(resolve, 900))
			setAuth({ id: "1", name: "Super Admin", email: values.email }, "SUPER_ADMIN", "mock-token-123")
			router.push("/dashboard")
		} catch {
			toast.error("Invalid credentials. Please try again.")
		}
	}

	return (
		<div className="space-y-8">
			<div className="space-y-1.5">
				<h1 className="font-hagrid text-[2rem] font-extrabold text-foreground leading-tight">Welcome back</h1>
				<p className="text-neutral-dark text-sm">Sign in to the Meetday Admin Panel.</p>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
				{/* Email */}
				<div className="space-y-1.5">
					<label htmlFor="email" className="block text-sm font-medium text-foreground">
						Email address
					</label>
					<input
						id="email"
						type="email"
						autoComplete="email"
						placeholder="you@meetday.com"
						className={cn(
							"w-full h-11 px-4 rounded-md border bg-white text-sm text-foreground",
							"placeholder:text-neutral-light",
							"focus:outline-none focus:ring-2 focus:ring-brand-red/25 focus:border-brand-red",
							"transition-colors",
							errors.email ? "border-red-400" : "border-neutral-light",
						)}
						{...register("email")}
					/>
					{errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
				</div>

				{/* Password */}
				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<label htmlFor="password" className="block text-sm font-medium text-foreground">
							Password
						</label>
						<a href="#" className="text-xs text-brand-red hover:text-brand-red-deep transition-colors">
							Forgot password?
						</a>
					</div>
					<div className="relative">
						<input
							id="password"
							type={showPassword ? "text" : "password"}
							autoComplete="current-password"
							placeholder="••••••••"
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

				{/* Submit */}
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
							Signing in…
						</>
					) : (
						"Sign in"
					)}
				</button>
			</form>

			<p className="text-center text-xs text-neutral-light">
				Access is restricted to authorized personnel only.
			</p>
		</div>
	)
}
