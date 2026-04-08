import axios from "axios"

export const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
	timeout: 10_000,
	headers: {
		"Content-Type": "application/json",
	},
})

export function setAuthToken(token: string | null) {
	if (token) {
		apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`
	} else {
		delete apiClient.defaults.headers.common["Authorization"]
	}
}
