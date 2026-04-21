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

export async function getOrders(symbol?: string): Promise<OrdersResponse> {
  const path = symbol
    ? `/v1/orders?symbol=${symbol}`
    : "/v1/orders";
  return orderlyFetch<OrdersResponse>("GET", path);
}

export async function cancelOrder(orderId: number): Promise<CancelResponse> {
  return orderlyFetch<CancelResponse>("DELETE", `/v1/order/${orderId}`);
}
