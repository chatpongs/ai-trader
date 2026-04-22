export type OrderSide = "BUY" | "SELL";

export type OrderType = "LIMIT" | "MARKET";

export type AlgoType =
  | "STOP"
  | "TP_SL"
  | "POSITIONAL_TP_SL"
  | "BRACKET"
  | "TRAILING_STOP"
  | "TAKE_PROFIT"
  | "STOP_LOSS";

export type TriggerPriceType = "MARK_PRICE";

export interface AlgoOrderRequest {
  symbol: string;
  algo_type: AlgoType;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  trigger_price: number;
  trigger_price_type?: TriggerPriceType;
  price?: number;
  reduce_only?: boolean;
  client_order_id?: string;
}

export interface OrderRequest {
  symbol: string;
  order_type: OrderType;
  order_quantity: number;
  side: OrderSide;
  order_price?: number;
  reduce_only?: boolean;
}

export interface Order {
  order_id: number;
  symbol: string;
  side: OrderSide;
  order_type: OrderType;
  order_quantity: number;
  order_price?: number;
  remaining_quantity: number;
  status: string;
  created_at: number;
  updated_at: number;
  client_order_id?: string;
  reduce_only: boolean;
}

export interface Position {
  symbol: string;
  side: OrderSide;
  quantity: number;
  avg_entry_price: number;
  realized_pnl: number;
  unrealized_pnl: number;
  leverage: number;
  liquidation_price: number;
  margin: number;
}

export interface AccountInfo {
  account_id: string;
  total_equity: number;
  total_margin: number;
  free_margin: number;
  available_balance: number;
  cumulative_pnl: number;
  total_initial_margin: number;
  total_maintenance_margin: number;
}

export interface Holding {
  token: string;
  holding: number;
  average_entry_price: number;
  locked: number;
  pending_withdraw: number;
  total_holding: number;
  total_locked: number;
  usd_value: number;
}

export interface RegisterKeyMessage {
  brokerId: string;
  chainId: number;
  orderlyKey: string;
  scope: string;
  timestamp: number;
  expiration: number;
}

export interface RegisterKeyResponse {
  success: boolean;
  message: string;
}

export interface OrderlyKey {
  orderly_key: string;
  scope: string;
  expiration: number;
  created_at: number;
  is_active: boolean;
}

export interface FutureInfo {
  symbol: string;
  index_price: number;
  mark_price: number;
  sum_unitary_funding: number;
  est_funding_rate: number;
  last_funding_rate: number;
  next_funding_time: number;
  open_interest: number;
  "24h_open": number;
  "24h_close": number;
  "24h_high": number;
  "24h_low": number;
  "24h_amount": number;
  "24h_volume": number;
}
