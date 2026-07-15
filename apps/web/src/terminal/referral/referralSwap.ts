/**
 * HookSwap Terminal — referral-routed swap utilities.
 *
 * When a stored referral code exists (`?ref=CODE` captured by `useCaptureRef`),
 * eligible swaps are routed through the ReferralRouter instead of the Universal
 * Router. The RR skims a fee (defaultFeeBps, currently 0.3%) from the input token
 * and forwards the remainder through SwapRouter02 (v3 exactInputSingle).
 *
 * Eligibility: single-hop v3, ERC-20 input (not native ETH), chain has a deployed
 * ReferralRouter, stored referral code present, AND the user has approved the RR
 * for the input token (checked on-chain via allowance read).
 */
import { encodeFunctionData, keccak256, toBytes } from 'viem'
import { readContract } from 'wagmi/actions'
import { wagmiConfig } from '~/connection/wagmiConfig'
import { referralRouterAbi } from './abis'
import { getReferralRouter } from './addresses'
import { getStoredReferrer } from './useCaptureRef'

/** Minimal ERC-20 ABI for allowance reads. */
const erc20AllowanceAbi = [
  {
    type: 'function' as const,
    name: 'allowance',
    stateMutability: 'view' as const,
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

/**
 * Check if a swap can be routed through the ReferralRouter.
 *
 * Conditions:
 *   1. A referral code is stored in localStorage
 *   2. The chain has a deployed ReferralRouter
 *   3. Input is ERC-20 (native ETH is not supported by the RR's transferFrom)
 */
export function canUseReferralRouter(chainId: number, isNativeIn: boolean): boolean {
  return !!getStoredReferrer() && !!getReferralRouter(chainId) && !isNativeIn
}

/**
 * Check on-chain whether the user has approved the ReferralRouter for at least
 * `amountIn` of `tokenIn`. Returns true if allowance >= amountIn, false otherwise.
 *
 * If the RPC call fails, returns false (safe fallback — swap goes through the
 * normal UR path instead of reverting on-chain).
 */
export async function checkReferralAllowance(params: {
  chainId: number
  tokenIn: `0x${string}`
  owner: `0x${string}`
  amountIn: bigint
}): Promise<boolean> {
  const routerAddr = getReferralRouter(params.chainId)
  if (!routerAddr) {
    return false
  }
  try {
    const allowance = await readContract(wagmiConfig, {
      address: params.tokenIn,
      abi: erc20AllowanceAbi,
      functionName: 'allowance',
      args: [params.owner, routerAddr as `0x${string}`],
    })
    return (allowance as bigint) >= params.amountIn
  } catch {
    return false
  }
}

/**
 * Build a txRequest that calls ReferralRouter.swapExactInput instead of the UR.
 *
 * The caller should have verified allowance via `checkReferralAllowance` first.
 * If allowance is insufficient, the saga silently falls back to the normal UR path.
 */
export function buildReferralSwapTx(params: {
  chainId: number
  tokenIn: `0x${string}`
  tokenOut: `0x${string}`
  feeTier: number
  amountIn: bigint
  amountOutMin: bigint
  recipient: `0x${string}`
}): { to: `0x${string}`; data: `0x${string}`; value: bigint } {
  const referrer = getStoredReferrer()!
  const refCode = keccak256(toBytes(referrer))
  const routerAddr = getReferralRouter(params.chainId)!

  const data = encodeFunctionData({
    abi: referralRouterAbi,
    functionName: 'swapExactInput',
    args: [
      params.tokenIn,
      params.tokenOut,
      params.feeTier,
      params.amountIn,
      params.amountOutMin,
      params.recipient,
      refCode,
    ],
  })

  return { to: routerAddr as `0x${string}`, data, value: 0n }
}
