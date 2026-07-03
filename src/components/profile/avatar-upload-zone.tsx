"use client"

import { useCallback, useRef, useState } from "react"
import { ImageIcon, Pencil, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { uploadUserAvatar } from "@/lib/api/storage"
import { cn } from "@/lib/utils"

interface AvatarUploadZoneProps {
	previewUrl: string | null
	initials: string
	onChange: (key: string, previewUrl: string) => void
	onClear: () => void
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"]

export function AvatarUploadZone({ previewUrl, initials, onChange, onClear }: AvatarUploadZoneProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)

	const handleFile = useCallback(
		async (file: File) => {
			if (!ACCEPTED.includes(file.type)) {
				toast.error("Only JPEG, PNG, or WebP images are allowed")
				return
			}
			if (file.size > 10 * 1024 * 1024) {
				toast.error("Image must be under 10 MB")
				return
			}
			const localUrl = URL.createObjectURL(file)
			setUploading(true)
			try {
				const key = await uploadUserAvatar(file)
				onChange(key, localUrl)
			} catch {
				URL.revokeObjectURL(localUrl)
				toast.error("Image upload failed. Please try again.")
			} finally {
				setUploading(false)
			}
		},
		[onChange],
	)

	const onInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (file) handleFile(file)
			e.target.value = ""
		},
		[handleFile],
	)

	return (
		<div className="flex flex-col items-center gap-2">
			<div className={cn("relative h-20 w-20 overflow-hidden rounded-full", !previewUrl && "bg-action-primary")}>
				{previewUrl ? (
					<>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={previewUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" />
						{uploading && (
							<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
								<Loader2 size={18} className="animate-spin text-white" />
							</div>
						)}
						{!uploading && (
							<div className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
								<button
									type="button"
									onClick={() => inputRef.current?.click()}
									className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-text-primary transition-colors hover:bg-white"
								>
									<Pencil size={12} />
								</button>
								<button
									type="button"
									onClick={onClear}
									className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-text-danger transition-colors hover:bg-white"
								>
									<X size={12} />
								</button>
							</div>
						)}
					</>
				) : (
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="flex h-full w-full items-center justify-center rounded-full text-lg font-bold text-white transition-opacity hover:opacity-90"
					>
						{uploading ? (
							<Loader2 size={18} className="animate-spin" />
						) : initials ? (
							initials
						) : (
							<ImageIcon size={18} />
						)}
					</button>
				)}
			</div>

			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				className="text-xs font-medium text-text-brand transition-colors hover:text-action-primary-hover"
			>
				Change photo
			</button>

			<input ref={inputRef} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={onInputChange} />
		</div>
	)
}
