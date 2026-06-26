"use client"

import { useEffect, useState } from "react"
import { Loader2, X, Plus } from "lucide-react"
import { Drawer, DrawerFooter } from "@/components/ui/drawer"
import { Button } from "@/components/ui/Button"
import {
	createCommunityChannel,
	updateCommunityChannel,
	type ChatChannel,
	type CreateChannelRequest,
} from "@/lib/api/communities"

// ─── Types ────────────────────────────────────────────────────────────────────

type ChannelDrawerProps = {
	open: boolean
	onClose: () => void
	onSuccess: () => void
	communityId: string
	/** Pass a channel to edit; omit for create mode */
	channel?: ChatChannel | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChannelDrawer({ open, onClose, onSuccess, communityId, channel }: ChannelDrawerProps) {
	const isEdit = !!channel

	const [name, setName]                   = useState("")
	const [description, setDescription]     = useState("")
	const [welcomeTitle, setWelcomeTitle]   = useState("")
	const [welcomeBody, setWelcomeBody]     = useState("")
	const [quickReplies, setQuickReplies]   = useState<string[]>([])
	const [replyInput, setReplyInput]       = useState("")
	const [isLoading, setIsLoading]         = useState(false)
	const [error, setError]                 = useState<string | null>(null)

	useEffect(() => {
		if (open) {
			setName(channel?.name ?? "")
			setDescription(channel?.description ?? "")
			setWelcomeTitle(channel?.welcomeTitle ?? "")
			setWelcomeBody(channel?.welcomeBody ?? "")
			setQuickReplies(channel?.quickReplies ?? [])
			setReplyInput("")
			setError(null)
		}
	}, [open, channel])

	function handleClose() {
		if (isLoading) return
		onClose()
	}

	function addQuickReply() {
		const trimmed = replyInput.trim()
		if (!trimmed || quickReplies.includes(trimmed)) return
		setQuickReplies(prev => [...prev, trimmed])
		setReplyInput("")
	}

	function removeQuickReply(reply: string) {
		setQuickReplies(prev => prev.filter(r => r !== reply))
	}

	function handleReplyKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			e.preventDefault()
			addQuickReply()
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!name.trim()) return
		setIsLoading(true)
		setError(null)

		const body: CreateChannelRequest = {
			name: name.trim(),
			description: description.trim() || undefined,
			welcomeTitle: welcomeTitle.trim() || undefined,
			welcomeBody: welcomeBody.trim() || undefined,
			quickReplies: quickReplies.length ? quickReplies : undefined,
		}

		try {
			if (isEdit && channel) {
				await updateCommunityChannel(communityId, channel.id, body)
			} else {
				await createCommunityChannel(communityId, body)
			}
			onSuccess()
			onClose()
		} catch (err: unknown) {
			const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
			const status = axiosErr?.response?.status
			if (status === 409) {
				setError("A channel with this name already exists.")
			} else if (status === 403) {
				setError("You don't have permission to manage channels.")
			} else {
				setError(axiosErr?.response?.data?.message ?? "Something went wrong. Please try again.")
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Drawer
			open={open}
			onClose={handleClose}
			title={isEdit ? `Edit #${channel?.name}` : "Create Channel"}
			description={
				isEdit
					? "Update channel name, description, or welcome message."
					: "Add a new channel to this community."
			}
		>
			<form onSubmit={handleSubmit} className="space-y-5">
				{/* Name */}
				<div>
					<label className="block text-xs font-semibold text-text-secondary mb-1.5">
						Name <span className="text-red-500" aria-hidden>*</span>
					</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g. event-talk"
						disabled={isLoading}
						className="w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors disabled:opacity-50"
					/>
				</div>

				{/* Description */}
				<div>
					<label className="block text-xs font-semibold text-text-secondary mb-1.5">
						Description <span className="text-text-tertiary font-normal">(optional)</span>
					</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="What is this channel for?"
						rows={2}
						disabled={isLoading}
						className="w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors resize-none disabled:opacity-50"
					/>
				</div>

				{/* Welcome Message */}
				<div className="rounded-xl border border-border-default p-4 space-y-4">
					<p className="text-xs font-semibold text-text-primary">
						Welcome Message <span className="text-text-tertiary font-normal">(optional)</span>
					</p>
					<div>
						<label className="block text-xs font-medium text-text-secondary mb-1.5">
							Title
						</label>
						<input
							type="text"
							value={welcomeTitle}
							onChange={(e) => setWelcomeTitle(e.target.value)}
							placeholder="e.g. Welcome to #event-talk!"
							disabled={isLoading}
							className="w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors disabled:opacity-50"
						/>
					</div>
					<div>
						<label className="block text-xs font-medium text-text-secondary mb-1.5">
							Body
						</label>
						<textarea
							value={welcomeBody}
							onChange={(e) => setWelcomeBody(e.target.value)}
							placeholder="e.g. Share what you're excited about for upcoming events."
							rows={3}
							disabled={isLoading}
							className="w-full rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors resize-none disabled:opacity-50"
						/>
					</div>
				</div>

				{/* Quick Replies */}
				<div>
					<label className="block text-xs font-semibold text-text-secondary mb-1.5">
						Quick Replies <span className="text-text-tertiary font-normal">(optional)</span>
					</label>
					<p className="text-[11px] text-text-tertiary mb-2">
						Short reply chips shown to new members in the welcome message.
					</p>
					{quickReplies.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mb-2">
							{quickReplies.map(reply => (
								<span
									key={reply}
									className="inline-flex items-center gap-1 rounded-full border border-border-default bg-surface-card px-2.5 py-0.5 text-xs font-medium text-text-primary"
								>
									{reply}
									<button
										type="button"
										onClick={() => removeQuickReply(reply)}
										disabled={isLoading}
										className="text-text-tertiary hover:text-text-primary transition-colors disabled:opacity-50"
										aria-label={`Remove ${reply}`}
									>
										<X size={10} />
									</button>
								</span>
							))}
						</div>
					)}
					<div className="flex gap-2">
						<input
							type="text"
							value={replyInput}
							onChange={(e) => setReplyInput(e.target.value)}
							onKeyDown={handleReplyKeyDown}
							placeholder="e.g. New Here"
							disabled={isLoading}
							className="flex-1 rounded-lg border border-border-default bg-surface-canvas px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus/10 transition-colors disabled:opacity-50"
						/>
						<button
							type="button"
							onClick={addQuickReply}
							disabled={isLoading || !replyInput.trim()}
							className="flex items-center gap-1 rounded-lg border border-border-default px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-neutral-50 transition-colors disabled:opacity-50"
						>
							<Plus size={12} /> Add
						</button>
					</div>
				</div>

				{/* Read-only info in edit mode */}
				{isEdit && channel && (
					<div className="rounded-xl border border-border-default bg-surface-card-muted px-4 py-3 space-y-1.5">
						<p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">Channel Info</p>
						<div className="flex items-center justify-between text-xs">
							<span className="text-text-secondary">Visibility</span>
							<span className="font-medium text-text-primary">{channel.isPrivate ? "Private" : "Public"}</span>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span className="text-text-secondary">Members</span>
							<span className="font-medium text-text-primary">{channel.members.toLocaleString("en-IN")}</span>
						</div>
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs text-red-700">
						{error}
					</div>
				)}
			</form>

			<DrawerFooter className="justify-between">
				<Button
					type="button"
					variant="secondary"
					size="md"
					radius="md"
					onClick={handleClose}
					disabled={isLoading}
					className="flex-1"
				>
					Cancel
				</Button>
				<Button
					variant="primary"
					size="md"
					radius="md"
					onClick={handleSubmit as unknown as React.MouseEventHandler}
					disabled={isLoading || !name.trim()}
					leftIcon={isLoading ? <Loader2 size={13} className="animate-spin" /> : undefined}
					className="flex-1"
				>
					{isEdit ? "Save Changes" : "Create Channel"}
				</Button>
			</DrawerFooter>
		</Drawer>
	)
}
