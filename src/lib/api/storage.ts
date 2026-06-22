import axios from "axios"
import { apiClient } from "./client"

interface PresignRequest {
	// TODO: change context to "COMMUNITY_MEDIA" when backend adds support
	context: "EVENT_MEDIA"
	contentType: "image/jpeg" | "image/png" | "image/webp"
	mediaType: "COVER" | "ICON"
	resourceId?: string
}

interface PresignResponse {
	url: string
	key: string
}

async function getPresignedUploadUrl(payload: PresignRequest): Promise<PresignResponse> {
	const { data } = await apiClient.post<PresignResponse>("/storage/upload-url", payload)
	return data
}

async function uploadFileToS3(presignedUrl: string, file: File): Promise<void> {
	await axios.put(presignedUrl, file, {
		headers: { "Content-Type": file.type },
	})
}

export async function uploadCommunityImage(
	file: File,
	mediaType: "COVER" | "ICON",
): Promise<string> {
	const contentType = file.type as "image/jpeg" | "image/png" | "image/webp"
	const { url, key } = await getPresignedUploadUrl({
		context: "EVENT_MEDIA",
		contentType,
		mediaType,
	})
	await uploadFileToS3(url, file)
	return key
}
