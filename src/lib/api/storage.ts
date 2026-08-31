import axios from "axios"
import { apiClient } from "./client"

// ─── Types ────────────────────────────────────────────────────────────────────

type ImageContentType = "image/jpeg" | "image/png" | "image/webp"
type PitchDocContentType =
	| "application/pdf"
	| "application/msword"
	| "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	| "application/vnd.ms-powerpoint"
	| "application/vnd.openxmlformats-officedocument.presentationml.presentation"

type PresignRequest =
	| { context: "EVENT_MEDIA";           contentType: ImageContentType | "video/mp4"; mediaType: "COVER" | "GALLERY" | "VIDEO"; resourceId?: string }
	| { context: "USER_AVATAR";           contentType: ImageContentType }
	| { context: "HOST_DOCUMENT";         contentType: ImageContentType | "application/pdf" }
	| { context: "INTEREST_IMAGE";        contentType: ImageContentType; resourceId: string }
	| { context: "REVIEW_PHOTO";          contentType: ImageContentType }
	| { context: "COMMUNITY_COVER";       contentType: ImageContentType; resourceId?: string }
	| { context: "COMMUNITY_ICON";        contentType: ImageContentType; resourceId?: string }
	| { context: "COMMUNITY_ANNOUNCEMENT"; contentType: ImageContentType; resourceId: string }
	| { context: "COMMUNITY_DM_MEDIA";    contentType: ImageContentType; resourceId: string }
	| { context: "COMMUNITY_FEED_MEDIA";  contentType: ImageContentType | "video/mp4"; resourceId: string }
	| { context: "SPONSORSHIP_MEDIA";     contentType: ImageContentType }
	| { context: "SPONSORSHIP_DOCUMENT";  contentType: PitchDocContentType }
	| { context: "SPONSORSHIP_CHAT_MEDIA"; contentType: ImageContentType | "application/pdf"; resourceId: string }
	| { context: "MEETDAY_CHAT_MEDIA";     contentType: ImageContentType; resourceId?: string }
	| { context: "COMMUNITY_PAST_EVENT_MEDIA"; contentType: ImageContentType; resourceId: string }
	| { context: "COMMUNITY_BRAND_LOGO_MEDIA"; contentType: ImageContentType }

interface PresignResponse {
	uploadUrl: string
	key: string
}

// ─── Internals ────────────────────────────────────────────────────────────────

async function getPresignedUploadUrl(payload: PresignRequest): Promise<PresignResponse> {
	const { data } = await apiClient.post<PresignResponse>("/storage/upload-url", payload)
	return data
}

async function uploadToStorage(presignedUrl: string, file: File): Promise<void> {
	await axios.put(presignedUrl, file, {
		headers: { "Content-Type": file.type },
	})
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export async function uploadCommunityImage(
	file: File,
	mediaType: "COVER" | "ICON",
	communityId?: string,
): Promise<string> {
	const context = mediaType === "COVER" ? "COMMUNITY_COVER" : "COMMUNITY_ICON"
	const { uploadUrl, key } = await getPresignedUploadUrl({
		context,
		contentType: file.type as ImageContentType,
		...(communityId && { resourceId: communityId }),
	})
	await uploadToStorage(uploadUrl, file)
	return key
}

export async function uploadInterestImage(file: File, interestId: string): Promise<string> {
	const { uploadUrl, key } = await getPresignedUploadUrl({
		context: "INTEREST_IMAGE",
		contentType: file.type as ImageContentType,
		resourceId: interestId,
	})
	await uploadToStorage(uploadUrl, file)
	return key
}

export async function uploadUserAvatar(file: File): Promise<string> {
	const { uploadUrl, key } = await getPresignedUploadUrl({
		context: "USER_AVATAR",
		contentType: file.type as ImageContentType,
	})
	await uploadToStorage(uploadUrl, file)
	return key
}

export async function uploadAnnouncementCoverImage(
	communityId: string,
	file: File,
): Promise<string> {
	const { uploadUrl, key } = await getPresignedUploadUrl({
		context: "COMMUNITY_ANNOUNCEMENT",
		contentType: file.type as ImageContentType,
		resourceId: communityId,
	})
	await uploadToStorage(uploadUrl, file)
	return key
}

export async function uploadFeedMedia(
	communityId: string,
	file: File,
): Promise<string> {
	const { uploadUrl, key } = await getPresignedUploadUrl({
		context: "COMMUNITY_FEED_MEDIA",
		contentType: file.type as ImageContentType | "video/mp4",
		resourceId: communityId,
	})
	await uploadToStorage(uploadUrl, file)
	return key
}

export async function uploadSponsorshipImage(file: File): Promise<string> {
	const { uploadUrl, key } = await getPresignedUploadUrl({
		context: "SPONSORSHIP_MEDIA",
		contentType: file.type as ImageContentType,
	})
	await uploadToStorage(uploadUrl, file)
	return key
}

// Host community profile logos share the SPONSORSHIP_MEDIA upload context (see ActivateCommunityDto).
export async function uploadCommunityProfileLogo(file: File): Promise<string> {
	const { uploadUrl, key } = await getPresignedUploadUrl({
		context: "SPONSORSHIP_MEDIA",
		contentType: file.type as ImageContentType,
	})
	await uploadToStorage(uploadUrl, file)
	return key
}

// resourceId is the target host's hostProfileId — admins upload "on behalf of" a host here.
export async function uploadCommunityPastEventImage(file: File, hostProfileId: string): Promise<string> {
	const { uploadUrl, key } = await getPresignedUploadUrl({
		context: "COMMUNITY_PAST_EVENT_MEDIA",
		contentType: file.type as ImageContentType,
		resourceId: hostProfileId,
	})
	await uploadToStorage(uploadUrl, file)
	return key
}

export async function uploadSponsorshipDocument(file: File): Promise<string> {
	const { uploadUrl, key } = await getPresignedUploadUrl({
		context: "SPONSORSHIP_DOCUMENT",
		contentType: file.type as PitchDocContentType,
	})
	await uploadToStorage(uploadUrl, file)
	return key
}

export async function uploadSponsorshipChatImage(file: File, interestId: string): Promise<string> {
	const { uploadUrl, key } = await getPresignedUploadUrl({
		context: "SPONSORSHIP_CHAT_MEDIA",
		contentType: file.type as ImageContentType | "application/pdf",
		resourceId: interestId,
	})
	await uploadToStorage(uploadUrl, file)
	return key
}

export async function uploadMeetdayChatImage(file: File, threadUserId: string): Promise<string> {
	const { uploadUrl, key } = await getPresignedUploadUrl({
		context: "MEETDAY_CHAT_MEDIA",
		contentType: file.type as ImageContentType,
		resourceId: threadUserId,
	})
	await uploadToStorage(uploadUrl, file)
	return key
}

export async function uploadCommunityBrandLogo(file: File): Promise<string> {
	const { uploadUrl, key } = await getPresignedUploadUrl({
		context: "COMMUNITY_BRAND_LOGO_MEDIA",
		contentType: file.type as ImageContentType,
	})
	await uploadToStorage(uploadUrl, file)
	return key
}
