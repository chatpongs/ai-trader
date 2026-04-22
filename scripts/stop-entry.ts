import "dotenv/config";
import { placeAlgoOrder } from "../src/orders.js";
import type { AlgoOrderRequest, OrderSide, OrderType } from "../src/types.js";
import { printNetworkBanner, confirmMainnet } from "../src/banner.js";

function parseArgs(): {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  trigger: number;
  price?: number;
} {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const symbol = get("--symbol");
  const side = (get("--side") ?? "BUY") as OrderSide;
  const type = (get("--type") ?? "MARKET") as OrderType;
  const qty = get("--qty") ? parseFloat(get("--qty")!) : undefined;
  const trigger = get("--trigger") ? parseFloat(get("--trigger")!) : undefined;
  const price = get("--price") ? parseFloat(get("--price")!) : undefined;

  if (!symbol || !qty || trigger === undefined) {
    console.error(
      [
        "Usage: npm run stop-entry -- \\",
        "  --symbol PERP_ETH_USDC \\",
        "  --trigger 1800 \\",
        "  --qty 0.01 \\",
        "  [--side BUY|SELL  (default BUY)] \\",
        "  [--type MARKET|LIMIT  (default MARKET)] \\",
        "  [--price 1799  (required for LIMIT)]",
        "",
        "Places a STOP order that triggers when mark price crosses --trigger,",
        "then opens a new position at market (or limit).",
      ].join("\n")
    );
    process.exit(1);
  }

  if (!["BUY", "SELL"].includes(side)) {
    console.error("Side must be BUY or SELL");
    process.exit(1);
  }

  if (!["MARKET", "LIMIT"].includes(type)) {
    console.error("Type must be MARKET or LIMIT");
    process.exit(1);
  }

  if (type === "LIMIT" && price === undefined) {
    console.error("LIMIT orders require --price");
    process.exit(1);
  }

  return { symbol, side, type, qty, trigger, price };
}

async function main() {
  printNetworkBanner();

  const { symbol, side, type, qty, trigger, price } = parseArgs();

  const order: AlgoOrderRequest = {
    symbol,
    algo_type: "STOP",
    type,
    side,
    quantity: qty,
    trigger_price: trigger,
    trigger_price_type: "MARK_PRICE",
    reduce_only: false,
  };

  if (type === "LIMIT" && price !== undefined) {
    order.price = price;
  }

  const direction = side === "BUY" ? "price <= trigger (or >=)" : "price crosses trigger";
  const summary =
    `STOP ${type} ${side} entry: ${qty} ${symbol} when mark ${direction} ${trigger}` +
    (price !== undefined ? ` @ limit ${price}` : "");

  await confirmMainnet(summary);

  console.log(`Placing ${summary}`);
  const result = await placeAlgoOrder(order);
  console.log("Algo order response:", JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
