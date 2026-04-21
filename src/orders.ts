import { orderlyFetch } from "./client.js";
import type { Order, OrderRequest } from "./types.js";

interface OrderResponse {
  success: boolean;
  data: {
    order_id: number;
    status: string;
  };
}

interface OrdersResponse {
  success: boolean;
  data: {
    rows: Order[];
    meta: { total: number; page: number; per_page: number };
  };
}

interface CancelResponse {
  success: boolean;
  data: {
    order_id: number;
    status: string;
  };
}

export async function placeOrder(order: OrderRequest): Promise<OrderResponse> {
  return orderlyFetch<OrderResponse>("POST", "/v1/order", order);
}

export async function getOrders(options?: {
  symbol?: string;
  status?: string;
}): Promise<OrdersResponse> {
  const params = new URLSearchParams();
  if (options?.symbol) params.set("symbol", options.symbol);
  if (options?.status) params.set("status", options.status);
  const qs = params.toString();
  const path = qs ? `/v1/orders?${qs}` : "/v1/orders";
  return orderlyFetch<OrdersResponse>("GET", path);
}

export async function getOrder(orderId: number): Promise<{ success: boolean; data: Order }> {
  return orderlyFetch<{ success: boolean; data: Order }>("GET", `/v1/order/${orderId}`);
}

export async function cancelOrder(orderId: number): Promise<CancelResponse> {
  return orderlyFetch<CancelResponse>("DELETE", `/v1/order/${orderId}`);
}
