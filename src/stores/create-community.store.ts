import { create } from "zustand"
import type {
	CommunityType,
	CommunityFeedPosting,
	CommunityChatPermission,
	CommunityDmPolicy,
	CommunityPhotoSharing,
	AssignableCommunityRole,
	Interest,
} from "@/types"
import type { Event } from "@/types"

// ─── Snapshot types ───────────────────────────────────────────────────────────

export type Step1Data = {
	name: string
	slug: string
	description: string
	type: CommunityType
	categoryId: string
	categoryName: string
	primaryCity: string
	interestTags: string[]
	coverImageKey: string
	iconKey: string
	coverImageUrl: string | null
	iconUrl: string | null
}

export type Step2Snapshot = {
	chatEnabled: boolean
	feedEnabled: boolean
	announcementsEnabled: boolean
	memberDirectoryEnabled: boolean
	experiencesTabEnabled: boolean
	feedPosting: CommunityFeedPosting
	chat: CommunityChatPermission
	spamDetection: boolean
	toxicContentDetection: boolean
	linkFiltering: boolean
	duplicateContentDetection: boolean
	reportThreshold: number
	dmPolicy: CommunityDmPolicy
	photoSharing: CommunityPhotoSharing
}

export type Step3Snapshot = {
	interests: Interest[]
	primaryCity: string
	cities: string[]
	manualEvents: Pick<Event, "id" | "title" | "eventDate" | "city">[]
}

export type AssignedMember = {
	userId: string
	name: string
	email: string
	role: AssignableCommunityRole
	avatarInitial: string
	avatarColor: string
}

export type Step4Snapshot = {
	managers: AssignedMember[]
	hosts: AssignedMember[]
	moderators: AssignedMember[]
}

// ─── Preview (live updates from Step 1 form) ─────────────────────────────────

export type CommunityPreview = {
	name: string
	slug: string
	description: string
	type: CommunityType | null
	categoryName: string | null
	primaryCity: string | null
	interestTags: string[]
	coverImageUrl: string | null
	iconUrl: string | null
}

// ─── Store ────────────────────────────────────────────────────────────────────

type CreateCommunityState = {
	communityId: string | null
	currentStep: number // 1–5; 6 = success screen

	preview: CommunityPreview
	step1Data: Step1Data | null
	step2Snapshot: Step2Snapshot | null
	step3Snapshot: Step3Snapshot | null
	step4Snapshot: Step4Snapshot | null

	setCommunityId: (id: string) => void
	updatePreview: (partial: Partial<CommunityPreview>) => void
	setStep1Data: (data: Step1Data) => void
	setStep2Snapshot: (data: Step2Snapshot) => void
	setStep3Snapshot: (data: Step3Snapshot) => void
	setStep4Snapshot: (data: Step4Snapshot) => void
	goToStep: (n: number) => void
	nextStep: () => void
	prevStep: () => void
	reset: () => void
}

const EMPTY_PREVIEW: CommunityPreview = {
	name: "",
	slug: "",
	description: "",
	type: null,
	categoryName: null,
	primaryCity: null,
	interestTags: [],
	coverImageUrl: null,
	iconUrl: null,
}

export const useCreateCommunityStore = create<CreateCommunityState>((set) => ({
	communityId: null,
	currentStep: 1,
	preview: EMPTY_PREVIEW,
	step1Data: null,
	step2Snapshot: null,
	step3Snapshot: null,
	step4Snapshot: null,

	setCommunityId: (id) => set({ communityId: id }),

	updatePreview: (partial) =>
		set((s) => ({ preview: { ...s.preview, ...partial } })),

	setStep1Data: (data) => set({ step1Data: data }),
	setStep2Snapshot: (data) => set({ step2Snapshot: data }),
	setStep3Snapshot: (data) => set({ step3Snapshot: data }),
	setStep4Snapshot: (data) => set({ step4Snapshot: data }),

	goToStep: (n) => set({ currentStep: n }),
	nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
	prevStep: () => set((s) => ({ currentStep: Math.max(1, s.currentStep - 1) })),

	reset: () =>
		set({
			communityId: null,
			currentStep: 1,
			preview: EMPTY_PREVIEW,
			step1Data: null,
			step2Snapshot: null,
			step3Snapshot: null,
			step4Snapshot: null,
		}),
}))
