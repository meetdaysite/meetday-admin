import axios from "axios"
import { apiClient } from "./client"

// ─── Types ────────────────────────────────────────────────────────────────────

type ImageContentType = "image/jpeg" | "image/png" | "image/webp"

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
