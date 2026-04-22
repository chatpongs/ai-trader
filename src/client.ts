import { config } from "./config.js";
import { createSignature, decodePrivateKey } from "./signer.js";

let cachedPrivateKey: Uint8Array | null = null;

async function getPrivateKey(): Promise<Uint8Array> {
  if (!cachedPrivateKey) {
    cachedPrivateKey = await decodePrivateKey(config.orderlySecret());
  }
  return cachedPrivateKey;
}

export async function orderlyFetch<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = new URL(`${config.baseUrl}${path}`);
  const privateKey = await getPrivateKey();
  const accountId = config.orderlyAccountId();

  const bodyStr = body ? JSON.stringify(body) : undefined;
  const queryString = url.search.slice(1) || undefined;

  const { timestamp, orderlyKey, orderlySignature } = await createSignature(
    privateKey,
    method,
    url.pathname,
    bodyStr,
    queryString
  );

  const headers: Record<string, string> = {
    "orderly-timestamp": String(timestamp),
    "orderly-account-id": accountId,
    "orderly-key": orderlyKey,
    "orderly-signature": orderlySignature,
  };

  if (method === "GET" || method === "DELETE") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: method !== "GET" && method !== "DELETE" ? bodyStr : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Orderly API error ${response.status}: ${JSON.stringify(data)}`
    );
  }

  // Orderly often returns HTTP 200 with `success: false` and an error `code`/`message`
  // for business-logic failures (e.g. invalid signature, bad nonce). Surface those
  // as thrown errors so callers don't silently read `undefined` fields.
  if (data && typeof data === "object" && (data as { success?: boolean }).success === false) {
    throw new Error(`Orderly API error: ${JSON.stringify(data)}`);
  }

  return data as T;
}
