import { config } from "./config.js";

export function printNetworkBanner(): void {
  const badge = config.isMainnet ? "[MAINNET]" : "[TESTNET]";
  console.log(`${badge} Network: ${config.network} | Chain ID: ${config.chainId} | Broker: ${config.brokerId}`);
}

export async function confirmMainnet(action: string): Promise<void> {
  if (!config.isMainnet) return;

  if (process.env.SKIP_MAINNET_CONFIRM === "true") {
    console.log(`[MAINNET] Skipping confirmation for: ${action}`);
    return;
  }

  console.log(`\n  !!! MAINNET ACTION !!!  `);
  console.log(`  About to: ${action}`);
  console.log(`  This uses real funds on Arbitrum One.`);
  console.log(`  Waiting 5 seconds... Press Ctrl+C to cancel.\n`);

  await new Promise((resolve) => setTimeout(resolve, 5000));
}
