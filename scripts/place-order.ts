import "dotenv/config";
import { placeOrder } from "../src/orders.js";
import type { OrderType, OrderSide } from "../src/types.js";
import { printNetworkBanner, confirmMainnet } from "../src/banner.js";

function parseArgs(): {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  price?: number;
} {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const symbol = get("--symbol");
  const side = get("--side") as OrderSide | undefined;
  const type = (get("--type") ?? "MARKET") as OrderType;
  const qty = get("--qty") ? parseFloat(get("--qty")!) : undefined;
  const price = get("--price") ? parseFloat(get("--price")!) : undefined;

  if (!symbol || !side || !qty) {
    console.error(
      "Usage: npm run order -- --symbol PERP_ETH_USDC --side BUY --qty 0.01 [--type MARKET|LIMIT] [--price 1500]"
    );
    process.exit(1);
  }

  if (!["BUY", "SELL"].includes(side)) {
    console.error("Side must be BUY or SELL");
    process.exit(1);
  }

  if (type === "LIMIT" && !price) {
    console.error("LIMIT orders require --price");
    process.exit(1);
  }

  return { symbol, side, type, qty, price };
}

async function main() {
  printNetworkBanner();

  const { symbol, side, type, qty, price } = parseArgs();

  const order: Parameters<typeof placeOrder>[0] = {
    symbol,
    order_type: type,
    order_quantity: qty,
    side,
  };

  if (type === "LIMIT" && price) {
    order.order_price = price;
  }

  await confirmMainnet(
    `place ${type} ${side} order: ${qty} ${symbol}${price ? ` @ ${price}` : ""}`
  );

  console.log(`Placing ${type} ${side} order: ${qty} ${symbol}${price ? ` @ ${price}` : ""}`);
  const result = await placeOrder(order);
  console.log("Order response:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
