import { CreateCommunityWizard } from "@/components/communities/create/create-community-wizard"

export const metadata = {
	title: "Create Community — Meetday Admin",
}

export default function CreateCommunityPage() {
	return (
		<div className="p-6">
			<CreateCommunityWizard />
		</div>
	)
}
