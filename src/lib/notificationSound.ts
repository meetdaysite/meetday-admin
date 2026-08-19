// Short, distinct "message arrived" chime synthesized via Web Audio API — no audio asset needed,
// avoids licensing concerns, and keeps the bundle small. Two quick ascending tones (not a copy
// of WhatsApp's pop sound). Mirrors frontend/src/lib/notificationSound.ts.

let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null
	const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
	if (!AudioContextCtor) return null
	if (!sharedAudioContext) sharedAudioContext = new AudioContextCtor()
	return sharedAudioContext
}

function resumeContext() {
	getAudioContext()?.resume().catch(() => {})
}

if (typeof window !== "undefined") {
	// Any interaction anywhere in the admin panel unlocks audio for the rest of the session.
	;(["pointerdown", "keydown", "click", "touchstart"] as const).forEach(evt =>
		window.addEventListener(evt, resumeContext, { once: true, passive: true }),
	)
}

function playTone(ctx: AudioContext, startTime: number, freq: number, duration: number) {
	const oscillator = ctx.createOscillator()
	const gain = ctx.createGain()
	oscillator.type = "sine"
	oscillator.frequency.setValueAtTime(freq, startTime)
	gain.gain.setValueAtTime(0, startTime)
	gain.gain.linearRampToValueAtTime(0.18, startTime + 0.015)
	gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
	oscillator.connect(gain)
	gain.connect(ctx.destination)
	oscillator.start(startTime)
	oscillator.stop(startTime + duration)
}

/** Plays a short two-tone "new message" chime. Silently no-ops if audio isn't available/allowed yet. */
export function playMessageChime() {
	const ctx = getAudioContext()
	if (!ctx) return
	try {
		if (ctx.state === "suspended") void ctx.resume()
		const now = ctx.currentTime
		playTone(ctx, now, 880, 0.12)
		playTone(ctx, now + 0.1, 1318.5, 0.16)
	} catch {
		// Autoplay blocked (no interaction yet this session) — silently skip.
	}
}
