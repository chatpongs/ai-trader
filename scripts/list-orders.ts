import "dotenv/config";
import { getOrders } from "../src/orders.js";

async function main() {
  const args = process.argv.slice(2);
  const symbolIdx = args.indexOf("--symbol");
  const symbol = symbolIdx !== -1 ? args[symbolIdx + 1] : undefined;

  const result = await getOrders(symbol);
  console.log("Open orders:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
