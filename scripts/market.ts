import "dotenv/config";
import { getAllMarkets, getMarket } from "../src/market.js";
import type { FutureInfo } from "../src/types.js";
import { printNetworkBanner } from "../src/banner.js";

function parseArgs(): {
  symbol?: string;
  raw: boolean;
  all: boolean;
  top?: number;
  sort: "volume" | "oi" | "change";
} {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const symbol = get("--symbol");
  const raw = args.includes("--raw");
  const all = args.includes("--all");
  const topStr = get("--top");
  const top = topStr ? parseInt(topStr, 10) : undefined;
  const sortRaw = (get("--sort") ?? "volume").toLowerCase();

  if (!["volume", "oi", "change"].includes(sortRaw)) {
    console.error("--sort must be one of: volume, oi, change");
    process.exit(1);
  }

  return { symbol, raw, all, top, sort: sortRaw as "volume" | "oi" | "change" };
}

function fmtNum(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(decimals) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(decimals) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(decimals) + "K";
  return n.toFixed(decimals);
}

function fmtPct(p: number): string {
  const sign = p >= 0 ? "+" : "";
  return `${sign}${(p * 100).toFixed(3)}%`;
}

function fmtPrice(p: number): string {
  if (!Number.isFinite(p)) return String(p);
  if (p >= 1000) return p.toFixed(2);
  if (p >= 1) return p.toFixed(3);
  if (p >= 0.01) return p.toFixed(5);
  return p.toFixed(8);
}

function change24h(m: FutureInfo): number {
  const open = m["24h_open"];
  const close = m["24h_close"];
  if (!open) return 0;
  return (close - open) / open;
}

function printOne(m: FutureInfo) {
  const ch = change24h(m);
  const nextFunding = new Date(m.next_funding_time);
  console.log(`Symbol:            ${m.symbol}`);
  console.log(`Mark price:        ${fmtPrice(m.mark_price)}`);
  console.log(`Index price:       ${fmtPrice(m.index_price)}`);
  console.log(`24h change:        ${fmtPct(ch)}   (open ${fmtPrice(m["24h_open"])} -> close ${fmtPrice(m["24h_close"])})`);
  console.log(`24h high / low:    ${fmtPrice(m["24h_high"])} / ${fmtPrice(m["24h_low"])}`);
  console.log(`24h volume (base): ${fmtNum(m["24h_volume"])}`);
  console.log(`24h amount (USD):  ${fmtNum(m["24h_amount"])}`);
  console.log(`Open interest:     ${fmtNum(m.open_interest)}`);
  console.log(`Funding rate:      ${fmtPct(m.last_funding_rate)} (last), ${fmtPct(m.est_funding_rate)} (est)`);
  console.log(`Next funding:      ${nextFunding.toISOString()}`);
}

function printTable(rows: FutureInfo[]) {
  const header = [
    "SYMBOL".padEnd(22),
    "MARK".padStart(12),
    "24H CHG".padStart(10),
    "24H HIGH".padStart(12),
    "24H LOW".padStart(12),
    "VOLUME".padStart(12),
    "OI".padStart(12),
    "FUNDING".padStart(10),
  ].join("  ");
  console.log(header);
  console.log("-".repeat(header.length));

  for (const m of rows) {
    console.log(
      [
        m.symbol.padEnd(22),
        fmtPrice(m.mark_price).padStart(12),
        fmtPct(change24h(m)).padStart(10),
        fmtPrice(m["24h_high"]).padStart(12),
        fmtPrice(m["24h_low"]).padStart(12),
        fmtNum(m["24h_amount"]).padStart(12),
        fmtNum(m.open_interest).padStart(12),
        fmtPct(m.last_funding_rate).padStart(10),
      ].join("  ")
    );
  }
}

async function main() {
  printNetworkBanner();

  const opts = parseArgs();

  if (opts.symbol) {
    const resp = await getMarket(opts.symbol);
    if (opts.raw) {
      console.log(JSON.stringify(resp.data, null, 2));
      return;
    }
    printOne(resp.data);
    return;
  }

  const resp = await getAllMarkets();
  let rows = resp.data.rows ?? [];

  if (opts.raw) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  const keyFn: (m: FutureInfo) => number = (() => {
    switch (opts.sort) {
      case "oi":
        return (m) => m.open_interest;
      case "change":
        return (m) => Math.abs(change24h(m));
      case "volume":
      default:
        return (m) => m["24h_amount"];
    }
  })();

  rows = [...rows].sort((a, b) => keyFn(b) - keyFn(a));

  if (!opts.all) {
    const top = opts.top && opts.top > 0 ? opts.top : 10;
    rows = rows.slice(0, top);
    console.log(
      `Top ${rows.length} of ${resp.data.rows.length} markets by ${opts.sort} ` +
        `(use --all or --top N to see more):\n`
    );
  } else {
    console.log(`All ${rows.length} markets, sorted by ${opts.sort}:\n`);
  }

  printTable(rows);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
