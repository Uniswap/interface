/**
 * HookSwap Terminal — client-side v2 pool creation + liquidity seeding.
 *
 * Self-contained CLIENT-SIDE flow (NO backend, NO Permit2): the deployed own
 * UniswapV2Router02 pulls each ERC-20 side via a plain ERC-20 `allowance`, and
 * `addLiquidity` / `addLiquidityETH` CREATES the pair on the first add. So creating a
 * brand-new pool is: approve each ERC-20 side to the router → call the router.
 *
 * Semantics (mirrors `contracts/seed/SeedLiquidity.s.sol` + `launchpad-integration/
 * examples/createV2Pair.ts`):
 *   • Native base (ETH on Robinhood) + ERC-20 project  → `addLiquidityETH(project,
 *     projectDesired, projectMin, ethMin, to, deadline, { value: ethDesired })`. The
 *     router wraps ETH into WETH; the pair is WETH/project. Native needs NO approval.
 *   • Two ERC-20s → `addLiquidity(base, project, …)`; both sides need an allowance.
 *   • First LP: the opening price IS the deposit ratio (no slippage), so mins ==
 *     desired. Detected via `factory.getPair == 0x0` OR an existing pair with zero
 *     reserves. Adding to a pool that already HAS reserves needs reserve-ratio-aware
 *     mins + slippage → deferred to Phase 2 (this hook reports `existingLiquidity`
 *     so the UI can gate it honestly rather than send a tx that could revert).
 *
 * All reads/writes are REAL (wagmi), gated behind the required allowance so a create
 * tx can never be signed while it would revert for a missing approval — exactly the
 * LockerScreen approach, extended to two approvable sides.
 */
import { useEffect, useMemo, useState } from 'react'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { erc20Abi, isAddress, parseUnits, zeroAddress, type Address, type Hash } from '~/chains'
import { useGetTransactionDeadline } from '~/hooks/useTransactionDeadline'
import { getPoolAddresses } from '~/terminal/pools/addresses'
import { poolFactoryAbi, poolPairAbi, poolRouter02Abi } from '~/terminal/pools/abis'
import { assume0xAddress } from '~/utils/wagmi'

export interface PoolTokenInput {
  /** ERC-20 address, or the NATIVE sentinel (`NATIVE_CHAIN_ID`) for the native currency. */
  address?: string
  decimals?: number
  symbol?: string
}

export interface UseCreateV2Pool {
  /** True when the chain has a v2 stack wired (addresses present). */
  ready: boolean
  /** Resolved pair address (`getPair`), or undefined while loading / no pair yet. */
  pairAddress?: Address
  /** No pool for this pair yet (factory returns 0x0). */
  noPairYet: boolean
  /** First-LP path: no pair, or a pair with zero reserves. Opening price = deposit ratio. */
  isFirstLp: boolean
  /** Pair already has reserves → Phase 2 (needs reserve-ratio mins). MVP gates this off. */
  existingLiquidity: boolean
  /** Whichever side is the chain's native currency (needs no approval), else undefined. */
  baseIsNative: boolean
  /** Parsed desired amounts (raw), or undefined when inputs are incomplete. */
  baseRaw?: bigint
  projectRaw?: bigint

  // Allowance gates (per ERC-20 side) — native base has no gate.
  needsBaseApproval: boolean
  needsProjectApproval: boolean
  baseApproving: boolean
  projectApproving: boolean
  approveBase: () => Promise<void>
  approveProject: () => Promise<void>

  // Create + seed.
  inputsValid: boolean
  canCreate: boolean
  create: () => Promise<void>
  isWritePending: boolean
  createHash?: Hash
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

export function useCreateV2Pool({
  chainId,
  owner,
  base,
  project,
  baseAmount,
  projectAmount,
}: {
  chainId?: number
  owner?: Address
  base: PoolTokenInput
  project: PoolTokenInput
  baseAmount: string
  projectAmount: string
}): UseCreateV2Pool {
  const addrs = getPoolAddresses(chainId)
  const ready = Boolean(addrs)
  const router = addrs?.v2Router02
  const factory = addrs?.v2Factory
  const weth = addrs?.weth

  const baseIsNative = isNativeAddr(base.address)
  const baseDecimals = baseIsNative ? 18 : base.decimals
  const baseErc20 = !baseIsNative && isAddress(base.address ?? '') ? assume0xAddress(base.address) : undefined
  const projectAddr = isAddress(project.address ?? '') ? assume0xAddress(project.address) : undefined

  const baseRaw = tryParse(baseAmount, baseDecimals)
  const projectRaw = tryParse(projectAmount, project.decimals)

  // The pair token for the base side is WETH when the base is native (the router
  // deposits into the WETH/project pair), else the base ERC-20 itself.
  const pairBaseToken = baseIsNative ? assume0xAddress(weth) : baseErc20
  const pairArgsReady = Boolean(pairBaseToken && projectAddr)

  /* --------------------------------------------------------------- first-LP detection */

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
  const noPairYet = getPairRead.isSuccess && !pairAddress

  const reservesRead = useReadContract({
    address: pairAddress,
    chainId,
    abi: poolPairAbi,
    functionName: 'getReserves',
    query: { enabled: Boolean(pairAddress) },
  })
  const reserves = reservesRead.data as readonly [bigint, bigint, number] | undefined
  const pairHasReserves = reserves ? reserves[0] > 0n && reserves[1] > 0n : undefined

  // First LP: no pair at all, OR a pair that exists but has zero reserves. Existing
  // liquidity (reserves > 0) is Phase 2 (reserve-ratio-aware mins + slippage).
  const isFirstLp = noPairYet || (Boolean(pairAddress) && pairHasReserves === false)
  const existingLiquidity = Boolean(pairAddress) && pairHasReserves === true

  /* --------------------------------------------------------------- allowance gates */

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

  /* --------------------------------------------------------------- writes */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()
  const getDeadline = useGetTransactionDeadline()

  const [baseApproveHash, setBaseApproveHash] = useState<Hash | undefined>(undefined)
  const [projectApproveHash, setProjectApproveHash] = useState<Hash | undefined>(undefined)
  const [createHash, setCreateHash] = useState<Hash | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  const baseApproveReceipt = useWaitForTransactionReceipt({ hash: baseApproveHash, chainId })
  const projectApproveReceipt = useWaitForTransactionReceipt({ hash: projectApproveHash, chainId })
  const createReceipt = useWaitForTransactionReceipt({ hash: createHash, chainId })

  const baseApproving = Boolean(baseApproveHash) && baseApproveReceipt.isLoading
  const projectApproving = Boolean(projectApproveHash) && projectApproveReceipt.isLoading
  const isConfirming = Boolean(createHash) && createReceipt.isLoading
  const isDone = Boolean(createHash) && createReceipt.isSuccess

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
    if (createReceipt.isSuccess) {
      void getPairRead.refetch()
      void reservesRead.refetch()
    }
  }, [createReceipt.isSuccess, getPairRead, reservesRead])

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

  // Inputs are complete + this is a first-LP add (MVP), with no outstanding approval.
  const inputsValid = Boolean(
    ready &&
      owner &&
      router &&
      pairBaseToken &&
      projectAddr &&
      baseRaw !== undefined &&
      projectRaw !== undefined,
  )
  const canCreate =
    inputsValid && isFirstLp && !existingLiquidity && !needsBaseApproval && !needsProjectApproval && !isWritePending

  const create = async (): Promise<void> => {
    if (!canCreate || !router || !owner || projectAddr === undefined || baseRaw === undefined || projectRaw === undefined) {
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
        // Fresh pair: mins == desired (opening price is exactly the deposit ratio).
        hash = await writeContractAsync({
          address: routerAddr,
          chainId,
          abi: poolRouter02Abi,
          functionName: 'addLiquidityETH',
          args: [projectAddr, projectRaw, projectRaw, baseRaw, owner, deadline],
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
          args: [baseErc20, projectAddr, baseRaw, projectRaw, baseRaw, projectRaw, owner, deadline],
        })
      }
      setCreateHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const reset = (): void => {
    setCreateHash(undefined)
    setBaseApproveHash(undefined)
    setProjectApproveHash(undefined)
    setError(undefined)
  }

  return useMemo(
    () => ({
      ready,
      pairAddress,
      noPairYet,
      isFirstLp,
      existingLiquidity,
      baseIsNative,
      baseRaw,
      projectRaw,
      needsBaseApproval,
      needsProjectApproval,
      baseApproving,
      projectApproving,
      approveBase,
      approveProject,
      inputsValid,
      canCreate,
      create,
      isWritePending,
      createHash,
      isConfirming,
      isDone,
      error,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      ready,
      pairAddress,
      noPairYet,
      isFirstLp,
      existingLiquidity,
      baseIsNative,
      baseRaw,
      projectRaw,
      needsBaseApproval,
      needsProjectApproval,
      baseApproving,
      projectApproving,
      inputsValid,
      canCreate,
      isWritePending,
      createHash,
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
