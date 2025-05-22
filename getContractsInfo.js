import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { SecretsManager } from "@chainlink/functions-toolkit";
import { ethers } from "ethers";

async function main() {
  const {
    EVM_PRIVATE_KEY,
    ETHEREUM_PROVIDER_SEPOLIA,                // ← 用这个
    FUNCTIONS_ROUTER_ADDRESS = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    DON_ID = "fun-ethereum-sepolia-1",
  } = process.env;

  if (!EVM_PRIVATE_KEY || !ETHEREUM_PROVIDER_SEPOLIA) {
    throw new Error("缺少 EVM_PRIVATE_KEY 或 ETHEREUM_PROVIDER_SEPOLIA");
  }

  /** provider + signer */
  const provider = new ethers.providers.JsonRpcProvider(
    ETHEREUM_PROVIDER_SEPOLIA,
    { name: "sepolia", chainId: 11155111 }     // 指明网络
  );
  const signer = new ethers.Wallet(EVM_PRIVATE_KEY, provider);

  /** SecretsManager */
  const secretsManager = new SecretsManager({
    signer,
    functionsRouterAddress: FUNCTIONS_ROUTER_ADDRESS,
    donId: DON_ID,
  });
  await secretsManager.initialize();

  /** 列出密钥 */
  const gateways = [
    "https://01.functions-gateway.testnet.chain.link/",
    "https://02.functions-gateway.testnet.chain.link/",
  ];
  const listing = await secretsManager.listDONHostedEncryptedSecrets(gateways);

  console.log(JSON.stringify(listing, null, 2));

  const latest = listing?.result?.[0]?.nodeResponses?.[0]?.rows?.[0];
  if (latest) {
    console.log(
      `最新 version = ${latest.version} (slot ${latest.slot_id})`
    );
  } else {
    console.log("当前没有任何存活的 DON‑hosted secrets。");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
