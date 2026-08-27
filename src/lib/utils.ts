import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// Presigned URLs keep the object key (with its extension) before the query string.
export function isPdfMediaUrl(url: string): boolean {
	return url.split("?")[0].toLowerCase().endsWith(".pdf")
}
