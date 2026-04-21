import "dotenv/config";
import { config } from "../src/config.js";
import { claimFaucetUsdc } from "../src/deposit.js";
import { Wallet } from "ethers";

async function main() {
  const wallet = new Wallet(config.walletPrivateKey());
  console.log(`Requesting testnet USDC for ${wallet.address}...`);
  await claimFaucetUsdc(wallet.address);
}

main().catch(console.error);
