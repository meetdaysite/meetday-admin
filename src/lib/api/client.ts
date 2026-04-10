import axios from "axios"

export const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
	timeout: 10_000,
	headers: {
		"Content-Type": "application/json",
	},
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
