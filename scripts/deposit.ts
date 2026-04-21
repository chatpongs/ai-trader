import "dotenv/config";
import { config } from "../src/config.js";
import { depositUsdc } from "../src/deposit.js";

async function main() {
  const args = process.argv.slice(2);
  const amountIdx = args.indexOf("--amount");
  const amount = amountIdx !== -1 ? parseFloat(args[amountIdx + 1]) : 10;

  if (isNaN(amount) || amount <= 0) {
    console.error("Usage: npm run deposit -- --amount <usdc_amount>");
    process.exit(1);
  }

  console.log(`Depositing ${amount} USDC on ${config.network}...`);
  await depositUsdc(amount);
}

main().catch(console.error);
