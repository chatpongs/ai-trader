import "dotenv/config";
import fs from "fs";
import path from "path";
import { config } from "../src/config.js";
import { generateEd25519KeyPair, deriveAccountId, registerOrderlyKey } from "../src/key-manager.js";
import { Wallet } from "ethers";

async function main() {
  const envPath = path.resolve(process.cwd(), ".env");

  const wallet = new Wallet(config.walletPrivateKey());
  console.log(`Wallet address: ${wallet.address}`);

  const accountId = deriveAccountId(wallet.address);
  console.log(`Orderly Account ID: ${accountId}`);

  console.log("Generating Ed25519 keypair...");
  const keyPair = await generateEd25519KeyPair();
  console.log(`Public key: ${keyPair.publicKey}`);

  console.log("Registering key with Orderly...");
  await registerOrderlyKey(keyPair);

  let envContent = fs.readFileSync(envPath, "utf-8");

  const updateOrAdd = (key: string, value: string) => {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
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
  console.log("\nDone! You can now run other commands.");
}

main().catch(console.error);
