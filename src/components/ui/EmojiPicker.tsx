"use client"

import { useEffect, useRef, useState } from "react"

const CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
	{
		label: "Smileys",
		icon: "😀",
		emojis: [
			"😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
			"😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
			"😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕",
			"🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁",
			"😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞",
			"😓", "😩", "😫", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "🤡", "👻", "👽", "🤖",
		],
	},
	{
		label: "Gestures",
		icon: "👍",
		emojis: [
			"👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆",
			"🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🙏", "🤝", "💪",
			"🦾", "🖊️", "✍️", "💅", "🤳", "💃", "🕺", "🧑‍🤝‍🧑", "👫", "👬", "👭",
		],
	},
	{
		label: "Animals",
		icon: "🐶",
		emojis: [
			"🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵",
			"🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄",
			"🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️", "🐢", "🐍", "🦎", "🦖", "🐙", "🦑", "🦀",
			"🐠", "🐟", "🐡", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🐘", "🦏", "🐪", "🐫",
		],
	},
	{
		label: "Food",
		icon: "🍔",
		emojis: [
			"🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥",
			"🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍞", "🥐", "🥖",
			"🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🥗", "🍿",
			"🧂", "🍱", "🍣", "🍤", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍡", "🍦", "🍧", "🍨", "🍩",
			"🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "☕", "🍵", "🧃", "🥤", "🍺", "🍻", "🍷", "🥂",
		],
	},
	{
		label: "Activities",
		icon: "⚽",
		emojis: [
			"⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "🎯", "🎳", "⛳",
			"🎣", "🤿", "🎽", "🎿", "🛹", "🎮", "🕹️", "🎲", "🧩", "🎭", "🎨", "🎤", "🎧", "🎸", "🎹", "🥁",
			"🎷", "🎺", "🎻", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️",
		],
	},
	{
		label: "Travel",
		icon: "✈️",
		emojis: [
			"🚗", "🚕", "🚙", "🚌", "🏎️", "🚓", "🚑", "🚒", "🚚", "🚲", "🛴", "🏍️", "✈️", "🛫", "🛬", "🚀",
			"🛸", "🚁", "⛵", "🚤", "🛳️", "⚓", "🗺️", "🗽", "🗼", "🏰", "🏯", "🎡", "🎢", "🎠", "⛺", "🏕️",
			"🏖️", "🏜️", "🌋", "🏔️", "⛰️", "🌄", "🌅", "🌆", "🌇", "🌃", "🌉", "🌌",
		],
	},
	{
		label: "Objects",
		icon: "💡",
		emojis: [
			"⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "💿", "📷", "📸", "🎥", "📞", "☎️", "📺", "📻", "🎙️",
			"⏰", "⏱️", "🔋", "🔌", "💡", "🔦", "🕯️", "🧯", "🛢️", "💰", "💵", "💳", "💎", "🔧", "🔨", "🪛",
			"🔩", "⚙️", "🧲", "🔫", "💣", "🔪", "🗡️", "🛡️", "🚪", "🪑", "🛏️", "🛋️", "🚽", "🚿", "🛁", "🧴",
			"🧷", "🧹", "🧺", "🧻", "🧼", "🧽", "🔑", "🗝️", "🔒", "🔓", "📩", "📧", "💌", "📥", "📤", "📦",
		],
	},
	{
		label: "Symbols",
		icon: "❤️",
		emojis: [
			"❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
			"💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⭐", "🌟",
			"✨", "⚡", "🔥", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "🔴",
			"🟠", "🟡", "🟢", "🔵", "🟣", "⚪", "⚫", "✅", "❌", "❓", "❗", "‼️", "⁉️", "🚫", "♻️", "🆗",
		],
	},
]

export interface EmojiPickerProps {
	onSelect: (emoji: string) => void
	className?: string
	buttonClassName?: string
	icon?: React.ReactNode
	align?: "left" | "right"
	position?: "top" | "bottom"
	title?: string
	disabled?: boolean
}

export function EmojiPicker({
	onSelect,
	className,
	buttonClassName,
	icon,
	align = "left",
	position = "top",
	title = "Insert emoji",
	disabled = false,
}: EmojiPickerProps) {
	const [open, setOpen] = useState(false)
	const [activeCategory, setActiveCategory] = useState(0)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		function onClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
		}
		document.addEventListener("mousedown", onClickOutside)
		return () => document.removeEventListener("mousedown", onClickOutside)
	}, [open])

	return (
		<div className={`relative shrink-0 ${className || ""}`} ref={ref}>
			<button
				type="button"
				disabled={disabled}
				onClick={() => setOpen(o => !o)}
				className={
					buttonClassName ||
					"shrink-0 size-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-base leading-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				}
				title={title}
				aria-label={title}
			>
				{icon || "🙂"}
			</button>
			{open && (
				<div
					className={`absolute z-50 w-[280px] sm:w-80 rounded-2xl border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden ${
						position === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
					} ${align === "right" ? "right-0" : "left-0"}`}
				>
					<div className="flex border-b-[3px] border-black overflow-x-auto shrink-0 bg-neutral-50">
						{CATEGORIES.map((cat, i) => (
							<button
								key={cat.label}
								type="button"
								onClick={() => setActiveCategory(i)}
								title={cat.label}
								className={`shrink-0 w-10 h-10 flex items-center justify-center text-base transition-colors ${
									activeCategory === i ? "bg-[#FFC940] font-bold" : "hover:bg-neutral-100"
								}`}
							>
								{cat.icon}
							</button>
						))}
					</div>
					<div className="max-h-56 overflow-y-auto grid grid-cols-8 gap-1 p-2">
						{CATEGORIES[activeCategory].emojis.map((emoji, i) => (
							<button
								key={`${emoji}-${i}`}
								type="button"
								onClick={() => {
									onSelect(emoji)
									setOpen(false)
								}}
								className="text-lg hover:bg-[#FFC940]/30 hover:scale-110 active:scale-95 transition-transform rounded-lg p-1 flex items-center justify-center cursor-pointer"
							>
								{emoji}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

