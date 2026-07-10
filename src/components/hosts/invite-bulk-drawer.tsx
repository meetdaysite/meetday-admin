"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { type ColumnDef } from "@tanstack/react-table"
import {
	Upload,
	FileText,
	AlertCircle,
	CheckCircle2,
	Check,
	Download,
	Loader2,
	ArrowLeft,
	ChevronRight,
	X as XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Drawer } from "@/components/ui/drawer"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/Button"
import { parseHostFile, downloadErrorReport, downloadTemplate } from "@/lib/parse-host-file"
import type { BulkHostRow } from "@/types"
import { inviteHostsBulk } from "@/lib/api/hosts"
import { toast } from "sonner"

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEPS = ["Upload", "Preview", "Done"] as const

function StepIndicator({ current }: { current: number }) {
	return (
		<div className="flex items-center w-full">
			{STEPS.map((label, i) => (
				<div key={label} className={cn("flex items-center", i > 0 && "flex-1")}>
					{i > 0 && (
						<div
							className={cn(
								"h-px flex-1 transition-colors",
								i <= current ? "bg-action-primary" : "bg-neutral-200",
							)}
						/>
					)}
					<div className="flex flex-col items-center gap-1.5">
						<div
							className={cn(
								"flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors",
								i < current
									? "border-border-focus bg-action-primary text-white"
									: i === current
										? "border-border-focus bg-surface-canvas text-text-brand"
										: "border-border-default bg-surface-canvas text-text-tertiary",
							)}
						>
							{i < current ? <Check size={12} /> : i + 1}
						</div>
						<span
							className={cn(
								"text-[10px] font-medium tracking-wide",
								i === current
									? "text-text-brand"
									: i < current
										? "text-text-secondary"
										: "text-text-tertiary",
							)}
						>
							{label}
						</span>
					</div>
				</div>
			))}
		</div>
	)
}

// ─── Step 1: Upload ───────────────────────────────────────────────────────────

function UploadStep({ onContinue }: { onContinue: (rows: BulkHostRow[]) => void }) {
	const [file, setFile]           = useState<File | null>(null)
	const [rows, setRows]           = useState<BulkHostRow[] | null>(null)
	const [parseError, setError]    = useState<string | null>(null)
	const [isParsing, setIsParsing] = useState(false)

	const onDrop = useCallback(async (accepted: File[]) => {
		const f = accepted[0]
		if (!f) return
		setFile(f)
		setRows(null)
		setError(null)
		setIsParsing(true)
		try {
			const parsed = await parseHostFile(f)
			setRows(parsed)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to parse file.")
		} finally {
			setIsParsing(false)
		}
	}, [])

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"text/csv": [".csv"],
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
		},
		maxFiles: 1,
		multiple: false,
	})

	const validCount = rows ? rows.filter((r) => r._valid).length : 0
	const errorCount = rows ? rows.length - validCount : 0

	return (
		<div className="space-y-5">
			{/* Dropzone */}
			<div
				{...getRootProps()}
				className={cn(
					"flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 transition-colors",
					isDragActive
						? "border-border-focus bg-surface-brand-soft"
						: rows
							? "border-green-300 bg-green-50 hover:bg-green-50/70"
							: "border-border-default bg-neutral-50 hover:border-neutral-300 hover:bg-surface-canvas",
				)}
			>
				<input {...getInputProps()} />
				<div
					className={cn(
						"flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
						rows ? "bg-green-100" : isDragActive ? "bg-surface-brand-soft" : "bg-surface-brand-soft",
					)}
				>
					{rows ? (
						<FileText size={22} className="text-green-600" />
					) : (
						<Upload size={22} className="text-text-brand" />
					)}
				</div>

				{isParsing ? (
					<div className="flex items-center gap-2 text-sm text-text-secondary">
						<Loader2 size={15} className="animate-spin text-text-brand" />
						Parsing file…
					</div>
				) : file ? (
					<div className="text-center">
						<p className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
							<FileText size={14} className="text-text-tertiary" />
							{file.name}
						</p>
						<p className="mt-0.5 text-[11px] text-text-tertiary">Drop a new file to replace</p>
					</div>
				) : (
					<div className="text-center">
						<p className="text-sm font-medium text-text-primary">
							{isDragActive ? "Drop it here" : "Drop your file here"}
						</p>
						<p className="mt-0.5 text-[11px] text-text-tertiary">CSV or XLSX · max 5 MB</p>
					</div>
				)}
			</div>

			{/* Parse summary */}
			{rows && (
				<div className="flex flex-wrap items-center gap-2">
					<span className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-text-secondary">
						{rows.length} row{rows.length !== 1 ? "s" : ""} found
					</span>
					<span className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
						{validCount} valid
					</span>
					{errorCount > 0 && (
						<span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
							{errorCount} with errors
						</span>
					)}
				</div>
			)}

			{/* Parse error */}
			{parseError && (
				<div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
					<AlertCircle size={14} className="mt-0.5 shrink-0 text-red-600" />
					<p className="text-xs text-red-700">{parseError}</p>
				</div>
			)}

			{/* Template download */}
			<p className="text-xs text-text-tertiary">
				Need a template?{" "}
				<button
					type="button"
					onClick={downloadTemplate}
					className="font-medium text-text-brand hover:underline"
				>
					Download sample CSV
				</button>
			</p>

			{/* Continue */}
			{rows && validCount > 0 && (
				<Button
					type="button"
					onClick={() => onContinue(rows)}
					rightIcon={<ChevronRight size={13} />}
				>
					Preview {validCount} row{validCount !== 1 ? "s" : ""}
				</Button>
			)}
		</div>
	)
}

// ─── Step 2: Preview ──────────────────────────────────────────────────────────

function PreviewStep({
	rows,
	onBack,
	onSend,
	isSending,
}: {
	rows: BulkHostRow[]
	onBack: () => void
	onSend: () => void
	isSending: boolean
}) {
	const validCount = rows.filter((r) => r._valid).length
	const errorCount = rows.length - validCount

	const columns: ColumnDef<BulkHostRow>[] = [
		{
			id: "index",
			header: "#",
			cell: ({ row }) => (
				<span className="text-xs text-text-tertiary tabular-nums">{row.original._index}</span>
			),
		},
		{
			id: "name",
			header: "Name",
			cell: ({ row }) => (
				<span className={cn("text-xs", !row.original.name && "italic text-text-tertiary")}>
					{row.original.name || "—"}
				</span>
			),
		},
		{
			id: "email",
			header: "Email",
			cell: ({ row }) => (
				<span className={cn("text-xs", !row.original.email && "italic text-text-tertiary")}>
					{row.original.email || "—"}
				</span>
			),
		},
		{
			id: "city",
			header: "City",
			cell: ({ row }) => (
				<span className={cn("text-xs", !row.original.city && "italic text-text-tertiary")}>
					{row.original.city || "—"}
				</span>
			),
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row }) =>
				row.original._valid ? (
					<span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
						<CheckCircle2 size={11} />
						Valid
					</span>
				) : (
					<span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
						<XIcon size={11} />
						Error
					</span>
				),
		},
		{
			id: "issues",
			header: "Issues",
			cell: ({ row }) => {
				if (row.original._valid) return null
				return (
					<ul className="space-y-0.5">
						{row.original._errors.map((e, i) => (
							<li key={i} className="text-[11px] text-red-600">
								{e}
							</li>
						))}
					</ul>
				)
			},
		},
	]

	return (
		<div className="space-y-5">
			{/* Summary bar */}
			<div className="flex flex-wrap items-center gap-2">
				<span className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-text-secondary">
					{rows.length} rows total
				</span>
				<span className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
					<span className="inline-flex items-center gap-1">
						<CheckCircle2 size={12} />
						{validCount} valid
					</span>
				</span>
				{errorCount > 0 && (
					<span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
						<span className="inline-flex items-center gap-1">
							<AlertCircle size={12} />
							{errorCount} with errors
						</span>
					</span>
				)}
				{errorCount > 0 && (
					<button
						type="button"
						onClick={() => downloadErrorReport(rows)}
						className="ml-auto flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
					>
						<Download size={13} />
						Download errors
					</button>
				)}
			</div>

			{/* Table */}
			<DataTable
				columns={columns}
				data={rows}
				emptyState={
					<p className="py-8 text-center text-sm text-text-tertiary">No rows found.</p>
				}
			/>

			{/* Footer actions */}
			<div className="flex items-center justify-between pt-1">
				<Button
					type="button"
					variant="secondary"
					onClick={onBack}
					leftIcon={<ArrowLeft size={13} />}
				>
					Back
				</Button>
				<Button
					type="button"
					onClick={onSend}
					disabled={validCount === 0 || isSending}
					leftIcon={isSending ? <Loader2 size={13} className="animate-spin" /> : undefined}
				>
					Send {validCount} invitation{validCount !== 1 ? "s" : ""}
				</Button>
			</div>
		</div>
	)
}

// ─── Step 3: Done ─────────────────────────────────────────────────────────────

function DoneStep({
	sentCount,
	failedRows,
	onReset,
	onClose,
	onOpenSingle,
}: {
	sentCount: number
	failedRows: BulkHostRow[]
	onReset: () => void
	onClose: () => void
	onOpenSingle: () => void
}) {
	return (
		<div className="flex flex-col items-center py-14 text-center">
			<div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
				<CheckCircle2 size={32} className="text-green-600" />
			</div>
			<h2 className="text-base font-semibold text-text-primary">
				{sentCount} invitation{sentCount !== 1 ? "s" : ""} sent
			</h2>
			<p className="mt-1 text-sm text-text-tertiary">
				Hosts will receive an email to complete their profile.
			</p>

			{failedRows.length > 0 && (
				<div className="mt-5 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left">
					<p className="text-xs font-semibold text-red-700">
						{failedRows.length} row{failedRows.length !== 1 ? "s" : ""} skipped due to
						validation errors
					</p>
					<button
						type="button"
						onClick={() => downloadErrorReport(failedRows)}
						className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-700 hover:underline"
					>
						<Download size={12} />
						Download error report
					</button>
				</div>
			)}

			<div className="mt-6 flex items-center gap-3">
				<Button type="button" onClick={onReset}>
					Upload another file
				</Button>
				<Button
					type="button"
					variant="secondary"
					onClick={() => {
						onClose()
						onOpenSingle()
					}}
				>
					Single invite
				</Button>
			</div>
		</div>
	)
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
	open: boolean
	onClose: () => void
	onOpenSingle: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteBulkDrawer({ open, onClose, onOpenSingle }: Props) {
	const [step, setStep]             = useState(0)
	const [rows, setRows]             = useState<BulkHostRow[]>([])
	const [isSending, setIsSending]   = useState(false)
	const [sentCount, setSentCount]   = useState(0)
	const [failedRows, setFailedRows] = useState<BulkHostRow[]>([])

	function handleContinue(parsed: BulkHostRow[]) {
		setRows(parsed)
		setStep(1)
	}

	async function handleSend() {
		setIsSending(true)
		try {
			const validRows = rows.filter((r) => r._valid)
			const result = await inviteHostsBulk({
				hosts: validRows.map((r) => ({ name: r.name, email: r.email, phone: r.phone, city: r.city })),
			})
			setSentCount(result.sent)
			setFailedRows(rows.filter((r) => result.failed.some((f) => f.email === r.email)))
			setStep(2)
		} catch {
			toast.error("Failed to send invitations. Please try again.")
		} finally {
			setIsSending(false)
		}
	}

	function handleReset() {
		setStep(0)
		setRows([])
		setSentCount(0)
		setFailedRows([])
	}

	function handleClose() {
		onClose()
		// reset after animation
		setTimeout(handleReset, 300)
	}

	return (
		<Drawer
			open={open}
			onClose={handleClose}
			title="Bulk Invite Hosts"
			description="Upload a CSV or XLSX file to send invitations in bulk."
			width="max-w-2xl"
		>
			<div className="space-y-6">
				<StepIndicator current={step} />

				{step === 0 && <UploadStep onContinue={handleContinue} />}
				{step === 1 && (
					<PreviewStep
						rows={rows}
						onBack={() => setStep(0)}
						onSend={handleSend}
						isSending={isSending}
					/>
				)}
				{step === 2 && (
					<DoneStep
						sentCount={sentCount}
						failedRows={failedRows}
						onReset={handleReset}
						onClose={handleClose}
						onOpenSingle={onOpenSingle}
					/>
				)}
			</div>
		</Drawer>
	)
}
