/**
 * HookSwap Terminal — referral-routed swap utilities.
 *
 * When a stored referral code exists (`?ref=CODE` captured by `useCaptureRef`),
 * eligible swaps are routed through the ReferralRouter instead of the Universal
 * Router. The RR skims a fee (defaultFeeBps, currently 0.3%) from the input token
 * and forwards the remainder through SwapRouter02 (v3 exactInputSingle).
 *
 * Eligibility: single-hop v3, ERC-20 input (not native ETH), chain has a deployed
 * ReferralRouter, stored referral code present.
 */
import { encodeFunctionData, keccak256, toBytes } from 'viem'
import { referralRouterAbi } from './abis'
import { getReferralRouter } from './addresses'
import { getStoredReferrer } from './useCaptureRef'

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
 * Build a txRequest that calls ReferralRouter.swapExactInput instead of the UR.
 *
 * The user must have approved the ReferralRouter for `tokenIn` (standard ERC-20
 * approve, NOT Permit2). If approval is missing the tx will revert on-chain with
 * a clear transferFrom error — the interface's existing approval check flow does
 * not cover the RR (it checks Permit2), so this is best-effort for now.
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
