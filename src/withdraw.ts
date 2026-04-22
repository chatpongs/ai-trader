import { Wallet, parseUnits } from "ethers";
import { config } from "./config.js";
import { orderlyFetch } from "./client.js";

// Orderly ledger contract used to verify withdraw EIP-712 signatures. This is
// network-specific (see config.ledgerContract) and different from
// `config.verifyingContract` (which is used for registration / orderly-key
// signatures). See: https://orderly.network/docs/build-on-omnichain/addresses

const WITHDRAW_TYPES = {
  Withdraw: [
    { name: "brokerId", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "receiver", type: "address" },
    { name: "token", type: "string" },
    { name: "amount", type: "uint256" },
    { name: "withdrawNonce", type: "uint64" },
    { name: "timestamp", type: "uint64" },
  ],
};

interface WithdrawNonceResponse {
  success: boolean;
  data: { withdraw_nonce: number | string };
}

interface WithdrawRequestResponse {
  success: boolean;
  data: { withdraw_id: number };
}

async function getWithdrawNonce(): Promise<string> {
  const res = await orderlyFetch<WithdrawNonceResponse>("GET", "/v1/withdraw_nonce");
  return String(res.data.withdraw_nonce);
}

export interface WithdrawOptions {
  amount: number;
  token?: string;
  receiver?: string;
  allowCrossChainWithdraw?: boolean;
}

export async function withdrawUsdc(options: WithdrawOptions): Promise<number> {
  const { amount, token = "USDC", allowCrossChainWithdraw = false } = options;

  const wallet = new Wallet(config.walletPrivateKey());
  const receiver = options.receiver ?? wallet.address;

  // USDC has 6 decimals — amount is a stringified integer in base units.
  const amountBaseUnits = parseUnits(amount.toString(), 6).toString();

  console.log("Fetching withdrawal nonce...");
  const withdrawNonce = await getWithdrawNonce();
  console.log(`Withdraw nonce: ${withdrawNonce}`);

  const message = {
    brokerId: config.brokerId,
    chainId: config.chainId,
    receiver,
    token,
    amount: amountBaseUnits,
    withdrawNonce,
    timestamp: Date.now(),
  };

  const domain = {
    name: "Orderly",
    version: "1",
    chainId: config.chainId,
    verifyingContract: config.ledgerContract as `0x${string}`,
  };

  console.log("Signing withdraw message (EIP-712)...");
  const signature = await wallet.signTypedData(domain, WITHDRAW_TYPES, message);

  console.log(`Requesting withdrawal of ${amount} ${token} to ${receiver}...`);
  const res = await orderlyFetch<WithdrawRequestResponse>(
    "POST",
    "/v1/withdraw_request",
    {
      message: { ...message, allowCrossChainWithdraw },
      signature,
      userAddress: wallet.address,
      verifyingContract: config.ledgerContract,
    }
  );

  const withdrawId = res?.data?.withdraw_id;
  console.log(`Withdrawal submitted! Withdraw ID: ${withdrawId}`);
  console.log(
    "Funds will be settled on-chain after the relayer processes the request (usually 1-2 minutes)."
  );
  return withdrawId;
}
