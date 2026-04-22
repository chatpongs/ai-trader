import "dotenv/config";
import { Wallet } from "ethers";
import { config } from "../src/config.js";
import { withdrawUsdc } from "../src/withdraw.js";
import { printNetworkBanner, confirmMainnet } from "../src/banner.js";

function parseFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : undefined;
}

async function main() {
  printNetworkBanner();

  const args = process.argv.slice(2);
  const amountStr = parseFlag(args, "--amount");
  const receiver = parseFlag(args, "--receiver");
  const token = parseFlag(args, "--token") ?? "USDC";
  const allowCrossChainWithdraw = args.includes("--cross-chain");

  const amount = amountStr ? parseFloat(amountStr) : NaN;

  if (!amountStr || isNaN(amount) || amount <= 0) {
    console.error(
      "Usage: npm run withdraw -- --amount <usdc_amount> [--receiver <address>] [--token USDC] [--cross-chain]"
    );
    process.exit(1);
  }

  const wallet = new Wallet(config.walletPrivateKey());
  const destination = receiver ?? wallet.address;

  console.log(`Wallet: ${wallet.address}`);
  console.log(`Destination: ${destination}`);

  await confirmMainnet(`withdraw ${amount} ${token} from Orderly to ${destination}`);

  console.log(`Withdrawing ${amount} ${token} on ${config.network}...`);
  await withdrawUsdc({ amount, token, receiver, allowCrossChainWithdraw });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
