import clsx from "clsx"
import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "red"
	size?: "sm" | "md" | "lg"
	radius?: "sm" | "md" | "lg" | "pill"
	leftIcon?: React.ReactNode
	rightIcon?: React.ReactNode
}

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
	sm: "h-[var(--size-action-sm)] px-3 text-label-sm",
	md: "h-[var(--size-action-md)] px-4 text-label-sm",
	lg: "h-[var(--size-action-lg)] px-5 text-label-md font-medium",
}

const iconSizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
	sm: "size-4",
	md: "size-5",
	lg: "size-6",
}

const radiusClasses: Record<NonNullable<ButtonProps["radius"]>, string> = {
	sm: "rounded-xl",
	md: "rounded-2xl",
	lg: "rounded-[24px]",
	pill: "rounded-full",
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
	primary: clsx(
		"bg-[#FFC940] border-[3px] border-black text-black font-black uppercase tracking-wider",
		"shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
		"hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
		"active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
		"transition-all cursor-pointer",
		"disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0",
	),
	secondary: clsx(
		"bg-white border-[3px] border-black text-black font-black uppercase tracking-wider",
		"shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
		"hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
		"active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
		"transition-all cursor-pointer",
		"disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0",
	),
	red: clsx(
		"bg-[#EE2C2C] border-[3px] border-black text-white font-black uppercase tracking-wider",
		"shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
		"hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
		"active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
		"transition-all cursor-pointer",
		"disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0",
	),
}

export function Button({
	variant = "primary",
	size = "md",
	radius = "md",
	leftIcon,
	rightIcon,
	children,
	className,
	disabled,
	...props
}: ButtonProps) {
	return (
		<button
			disabled={disabled}
			className={clsx(
				"inline-flex items-center justify-center select-none",
				"transition-colors duration-(--duration-120)",
				sizeClasses[size],
				radiusClasses[radius],
				variantClasses[variant],
				className,
			)}
			{...props}
		>
			{leftIcon && (
				<span className={clsx("flex items-center justify-start shrink-0", iconSizeClasses[size])}>{leftIcon}</span>
			)}
			{children}
			{rightIcon && (
				<span className={clsx("flex items-center justify-end shrink-0", iconSizeClasses[size])}>{rightIcon}</span>
			)}
		</button>
	)
}
