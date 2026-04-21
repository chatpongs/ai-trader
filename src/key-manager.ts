import { randomBytes } from "crypto";
import { getPublicKeyAsync } from "@noble/ed25519";
import { encodeBase58, Wallet, AbiCoder, keccak256, solidityPackedKeccak256 } from "ethers";
import { config } from "./config.js";

const EIP712_DOMAIN = {
  name: "Orderly",
  version: "1",
  chainId: 0,
  verifyingContract: config.verifyingContract as `0x${string}`,
};

const ADD_ORDERLY_KEY_TYPES = {
  AddOrderlyKey: [
    { name: "brokerId", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "orderlyKey", type: "string" },
    { name: "scope", type: "string" },
    { name: "timestamp", type: "uint64" },
    { name: "expiration", type: "uint64" },
  ],
};

const REGISTRATION_TYPES = {
  Registration: [
    { name: "brokerId", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "timestamp", type: "uint64" },
    { name: "registrationNonce", type: "uint256" },
  ],
};

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export async function generateEd25519KeyPair(): Promise<KeyPair> {
  const privateKeyBytes = randomBytes(32);
  const publicKeyBytes = await getPublicKeyAsync(privateKeyBytes);

  return {
    privateKey: `0x${Buffer.from(privateKeyBytes).toString("hex")}`,
    publicKey: `ed25519:${encodeBase58(publicKeyBytes)}`,
  };
}

export function deriveAccountId(walletAddress: string): string {
  const coder = AbiCoder.defaultAbiCoder();

  return keccak256(
    coder.encode(
      ["address", "bytes32"],
      [walletAddress, solidityPackedKeccak256(["string"], [config.brokerId])]
    )
  );
}

export async function getRegistrationNonce(): Promise<string> {
  const res = await fetch(`${config.baseUrl}/v1/registration_nonce`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(`Failed to get registration nonce: ${JSON.stringify(data)}`);
  }

  return data.data.registration_nonce as string;
}

export async function registerAccount(): Promise<string> {
  const wallet = new Wallet(config.walletPrivateKey());
  const registrationNonce = await getRegistrationNonce();

  const message = {
    brokerId: config.brokerId,
    chainId: config.chainId,
    timestamp: Date.now(),
    registrationNonce,
  };

  const signature = await wallet.signTypedData(
    { ...EIP712_DOMAIN, chainId: config.chainId },
    REGISTRATION_TYPES,
    message
  );

  const response = await fetch(`${config.baseUrl}/v1/register_account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      signature,
      userAddress: wallet.address,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(`Failed to register account: ${JSON.stringify(data)}`);
  }

  console.log("Account registered successfully:", JSON.stringify(data, null, 2));
  return data.data.account_id as string;
}

export async function registerOrderlyKey(keyPair: KeyPair): Promise<void> {
  const wallet = new Wallet(config.walletPrivateKey());
  const timestamp = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  const message = {
    brokerId: config.brokerId,
    chainId: config.chainId,
    orderlyKey: keyPair.publicKey,
    scope: "read,trading",
    timestamp,
    expiration: timestamp + oneYear,
  };

  const signature = await wallet.signTypedData(
    { ...EIP712_DOMAIN, chainId: config.chainId },
    ADD_ORDERLY_KEY_TYPES,
    message
  );

  const response = await fetch(`${config.baseUrl}/v1/orderly_key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      signature,
      userAddress: wallet.address,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(`Failed to register orderly key: ${JSON.stringify(data)}`);
  }

  console.log("Orderly key registered successfully:", JSON.stringify(data, null, 2));
}
