/**
 * HookSwap launchpad integration — v2 create + seed liquidity.
 *
 * Deposits a graduated token + the chain's WETH/native into a HookSwap v2 pool
 * so the token becomes swappable and routable on HookSwap.
 *
 * Runnable shape (ethers v6). Dependencies are NOT installed in this repo; run in
 * your own project:  npm i ethers  (and `ts-node`/`tsx` to execute a .ts file).
 *
 *   RPC_URL=... PRIVATE_KEY=0x... npx tsx createV2Pair.ts
 *
 * The opening price on a FRESH pair is defined purely by the deposit ratio
 * amountTokenDesired : ethAmount. Whatever you deposit IS the price.
 */

import { ethers } from 'ethers';
import addresses from '../addresses.json';
import V2FactoryAbi from '../abis/UniswapV2Factory.json';
import V2Router02Abi from '../abis/UniswapV2Router02.json';
import ERC20Abi from '../abis/ERC20.json';

// ---- config: edit these ----------------------------------------------------
const CHAIN_ID = '4326'; // MegaETH. Any key in addresses.json.
const LAUNCHED_TOKEN = '0xYourLaunchedTokenAddress';
const TREASURY = '0xYourLiquidityRecipient'; // receives the LP tokens
const AMOUNT_TOKEN = ethers.parseUnits('1000000', 18); // token side (adjust decimals)
const AMOUNT_ETH = ethers.parseEther('1'); // native/WETH side -> sets opening price
// ---------------------------------------------------------------------------

async function main() {
  const rpc = process.env.RPC_URL;
  const pk = process.env.PRIVATE_KEY;
  if (!rpc || !pk) throw new Error('set RPC_URL and PRIVATE_KEY');

  const a = (addresses.chains as Record<string, any>)[CHAIN_ID];
  if (!a) throw new Error(`no addresses for chain ${CHAIN_ID}`);
  if (CHAIN_ID === '4217') {
    throw new Error('Tempo has no native-gas wrapper; use addLiquidity(tokenA, tokenB) with an ERC-20 quote, not addLiquidityETH.');
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const signer = new ethers.Wallet(pk, provider);

  const factory = new ethers.Contract(a.v2Factory, V2FactoryAbi, signer);
  const router = new ethers.Contract(a.v2Router02, V2Router02Abi, signer);
  const token = new ethers.Contract(LAUNCHED_TOKEN, ERC20Abi, signer);

  // 1. Ensure the pair exists (optional: addLiquidityETH also creates it).
  let pair: string = await factory.getPair(LAUNCHED_TOKEN, a.weth);
  if (pair === ethers.ZeroAddress) {
    console.log('creating pair...');
    await (await factory.createPair(LAUNCHED_TOKEN, a.weth)).wait();
    pair = await factory.getPair(LAUNCHED_TOKEN, a.weth);
  }
  console.log('pair:', pair);

  // 2. Approve the router to pull the token side.
  const allowance: bigint = await token.allowance(await signer.getAddress(), a.v2Router02);
  if (allowance < AMOUNT_TOKEN) {
    console.log('approving router...');
    await (await token.approve(a.v2Router02, AMOUNT_TOKEN)).wait();
  }

  // 3. Seed liquidity. On a fresh pair there is no slippage, so mins == desired.
  const deadline = Math.floor(Date.now() / 1000) + 1200;
  console.log('adding liquidity...');
  const tx = await router.addLiquidityETH(
    LAUNCHED_TOKEN,
    AMOUNT_TOKEN, // amountTokenDesired
    AMOUNT_TOKEN, // amountTokenMin (fresh pair: exact)
    AMOUNT_ETH,   // amountETHMin  (fresh pair: exact)
    TREASURY,
    deadline,
    { value: AMOUNT_ETH },
  );
  const receipt = await tx.wait();
  console.log('seeded. tx:', receipt?.hash);

  // 4. Verify reserves are non-zero.
  const pairC = new ethers.Contract(
    pair,
    ['function getReserves() view returns (uint112,uint112,uint32)'],
    provider,
  );
  const [r0, r1] = await pairC.getReserves();
  console.log('reserves:', r0.toString(), r1.toString());
  if (r0 === 0n || r1 === 0n) throw new Error('pool has no liquidity');
  console.log('OK — pool is live and routable against WETH.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
