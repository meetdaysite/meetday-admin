"use client"

import PageHeader from "@/components/ui/PageHeader"
import { useCreateCommunityStore } from "@/stores/create-community.store"
import { CommunityPreviewPanel } from "./community-preview-panel"
import { StepIndicator } from "./step-indicator"
import { Step1BasicDetails } from "./steps/step1-basic-details"
import { Step2CommunityRules } from "./steps/step2-community-rules"
import { Step3ExperienceMapping } from "./steps/step3-experience-mapping"
import { Step4Managers } from "./steps/step4-managers"
import { Step5ReviewPublish } from "./steps/step5-review-publish"
import { SuccessScreen } from "./success-screen"

const STEP_SUBTITLES: Record<number, string> = {
	1: "Create a new Meetday-managed community.",
	2: "Define rules, access and interaction settings for your community.",
	3: "Map interests, cities and events so the right experiences automatically connect to this community.",
	4: "Add managers, hosts and moderators and set their permissions.",
	5: "Review all details and publish your community.",
}

export function CreateCommunityWizard() {
	const { currentStep } = useCreateCommunityStore()

	if (currentStep === 6) {
		return <SuccessScreen />
	}

	return (
		<div className="flex min-h-full flex-col">
			{/* Page header */}
			<PageHeader title="Create Community" description={STEP_SUBTITLES[currentStep]} />

			{/* Step indicator */}
			<div className="pb-4">
				<StepIndicator />
			</div>

			{/* Body */}
			<div className="flex flex-1 gap-6">
				{/* Form area */}
				<div className="flex-1 min-w-0">
					{currentStep === 1 && <Step1BasicDetails />}
					{currentStep === 2 && <Step2CommunityRules />}
					{currentStep === 3 && <Step3ExperienceMapping />}
					{currentStep === 4 && <Step4Managers />}
					{currentStep === 5 && <Step5ReviewPublish />}
				</div>

				{/* Preview panel — hidden on Review & Publish since it has its own layout */}
				{currentStep < 5 && (
					<div className="w-72 shrink-0 hidden lg:block">
						<CommunityPreviewPanel />
					</div>
				)}
			</div>
		</div>
	)
}
