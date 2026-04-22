import { config } from "./config.js";
import type { FutureInfo } from "./types.js";

interface FuturesInfoResponse {
  success: boolean;
  timestamp?: number;
  data: {
    rows: FutureInfo[];
  };
}

interface SingleFutureInfoResponse {
  success: boolean;
  timestamp?: number;
  data: FutureInfo;
}

async function publicFetch<T>(path: string): Promise<T> {
  const url = `${config.baseUrl}${path}`;
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Orderly API error ${response.status}: ${JSON.stringify(data)}`
    );
  }
  return data as T;
}

export async function getAllMarkets(): Promise<FuturesInfoResponse> {
  return publicFetch<FuturesInfoResponse>("/v1/public/futures");
}

export async function getMarket(symbol: string): Promise<SingleFutureInfoResponse> {
  return publicFetch<SingleFutureInfoResponse>(
    `/v1/public/futures/${encodeURIComponent(symbol)}`
  );
}
