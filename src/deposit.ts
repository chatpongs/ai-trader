import { Wallet, Contract, JsonRpcProvider, keccak256, parseUnits, toUtf8Bytes } from "ethers";
import { config } from "./config.js";
import { deriveAccountId } from "./key-manager.js";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

const VAULT_ABI = [
  "function deposit((bytes32 accountId, bytes32 brokerHash, bytes32 tokenHash, uint128 tokenAmount) depositInput) payable",
  "function getDepositFee(address account, (bytes32 accountId, bytes32 brokerHash, bytes32 tokenHash, uint128 tokenAmount) depositInput) view returns (uint256)",
];

export async function claimFaucetUsdc(address: string): Promise<void> {
  if (!config.isTestnet) {
    throw new Error(
      "Faucet is only available on testnet. On mainnet you need real USDC."
    );
  }

  const faucetUrl = `${config.operatorUrl}/v1/faucet/usdc`;

  const response = await fetch(faucetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_address: address,
      broker_id: config.brokerId,
      chain_id: String(config.chainId),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Faucet request failed: ${JSON.stringify(data)}`);
  }

  console.log("Faucet response:", JSON.stringify(data, null, 2));
}

export async function depositUsdc(amount: number): Promise<string> {
  const provider = new JsonRpcProvider(config.rpcUrl);
  const wallet = new Wallet(config.walletPrivateKey(), provider);

  const usdc = new Contract(config.usdcAddress, ERC20_ABI, wallet);
  const vault = new Contract(config.vaultAddress, VAULT_ABI, wallet);

  const depositAmount = parseUnits(amount.toString(), 6);
  const accountId = deriveAccountId(wallet.address);
  const brokerHash = keccak256(toUtf8Bytes(config.brokerId));
  const tokenHash = keccak256(toUtf8Bytes("USDC"));

  const currentAllowance = await usdc.allowance(wallet.address, config.vaultAddress);
  if (currentAllowance < depositAmount) {
    console.log(`Approving USDC transfer (${amount} USDC)...`);
    const approveTx = await usdc.approve(config.vaultAddress, depositAmount);
    await approveTx.wait();
    console.log("Approval confirmed.");
  }

  const depositInput = {
    accountId,
    brokerHash,
    tokenHash,
    tokenAmount: depositAmount,
  };

  console.log("Getting deposit fee...");
  const depositFee = await vault.getDepositFee(wallet.address, depositInput);
  console.log(`Deposit fee: ${depositFee.toString()} wei`);

  console.log(`Depositing ${amount} USDC...`);
  const depositTx = await vault.deposit(depositInput, { value: depositFee });
  const receipt = await depositTx.wait();

  console.log(`Deposit confirmed! TX hash: ${receipt.hash}`);
  return receipt.hash;
}
