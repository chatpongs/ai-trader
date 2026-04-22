import "dotenv/config";
import { placeAlgoOrder } from "../src/orders.js";
import { orderlyFetch } from "../src/client.js";
import type { AlgoOrderRequest, OrderSide, OrderType } from "../src/types.js";
import { printNetworkBanner, confirmMainnet } from "../src/banner.js";

interface PositionsResponse {
  success: boolean;
  data: {
    rows: Array<{
      symbol: string;
      position_qty: number;
      mark_price?: number;
    }>;
  };
}

function parseArgs(): {
  symbol: string;
  trigger: number;
  qty?: number;
  side?: OrderSide;
  type: OrderType;
  price?: number;
} {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const symbol = get("--symbol");
  const trigger = get("--trigger") ? parseFloat(get("--trigger")!) : undefined;
  const qty = get("--qty") ? parseFloat(get("--qty")!) : undefined;
  const side = get("--side") as OrderSide | undefined;
  const type = (get("--type") ?? "MARKET") as OrderType;
  const price = get("--price") ? parseFloat(get("--price")!) : undefined;

  if (!symbol || trigger === undefined) {
    console.error(
      [
        "Usage: npm run stop-loss -- \\",
        "  --symbol PERP_ETH_USDC \\",
        "  --trigger 1500 \\",
        "  [--qty 0.01  (default: full current position size)] \\",
        "  [--side BUY|SELL  (auto-detected from open position)] \\",
        "  [--type MARKET|LIMIT  (default MARKET)] \\",
        "  [--price 1499  (required for LIMIT)]",
        "",
        "Places a reduce-only STOP order that triggers when mark price crosses",
        "--trigger, closing (part of) an existing position.",
      ].join("\n")
    );
    process.exit(1);
  }

  if (side && !["BUY", "SELL"].includes(side)) {
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

  return { symbol, trigger, qty, side, type, price };
}

async function resolveFromPosition(symbol: string): Promise<{ side: OrderSide; qty: number }> {
  const positionsResp = await orderlyFetch<PositionsResponse>("GET", "/v1/positions");
  const rows = positionsResp?.data?.rows ?? [];
  const pos = rows.find((p) => p.symbol === symbol && Number(p.position_qty) !== 0);

  if (!pos) {
    throw new Error(
      `No open position found for ${symbol}. Supply --qty and --side explicitly, or open a position first.`
    );
  }

  const rawQty = Number(pos.position_qty);
  const qty = Math.abs(rawQty);
  // Long position has positive qty -> stop-loss must SELL. Short (negative qty) -> BUY.
  const side: OrderSide = rawQty > 0 ? "SELL" : "BUY";
  return { side, qty };
}

async function main() {
  printNetworkBanner();

  const parsed = parseArgs();

  let side = parsed.side;
  let qty = parsed.qty;

  if (!side || qty === undefined) {
    const fromPos = await resolveFromPosition(parsed.symbol);
    if (!side) side = fromPos.side;
    if (qty === undefined) qty = fromPos.qty;
  }

  if (!qty || qty <= 0) {
    console.error("Resolved quantity is 0 or negative. Aborting.");
    process.exit(1);
  }

  const order: AlgoOrderRequest = {
    symbol: parsed.symbol,
    algo_type: "STOP",
    type: parsed.type,
    side: side!,
    quantity: qty,
    trigger_price: parsed.trigger,
    trigger_price_type: "MARK_PRICE",
    reduce_only: true,
  };

  if (parsed.type === "LIMIT" && parsed.price !== undefined) {
    order.price = parsed.price;
  }

  const summary =
    `STOP-LOSS ${parsed.type} ${side} (reduce-only): ${qty} ${parsed.symbol} ` +
    `when mark crosses ${parsed.trigger}` +
    (parsed.price !== undefined ? ` @ limit ${parsed.price}` : "");

  await confirmMainnet(summary);

  console.log(`Placing ${summary}`);
  const result = await placeAlgoOrder(order);
  console.log("Algo order response:", JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
