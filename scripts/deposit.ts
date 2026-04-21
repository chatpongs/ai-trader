import "dotenv/config";
import { JsonRpcProvider, Wallet, formatEther } from "ethers";
import { config } from "../src/config.js";
import { depositUsdc } from "../src/deposit.js";
import { printNetworkBanner, confirmMainnet } from "../src/banner.js";

async function main() {
  printNetworkBanner();

  const args = process.argv.slice(2);
  const amountIdx = args.indexOf("--amount");
  const amount = amountIdx !== -1 ? parseFloat(args[amountIdx + 1]) : 10;

  if (isNaN(amount) || amount <= 0) {
    console.error("Usage: npm run deposit -- --amount <usdc_amount>");
    process.exit(1);
  }

  const provider = new JsonRpcProvider(config.rpcUrl);
  const wallet = new Wallet(config.walletPrivateKey(), provider);

  const ethBalance = await provider.getBalance(wallet.address);
  console.log(`Wallet: ${wallet.address}`);
  console.log(`ETH balance: ${formatEther(ethBalance)} ETH`);

  if (ethBalance === 0n) {
    console.error("\nNo ETH for gas!");
    if (config.isTestnet) {
      console.error("Get testnet ETH from:");
      console.error("  https://faucet.quicknode.com/arbitrum/sepolia");
      console.error("  https://www.alchemy.com/faucets/arbitrum-sepolia\n");
    } else {
      console.error("Send ETH to your wallet on Arbitrum One.\n");
    }
    process.exit(1);
  }

  await confirmMainnet(`deposit ${amount} USDC to Orderly Vault`);

  console.log(`Depositing ${amount} USDC on ${config.network}...`);
  await depositUsdc(amount);
}

main().catch(console.error);
