/**
 * HookSwap Terminal — client-side v2 REMOVE-liquidity.
 *
 * Burns a chosen portion of a wallet's LP (pair) tokens back into the two underlying
 * ERC-20s via the deployed own UniswapV2Router02. Self-contained CLIENT-SIDE flow (NO
 * backend, NO Permit2), mirroring `useCreateV2Pool`/`useAddV2Liquidity`: the LP token
 * IS a standard ERC-20, so the caller approves the PAIR address to the router (plain
 * ERC-20 `allowance`), then the router pulls + burns it.
 *
 * The hook keys off the PAIR ADDRESS and reads everything on-chain:
 *   • pair.balanceOf(owner)  → the wallet's LP balance
 *   • pair.getReserves()     → reserve0 / reserve1
 *   • pair.totalSupply()     → LP supply
 *   • pair.token0()          → maps reserves onto the caller's tokenA / tokenB
 *   • pair.allowance(owner, router) → the LP-token approval gate
 *
 * Expected output (constant-product pro-rata share of reserves):
 *   amountOut(token) = reserve(token) * liquidity / totalSupply
 * `slippageBips` (default 50 = 0.5%) is applied to each to derive the router `min`s:
 *   min = amountOut * (10000 - bips) / 10000
 *
 * Native vs WETH output: when one side is the chain's WETH and `receiveNative` is true,
 * `removeLiquidityETH(token, liquidity, tokenMin, ethMin, to, deadline)` unwraps the
 * WETH side to native ETH; otherwise `removeLiquidity(tokenA, tokenB, …)` returns both
 * ERC-20s (WETH stays wrapped).
 *
 * All reads/writes are REAL (wagmi), gated behind the LP-token allowance so a remove
 * tx can never be signed while it would revert for a missing approval.
 */
import { useEffect, useMemo, useState } from 'react'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { erc20Abi, formatUnits, isAddress, type Address, type Hash } from '~/chains'
import { useGetTransactionDeadline } from '~/hooks/useTransactionDeadline'
import { getPoolAddresses } from '~/terminal/pools/addresses'
import { poolPairAbi, poolRouter02Abi } from '~/terminal/pools/abis'
import { assume0xAddress } from '~/utils/wagmi'

/** UniswapV2 LP (pair) tokens are always 18-decimals (canonical UniswapV2ERC20). */
export const LP_TOKEN_DECIMALS = 18

/** Default slippage tolerance applied to the router `min`s (0.5%). */
export const DEFAULT_REMOVE_SLIPPAGE_BIPS = 50

/** One side of the pair (either may be the chain's WETH). Metadata only. */
export interface RemoveTokenInput {
  /** ERC-20 address of this pair side. */
  address?: string
  decimals?: number
  symbol?: string
}

export interface UseRemoveV2Liquidity {
  /** True when the chain has a v2 stack wired (addresses present). */
  ready: boolean

  /** On-chain LP balance for `owner` (raw / formatted, 18 decimals). */
  lpBalanceRaw?: bigint
  lpBalanceFormatted?: string
  /** LP amount that will actually be removed (raw), derived from percent or lpAmount. */
  liquidityRaw?: bigint

  /** True when the pair has a WETH side that can be unwrapped to native ETH. */
  hasNativeSide: boolean
  /** True when this remove will unwrap the WETH side to native ETH (removeLiquidityETH). */
  willReceiveNative: boolean

  /** Expected amounts out, keyed to the caller's tokenA / tokenB (raw / formatted). */
  expectedAmountARaw?: bigint
  expectedAmountBRaw?: bigint
  expectedAmountAFormatted?: string
  expectedAmountBFormatted?: string
  /** Slippage-adjusted router `min`s (raw), keyed to tokenA / tokenB. */
  minAmountARaw?: bigint
  minAmountBRaw?: bigint

  // LP-token allowance gate → the router.
  needsApproval: boolean
  approving: boolean
  approve: () => Promise<void>

  // Remove.
  inputsValid: boolean
  canRemove: boolean
  remove: () => Promise<void>
  isWritePending: boolean
  removeHash?: Hash
  isConfirming: boolean
  isDone: boolean
  error?: string
  reset: () => void
}

/** min = amount * (10000 - bips) / 10000 (integer floor), clamped to a sane bips range. */
function applySlippageMin(amount: bigint, bips: number): bigint {
  const b = BigInt(Math.max(0, Math.min(10000, Math.round(bips))))
  return (amount * (10000n - b)) / 10000n
}

export function useRemoveV2Liquidity({
  chainId,
  owner,
  pairAddress,
  tokenA,
  tokenB,
  percent,
  lpAmount,
  receiveNative = true,
  slippageBips = DEFAULT_REMOVE_SLIPPAGE_BIPS,
}: {
  chainId?: number
  owner?: Address
  /** The v2 pair (LP token) address — the key everything reads from. */
  pairAddress?: string
  tokenA: RemoveTokenInput
  tokenB: RemoveTokenInput
  /** Portion of the LP balance to remove, 0–100. Ignored when `lpAmount` is set. */
  percent?: number
  /** Explicit raw LP amount to remove (overrides `percent`). */
  lpAmount?: bigint
  /** Unwrap the WETH side to native ETH when the pair has one. Default true. */
  receiveNative?: boolean
  slippageBips?: number
}): UseRemoveV2Liquidity {
  const addrs = getPoolAddresses(chainId)
  const ready = Boolean(addrs)
  const router = addrs?.v2Router02
  const weth = addrs?.weth

  const pair = isAddress(pairAddress ?? '') ? assume0xAddress(pairAddress) : undefined
  const tokenAAddr = isAddress(tokenA.address ?? '') ? assume0xAddress(tokenA.address) : undefined
  const tokenBAddr = isAddress(tokenB.address ?? '') ? assume0xAddress(tokenB.address) : undefined

  /* ------------------------------------------------------------- on-chain reads */

  const balanceRead = useReadContract({
    address: pair,
    chainId,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    query: { enabled: Boolean(pair && owner) },
  })
  const reservesRead = useReadContract({
    address: pair,
    chainId,
    abi: poolPairAbi,
    functionName: 'getReserves',
    query: { enabled: Boolean(pair) },
  })
  const totalSupplyRead = useReadContract({
    address: pair,
    chainId,
    abi: poolPairAbi,
    functionName: 'totalSupply',
    query: { enabled: Boolean(pair) },
  })
  const token0Read = useReadContract({
    address: pair,
    chainId,
    abi: poolPairAbi,
    functionName: 'token0',
    query: { enabled: Boolean(pair) },
  })
  const allowanceRead = useReadContract({
    address: pair,
    chainId,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && router ? [owner, assume0xAddress(router)] : undefined,
    query: { enabled: Boolean(pair && owner && router) },
  })

  const lpBalanceRaw = balanceRead.data as bigint | undefined
  const reserves = reservesRead.data as readonly [bigint, bigint, number] | undefined
  const totalSupply = totalSupplyRead.data as bigint | undefined
  const token0 = token0Read.data as Address | undefined
  const lpAllowance = allowanceRead.data as bigint | undefined

  const lpBalanceFormatted =
    lpBalanceRaw !== undefined ? formatUnits(lpBalanceRaw, LP_TOKEN_DECIMALS) : undefined

  /* ------------------------------------------------------------- liquidity to remove */

  // Explicit lpAmount wins; otherwise take `percent` of the on-chain LP balance.
  let liquidityRaw: bigint | undefined
  if (lpAmount !== undefined) {
    liquidityRaw = lpAmount
  } else if (percent !== undefined && lpBalanceRaw !== undefined) {
    const bips = BigInt(Math.max(0, Math.min(10000, Math.round(percent * 100))))
    liquidityRaw = (lpBalanceRaw * bips) / 10000n
  }
  // Never attempt to remove more than the wallet holds.
  if (liquidityRaw !== undefined && lpBalanceRaw !== undefined && liquidityRaw > lpBalanceRaw) {
    liquidityRaw = lpBalanceRaw
  }

  /* ------------------------------------------------------------- reserve mapping */

  // reserve0/reserve1 follow token0/token1 → map onto the caller's tokenA / tokenB.
  const token0IsA =
    token0 !== undefined && tokenAAddr !== undefined && token0.toLowerCase() === tokenAAddr.toLowerCase()
  const reserveA = reserves ? (token0IsA ? reserves[0] : reserves[1]) : undefined
  const reserveB = reserves ? (token0IsA ? reserves[1] : reserves[0]) : undefined

  const canCompute =
    liquidityRaw !== undefined &&
    liquidityRaw > 0n &&
    totalSupply !== undefined &&
    totalSupply > 0n &&
    reserveA !== undefined &&
    reserveB !== undefined

  const expectedAmountARaw = canCompute ? (reserveA! * liquidityRaw!) / totalSupply! : undefined
  const expectedAmountBRaw = canCompute ? (reserveB! * liquidityRaw!) / totalSupply! : undefined
  const minAmountARaw = expectedAmountARaw !== undefined ? applySlippageMin(expectedAmountARaw, slippageBips) : undefined
  const minAmountBRaw = expectedAmountBRaw !== undefined ? applySlippageMin(expectedAmountBRaw, slippageBips) : undefined

  const expectedAmountAFormatted =
    expectedAmountARaw !== undefined && tokenA.decimals !== undefined
      ? formatUnits(expectedAmountARaw, tokenA.decimals)
      : undefined
  const expectedAmountBFormatted =
    expectedAmountBRaw !== undefined && tokenB.decimals !== undefined
      ? formatUnits(expectedAmountBRaw, tokenB.decimals)
      : undefined

  /* ------------------------------------------------------------- native-side detection */

  const wethLower = weth?.toLowerCase()
  const aIsWeth = Boolean(wethLower && tokenAAddr && tokenAAddr.toLowerCase() === wethLower)
  const bIsWeth = Boolean(wethLower && tokenBAddr && tokenBAddr.toLowerCase() === wethLower)
  const hasNativeSide = aIsWeth || bIsWeth
  const willReceiveNative = receiveNative && hasNativeSide

  /* ------------------------------------------------------------- writes */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()
  const getDeadline = useGetTransactionDeadline()

  const [approveHash, setApproveHash] = useState<Hash | undefined>(undefined)
  const [removeHash, setRemoveHash] = useState<Hash | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  const approveReceipt = useWaitForTransactionReceipt({ hash: approveHash, chainId })
  const removeReceipt = useWaitForTransactionReceipt({ hash: removeHash, chainId })

  const approving = Boolean(approveHash) && approveReceipt.isLoading
  const isConfirming = Boolean(removeHash) && removeReceipt.isLoading
  const isDone = Boolean(removeHash) && removeReceipt.isSuccess

  const needsApproval =
    liquidityRaw !== undefined && liquidityRaw > 0n && lpAllowance !== undefined && lpAllowance < liquidityRaw

  useEffect(() => {
    if (approveReceipt.isSuccess) {
      void allowanceRead.refetch()
      setApproveHash(undefined)
    }
  }, [approveReceipt.isSuccess, allowanceRead])

  useEffect(() => {
    if (removeReceipt.isSuccess) {
      void balanceRead.refetch()
      void reservesRead.refetch()
      void totalSupplyRead.refetch()
    }
  }, [removeReceipt.isSuccess, balanceRead, reservesRead, totalSupplyRead])

  const approve = async (): Promise<void> => {
    if (!pair || !router || liquidityRaw === undefined || liquidityRaw <= 0n) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: pair,
        chainId,
        abi: erc20Abi,
        functionName: 'approve',
        args: [assume0xAddress(router), liquidityRaw],
      })
      setApproveHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const inputsValid = Boolean(
    ready &&
      owner &&
      router &&
      pair &&
      tokenAAddr &&
      tokenBAddr &&
      liquidityRaw !== undefined &&
      liquidityRaw > 0n &&
      expectedAmountARaw !== undefined &&
      expectedAmountBRaw !== undefined &&
      minAmountARaw !== undefined &&
      minAmountBRaw !== undefined,
  )
  const canRemove = inputsValid && !needsApproval && !isWritePending

  const remove = async (): Promise<void> => {
    if (
      !canRemove ||
      !router ||
      !owner ||
      tokenAAddr === undefined ||
      tokenBAddr === undefined ||
      liquidityRaw === undefined ||
      minAmountARaw === undefined ||
      minAmountBRaw === undefined
    ) {
      return
    }
    setError(undefined)
    // Deadline: prefer the on-chain-timestamp helper; fall back to a client-side 20-min
    // window when it can't resolve (its multicall targets the swap context's chain).
    let deadline: bigint
    try {
      deadline = (await getDeadline())?.toBigInt() ?? BigInt(Math.floor(Date.now() / 1000) + 1200)
    } catch {
      deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
    }
    const routerAddr = assume0xAddress(router)
    try {
      let hash: Hash
      if (willReceiveNative) {
        // Unwrap the WETH side → native ETH. `token` is the NON-WETH side; the WETH
        // side's min becomes `amountETHMin`.
        const tokenIsA = !aIsWeth // if A is WETH, the non-WETH token is B
        const tokenParam = tokenIsA ? tokenAAddr : tokenBAddr
        const tokenMin = tokenIsA ? minAmountARaw : minAmountBRaw
        const ethMin = tokenIsA ? minAmountBRaw : minAmountARaw
        hash = await writeContractAsync({
          address: routerAddr,
          chainId,
          abi: poolRouter02Abi,
          functionName: 'removeLiquidityETH',
          args: [tokenParam, liquidityRaw, tokenMin, ethMin, owner, deadline],
        })
      } else {
        hash = await writeContractAsync({
          address: routerAddr,
          chainId,
          abi: poolRouter02Abi,
          functionName: 'removeLiquidity',
          args: [tokenAAddr, tokenBAddr, liquidityRaw, minAmountARaw, minAmountBRaw, owner, deadline],
        })
      }
      setRemoveHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const reset = (): void => {
    setRemoveHash(undefined)
    setApproveHash(undefined)
    setError(undefined)
  }

  return useMemo(
    () => ({
      ready,
      lpBalanceRaw,
      lpBalanceFormatted,
      liquidityRaw,
      hasNativeSide,
      willReceiveNative,
      expectedAmountARaw,
      expectedAmountBRaw,
      expectedAmountAFormatted,
      expectedAmountBFormatted,
      minAmountARaw,
      minAmountBRaw,
      needsApproval,
      approving,
      approve,
      inputsValid,
      canRemove,
      remove,
      isWritePending,
      removeHash,
      isConfirming,
      isDone,
      error,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      ready,
      lpBalanceRaw,
      lpBalanceFormatted,
      liquidityRaw,
      hasNativeSide,
      willReceiveNative,
      expectedAmountARaw,
      expectedAmountBRaw,
      expectedAmountAFormatted,
      expectedAmountBFormatted,
      minAmountARaw,
      minAmountBRaw,
      needsApproval,
      approving,
      inputsValid,
      canRemove,
      isWritePending,
      removeHash,
      isConfirming,
      isDone,
      error,
    ],
  )
}

/** Best-effort human-readable error, dropping the giant viem stack. */
function toMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'shortMessage' in e && typeof (e as { shortMessage: unknown }).shortMessage === 'string') {
    return (e as { shortMessage: string }).shortMessage
  }
  if (e instanceof Error) {
    return e.message.split('\n')[0]
  }
  return 'Transaction failed'
}
