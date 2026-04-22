import "dotenv/config";
import { getOrders, getOrder, getAlgoOrders, getAlgoOrder } from "../src/orders.js";

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const isAlgo = args.includes("--algo");

  const idArg = get("--id");
  if (idArg) {
    const orderId = parseInt(idArg, 10);
    console.log(`Fetching ${isAlgo ? "algo " : ""}order ${orderId}...`);
    const result = isAlgo
      ? await getAlgoOrder(orderId)
      : await getOrder(orderId);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const symbol = get("--symbol");
  const status = get("--status"); // e.g. FILLED, NEW, CANCELLED

  const result = isAlgo
    ? await getAlgoOrders({ symbol, status })
    : await getOrders({ symbol, status });
  console.log(`Total: ${result.data.meta.total}`);
  console.log(JSON.stringify(result.data.rows, null, 2));
}

main().catch(console.error);
