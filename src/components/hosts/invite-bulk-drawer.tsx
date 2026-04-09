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
import { parseHostFile, downloadErrorReport, downloadTemplate } from "@/lib/parse-host-file"
import type { BulkHostRow } from "@/types"

// ─── Step indicator ───────────────────────────────────────────────────────────

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
								i <= current ? "bg-brand-red" : "bg-neutral-200",
							)}
						/>
					)}
					<div className="flex flex-col items-center gap-1.5">
						<div
							className={cn(
								"flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors",
								i < current
									? "border-brand-red bg-brand-red text-white"
									: i === current
										? "border-brand-red bg-white text-brand-red"
										: "border-neutral-200 bg-white text-neutral-light",
							)}
						>
							{i < current ? <Check size={12} /> : i + 1}
						</div>
						<span
							className={cn(
								"text-[10px] font-medium tracking-wide",
								i === current
									? "text-brand-red"
									: i < current
										? "text-neutral-dark"
										: "text-neutral-light",
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
						? "border-brand-red bg-brand-red/5"
						: rows
							? "border-green-300 bg-green-50 hover:bg-green-50/70"
							: "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-white",
				)}
			>
				<input {...getInputProps()} />
				<div
					className={cn(
						"flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
						rows ? "bg-green-100" : isDragActive ? "bg-brand-red/15" : "bg-brand-red/10",
					)}
				>
					{rows ? (
						<FileText size={22} className="text-green-600" />
					) : (
						<Upload size={22} className="text-brand-red" />
					)}
				</div>

				{isParsing ? (
					<div className="flex items-center gap-2 text-sm text-neutral-dark">
						<Loader2 size={15} className="animate-spin text-brand-red" />
						Parsing file…
					</div>
				) : file ? (
					<div className="text-center">
						<p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
							<FileText size={14} className="text-neutral-light" />
							{file.name}
						</p>
						<p className="mt-0.5 text-[11px] text-neutral-light">Drop a new file to replace</p>
					</div>
				) : (
					<div className="text-center">
						<p className="text-sm font-medium text-foreground">
							{isDragActive ? "Drop it here" : "Drop your file here"}
						</p>
						<p className="mt-0.5 text-[11px] text-neutral-light">CSV or XLSX · max 5 MB</p>
					</div>
				)}
			</div>

			{/* Parse summary */}
			{rows && (
				<div className="flex flex-wrap items-center gap-2">
					<span className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-dark">
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
			<p className="text-xs text-neutral-light">
				Need a template?{" "}
				<button
					type="button"
					onClick={downloadTemplate}
					className="font-medium text-brand-red hover:underline"
				>
					Download sample CSV
				</button>
			</p>

			{/* Continue */}
			{rows && validCount > 0 && (
				<button
					type="button"
					onClick={() => onContinue(rows)}
					className="flex items-center gap-1.5 rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors"
				>
					Preview {validCount} row{validCount !== 1 ? "s" : ""}
					<ChevronRight size={13} />
				</button>
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
				<span className="text-xs text-neutral-light tabular-nums">{row.original._index}</span>
			),
		},
		{
			id: "name",
			header: "Name",
			cell: ({ row }) => (
				<span className={cn("text-xs", !row.original.name && "italic text-neutral-light")}>
					{row.original.name || "—"}
				</span>
			),
		},
		{
			id: "email",
			header: "Email",
			cell: ({ row }) => (
				<span className={cn("text-xs", !row.original.email && "italic text-neutral-light")}>
					{row.original.email || "—"}
				</span>
			),
		},
		{
			id: "city",
			header: "City",
			cell: ({ row }) => (
				<span className={cn("text-xs", !row.original.city && "italic text-neutral-light")}>
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
				<span className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-dark">
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
						className="ml-auto flex items-center gap-1.5 text-xs text-neutral-dark hover:text-foreground transition-colors"
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
					<p className="py-8 text-center text-sm text-neutral-light">No rows found.</p>
				}
			/>

			{/* Footer actions */}
			<div className="flex items-center justify-between pt-1">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors"
				>
					<ArrowLeft size={13} />
					Back
				</button>
				<button
					type="button"
					onClick={onSend}
					disabled={validCount === 0 || isSending}
					className="flex items-center gap-1.5 rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors disabled:opacity-60"
				>
					{isSending && <Loader2 size={13} className="animate-spin" />}
					Send {validCount} invitation{validCount !== 1 ? "s" : ""}
				</button>
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
			<h2 className="text-base font-semibold text-foreground">
				{sentCount} invitation{sentCount !== 1 ? "s" : ""} sent
			</h2>
			<p className="mt-1 text-sm text-neutral-light">
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
				<button
					type="button"
					onClick={onReset}
					className="rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold text-white hover:bg-brand-red-deep transition-colors"
				>
					Upload another file
				</button>
				<button
					type="button"
					onClick={() => {
						onClose()
						onOpenSingle()
					}}
					className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-foreground hover:bg-neutral-50 transition-colors"
				>
					Single invite
				</button>
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
		// TODO: replace with real API — send only rows where _valid === true
		await new Promise((r) => setTimeout(r, 1200))
		setSentCount(rows.filter((r) => r._valid).length)
		setFailedRows(rows.filter((r) => !r._valid))
		setIsSending(false)
		setStep(2)
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
