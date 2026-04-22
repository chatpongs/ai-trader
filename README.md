# ai-trader

A TypeScript CLI for trading on **Orderly Network** (the backend powering WooFi Pro) via REST API. Built for Arbitrum Sepolia testnet by default.

## Prerequisites

- **Node.js** 18+ (for native `fetch` support)
- **An EVM wallet** with its private key
- **Testnet ETH** on Arbitrum Sepolia (for gas fees)
  - Get from: https://faucet.quicknode.com/arbitrum/sepolia or https://www.alchemy.com/faucets/arbitrum-sepolia

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` and add your wallet private key:

```
WALLET_PRIVATE_KEY=your_hex_private_key_without_0x_prefix
```

Leave `ORDERLY_SECRET` and `ORDERLY_ACCOUNT_ID` empty — they'll be auto-filled by `register-key`.

## Full Onboarding Flow

Run these commands **in order** for your first-time setup:

```bash
npm run faucet          # 1. Claim 1,000 testnet USDC
npm run register-key    # 2. Register account + generate/register API key
npm run deposit -- --amount 10    # 3. Deposit USDC into Orderly Vault
npm run balance         # 4. Verify your deposit arrived
```

After deposit, wait ~1–2 minutes for the cross-chain settlement before the balance reflects.

## Commands

### `npm run faucet`

Claims 1,000 testnet USDC from the Orderly faucet to your wallet.

```bash
npm run faucet
```

### `npm run register-key`

Performs a 3-step flow:
1. Registers your Orderly account via EIP-712 signature
2. Generates an Ed25519 keypair for API signing
3. Registers the public key with Orderly Network

Automatically saves `ORDERLY_SECRET` and `ORDERLY_ACCOUNT_ID` to your `.env` file.

```bash
npm run register-key
```

### `npm run deposit`

Approves and deposits USDC from your wallet into the Orderly Vault contract on Arbitrum Sepolia. This funds your trading account. Requires testnet ETH for gas.

```bash
# Deposit 10 USDC (default)
npm run deposit

# Deposit custom amount
npm run deposit -- --amount 50
```

### `npm run balance`

Shows account info (fees, leverage, etc.) and your current USDC holdings.

```bash
npm run balance
```

### `npm run order`

Places an order on a perpetual market.

**Arguments:**
- `--symbol` — required (e.g., `PERP_ETH_USDC`, `PERP_BTC_USDC`)
- `--side` — required (`BUY` or `SELL`)
- `--qty` — required (base asset quantity, e.g., `0.01`)
- `--type` — optional, defaults to `MARKET` (`MARKET` or `LIMIT`)
- `--price` — required only for `LIMIT` orders

```bash
# Market buy
npm run order -- --symbol PERP_ETH_USDC --side BUY --qty 0.01 --type MARKET

# Limit sell at $3,500
npm run order -- --symbol PERP_ETH_USDC --side SELL --qty 0.01 --type LIMIT --price 3500
```

### `npm run stop-entry`

Places a **STOP** algo order that opens a new position when the mark price crosses a trigger. Useful for "buy the dip" setups: trigger fires when price trades at or through the stop price, then becomes a market (or limit) order.

Flags:

- `--symbol` — e.g. `PERP_ETH_USDC`
- `--trigger` — mark price that activates the order
- `--qty` — order quantity
- `--side` — optional, defaults to `BUY` (`BUY` or `SELL`)
- `--type` — optional, defaults to `MARKET` (`MARKET` or `LIMIT`)
- `--price` — required only for `LIMIT` orders

```bash
# Buy 0.01 ETH if price drops to 1800 (market fill)
npm run stop-entry -- --symbol PERP_ETH_USDC --trigger 1800 --qty 0.01

# Buy 0.01 ETH if price drops to 1800, but only fill at 1799 or better (limit)
npm run stop-entry -- --symbol PERP_ETH_USDC --trigger 1800 --qty 0.01 --type LIMIT --price 1799

# Short-entry when price breaks down below 1800
npm run stop-entry -- --symbol PERP_ETH_USDC --trigger 1800 --qty 0.01 --side SELL
```

### `npm run stop-loss`

Places a **reduce-only STOP** algo order that closes (part of) an existing position when the mark price crosses a trigger. Side and quantity are auto-detected from your open position if omitted.

Flags:

- `--symbol` — e.g. `PERP_ETH_USDC`
- `--trigger` — mark price that activates the close
- `--qty` — optional, defaults to full current position size
- `--side` — optional, auto-detected (opposite of your position)
- `--type` — optional, defaults to `MARKET` (`MARKET` or `LIMIT`)
- `--price` — required only for `LIMIT` orders

```bash
# Stop-loss at 1500 for whatever position you currently hold on ETH
npm run stop-loss -- --symbol PERP_ETH_USDC --trigger 1500

# Partial stop-loss: close only 0.005 ETH when price hits 1500
npm run stop-loss -- --symbol PERP_ETH_USDC --trigger 1500 --qty 0.005

# Stop-limit: trigger at 1500, close via limit at 1495
npm run stop-loss -- --symbol PERP_ETH_USDC --trigger 1500 --type LIMIT --price 1495
```

### `npm run orders`

Lists open orders (or filters/fetches specific ones).

```bash
# All open orders
npm run orders

# Filter by symbol
npm run orders -- --symbol PERP_ETH_USDC

# Filter by status (NEW, FILLED, CANCELLED, REJECTED, etc.)
npm run orders -- --status FILLED

# Look up a specific order by ID
npm run orders -- --id 3064266535
```

### `npm run cancel`

Cancels an open order by its ID. Orderly requires a symbol to cancel; if you omit `--symbol`, the script looks it up automatically via `GET /v1/order/:id`. Pass `--algo` to cancel a stop / algo order.

```bash
# Regular order (symbol auto-resolved)
npm run cancel -- --id 3064266535

# Regular order, explicit symbol (avoids an extra lookup)
npm run cancel -- --id 3064266535 --symbol PERP_ETH_USDC

# Algo order (STOP / stop-loss / stop-entry) — --symbol is required
npm run cancel -- --id 3064266535 --symbol PERP_ETH_USDC --algo
```

### `npm run position`

Shows open positions.

```bash
# Non-zero positions only
npm run position

# Raw full API response (incl. all symbols)
npm run position -- --all
```

### `npm run close`

Closes a position by placing a reduce-only market order in the opposite direction.

```bash
# Close a specific symbol
npm run close -- --symbol PERP_ETH_USDC

# Close all open positions
npm run close -- --all
```

### `npm run typecheck`

Runs the TypeScript compiler in check-only mode.

```bash
npm run typecheck
```

## Project Structure

```
ai-trader/
├── .env.example          # Template for env vars
├── package.json
├── tsconfig.json
├── src/
│   ├── config.ts         # Env vars & network constants (testnet/mainnet)
│   ├── signer.ts         # Ed25519 request signing
│   ├── client.ts         # Authenticated fetch wrapper
│   ├── key-manager.ts    # Key generation + EIP-712 registration
│   ├── account.ts        # GET account info & holdings
│   ├── orders.ts         # Place/list/cancel/get orders
│   ├── deposit.ts        # Faucet + on-chain USDC deposit
│   └── types.ts          # TypeScript interfaces
└── scripts/
    ├── faucet.ts
    ├── register-key.ts
    ├── deposit.ts
    ├── place-order.ts
    ├── list-orders.ts
    ├── cancel-order.ts
    ├── close-position.ts
    └── get-position.ts
```

## Network Configuration

The client supports both **testnet** (Arbitrum Sepolia) and **mainnet** (Arbitrum One). Default is testnet.

### Testnet (default)

| Setting | Value |
|---|---|
| Base URL | `https://testnet-api.orderly.org` |
| RPC URL | `https://arbitrum-sepolia.publicnode.com` |
| Chain ID | `421614` |
| Broker ID | `woofi_pro` |
| USDC | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| Vault | `0x0EaC556c0C2321BA25b9DC01e4e3c95aD5CDCd2f` |

### Mainnet

| Setting | Value |
|---|---|
| Base URL | `https://api.orderly.org` |
| RPC URL | `https://arb1.arbitrum.io/rpc` (override with `RPC_URL` env var) |
| Chain ID | `42161` |
| Broker ID | `woofi_pro` |
| USDC | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Vault | `0x816f722424b49Cf1275cc86DA9840Fbd5a6167e9` |

## Switching to Mainnet

### 1. Update `.env`

```
NETWORK=mainnet
WALLET_PRIVATE_KEY=<your real private key>

# Recommended: use a paid RPC provider for mainnet reliability
RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

**Clear** the previous `ORDERLY_SECRET` and `ORDERLY_ACCOUNT_ID` values — they're testnet-only.

### 2. Fund your wallet

You need real funds on Arbitrum One:
- **ETH** for gas (~$2–5 worth)
- **USDC** to trade with

Bridge USDC/ETH to Arbitrum One from Ethereum/other L2s via [Arbitrum Bridge](https://bridge.arbitrum.io/) or use an exchange withdrawal.

### 3. Onboarding flow

```bash
npm run register-key        # Registers your mainnet account
npm run deposit -- --amount 100    # Deposits 100 USDC
npm run balance
```

Note: `npm run faucet` will **throw an error** on mainnet (no free USDC there).

### Mainnet safety features

When `NETWORK=mainnet`, the CLI:
- Displays a `[MAINNET]` banner for every command
- Waits 5 seconds before executing `deposit`, `order`, or `close` to give you a chance to Ctrl+C
- Can skip the confirmation wait with `SKIP_MAINNET_CONFIRM=true` in `.env` (for scripts/automation)

### Testnet vs Mainnet account IDs

Your Orderly Account ID is derived from `wallet_address + broker_id`, **not** from the network. This means your account ID is the same on testnet and mainnet — but the accounts themselves are separate databases. You must `register-key` again when switching networks.

## Authentication Model

Every authenticated request is signed with Ed25519:

1. Build message: `{timestamp}{METHOD}{path}{?query}{jsonBody}`
2. Sign with your Ed25519 private key
3. Attach signature + public key + account ID + timestamp as headers:

| Header | Value |
|---|---|
| `orderly-timestamp` | Unix ms timestamp |
| `orderly-account-id` | Your Orderly account ID |
| `orderly-key` | `ed25519:<base58-public-key>` |
| `orderly-signature` | Base64url-encoded signature |

## Viewing Your Activity in the UI

Connect the same wallet you used for this CLI:

- **WooFi Pro mainnet:** https://pro.woofi.com
- **WooFi Pro testnet:** https://testnet-pro.woofi.com

Make sure to switch to the **Perpetual** trading mode (your PERP positions won't appear on the Spot page).

## Troubleshooting

### `Account not found` during register-key
Your wallet isn't registered with Orderly yet. The `register-key` script handles registration automatically — if this persists, ensure your `WALLET_PRIVATE_KEY` is correct.

### `execution reverted` during deposit
Either (1) you don't have testnet ETH for gas, or (2) your USDC allowance is insufficient. The script auto-approves, so check your wallet has ETH.

### `account id not exist` on any read command
Run `npm run register-key` first, then deposit USDC. The account is created when you deposit on-chain.

### Deposit doesn't reflect in balance immediately
Cross-chain deposits take ~1–2 minutes. Wait and retry `npm run balance`.

### No open positions after placing a market order
Check the order's actual status — it may have been rejected due to insufficient margin or testnet liquidity:

```bash
npm run orders -- --id <your_order_id>
```

## Security Notes

- **Never commit your `.env`** — it's in `.gitignore` by default
- Your `ORDERLY_SECRET` is an Ed25519 private key that grants trading access to your account for 365 days
- To revoke, register a new key — the old one will continue working until expiration unless you contact Orderly support

## References

- [Orderly Network docs](https://orderly.network/docs)
- [Orderly REST API reference](https://orderly.network/docs/build-on-omnichain/evm-api/introduction)
- [WooFi Pro](https://pro.woofi.com)
