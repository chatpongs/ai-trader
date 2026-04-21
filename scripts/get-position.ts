import "dotenv/config";
import { orderlyFetch } from "../src/client.js";
import { getAccountInfo, getHoldings } from "../src/account.js";

interface PositionsResponse {
  success: boolean;
  data: {
    rows: Array<{
      symbol: string;
      position_qty: number;
      cost_position: number;
      last_sub_type: string;
      pending_long_qty: number;
      pending_short_qty: number;
      settle_price: number;
      average_open_price: number;
      unsettled_pnl: number;
      mark_price: number;
      est_liq_price: number;
      timestamp: number;
      imr_withdraw_orders: number;
      mmr_with_orders: number;
      mmr: number;
      imr: number;
      pnl_24_h: number;
      fee_24_h: number;
    }>;
  };
}

async function main() {
  const args = process.argv.slice(2);
  const showBalances = args.includes("--balances");
  const showAll = args.includes("--all");

  if (showBalances) {
    console.log("Fetching account info & holdings...\n");
    const [info, holdings] = await Promise.all([getAccountInfo(), getHoldings()]);

    console.log("=== Account Info ===");
    console.log(JSON.stringify(info.data, null, 2));

    console.log("\n=== Holdings ===");
    const nonZero = (holdings.data.holding ?? []).filter(
      (h) => parseFloat(String(h.holding)) !== 0
    );
    if (nonZero.length === 0) {
      console.log("No holdings.");
    } else {
      console.log(JSON.stringify(nonZero, null, 2));
    }
    return;
  }

  console.log("Fetching open positions...\n");
  const positions = await orderlyFetch<PositionsResponse>("GET", "/v1/positions");

  if (showAll) {
    console.log("=== Full response ===");
    console.log(JSON.stringify(positions.data, null, 2));
    return;
  }

  const openPositions = (positions.data.rows ?? []).filter(
    (p) => Number(p.position_qty) !== 0
  );

  if (openPositions.length === 0) {
    console.log("No open positions.");
    console.log("(Use --all flag to see the full API response)");
  } else {
    console.log(JSON.stringify(openPositions, null, 2));
  }
}

main().catch(console.error);
