import "dotenv/config";
import { cancelOrder } from "../src/orders.js";

async function main() {
  const args = process.argv.slice(2);
  const idIdx = args.indexOf("--id");
  const orderId = idIdx !== -1 ? parseInt(args[idIdx + 1], 10) : undefined;

  if (!orderId) {
    console.error("Usage: npm run cancel -- --id <order_id>");
    process.exit(1);
  }

  console.log(`Cancelling order ${orderId}...`);
  const result = await cancelOrder(orderId);
  console.log("Cancel response:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
