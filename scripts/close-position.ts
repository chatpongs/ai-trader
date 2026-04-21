import "dotenv/config";
import { orderlyFetch } from "../src/client.js";
import { placeOrder } from "../src/orders.js";

interface PositionsResponse {
  success: boolean;
  data: {
    rows: Array<{
      symbol: string;
      position_qty: number;
      average_open_price: number;
      mark_price: number;
      unsettled_pnl: number;
    }>;
  };
}

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const targetSymbol = get("--symbol");
  const closeAll = args.includes("--all");

  if (!targetSymbol && !closeAll) {
    console.error(
      "Usage:\n  npm run close -- --symbol PERP_ETH_USDC\n  npm run close -- --all"
    );
    process.exit(1);
  }

  console.log("Fetching open positions...");
  const positions = await orderlyFetch<PositionsResponse>("GET", "/v1/positions");
  const openPositions = (positions.data.rows ?? []).filter(
    (p) => Number(p.position_qty) !== 0
  );

  if (openPositions.length === 0) {
    console.log("No open positions to close.");
    return;
  }

  const toClose = targetSymbol
    ? openPositions.filter((p) => p.symbol === targetSymbol)
    : openPositions;

  if (toClose.length === 0) {
    console.log(`No open position for ${targetSymbol}.`);
    console.log(
      `Open positions: ${openPositions.map((p) => p.symbol).join(", ")}`
    );
    return;
  }

  for (const pos of toClose) {
    const qty = Math.abs(Number(pos.position_qty));
    const side = Number(pos.position_qty) > 0 ? "SELL" : "BUY";

    console.log(
      `\nClosing ${pos.symbol}: ${pos.position_qty} @ mark ${pos.mark_price}`
    );
    console.log(`  Placing ${side} MARKET reduce-only order for ${qty}...`);

    try {
      const result = await placeOrder({
        symbol: pos.symbol,
        order_type: "MARKET",
        order_quantity: qty,
        side,
        reduce_only: true,
      });
      console.log(`  Order ID: ${result.data.order_id} (${result.data.status ?? "NEW"})`);
    } catch (err: any) {
      console.error(`  Failed to close ${pos.symbol}:`, err?.message ?? err);
    }
  }

  console.log("\nDone.");
}

main().catch(console.error);
