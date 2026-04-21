import "dotenv/config";

export const config = {
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

  network: process.env.NETWORK ?? "testnet",

  get baseUrl() {
    return this.network === "mainnet"
      ? "https://api.orderly.org"
      : "https://testnet-api.orderly.org";
  },

  get rpcUrl() {
    return this.network === "mainnet"
      ? "https://arb1.arbitrum.io/rpc"
      : "https://arbitrum-sepolia.publicnode.com";
  },

  get chainId() {
    return this.network === "mainnet" ? 42161 : 421614;
  },

  brokerId: process.env.BROKER_ID ?? "woofi_pro",

  get verifyingContract() {
    return this.network === "mainnet"
      ? "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
      : "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC";
  },

  get usdcAddress() {
    return this.network === "mainnet"
      ? "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
      : "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
  },

  get vaultAddress() {
    return this.network === "mainnet"
      ? "0x7924a8725D1A2E3e4bC1a23BD5B24034e6E3D016"
      : "0x0EaC556c0C2321BA25b9DC01e4e3c95aD5CDCd2f";
  },
} as const;
