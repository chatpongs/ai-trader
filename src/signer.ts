import { getPublicKeyAsync, signAsync } from "@noble/ed25519";
import { encodeBase58 } from "ethers";

export async function createSignature(
  privateKey: Uint8Array,
  method: string,
  path: string,
  body?: string,
  query?: string
): Promise<{ timestamp: number; orderlyKey: string; orderlySignature: string }> {
  const timestamp = Date.now();
  const encoder = new TextEncoder();

  let message = `${timestamp}${method.toUpperCase()}${path}`;
  if (query) message += `?${query}`;
  if (body) message += body;

  const orderlySignature = await signAsync(encoder.encode(message), privateKey);
  const publicKey = await getPublicKeyAsync(privateKey);

  return {
    timestamp,
    orderlyKey: `ed25519:${encodeBase58(publicKey)}`,
    orderlySignature: Buffer.from(orderlySignature).toString("base64url"),
  };
}

export async function decodePrivateKey(keyString: string): Promise<Uint8Array> {
  if (keyString.startsWith("0x")) {
    const hex = keyString.slice(2);
    if (hex.length === 64) return Uint8Array.from(Buffer.from(hex, "hex"));
    throw new Error("Invalid hex private key length (expected 32 bytes)");
  }
  throw new Error("ORDERLY_SECRET must be a hex string starting with 0x");
}
