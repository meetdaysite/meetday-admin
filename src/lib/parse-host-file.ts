import Papa from "papaparse"
import type { BulkHostRow } from "@/types"

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Picks the first present key from a row object, handles header casing variants. */
function pick(row: Record<string, string>, ...keys: string[]): string {
	for (const k of keys) {
		if (row[k] !== undefined && row[k] !== null) return String(row[k]).trim()
	}
	return ""
}

function validateRow(raw: Record<string, string>, index: number): BulkHostRow {
	const name  = pick(raw, "name", "Name", "Full Name", "full_name", "fullName")
	const email = pick(raw, "email", "Email", "Email Address").toLowerCase()
	const phone = pick(raw, "phone", "Phone", "Mobile", "mobile", "contact")
	const city  = pick(raw, "city", "City", "Location", "location")

	const errors: string[] = []
	if (!name)                      errors.push("Name is required")
	if (!email)                     errors.push("Email is required")
	else if (!EMAIL_RE.test(email)) errors.push("Invalid email format")
	if (!city)                      errors.push("City is required")

	return { _index: index + 1, name, email, phone, city, _valid: errors.length === 0, _errors: errors }
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

async function parseCsv(file: File): Promise<BulkHostRow[]> {
	return new Promise((resolve, reject) => {
		Papa.parse<Record<string, string>>(file, {
			header: true,
			skipEmptyLines: true,
			complete: ({ data }) => resolve(data.map((r, i) => validateRow(r, i))),
			error: reject,
		})
	})
}

// ─── XLSX ─────────────────────────────────────────────────────────────────────

async function parseXlsx(file: File): Promise<BulkHostRow[]> {
	// Requires: npm install xlsx
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let xlsx: any
	try {
		xlsx = await import(/* webpackIgnore: true */ "xlsx" as string)
	} catch {
		throw new Error(
			"XLSX parsing requires the xlsx package. Run: npm install xlsx, then restart the dev server. " +
			"Alternatively, export your spreadsheet as CSV.",
		)
	}
	const buffer = await file.arrayBuffer()
	const wb = xlsx.read(buffer, { type: "array" })
	const ws = wb.Sheets[wb.SheetNames[0]]
	const rows: Record<string, string>[] = xlsx.utils.sheet_to_json(ws, { defval: "" })
	return rows.map((r, i) => validateRow(r, i))
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseHostFile(file: File): Promise<BulkHostRow[]> {
	const name = file.name.toLowerCase()
	if (name.endsWith(".csv"))               return parseCsv(file)
	if (name.endsWith(".xlsx") || name.endsWith(".xls")) return parseXlsx(file)
	throw new Error("Unsupported file type. Please upload a .csv or .xlsx file.")
}

export function downloadErrorReport(rows: BulkHostRow[]) {
	const invalid = rows.filter((r) => !r._valid)
	if (invalid.length === 0) return
	const csv = Papa.unparse(
		invalid.map((r) => ({
			row:    r._index,
			name:   r.name,
			email:  r.email,
			phone:  r.phone,
			city:   r.city,
			errors: r._errors.join("; "),
		})),
	)
	triggerDownload(csv, "text/csv", "host-invite-errors.csv")
}

export function downloadTemplate() {
	const csv = "name,email,phone,city\nJane Doe,jane@example.com,9876543210,Mumbai\nRahul Mehta,rahul@example.com,,Pune\n"
	triggerDownload(csv, "text/csv", "host-invite-template.csv")
}

function triggerDownload(content: string, mimeType: string, filename: string) {
	const blob = new Blob([content], { type: mimeType })
	const url  = URL.createObjectURL(blob)
	const a    = document.createElement("a")
	a.href     = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}
