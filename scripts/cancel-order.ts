import "dotenv/config";
import { cancelOrder, cancelAlgoOrder, getOrder } from "../src/orders.js";

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const idArg = get("--id");
  const orderId = idArg ? parseInt(idArg, 10) : undefined;
  let symbol = get("--symbol");
  const isAlgo = args.includes("--algo");

  if (!orderId) {
    console.error(
      "Usage: npm run cancel -- --id <order_id> [--symbol PERP_ETH_USDC] [--algo]"
    );
    process.exit(1);
  }

  if (!symbol && !isAlgo) {
    // Regular orders can be looked up by id to auto-fill symbol.
    console.log(`Looking up order ${orderId} to resolve symbol...`);
    try {
      const info = await getOrder(orderId);
      symbol = info.data.symbol;
      console.log(`Resolved symbol: ${symbol}`);
    } catch (err) {
      console.error(
        "Failed to look up order symbol. Pass --symbol explicitly.",
        err
      );
      process.exit(1);
    }
  }

  if (!symbol) {
    console.error(
      "Cancelling algo orders requires --symbol (e.g. --symbol PERP_ETH_USDC)."
    );
    process.exit(1);
  }

  console.log(
    `Cancelling ${isAlgo ? "algo " : ""}order ${orderId} on ${symbol}...`
  );
  const result = isAlgo
    ? await cancelAlgoOrder(orderId, symbol)
    : await cancelOrder(orderId, symbol);
  console.log("Cancel response:", JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
