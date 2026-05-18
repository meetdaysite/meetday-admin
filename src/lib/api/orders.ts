import { apiClient } from "./client"
import type { Order, OrderDetail, OrderStatus } from "@/types"

export type GetOrdersParams = {
	eventId?: string
	userId?: string
	hostProfileId?: string
	status?: OrderStatus
	bookingId?: string
	from?: string
	to?: string
	page?: number
	limit?: number
}

export type OrdersListResponse = {
	orders: Order[]
	total: number
	page: number
	limit: number
}

export async function getOrders(params?: GetOrdersParams): Promise<OrdersListResponse> {
	const { data } = await apiClient.get<OrdersListResponse>("/admin/orders", { params })
	return data
}

export async function getOrderById(id: string): Promise<OrderDetail> {
	const { data } = await apiClient.get<OrderDetail>(`/admin/orders/${id}`)
	return data
}
