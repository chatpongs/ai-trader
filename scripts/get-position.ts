import "dotenv/config";
import { orderlyFetch } from "../src/client.js";
import { getAccountInfo, getHoldings } from "../src/account.js";

interface PositionsResponse {
  success: boolean;
  data: {
    rows: Array<{
      symbol: string;
      side: string;
      quantity: string;
      avg_entry_price: string;
      unrealized_pnl: string;
      realized_pnl: string;
      leverage: string;
      liquidation_price: string;
      margin: string;
    }>;
  };
}

async function main() {
  const args = process.argv.slice(2);
  const showBalances = args.includes("--balances");

  if (showBalances) {
    console.log("Fetching account info & holdings...\n");
    const [info, holdings] = await Promise.all([getAccountInfo(), getHoldings()]);

    console.log("=== Account Info ===");
    console.log(JSON.stringify(info.data, null, 2));

    console.log("\n=== Holdings ===");
    const nonZero = holdings.data.filter((h) => parseFloat(String(h.holding)) > 0);
    if (nonZero.length === 0) {
      console.log("No holdings.");
    } else {
      console.log(JSON.stringify(nonZero, null, 2));
    }
    return;
  }

  console.log("Fetching open positions...\n");
  const positions = await orderlyFetch<PositionsResponse>("GET", "/v1/positions");

  const openPositions = positions.data.rows.filter(
    (p) => parseFloat(p.quantity) > 0
  );

  if (openPositions.length === 0) {
    console.log("No open positions.");
  } else {
    console.log(JSON.stringify(openPositions, null, 2));
  }
}

main().catch(console.error);
