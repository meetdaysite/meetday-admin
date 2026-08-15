"use client"

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"

export interface PlaceFields {
	fullAddress: string
	venueName: string
	city: string
}

interface VenueAutocompleteInputProps {
	id?: string
	value: string
	onChange: (v: string) => void
	onPlaceSelect: (fields: PlaceFields) => void
	placeholder?: string
	disabled?: boolean
	className: string
}

type PlaceSuggestion = {
	label: string
	mainText: string
	secondaryText: string
	prediction: google.maps.places.PlacePrediction
}

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
let googleMapsOptionsSet = false

async function ensurePlacesLibrary() {
	if (!googleMapsApiKey) return false
	if (!googleMapsOptionsSet) {
		setOptions({ key: googleMapsApiKey })
		googleMapsOptionsSet = true
	}
	await importLibrary("places")
	return true
}

function cityFromComponents(components?: google.maps.places.AddressComponent[]) {
	return (
		components?.find((c) => c.types.includes("locality"))?.longText ??
		components?.find((c) => c.types.includes("administrative_area_level_3"))?.longText ??
		components?.find((c) => c.types.includes("administrative_area_level_2"))?.longText ??
		""
	)
}

// Venue name input with Google Places autocomplete — mirrors the frontend host app's
// VenueAutocompleteInput (frontend/src/components/eventForm/AddressAutocompleteInput.tsx),
// ported here since the admin app is a separate project with no shared component package.
//
// The suggestions dropdown is rendered via a React portal so it escapes any
// overflow-hidden / overflow-y-auto ancestor (e.g. the drawer body).
export function VenueAutocompleteInput({
	id,
	value,
	onChange,
	onPlaceSelect,
	placeholder,
	disabled,
	className,
}: VenueAutocompleteInputProps) {
	const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
	const [open, setOpen] = useState(false)
	const [highlightedIndex, setHighlightedIndex] = useState(0)
	const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})
	const listboxId = useId()
	const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
	const requestIdRef = useRef(0)
	const rootRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const dropdownRef = useRef<HTMLDivElement>(null)

	// Recalculate dropdown position whenever it opens or the window scrolls/resizes
	useEffect(() => {
		if (!open) return

		function updatePosition() {
			const rect = inputRef.current?.getBoundingClientRect()
			if (!rect) return
			setDropdownStyle({
				position: "fixed",
				top: rect.bottom + 4,
				left: rect.left,
				width: rect.width,
				zIndex: 9999,
			})
		}

		updatePosition()
		window.addEventListener("scroll", updatePosition, true)
		window.addEventListener("resize", updatePosition)
		return () => {
			window.removeEventListener("scroll", updatePosition, true)
			window.removeEventListener("resize", updatePosition)
		}
	}, [open])

	useEffect(() => {
		if (!googleMapsApiKey || value.trim().length < 3) {
			const resetTimer = window.setTimeout(() => {
				setSuggestions([])
				setOpen(false)
			}, 0)
			return () => window.clearTimeout(resetTimer)
		}

		const requestId = ++requestIdRef.current
		const timer = window.setTimeout(async () => {
			try {
				const loaded = await ensurePlacesLibrary()
				if (!loaded || requestId !== requestIdRef.current) return

				sessionTokenRef.current ??= new google.maps.places.AutocompleteSessionToken()
				const { suggestions: nextSuggestions } =
					await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
						input: value,
						includedRegionCodes: ["in"],
						region: "in",
						sessionToken: sessionTokenRef.current,
					})

				if (requestId !== requestIdRef.current) return

				const placeSuggestions = nextSuggestions
					.map((suggestion) => suggestion.placePrediction)
					.filter((prediction): prediction is google.maps.places.PlacePrediction => prediction !== null)
					.map((prediction) => ({
						label: prediction.text.text,
						mainText: prediction.mainText?.text ?? prediction.text.text,
						secondaryText: prediction.secondaryText?.text ?? "",
						prediction,
					}))

				setSuggestions(placeSuggestions)
				setHighlightedIndex(0)
				setOpen(placeSuggestions.length > 0)
			} catch {
				setSuggestions([])
				setOpen(false)
			}
		}, 250)

		return () => window.clearTimeout(timer)
	}, [value])

	useEffect(() => {
		function handlePointerDown(event: PointerEvent) {
			const target = event.target as Node
			if (!rootRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
				setOpen(false)
			}
		}
		document.addEventListener("pointerdown", handlePointerDown)
		return () => document.removeEventListener("pointerdown", handlePointerDown)
	}, [])

	async function selectSuggestion(suggestion: PlaceSuggestion) {
		setOpen(false)
		setSuggestions([])

		const place = suggestion.prediction.toPlace()
		await place.fetchFields({
			fields: ["addressComponents", "displayName", "formattedAddress"],
		})

		sessionTokenRef.current = null
		onPlaceSelect({
			fullAddress: place.formattedAddress ?? suggestion.label,
			venueName: place.displayName ?? suggestion.mainText,
			city: cityFromComponents(place.addressComponents),
		})
	}

	function handleBlur() {
		window.setTimeout(() => setOpen(false), 120)
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (!open || suggestions.length === 0) return

		if (event.key === "ArrowDown") {
			event.preventDefault()
			setHighlightedIndex((i) => (i + 1) % suggestions.length)
		} else if (event.key === "ArrowUp") {
			event.preventDefault()
			setHighlightedIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
		} else if (event.key === "Enter") {
			event.preventDefault()
			selectSuggestion(suggestions[highlightedIndex])
		} else if (event.key === "Escape") {
			setOpen(false)
		}
	}

	const dropdown =
		open && suggestions.length > 0
			? createPortal(
					<div
						ref={dropdownRef}
						id={listboxId}
						role="listbox"
						style={dropdownStyle}
						className="overflow-hidden rounded-lg border border-border-default bg-surface-canvas shadow-lg"
					>
						{suggestions.map((suggestion, index) => (
							<button
								key={suggestion.prediction.placeId}
								type="button"
								role="option"
								aria-selected={index === highlightedIndex}
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => selectSuggestion(suggestion)}
								className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors ${
									index === highlightedIndex ? "bg-neutral-100" : "hover:bg-neutral-50"
								}`}
							>
								<span className="text-xs font-medium text-text-primary">{suggestion.mainText}</span>
								{suggestion.secondaryText && (
									<span className="text-[11px] text-text-tertiary">{suggestion.secondaryText}</span>
								)}
							</button>
						))}
					</div>,
					document.body,
				)
			: null

	return (
		<div ref={rootRef} className="relative w-full">
			<input
				ref={inputRef}
				id={id}
				type="text"
				value={value}
				disabled={disabled}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => setOpen(suggestions.length > 0)}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				className={className}
				autoComplete="off"
				role="combobox"
				aria-expanded={open}
				aria-autocomplete="list"
				aria-controls={listboxId}
			/>
			{dropdown}
		</div>
	)
}

