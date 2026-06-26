"use client"

import {
	CheckCircle2,
	Eye,
	Megaphone,
	Settings,
	Users,
	CalendarDays,
	MapPin,
	Globe,
	Copy,
	Check,
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { useCreateCommunityStore } from "@/stores/create-community.store"

const WHATS_ACTIVE = [
	{
		icon: <Globe size={14} />,
		label: "Community is Live and Discoverable",
		desc: "Anyone can now discover and join this community.",
	},
	{
		icon: <CalendarDays size={14} />,
		label: "Matched Experiences Attached",
		desc: "Events matching your interests and cities are automatically added.",
	},
	{
		icon: <Users size={14} />,
		label: "Managers and Moderators Assigned",
		desc: "People have been assigned with roles and permissions.",
	},
	{
		icon: <MapPin size={14} />,
		label: "Community URL Created",
		desc: "Your unique community link is ready to share.",
	},
]

export function SuccessScreen() {
	const router = useRouter()
	const { step1Data, communityId, reset } = useCreateCommunityStore()
	const [copied, setCopied] = useState(false)

	const slug = step1Data?.slug ?? ""
	const communityUrl = `meetday.ai/communities/${slug}`

	const copyUrl = () => {
		navigator.clipboard.writeText(communityUrl)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const goToDashboard = () => {
		reset()
		if (communityId) router.push(`/communities/${communityId}`)
		else router.push("/communities")
	}

	return (
		<div className="flex min-h-full gap-6 p-6">
			{/* Main content */}
			<div className="flex-1 flex flex-col items-center gap-8">
				{/* Hero */}
				<div className="flex flex-col items-center gap-4 pt-8 text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#dcfce7]">
						<CheckCircle2 size={36} className="text-[#16a34a]" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-text-primary">
							{step1Data?.name ?? "Community"} is now live! ðŸŽ‰
						</h1>
						<p className="mt-1 text-sm text-text-secondary">
							Your community has been created successfully and is ready for members.
						</p>
					</div>
				</div>

				{/* Action cards */}
				<div className="grid w-full max-w-2xl grid-cols-3 gap-4">
					{[
						{
							icon: <Eye size={20} className="text-[#dc2626]" />,
							bg: "bg-[#fff5f5]",
							label: "View Community",
							desc: "See how your community looks to members.",
							action: () => window.open(`https://${communityUrl}`, "_blank"),
							buttonLabel: "View Community â†’",
							buttonClass: "border border-[#dc2626] text-[#dc2626] hover:bg-[#fff5f5]",
						},
						{
							icon: <Megaphone size={20} className="text-[#7c3aed]" />,
							bg: "bg-[#f5f0ff]",
							label: "Create First Announcement",
							desc: "Welcome your members with your first announcement.",
							action: () => {
								reset()
								router.push("/communities")
							},
							buttonLabel: "Create Announcement â†’",
							buttonClass: "border border-[#7c3aed] text-[#7c3aed] hover:bg-[#f5f0ff]",
						},
						{
							icon: <Settings size={20} className="text-[#059669]" />,
							bg: "bg-[#f0fdf4]",
							label: "Manage Community",
							desc: "Go to the community dashboard to manage everything.",
							action: goToDashboard,
							buttonLabel: "Manage Community â†’",
							buttonClass: "border border-[#059669] text-[#059669] hover:bg-[#f0fdf4]",
						},
					].map(card => (
						<div
							key={card.label}
							className="flex flex-col items-center gap-3 rounded-card border border-border-subtle bg-surface-canvas p-5 text-center"
						>
							<div
								className={cn(
									"flex h-12 w-12 items-center justify-center rounded-full",
									card.bg,
								)}
							>
								{card.icon}
							</div>
							<p className="text-label-sm font-semibold text-text-primary">{card.label}</p>
							<p className="text-caption text-text-tertiary">{card.desc}</p>
							<button
								type="button"
								onClick={card.action}
								className={cn(
									"w-full rounded-action px-3 py-1.5 text-label-sm font-medium transition-colors",
									card.buttonClass,
								)}
							>
								{card.buttonLabel}
							</button>
						</div>
					))}
				</div>

				{/* What's active */}
				<div className="w-full max-w-2xl rounded-card border border-border-subtle bg-surface-canvas p-5">
					<p className="text-label-sm font-semibold text-text-primary mb-4">
						What&apos;s Active Now
					</p>
					<div className="flex flex-col gap-3">
						{WHATS_ACTIVE.map(item => (
							<div key={item.label} className="flex items-start gap-3">
								<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-[#16a34a]">
									{item.icon}
								</div>
								<div>
									<p className="text-label-sm font-medium text-text-primary">
										{item.label}
									</p>
									<p className="text-caption text-text-secondary">{item.desc}</p>
								</div>
								<CheckCircle2 size={16} className="ml-auto shrink-0 text-[#16a34a]" />
							</div>
						))}
					</div>
					<p className="mt-4 text-center text-caption text-text-secondary">
						ðŸŽ‰ Great work! Your community is ready to bring people together.
					</p>
				</div>

				{/* CTA */}
				<div className="w-full max-w-2xl rounded-card border border-border-subtle bg-surface-canvas p-5 flex items-center justify-between gap-4">
					<div>
						<p className="text-label-sm font-semibold text-text-primary">
							ðŸš€ You&apos;re all set! What would you like to do next?
						</p>
						<p className="text-caption text-text-secondary">
							Jump into your community workspace and start building an amazing experience.
						</p>
					</div>
					<Button variant="primary" size="md" radius="md" onClick={goToDashboard}>
						Go to Community Dashboard â†’
					</Button>
				</div>
			</div>

			{/* Right sidebar */}
			<div className="w-72 shrink-0 flex flex-col gap-4">
				<div className="rounded-panel border border-border-subtle bg-surface-canvas overflow-hidden shadow-card">
					<div className="p-4 border-b border-border-subtle">
						<p className="text-label-sm font-semibold text-text-primary">Community Summary</p>
					</div>
					<div className="h-24 bg-linear-to-br from-[#1a0533] to-[#4c1d95] relative overflow-hidden">
						{step1Data?.coverImageUrl && (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={step1Data.coverImageUrl}
								alt=""
								className="h-full w-full object-cover"
							/>
						)}
					</div>
					<div className="p-4 flex flex-col gap-3">
						<p className="text-label-md font-bold text-text-primary">{step1Data?.name}</p>

						<div className="flex flex-col gap-2 text-caption">
							{[
								{ label: "Community URL", value: communityUrl, copy: true },
								{ label: "Visibility", value: "Public Community" },
								{ label: "Category", value: step1Data?.categoryName ?? "â€”" },
							].map(row => (
								<div key={row.label}>
									<p className="text-text-secondary">{row.label}</p>
									<div className="flex items-center gap-1.5 mt-0.5">
										<p className="font-medium text-text-secondary truncate">
											{row.value}
										</p>
										{row.copy && (
											<button
												type="button"
												onClick={copyUrl}
												className="shrink-0 text-icon-secondary hover:text-icon-primary transition-colors"
											>
												{copied ? (
													<Check size={12} className="text-[#16a34a]" />
												) : (
													<Copy size={12} />
												)}
											</button>
										)}
									</div>
								</div>
							))}

							{step1Data?.interestTags && step1Data.interestTags.length > 0 && (
								<div>
									<p className="text-text-secondary">Interests</p>
									<div className="mt-0.5 flex flex-wrap gap-1">
										{step1Data.interestTags.map(t => (
											<span
												key={t}
												className="rounded-badge bg-surface-card border border-border-subtle px-1.5 py-0.5 text-[10px] text-text-secondary"
											>
												{t}
											</span>
										))}
									</div>
								</div>
							)}
						</div>

						<div className="border-t border-border-subtle pt-3">
							<p className="text-caption font-semibold text-text-secondary mb-2">
								What Happens Next?
							</p>
							{[
								"Members can discover and join your community.",
								"Qualified events will automatically appear.",
								"You can start posting, chatting and engaging.",
								"You can manage members and settings anytime.",
							].map(item => (
								<div key={item} className="flex items-start gap-1.5 mb-1.5">
									<CheckCircle2 size={12} className="mt-0.5 shrink-0 text-[#16a34a]" />
									<p className="text-caption text-text-secondary">{item}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
