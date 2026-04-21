import "dotenv/config";
import fs from "fs";
import path from "path";
import { Wallet } from "ethers";
import { config } from "../src/config.js";
import {
  generateEd25519KeyPair,
  deriveAccountId,
  registerAccount,
  registerOrderlyKey,
} from "../src/key-manager.js";
import { printNetworkBanner } from "../src/banner.js";

async function main() {
  printNetworkBanner();

  const envPath = path.resolve(process.cwd(), ".env");

  const wallet = new Wallet(config.walletPrivateKey());
  console.log(`Wallet address: ${wallet.address}`);

  const expectedAccountId = deriveAccountId(wallet.address);
  console.log(`Expected Orderly Account ID: ${expectedAccountId}`);

  // Step 1: Register account (off-chain via API) — creates the Orderly account
  console.log("\nStep 1: Registering account with Orderly...");
  let accountId: string;
  try {
    accountId = await registerAccount();
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    // If already registered, that's fine - use the derived ID
    if (msg.includes("already") || msg.includes("exist")) {
      console.log("Account already registered, continuing...");
      accountId = expectedAccountId;
    } else {
      console.error("Account registration failed:", msg);
      process.exit(1);
    }
  }

  // Step 2: Generate Ed25519 keypair
  console.log("\nStep 2: Generating Ed25519 keypair...");
  const keyPair = await generateEd25519KeyPair();
  console.log(`Public key: ${keyPair.publicKey}`);

  // Step 3: Register the key with Orderly
  console.log("\nStep 3: Registering API key with Orderly...");
  try {
    await registerOrderlyKey(keyPair);
  } catch (err: any) {
    console.error("Key registration failed:", err?.message ?? err);
    process.exit(1);
  }

  // Step 4: Save to .env
  let envContent = fs.readFileSync(envPath, "utf-8");

  const updateOrAdd = (key: string, value: string) => {
    const commentedRegex = new RegExp(`^#\\s*${key}=.*$`, "m");
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else if (commentedRegex.test(envContent)) {
      envContent = envContent.replace(commentedRegex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  };

  updateOrAdd("ORDERLY_SECRET", keyPair.privateKey);
  updateOrAdd("ORDERLY_ACCOUNT_ID", accountId);

  fs.writeFileSync(envPath, envContent, "utf-8");
  console.log("\nSaved to .env:");
  console.log(`  ORDERLY_SECRET=${keyPair.privateKey}`);
  console.log(`  ORDERLY_ACCOUNT_ID=${accountId}`);
  console.log("\nDone! Next step:");
  console.log("  npm run deposit -- --amount 10");
}

main().catch(console.error);
