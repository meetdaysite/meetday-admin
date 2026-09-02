"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	List,
	ListOrdered,
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
	Link as LinkIcon,
	Quote,
	Minus,
	Undo,
	Redo,
	Eye,
	Edit3,
	RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"

function ListIndentIcon({ size = 14, className }: { size?: number; className?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
			<line x1="3" y1="6" x2="21" y2="6" />
			<line x1="11" y1="12" x2="21" y2="12" />
			<line x1="11" y1="18" x2="21" y2="18" />
			<polyline points="3 10 7 14 3 18" />
		</svg>
	)
}

function ListOutdentIcon({ size = 14, className }: { size?: number; className?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
			<line x1="3" y1="6" x2="21" y2="6" />
			<line x1="11" y1="12" x2="21" y2="12" />
			<line x1="11" y1="18" x2="21" y2="18" />
			<polyline points="7 10 3 14 7 18" />
		</svg>
	)
}

export interface RichTextEditorProps {
	value: string
	onChange: (html: string) => void
	placeholder?: string
	minHeight?: string
	className?: string
}

export function RichTextEditor({
	value,
	onChange,
	placeholder = "Compose your announcement message here…",
	minHeight = "280px",
	className,
}: RichTextEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null)
	const isInternalChangeRef = useRef(false)
	const [mode, setMode] = useState<"write" | "preview">("write")
	const [activeFormats, setActiveFormats] = useState({
		bold: false,
		italic: false,
		underline: false,
		strike: false,
		unorderedList: false,
		orderedList: false,
		alignLeft: false,
		alignCenter: false,
		alignRight: false,
		alignJustify: false,
		formatBlock: "p",
	})

	const [wordCount, setWordCount] = useState(0)
	const [charCount, setCharCount] = useState(0)

	const updateCounts = useCallback((text: string) => {
		const trimmed = text.trim()
		setCharCount(trimmed ? text.length : 0)
		setWordCount(trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0)
	}, [])

	// Sync value from external state ONLY when not caused by internal user typing
	useEffect(() => {
		if (isInternalChangeRef.current) {
			isInternalChangeRef.current = false
			return
		}
		if (editorRef.current) {
			const currentHtml = editorRef.current.innerHTML
			if (currentHtml !== value) {
				editorRef.current.innerHTML = value || ""
				updateCounts(editorRef.current.innerText || "")
			}
		}
	}, [value, updateCounts])

	const updateActiveFormats = useCallback(() => {
		if (typeof document === "undefined") return
		try {
			setActiveFormats({
				bold: document.queryCommandState("bold"),
				italic: document.queryCommandState("italic"),
				underline: document.queryCommandState("underline"),
				strike: document.queryCommandState("strikeThrough"),
				unorderedList: document.queryCommandState("insertUnorderedList"),
				orderedList: document.queryCommandState("insertOrderedList"),
				alignLeft: document.queryCommandState("justifyLeft"),
				alignCenter: document.queryCommandState("justifyCenter"),
				alignRight: document.queryCommandState("justifyRight"),
				alignJustify: document.queryCommandState("justifyFull"),
				formatBlock: document.queryCommandValue("formatBlock")?.toLowerCase() || "p",
			})
		} catch {
			// ignore queryCommandState errors in unsupported envs
		}
	}, [])

	const handleInput = () => {
		if (!editorRef.current) return
		isInternalChangeRef.current = true
		const html = editorRef.current.innerHTML
		const cleanHtml = html === "<p><br></p>" || html === "<br>" || html === "<div><br></div>" ? "" : html
		onChange(cleanHtml)
		updateCounts(editorRef.current.innerText || "")
		updateActiveFormats()
	}

	const exec = (command: string, value: string | undefined = undefined) => {
		if (!editorRef.current) return
		editorRef.current.focus()
		document.execCommand(command, false, value)
		handleInput()
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Tab") {
			e.preventDefault()
			if (e.shiftKey) {
				exec("outdent")
			} else {
				exec("indent")
			}
		}
	}

	const handleHeadingChange = (tag: string) => {
		if (tag === "p") {
			exec("formatBlock", "<p>")
		} else {
			exec("formatBlock", `<${tag}>`)
		}
	}

	const handleAddLink = () => {
		const selection = window.getSelection()?.toString()
		const url = window.prompt("Enter link URL (e.g. https://meetday.com):", "https://")
		if (url && url !== "https://") {
			if (!selection) {
				exec("insertHTML", `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)
			} else {
				exec("createLink", url)
			}
		}
	}

	const toolsRef = useRef<HTMLDivElement>(null)
	const [toolsOpen, setToolsOpen] = useState(false)

	// Close tools dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
				setToolsOpen(false)
			}
		}
		if (toolsOpen) {
			document.addEventListener("mousedown", handleClickOutside)
			return () => document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [toolsOpen])

	const handleClearFormatting = () => {
		exec("removeFormat")
		exec("formatBlock", "<p>")
	}

	return (
		<div className={cn("flex flex-col border-[3px] border-black rounded-2xl bg-white shadow-xs relative", className)}>
			{/* Toolbar Header */}
			<div className="relative flex items-center justify-between gap-2 border-b-[3px] border-black bg-neutral-50 px-3 py-2 shrink-0 z-20 rounded-t-[20px]">
				{/* ── DESKTOP FORMATTING CONTROLS (INLINE >= md) ───────────────────── */}
				<div className="hidden md:flex flex-wrap items-center gap-1">
					{/* Heading Selector */}
					<select
						value={
							activeFormats.formatBlock.includes("h1")
								? "h1"
								: activeFormats.formatBlock.includes("h2")
									? "h2"
									: activeFormats.formatBlock.includes("h3")
										? "h3"
										: "p"
						}
						onChange={(e) => handleHeadingChange(e.target.value)}
						disabled={mode === "preview"}
						className="h-8 px-2.5 rounded-lg border-2 border-black bg-white text-xs font-bold text-black outline-none hover:bg-neutral-50 cursor-pointer disabled:opacity-40"
						title="Text Style"
					>
						<option value="p">Normal text</option>
						<option value="h1">Heading 1 (Large)</option>
						<option value="h2">Heading 2 (Medium)</option>
						<option value="h3">Heading 3 (Small)</option>
					</select>

					<div className="h-5 w-[2px] bg-black/20 mx-1" />

					{/* Bold, Italic, Underline, Strike */}
					<button
						type="button"
						onClick={() => exec("bold")}
						disabled={mode === "preview"}
						className={cn(
							"size-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-40",
							activeFormats.bold ? "bg-[#FFC940] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black/80 hover:bg-neutral-100",
						)}
						title="Bold (Ctrl+B)"
					>
						<Bold size={14} strokeWidth={2.8} />
					</button>

					<button
						type="button"
						onClick={() => exec("italic")}
						disabled={mode === "preview"}
						className={cn(
							"size-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-40",
							activeFormats.italic ? "bg-[#FFC940] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black/80 hover:bg-neutral-100",
						)}
						title="Italic (Ctrl+I)"
					>
						<Italic size={14} strokeWidth={2.8} />
					</button>

					<button
						type="button"
						onClick={() => exec("underline")}
						disabled={mode === "preview"}
						className={cn(
							"size-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-40",
							activeFormats.underline ? "bg-[#FFC940] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black/80 hover:bg-neutral-100",
						)}
						title="Underline (Ctrl+U)"
					>
						<Underline size={14} strokeWidth={2.8} />
					</button>

					<button
						type="button"
						onClick={() => exec("strikeThrough")}
						disabled={mode === "preview"}
						className={cn(
							"size-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-40",
							activeFormats.strike ? "bg-[#FFC940] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black/80 hover:bg-neutral-100",
						)}
						title="Strikethrough"
					>
						<Strikethrough size={14} strokeWidth={2.8} />
					</button>

					<div className="h-5 w-[2px] bg-black/20 mx-1" />

					{/* Lists */}
					<button
						type="button"
						onClick={() => exec("insertUnorderedList")}
						disabled={mode === "preview"}
						className={cn(
							"size-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-40",
							activeFormats.unorderedList ? "bg-[#FFC940] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black/80 hover:bg-neutral-100",
						)}
						title="Bullet List"
					>
						<List size={14} strokeWidth={2.5} />
					</button>

					<button
						type="button"
						onClick={() => exec("insertOrderedList")}
						disabled={mode === "preview"}
						className={cn(
							"size-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-40",
							activeFormats.orderedList ? "bg-[#FFC940] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black/80 hover:bg-neutral-100",
						)}
						title="Numbered List"
					>
						<ListOrdered size={14} strokeWidth={2.5} />
					</button>

					{/* Sub-bullet / Indent & Outdent */}
					<button
						type="button"
						onClick={() => exec("indent")}
						disabled={mode === "preview"}
						className="size-8 rounded-lg border-2 border-black bg-white text-black/80 hover:bg-neutral-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
						title="Sub-bullet / Indent (Tab)"
					>
						<ListIndentIcon size={14} />
					</button>

					<button
						type="button"
						onClick={() => exec("outdent")}
						disabled={mode === "preview"}
						className="size-8 rounded-lg border-2 border-black bg-white text-black/80 hover:bg-neutral-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
						title="Parent-bullet / Outdent (Shift+Tab)"
					>
						<ListOutdentIcon size={14} />
					</button>

					<div className="h-5 w-[2px] bg-black/20 mx-1" />

					{/* Alignment */}
					<button
						type="button"
						onClick={() => exec("justifyLeft")}
						disabled={mode === "preview"}
						className={cn(
							"size-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-40",
							activeFormats.alignLeft ? "bg-[#FFC940] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black/80 hover:bg-neutral-100",
						)}
						title="Align Left"
					>
						<AlignLeft size={14} strokeWidth={2.5} />
					</button>

					<button
						type="button"
						onClick={() => exec("justifyCenter")}
						disabled={mode === "preview"}
						className={cn(
							"size-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-40",
							activeFormats.alignCenter ? "bg-[#FFC940] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black/80 hover:bg-neutral-100",
						)}
						title="Align Center"
					>
						<AlignCenter size={14} strokeWidth={2.5} />
					</button>

					<button
						type="button"
						onClick={() => exec("justifyRight")}
						disabled={mode === "preview"}
						className={cn(
							"size-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-40",
							activeFormats.alignRight ? "bg-[#FFC940] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black/80 hover:bg-neutral-100",
						)}
						title="Align Right"
					>
						<AlignRight size={14} strokeWidth={2.5} />
					</button>

					<button
						type="button"
						onClick={() => exec("justifyFull")}
						disabled={mode === "preview"}
						className={cn(
							"size-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer disabled:opacity-40",
							activeFormats.alignJustify ? "bg-[#FFC940] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black/80 hover:bg-neutral-100",
						)}
						title="Justify"
					>
						<AlignJustify size={14} strokeWidth={2.5} />
					</button>

					<div className="h-5 w-[2px] bg-black/20 mx-1" />

					{/* Link, Blockquote, Divider */}
					<button
						type="button"
						onClick={handleAddLink}
						disabled={mode === "preview"}
						className="size-8 rounded-lg border-2 border-black bg-white text-black/80 hover:bg-neutral-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
						title="Insert Link"
					>
						<LinkIcon size={14} strokeWidth={2.5} />
					</button>

					<button
						type="button"
						onClick={() => exec("formatBlock", "<blockquote>")}
						disabled={mode === "preview"}
						className="size-8 rounded-lg border-2 border-black bg-white text-black/80 hover:bg-neutral-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
						title="Quote Block"
					>
						<Quote size={14} strokeWidth={2.5} />
					</button>

					<button
						type="button"
						onClick={() => exec("insertHorizontalRule")}
						disabled={mode === "preview"}
						className="size-8 rounded-lg border-2 border-black bg-white text-black/80 hover:bg-neutral-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
						title="Divider"
					>
						<Minus size={14} strokeWidth={2.5} />
					</button>

					<div className="h-5 w-[2px] bg-black/20 mx-1" />

					{/* Undo, Redo, Clear */}
					<button
						type="button"
						onClick={() => exec("undo")}
						disabled={mode === "preview"}
						className="size-8 rounded-lg border-2 border-black bg-white text-black/80 hover:bg-neutral-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
						title="Undo"
					>
						<Undo size={14} strokeWidth={2.5} />
					</button>

					<button
						type="button"
						onClick={() => exec("redo")}
						disabled={mode === "preview"}
						className="size-8 rounded-lg border-2 border-black bg-white text-black/80 hover:bg-neutral-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
						title="Redo"
					>
						<Redo size={14} strokeWidth={2.5} />
					</button>

					<button
						type="button"
						onClick={handleClearFormatting}
						disabled={mode === "preview"}
						className="size-8 rounded-lg border-2 border-black bg-white text-black/80 hover:bg-neutral-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
						title="Clear Formatting"
					>
						<RotateCcw size={13} strokeWidth={2.5} />
					</button>
				</div>

				{/* ── MOBILE ROW (< md): Write/Preview on Left, Tools on Right ────────── */}
				<div className="flex md:hidden items-center justify-between w-full">
					{/* Write vs Preview toggle on the left */}
					<div className="flex items-center rounded-xl border-2 border-black bg-white p-0.5 shadow-2xs">
						<button
							type="button"
							onClick={() => setMode("write")}
							className={cn(
								"flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer",
								mode === "write" ? "bg-[#EE2C2C] text-white" : "text-black/60 hover:text-black",
							)}
						>
							<Edit3 size={12} strokeWidth={2.5} />
							<span>Write</span>
						</button>
						<button
							type="button"
							onClick={() => setMode("preview")}
							className={cn(
								"flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer",
								mode === "preview" ? "bg-[#FFC940] text-black" : "text-black/60 hover:text-black",
							)}
						>
							<Eye size={12} strokeWidth={2.5} />
							<span>Preview</span>
						</button>
					</div>

					{/* Tools Button with Dropdown on the right */}
					<div className="relative" ref={toolsRef}>
						<button
							type="button"
							onClick={() => setToolsOpen(v => !v)}
							disabled={mode === "preview"}
							className={cn(
								"flex items-center gap-1.5 h-8 px-3 rounded-xl border-2 border-black font-black text-xs transition-all cursor-pointer disabled:opacity-40",
								toolsOpen ? "bg-[#FFC940] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black hover:bg-neutral-100",
							)}
						>
							<span>Tools</span>
							<span className="text-[10px] transform transition-transform duration-200">
								{toolsOpen ? "▲" : "▼"}
							</span>
						</button>

						{/* Tools Dropdown Menu - Aligned to Right edge so it never overflows offscreen */}
						{toolsOpen && (
							<div className="absolute right-0 top-full mt-2 z-50 w-[270px] max-w-[calc(100vw-36px)] bg-white border-[3px] border-black rounded-2xl p-3.5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
								{/* Style Heading & Text formats */}
								<div className="flex flex-col gap-1.5">
									<span className="text-[10px] font-black uppercase tracking-wider text-black/50">Style & Text</span>
									<select
										value={
											activeFormats.formatBlock.includes("h1")
												? "h1"
												: activeFormats.formatBlock.includes("h2")
													? "h2"
													: activeFormats.formatBlock.includes("h3")
														? "h3"
														: "p"
										}
										onChange={(e) => handleHeadingChange(e.target.value)}
										className="w-full h-8 px-2 rounded-lg border-2 border-black bg-white text-xs font-bold text-black outline-none"
									>
										<option value="p">Normal text</option>
										<option value="h1">Heading 1 (Large)</option>
										<option value="h2">Heading 2 (Medium)</option>
										<option value="h3">Heading 3 (Small)</option>
									</select>

									<div className="grid grid-cols-4 gap-1.5">
										<button
											type="button"
											onClick={() => exec("bold")}
											className={cn(
												"h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer",
												activeFormats.bold ? "bg-[#FFC940] text-black" : "bg-white text-black/80 hover:bg-neutral-100",
											)}
											title="Bold"
										>
											<Bold size={14} strokeWidth={2.8} />
										</button>

										<button
											type="button"
											onClick={() => exec("italic")}
											className={cn(
												"h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer",
												activeFormats.italic ? "bg-[#FFC940] text-black" : "bg-white text-black/80 hover:bg-neutral-100",
											)}
											title="Italic"
										>
											<Italic size={14} strokeWidth={2.8} />
										</button>

										<button
											type="button"
											onClick={() => exec("underline")}
											className={cn(
												"h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer",
												activeFormats.underline ? "bg-[#FFC940] text-black" : "bg-white text-black/80 hover:bg-neutral-100",
											)}
											title="Underline"
										>
											<Underline size={14} strokeWidth={2.8} />
										</button>

										<button
											type="button"
											onClick={() => exec("strikeThrough")}
											className={cn(
												"h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer",
												activeFormats.strike ? "bg-[#FFC940] text-black" : "bg-white text-black/80 hover:bg-neutral-100",
											)}
											title="Strikethrough"
										>
											<Strikethrough size={14} strokeWidth={2.8} />
										</button>
									</div>
								</div>

								{/* Lists & Bullets */}
								<div className="flex flex-col gap-1.5 pt-2 border-t border-black/10">
									<span className="text-[10px] font-black uppercase tracking-wider text-black/50">Lists & Sub-bullets</span>
									<div className="grid grid-cols-4 gap-1.5">
										<button
											type="button"
											onClick={() => exec("insertUnorderedList")}
											className={cn(
												"h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer",
												activeFormats.unorderedList ? "bg-[#FFC940] text-black" : "bg-white text-black/80 hover:bg-neutral-100",
											)}
											title="Bullet List"
										>
											<List size={14} strokeWidth={2.5} />
										</button>

										<button
											type="button"
											onClick={() => exec("insertOrderedList")}
											className={cn(
												"h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer",
												activeFormats.orderedList ? "bg-[#FFC940] text-black" : "bg-white text-black/80 hover:bg-neutral-100",
											)}
											title="Numbered List"
										>
											<ListOrdered size={14} strokeWidth={2.5} />
										</button>

										<button
											type="button"
											onClick={() => exec("indent")}
											className="h-8 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 flex items-center justify-center text-black/80 transition-all cursor-pointer"
											title="Sub-bullet / Indent (Tab)"
										>
											<ListIndentIcon size={14} />
										</button>

										<button
											type="button"
											onClick={() => exec("outdent")}
											className="h-8 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 flex items-center justify-center text-black/80 transition-all cursor-pointer"
											title="Parent-bullet / Outdent (Shift+Tab)"
										>
											<ListOutdentIcon size={14} />
										</button>
									</div>
								</div>

								{/* Alignment */}
								<div className="flex flex-col gap-1.5 pt-2 border-t border-black/10">
									<span className="text-[10px] font-black uppercase tracking-wider text-black/50">Alignment</span>
									<div className="grid grid-cols-4 gap-1.5">
										<button
											type="button"
											onClick={() => exec("justifyLeft")}
											className={cn(
												"h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer",
												activeFormats.alignLeft ? "bg-[#FFC940] text-black" : "bg-white text-black/80 hover:bg-neutral-100",
											)}
											title="Align Left"
										>
											<AlignLeft size={14} strokeWidth={2.5} />
										</button>

										<button
											type="button"
											onClick={() => exec("justifyCenter")}
											className={cn(
												"h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer",
												activeFormats.alignCenter ? "bg-[#FFC940] text-black" : "bg-white text-black/80 hover:bg-neutral-100",
											)}
											title="Align Center"
										>
											<AlignCenter size={14} strokeWidth={2.5} />
										</button>

										<button
											type="button"
											onClick={() => exec("justifyRight")}
											className={cn(
												"h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer",
												activeFormats.alignRight ? "bg-[#FFC940] text-black" : "bg-white text-black/80 hover:bg-neutral-100",
											)}
											title="Align Right"
										>
											<AlignRight size={14} strokeWidth={2.5} />
										</button>

										<button
											type="button"
											onClick={() => exec("justifyFull")}
											className={cn(
												"h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer",
												activeFormats.alignJustify ? "bg-[#FFC940] text-black" : "bg-white text-black/80 hover:bg-neutral-100",
											)}
											title="Justify"
										>
											<AlignJustify size={14} strokeWidth={2.5} />
										</button>
									</div>
								</div>

								{/* Insert & Actions */}
								<div className="flex flex-col gap-1.5 pt-2 border-t border-black/10">
									<span className="text-[10px] font-black uppercase tracking-wider text-black/50">Insert & Actions</span>
									<div className="grid grid-cols-6 gap-1.5">
										<button
											type="button"
											onClick={handleAddLink}
											className="h-8 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 flex items-center justify-center text-black/80 cursor-pointer"
											title="Insert Link"
										>
											<LinkIcon size={14} strokeWidth={2.5} />
										</button>

										<button
											type="button"
											onClick={() => exec("formatBlock", "<blockquote>")}
											className="h-8 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 flex items-center justify-center text-black/80 cursor-pointer"
											title="Quote Block"
										>
											<Quote size={14} strokeWidth={2.5} />
										</button>

										<button
											type="button"
											onClick={() => exec("insertHorizontalRule")}
											className="h-8 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 flex items-center justify-center text-black/80 cursor-pointer"
											title="Divider"
										>
											<Minus size={14} strokeWidth={2.5} />
										</button>

										<button
											type="button"
											onClick={() => exec("undo")}
											className="h-8 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 flex items-center justify-center text-black/80 cursor-pointer"
											title="Undo"
										>
											<Undo size={14} strokeWidth={2.5} />
										</button>

										<button
											type="button"
											onClick={() => exec("redo")}
											className="h-8 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 flex items-center justify-center text-black/80 cursor-pointer"
											title="Redo"
										>
											<Redo size={14} strokeWidth={2.5} />
										</button>

										<button
											type="button"
											onClick={handleClearFormatting}
											className="h-8 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 flex items-center justify-center text-black/80 cursor-pointer"
											title="Clear Formatting"
										>
											<RotateCcw size={13} strokeWidth={2.5} />
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* ── DESKTOP WRITE VS PREVIEW TOGGLE ON RIGHT (>= md) ───────────── */}
				<div className="hidden md:flex items-center rounded-xl border-2 border-black bg-white p-0.5 shadow-2xs">
					<button
						type="button"
						onClick={() => setMode("write")}
						className={cn(
							"flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer",
							mode === "write" ? "bg-[#EE2C2C] text-white" : "text-black/60 hover:text-black",
						)}
					>
						<Edit3 size={12} strokeWidth={2.5} />
						<span>Write</span>
					</button>
					<button
						type="button"
						onClick={() => setMode("preview")}
						className={cn(
							"flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer",
							mode === "preview" ? "bg-[#FFC940] text-black" : "text-black/60 hover:text-black",
						)}
					>
						<Eye size={12} strokeWidth={2.5} />
						<span>Preview</span>
					</button>
				</div>
			</div>

			{/* Canvas Body - Keep editorRef ALWAYS mounted so state is never lost */}
			<div className="relative flex-1 bg-white">
				{/* Write Mode Editor */}
				<div className={cn("relative", mode === "write" ? "block" : "hidden")}>
					<div
						ref={editorRef}
						contentEditable
						onInput={handleInput}
						onKeyDown={handleKeyDown}
						onKeyUp={updateActiveFormats}
						onMouseUp={updateActiveFormats}
						style={{ minHeight }}
						className={cn(
							"w-full px-5 py-4 text-sm sm:text-base font-medium text-black outline-none focus:bg-neutral-50/40 transition-colors overflow-y-auto leading-relaxed",
							"[&_h1]:text-2xl [&_h1]:font-black [&_h1]:font-heading [&_h1]:mb-3 [&_h1]:text-black",
							"[&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:font-heading [&_h2]:mb-2.5 [&_h2]:text-black",
							"[&_h3]:text-lg [&_h3]:font-bold [&_h3]:font-heading [&_h3]:mb-2 [&_h3]:text-black",
							"[&_p]:mb-3 [&_p]:leading-relaxed",
							"[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3",
							"[&_ul_ul]:list-[circle] [&_ul_ul]:pl-6 [&_ul_ul]:my-1",
							"[&_ul_ul_ul]:list-[square] [&_ul_ul_ul]:pl-6 [&_ul_ul_ul]:my-1",
							"[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3",
							"[&_ol_ol]:list-[lower-alpha] [&_ol_ol]:pl-6 [&_ol_ol]:my-1",
							"[&_ol_ol_ol]:list-[lower-roman] [&_ol_ol_ol]:pl-6 [&_ol_ol_ol]:my-1",
							"[&_li]:mb-1",
							"[&_blockquote]:border-l-4 [&_blockquote]:border-[#EE2C2C] [&_blockquote]:bg-red-50/40 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:text-neutral-700",
							"[&_a]:text-[#EE2C2C] [&_a]:underline [&_a]:font-bold",
							"[&_hr]:border-t-2 [&_hr]:border-black/10 [&_hr]:my-4",
						)}
					/>
					{!value && (
						<div className="absolute top-4 left-5 text-sm sm:text-base text-neutral-400 font-medium pointer-events-none select-none">
							{placeholder}
						</div>
					)}
				</div>

				{/* Preview Mode Canvas - Strictly renders single content under the badge */}
				<div
					style={{ minHeight }}
					className={cn("w-full px-4 sm:px-6 py-5 bg-neutral-50/70 overflow-y-auto", mode === "preview" ? "block" : "hidden")}
				>
					<div className="max-w-3xl mx-auto bg-white border-2 border-black/15 rounded-2xl p-6 sm:p-8 shadow-sm">
						<div className="inline-block px-2.5 py-0.5 rounded-full bg-[#EE2C2C] text-white text-[10px] font-black uppercase tracking-wider mb-4">
							Announcement Preview
						</div>
						{value ? (
							<div
								dangerouslySetInnerHTML={{ __html: value }}
								className={cn(
									"text-sm sm:text-base text-black leading-relaxed",
									"[&_h1]:text-2xl [&_h1]:font-black [&_h1]:font-heading [&_h1]:mb-3",
									"[&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:font-heading [&_h2]:mb-2.5",
									"[&_h3]:text-lg [&_h3]:font-bold [&_h3]:font-heading [&_h3]:mb-2",
									"[&_p]:mb-3 [&_p]:leading-relaxed",
									"[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3",
									"[&_ul_ul]:list-[circle] [&_ul_ul]:pl-6 [&_ul_ul]:my-1",
									"[&_ul_ul_ul]:list-[square] [&_ul_ul_ul]:pl-6 [&_ul_ul_ul]:my-1",
									"[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3",
									"[&_ol_ol]:list-[lower-alpha] [&_ol_ol]:pl-6 [&_ol_ol]:my-1",
									"[&_ol_ol_ol]:list-[lower-roman] [&_ol_ol_ol]:pl-6 [&_ol_ol_ol]:my-1",
									"[&_li]:mb-1",
									"[&_blockquote]:border-l-4 [&_blockquote]:border-[#EE2C2C] [&_blockquote]:bg-red-50/40 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:italic",
									"[&_a]:text-[#EE2C2C] [&_a]:underline [&_a]:font-bold",
									"[&_hr]:border-t-2 [&_hr]:border-black/10 [&_hr]:my-4",
								)}
							/>
						) : (
							<p className="text-sm font-semibold text-neutral-400 italic">
								No content written yet. Switch to "Write" mode to compose your message.
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Footer Stats Bar */}
			<div className="flex items-center justify-between px-4 py-2 border-t-[2px] border-black/10 bg-neutral-50/70 text-[11px] font-bold text-neutral-500 shrink-0 select-none">
				<span>
					Rich Text Formatting (HTML Email)
				</span>
				<div className="flex items-center gap-3">
					<span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
					<span>•</span>
					<span>{charCount} {charCount === 1 ? "character" : "characters"}</span>
				</div>
			</div>
		</div>
	)
}

