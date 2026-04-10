import axios from "axios"
import { firebaseAuth } from "@/lib/firebase/config"

export const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
	timeout: 10_000,
	headers: {
		"Content-Type": "application/json",
	},
})

// Attach a fresh Firebase ID token before every request.
// Firebase SDK caches the token and silently refreshes it ~5 min before expiry,
// so getIdToken() is cheap on the hot path.
apiClient.interceptors.request.use(async (config) => {
	const user = firebaseAuth.currentUser
	if (user) {
		const token = await user.getIdToken()
		config.headers["Authorization"] = `Bearer ${token}`
	}
	return config
})

// Unwrap the success envelope so callers get T directly from response.data
// instead of { success, timestamp, data: T }
apiClient.interceptors.response.use(
	(response) => {
		const body = response.data
		if (body && typeof body === "object" && "success" in body && "data" in body) {
			response.data = body.data
		}
		return response
	},
	(error) => Promise.reject(error),
)

export function setAuthToken(token: string | null) {
	if (token) {
		apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`
	} else {
		delete apiClient.defaults.headers.common["Authorization"]
	}
}
