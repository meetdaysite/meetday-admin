"use client"

import { useCallback, useRef, useState } from "react"
import { ImageIcon, Upload, X, Pencil, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadCommunityImage } from "@/lib/api/storage"
import { toast } from "sonner"

interface ImageUploadZoneProps {
	value: string | null
	previewUrl: string | null
	onChange: (key: string, previewUrl: string) => void
	onClear: () => void
	mediaType: "COVER" | "ICON"
	label: string
	hint: string
	aspectClass?: string
	shape?: "rect" | "circle"
	required?: boolean
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"]

export function ImageUploadZone({
	value,
	previewUrl,
	onChange,
	onClear,
	mediaType,
	label,
	hint,
	aspectClass = "aspect-video",
	shape = "rect",
	required,
}: ImageUploadZoneProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)
	const [dragOver, setDragOver] = useState(false)

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
				const key = await uploadCommunityImage(file, mediaType)
				onChange(key, localUrl)
			} catch {
				URL.revokeObjectURL(localUrl)
				toast.error("Image upload failed. Please try again.")
			} finally {
				setUploading(false)
			}
		},
		[mediaType, onChange],
	)

	const onDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setDragOver(false)
			const file = e.dataTransfer.files[0]
			if (file) handleFile(file)
		},
		[handleFile],
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
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between">
				<span className="text-label-sm font-semibold text-text-primary">
					{label}
					{required && <span className="ml-0.5 text-text-danger">*</span>}
				</span>
			</div>

			<div
				className={cn("relative overflow-hidden", shape === "circle" ? "rounded-full" : "rounded-card", aspectClass)}
				onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
				onDragLeave={() => setDragOver(false)}
				onDrop={onDrop}
			>
				{previewUrl ? (
					<>
						<img
							src={previewUrl}
							alt={label}
							className={cn("h-full w-full object-cover", shape === "circle" && "rounded-full")}
						/>
						{uploading && (
							<div className="absolute inset-0 flex items-center justify-center bg-black/40">
								<Loader2 size={20} className="animate-spin text-white" />
							</div>
						)}
						{!uploading && (
							<div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity bg-black/40">
								<button
									type="button"
									onClick={() => inputRef.current?.click()}
									className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-text-primary hover:bg-white transition-colors"
								>
									<Pencil size={14} />
								</button>
								<button
									type="button"
									onClick={onClear}
									className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-text-danger hover:bg-white transition-colors"
								>
									<X size={14} />
								</button>
							</div>
						)}
					</>
				) : (
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className={cn(
							"flex h-full w-full flex-col items-center justify-center gap-2",
							"border-2 border-dashed transition-colors",
							shape === "circle" ? "rounded-full" : "rounded-card",
							dragOver
								? "border-border-focus bg-surface-brand-soft"
								: "border-border-default bg-surface-canvas hover:border-border-strong hover:bg-surface-card",
						)}
					>
						{uploading ? (
							<Loader2 size={20} className="animate-spin text-icon-brand" />
						) : (
							<>
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card">
									{shape === "circle" ? (
										<ImageIcon size={16} className="text-icon-secondary" />
									) : (
										<Upload size={16} className="text-icon-secondary" />
									)}
								</div>
								<div className="text-center">
									<p className="text-label-sm text-text-secondary">
										{shape === "circle" ? "Upload icon" : "Upload cover image"}
									</p>
									<p className="text-caption text-text-secondary mt-0.5">{hint}</p>
								</div>
							</>
						)}
					</button>
				)}
			</div>

			<input
				ref={inputRef}
				type="file"
				accept={ACCEPTED.join(",")}
				className="hidden"
				onChange={onInputChange}
			/>

			{value && !uploading && (
				<p className="text-caption text-text-tertiary truncate">Key: {value}</p>
			)}
		</div>
	)
}
