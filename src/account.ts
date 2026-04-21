import { orderlyFetch } from "./client.js";
import type { AccountInfo, Holding } from "./types.js";

interface AccountInfoResponse {
  success: boolean;
  data: {
    account_id: string;
    total_collateral: number;
    total_free_collateral: number;
    total_margin_ratio: number;
    total_initial_margin: number;
    total_maintenance_margin: number;
    available_balance: number;
    cumulative_pnl: number;
  };
}

interface HoldingsResponse {
  success: boolean;
  data: Holding[];
}

export async function getAccountInfo(): Promise<AccountInfoResponse> {
  return orderlyFetch<AccountInfoResponse>("GET", "/v1/client/info");
}

export async function getHoldings(): Promise<HoldingsResponse> {
  return orderlyFetch<HoldingsResponse>("GET", "/v1/client/holdings");
}
