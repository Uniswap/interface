/**
 * HookSwap Terminal — client-side v2 ADD-liquidity to an EXISTING pool.
 *
 * This is the reserve-ratio case that `useCreateV2Pool` explicitly deferred as
 * "Phase 2": the pair already has reserves, so a deposit must match the current
 * pool ratio and both `min` amounts must be slippage-protected (the ratio can move
 * between the read and the mined tx). Self-contained CLIENT-SIDE flow (NO backend,
 * NO Permit2), mirroring `useCreateV2Pool`: the deployed own UniswapV2Router02 pulls
 * each ERC-20 side via a plain ERC-20 `allowance`, then `addLiquidity` /
 * `addLiquidityETH` deposits into the existing pair.
 *
 * Pairing math (constant-product, matching UniswapV2Router02.quote — pure integer
 * floor division): for the side the user did NOT type,
 *   amountOther = amountTyped * reserveOther / reserveTyped
 * `reserveBase` / `reserveProject` are the on-chain reserves mapped onto the caller's
 * base/project tokens via `token0()` (getReserves' reserve0/reserve1 follow
 * token0()/token1()). The native base maps to the WETH reserve.
 *
 * Slippage: `slippageBips` (default 50 = 0.5%) is applied to BOTH desired amounts to
 * derive the router `min`s → `min = desired * (10000 - bips) / 10000`.
 *
 * Semantics (mirrors `useCreateV2Pool`):
 *   • Native base (ETH on Robinhood) + ERC-20 project → `addLiquidityETH(project,
 *     projectDesired, projectMin, ethMin, to, deadline, { value: ethDesired })`. The
 *     router wraps ETH into WETH; native needs NO approval.
 *   • Two ERC-20s → `addLiquidity(base, project, …)`; both sides need an allowance.
 *
 * All reads/writes are REAL (wagmi), gated behind the required allowances so an add
 * tx can never be signed while it would revert for a missing approval.
 */
import { useEffect, useMemo, useState } from 'react'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { erc20Abi, formatUnits, isAddress, parseUnits, zeroAddress, type Address, type Hash } from '~/chains'
import { useGetTransactionDeadline } from '~/hooks/useTransactionDeadline'
import { getPoolAddresses } from '~/terminal/pools/addresses'
import { poolFactoryAbi, poolPairAbi, poolRouter02Abi } from '~/terminal/pools/abis'
import { assume0xAddress } from '~/utils/wagmi'
import type { PoolTokenInput } from '~/terminal/pools/useCreateV2Pool'

/** Which side the user typed `inputAmount` for; the other side is computed. */
export type AddLiquiditySide = 'base' | 'project'

/** Default slippage tolerance applied to the router `min`s (0.5%). */
export const DEFAULT_ADD_SLIPPAGE_BIPS = 50

export interface UseAddV2Liquidity {
  /** True when the chain has a v2 stack wired (addresses present). */
  ready: boolean
  /** Whichever side is the chain's native currency (needs no approval), else false. */
  baseIsNative: boolean

  /** On-chain reserves loaded for the pair. */
  reservesLoaded: boolean
  /** Pair has non-zero reserves — required to derive the deposit ratio. */
  poolHasReserves: boolean

  /** Parsed / derived desired amounts (raw). Both are set once inputs are valid. */
  baseRaw?: bigint
  projectRaw?: bigint
  /** Slippage-adjusted router `min`s (raw). */
  baseMinRaw?: bigint
  projectMinRaw?: bigint
  /**
   * Human-readable amounts for BOTH sides (the typed side echoes the input, the
   * derived side is the computed counterpart the UI fills into the other field).
   */
  baseAmountFormatted?: string
  projectAmountFormatted?: string

  // Allowance gates (per ERC-20 side) — native base has no gate.
  needsBaseApproval: boolean
  needsProjectApproval: boolean
  baseApproving: boolean
  projectApproving: boolean
  approveBase: () => Promise<void>
  approveProject: () => Promise<void>

  // Add.
  inputsValid: boolean
  canAdd: boolean
  add: () => Promise<void>
  isWritePending: boolean
  addHash?: Hash
  isConfirming: boolean
  isDone: boolean
  error?: string
  reset: () => void
}

function isNativeAddr(addr?: string): boolean {
  return addr === NATIVE_CHAIN_ID
}

/** parseUnits that returns undefined for an empty/zero/invalid amount (never throws). */
function tryParse(amount: string, decimals?: number): bigint | undefined {
  if (!amount || decimals === undefined) {
    return undefined
  }
  const n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) {
    return undefined
  }
  try {
    const raw = parseUnits(amount, decimals)
    return raw > 0n ? raw : undefined
  } catch {
    return undefined
  }
}

/** min = amount * (10000 - bips) / 10000 (integer floor), clamped to a sane bips range. */
function applySlippageMin(amount: bigint, bips: number): bigint {
  const b = BigInt(Math.max(0, Math.min(10000, Math.round(bips))))
  return (amount * (10000n - b)) / 10000n
}

export function useAddV2Liquidity({
  chainId,
  owner,
  base,
  project,
  inputSide,
  inputAmount,
  slippageBips = DEFAULT_ADD_SLIPPAGE_BIPS,
}: {
  chainId?: number
  owner?: Address
  base: PoolTokenInput
  project: PoolTokenInput
  /** Which side `inputAmount` refers to — the other side is derived from reserves. */
  inputSide: AddLiquiditySide
  inputAmount: string
  slippageBips?: number
}): UseAddV2Liquidity {
  const addrs = getPoolAddresses(chainId)
  const ready = Boolean(addrs)
  const router = addrs?.v2Router02
  const factory = addrs?.v2Factory
  const weth = addrs?.weth

  const baseIsNative = isNativeAddr(base.address)
  const baseDecimals = baseIsNative ? 18 : base.decimals
  const projectDecimals = project.decimals
  const baseErc20 = !baseIsNative && isAddress(base.address ?? '') ? assume0xAddress(base.address) : undefined
  const projectAddr = isAddress(project.address ?? '') ? assume0xAddress(project.address) : undefined

  // The pair token for the base side is WETH when the base is native.
  const pairBaseToken = baseIsNative ? assume0xAddress(weth) : baseErc20
  const pairArgsReady = Boolean(pairBaseToken && projectAddr)

  /* ------------------------------------------------------------- resolve the pair */

  const getPairRead = useReadContract({
    address: assume0xAddress(factory),
    chainId,
    abi: poolFactoryAbi,
    functionName: 'getPair',
    args: pairArgsReady ? [pairBaseToken as Address, projectAddr as Address] : undefined,
    query: { enabled: ready && pairArgsReady },
  })
  const rawPair = getPairRead.data as Address | undefined
  const pairAddress = rawPair && rawPair !== zeroAddress ? rawPair : undefined

  /* ------------------------------------------------------------- reserves + ordering */

  const reservesRead = useReadContract({
    address: pairAddress,
    chainId,
    abi: poolPairAbi,
    functionName: 'getReserves',
    query: { enabled: Boolean(pairAddress) },
  })
  const token0Read = useReadContract({
    address: pairAddress,
    chainId,
    abi: poolPairAbi,
    functionName: 'token0',
    query: { enabled: Boolean(pairAddress) },
  })
  const reserves = reservesRead.data as readonly [bigint, bigint, number] | undefined
  const token0 = token0Read.data as Address | undefined

  const reservesLoaded = Boolean(reserves && token0)
  // Map reserve0/reserve1 (which follow token0/token1) onto base/project.
  const token0IsBase =
    token0 !== undefined && pairBaseToken !== undefined && token0.toLowerCase() === pairBaseToken.toLowerCase()
  const reserveBase = reserves ? (token0IsBase ? reserves[0] : reserves[1]) : undefined
  const reserveProject = reserves ? (token0IsBase ? reserves[1] : reserves[0]) : undefined
  const poolHasReserves = Boolean(reserveBase && reserveProject && reserveBase > 0n && reserveProject > 0n)

  /* ------------------------------------------------------------- pairing math */

  // Typed side is parsed; the other side is derived from the pool ratio.
  let baseRaw: bigint | undefined
  let projectRaw: bigint | undefined
  if (inputSide === 'base') {
    baseRaw = tryParse(inputAmount, baseDecimals)
    projectRaw =
      baseRaw !== undefined && poolHasReserves && reserveBase && reserveProject
        ? (baseRaw * reserveProject) / reserveBase
        : undefined
  } else {
    projectRaw = tryParse(inputAmount, projectDecimals)
    baseRaw =
      projectRaw !== undefined && poolHasReserves && reserveBase && reserveProject
        ? (projectRaw * reserveBase) / reserveProject
        : undefined
  }

  const baseMinRaw = baseRaw !== undefined ? applySlippageMin(baseRaw, slippageBips) : undefined
  const projectMinRaw = projectRaw !== undefined ? applySlippageMin(projectRaw, slippageBips) : undefined

  const baseAmountFormatted =
    baseRaw !== undefined && baseDecimals !== undefined ? formatUnits(baseRaw, baseDecimals) : undefined
  const projectAmountFormatted =
    projectRaw !== undefined && projectDecimals !== undefined ? formatUnits(projectRaw, projectDecimals) : undefined

  /* ------------------------------------------------------------- allowance gates */

  const projectAllowanceRead = useReadContract({
    address: projectAddr,
    chainId,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && router ? [owner, assume0xAddress(router)] : undefined,
    query: { enabled: ready && Boolean(projectAddr && owner && router) },
  })
  const projectAllowance = projectAllowanceRead.data as bigint | undefined
  const needsProjectApproval =
    projectRaw !== undefined && projectAllowance !== undefined && projectAllowance < projectRaw

  const baseAllowanceRead = useReadContract({
    address: baseErc20,
    chainId,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && router ? [owner, assume0xAddress(router)] : undefined,
    query: { enabled: ready && Boolean(baseErc20 && owner && router) },
  })
  const baseAllowance = baseAllowanceRead.data as bigint | undefined
  const needsBaseApproval =
    !baseIsNative && baseRaw !== undefined && baseAllowance !== undefined && baseAllowance < baseRaw

  /* ------------------------------------------------------------- writes */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()
  const getDeadline = useGetTransactionDeadline()

  const [baseApproveHash, setBaseApproveHash] = useState<Hash | undefined>(undefined)
  const [projectApproveHash, setProjectApproveHash] = useState<Hash | undefined>(undefined)
  const [addHash, setAddHash] = useState<Hash | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  const baseApproveReceipt = useWaitForTransactionReceipt({ hash: baseApproveHash, chainId })
  const projectApproveReceipt = useWaitForTransactionReceipt({ hash: projectApproveHash, chainId })
  const addReceipt = useWaitForTransactionReceipt({ hash: addHash, chainId })

  const baseApproving = Boolean(baseApproveHash) && baseApproveReceipt.isLoading
  const projectApproving = Boolean(projectApproveHash) && projectApproveReceipt.isLoading
  const isConfirming = Boolean(addHash) && addReceipt.isLoading
  const isDone = Boolean(addHash) && addReceipt.isSuccess

  useEffect(() => {
    if (baseApproveReceipt.isSuccess) {
      void baseAllowanceRead.refetch()
      setBaseApproveHash(undefined)
    }
  }, [baseApproveReceipt.isSuccess, baseAllowanceRead])

  useEffect(() => {
    if (projectApproveReceipt.isSuccess) {
      void projectAllowanceRead.refetch()
      setProjectApproveHash(undefined)
    }
  }, [projectApproveReceipt.isSuccess, projectAllowanceRead])

  useEffect(() => {
    if (addReceipt.isSuccess) {
      void reservesRead.refetch()
    }
  }, [addReceipt.isSuccess, reservesRead])

  const approveBase = async (): Promise<void> => {
    if (!baseErc20 || !router || baseRaw === undefined) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: baseErc20,
        chainId,
        abi: erc20Abi,
        functionName: 'approve',
        args: [assume0xAddress(router), baseRaw],
      })
      setBaseApproveHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const approveProject = async (): Promise<void> => {
    if (!projectAddr || !router || projectRaw === undefined) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: projectAddr,
        chainId,
        abi: erc20Abi,
        functionName: 'approve',
        args: [assume0xAddress(router), projectRaw],
      })
      setProjectApproveHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const inputsValid = Boolean(
    ready &&
      owner &&
      router &&
      projectAddr &&
      (baseIsNative || baseErc20) &&
      poolHasReserves &&
      baseRaw !== undefined &&
      projectRaw !== undefined &&
      baseMinRaw !== undefined &&
      projectMinRaw !== undefined,
  )
  const canAdd = inputsValid && !needsBaseApproval && !needsProjectApproval && !isWritePending

  const add = async (): Promise<void> => {
    if (
      !canAdd ||
      !router ||
      !owner ||
      projectAddr === undefined ||
      baseRaw === undefined ||
      projectRaw === undefined ||
      baseMinRaw === undefined ||
      projectMinRaw === undefined
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
      if (baseIsNative) {
        // Native base → addLiquidityETH(project, projectDesired, projectMin, ethMin, to, deadline){value}
        hash = await writeContractAsync({
          address: routerAddr,
          chainId,
          abi: poolRouter02Abi,
          functionName: 'addLiquidityETH',
          args: [projectAddr, projectRaw, projectMinRaw, baseMinRaw, owner, deadline],
          value: baseRaw,
        })
      } else {
        if (baseErc20 === undefined) {
          return
        }
        hash = await writeContractAsync({
          address: routerAddr,
          chainId,
          abi: poolRouter02Abi,
          functionName: 'addLiquidity',
          args: [baseErc20, projectAddr, baseRaw, projectRaw, baseMinRaw, projectMinRaw, owner, deadline],
        })
      }
      setAddHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const reset = (): void => {
    setAddHash(undefined)
    setBaseApproveHash(undefined)
    setProjectApproveHash(undefined)
    setError(undefined)
  }

  return useMemo(
    () => ({
      ready,
      baseIsNative,
      reservesLoaded,
      poolHasReserves,
      baseRaw,
      projectRaw,
      baseMinRaw,
      projectMinRaw,
      baseAmountFormatted,
      projectAmountFormatted,
      needsBaseApproval,
      needsProjectApproval,
      baseApproving,
      projectApproving,
      approveBase,
      approveProject,
      inputsValid,
      canAdd,
      add,
      isWritePending,
      addHash,
      isConfirming,
      isDone,
      error,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      ready,
      baseIsNative,
      reservesLoaded,
      poolHasReserves,
      baseRaw,
      projectRaw,
      baseMinRaw,
      projectMinRaw,
      baseAmountFormatted,
      projectAmountFormatted,
      needsBaseApproval,
      needsProjectApproval,
      baseApproving,
      projectApproving,
      inputsValid,
      canAdd,
      isWritePending,
      addHash,
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
