import "dotenv/config";

type Network = "testnet" | "mainnet";

const network = (process.env.NETWORK ?? "testnet") as Network;

if (network !== "testnet" && network !== "mainnet") {
  throw new Error(`Invalid NETWORK: ${network}. Must be "testnet" or "mainnet"`);
}

// ========== Network-specific constants ==========

interface NetworkConfig {
  baseUrl: string;
  operatorUrl: string;
  rpcUrl: string;
  chainId: number;
  verifyingContract: string;
  ledgerContract: string;
  usdcAddress: string;
  vaultAddress: string;
  explorerUrl: string;
}

const TESTNET: NetworkConfig = {
  baseUrl: "https://testnet-api.orderly.org",
  operatorUrl: "https://testnet-operator-evm.orderly.org",
  rpcUrl: "https://arbitrum-sepolia.publicnode.com",
  chainId: 421614,
  verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
  // Orderly L2 Ledger contract used as EIP-712 verifyingContract for withdraw messages.
  // Source: https://orderly.network/docs/build-on-omnichain/addresses
  ledgerContract: "0x1826B75e2ef249173FC735149AE4B8e9ea10abff",
  usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  vaultAddress: "0x0EaC556c0C2321BA25b9DC01e4e3c95aD5CDCd2f",
  explorerUrl: "https://sepolia.arbiscan.io",
};

const MAINNET: NetworkConfig = {
  baseUrl: "https://api.orderly.org",
  operatorUrl: "https://operator-evm.orderly.org",
  rpcUrl: process.env.RPC_URL ?? "https://arb1.arbitrum.io/rpc",
  chainId: 42161,
  verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
  ledgerContract: "0x6F7a338F2aA472838dEFD3283eB360d4Dff5D203",
  usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  vaultAddress: "0x816f722424b49Cf1275cc86DA9840Fbd5a6167e9",
  explorerUrl: "https://arbiscan.io",
};

const NETWORKS: Record<Network, NetworkConfig> = {
  testnet: TESTNET,
  mainnet: MAINNET,
};

const current = NETWORKS[network];

export const config = {
  network,
  isTestnet: network === "testnet",
  isMainnet: network === "mainnet",

  walletPrivateKey: () => {
    const key = process.env.WALLET_PRIVATE_KEY;
    if (!key) throw new Error("WALLET_PRIVATE_KEY not set in .env");
    return key;
  },

  orderlySecret: () => {
    const key = process.env.ORDERLY_SECRET;
    if (!key) throw new Error("ORDERLY_SECRET not set in .env. Run: npm run register-key");
    return key;
  },

  orderlyAccountId: () => {
    const id = process.env.ORDERLY_ACCOUNT_ID;
    if (!id) throw new Error("ORDERLY_ACCOUNT_ID not set in .env. Run: npm run register-key");
    return id;
  },

  brokerId: process.env.BROKER_ID ?? "woofi_pro",

  baseUrl: current.baseUrl,
  operatorUrl: current.operatorUrl,
  rpcUrl: current.rpcUrl,
  chainId: current.chainId,
  verifyingContract: current.verifyingContract,
  ledgerContract: current.ledgerContract,
  usdcAddress: current.usdcAddress,
  vaultAddress: current.vaultAddress,
  explorerUrl: current.explorerUrl,
} as const;
