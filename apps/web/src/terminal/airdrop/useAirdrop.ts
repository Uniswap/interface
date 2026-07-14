/**
 * HookSwap Terminal — client-side merkle airdrop flows (MerkleDistributorFactory + child).
 *
 * Two self-contained CLIENT-SIDE flows (NO backend, NO Permit2). All reads/writes are REAL
 * (wagmi); the merkle root + proofs are REAL computations from `~/terminal/airdrop/merkle.ts`,
 * whose leaf/node encoding is verified byte-for-byte against `contracts/airdrop/src/*.sol`.
 *
 *  useCreateAirdrop — the project side. Two sequential writes, no allowance:
 *    1. DEPLOY  `factory.createDistributor(token, merkleRoot)` → a fresh `MerkleDistributor`;
 *               the new address is decoded from the `DistributorCreated` log (first indexed topic,
 *               emitted from the factory's own address — no keccak/event-hash needed).
 *    2. FUND    a PLAIN `token.transfer(distributor, tokenTotal)` — the distributor is
 *               non-custodial and never pulls, so there is NO approve step; the button is gated on
 *               the creator's live token balance instead.
 *    The token's `decimals`/`symbol` are REAL on-chain reads off the pasted address; CSV amounts
 *    are WHOLE tokens → scaled with `parseUnits(amount, decimals)` before the tree is built.
 *
 *  useClaimAirdrop — the recipient side:
 *    Given a distributor address + a claims source (a loaded claims.json OR a re-pasted recipient
 *    CSV), it reads the distributor's `token()`/`decimals`/`merkleRoot`, looks up the connected
 *    wallet's claim, and — CRUCIALLY — cross-checks the source's root against the on-chain
 *    `merkleRoot()` so a wrong/tampered file can never present a proof that would revert. It reads
 *    `isClaimed(index)` and, when claimable, sends `claim(index, account, amount, proof)`.
 */
import { useEffect, useMemo, useState } from 'react'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import type { Hex } from 'viem'
import { erc20Abi, getAddress, isAddress, parseUnits, type Address, type Hash } from '~/chains'
import { merkleDistributorAbi, merkleDistributorFactoryAbi } from '~/terminal/airdrop/abis'
import { getAirdropFactory } from '~/terminal/airdrop/addresses'
import { buildTree, type AirdropClaim, type AirdropTree } from '~/terminal/airdrop/merkle'
import { assume0xAddress } from '~/utils/wagmi'

/* ============================================================ shared helpers */

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

/** A 32-byte indexed address topic → checksummed address (last 20 bytes). */
function topicToAddress(topic?: string): Address | undefined {
  if (!topic || topic.length < 42) {
    return undefined
  }
  try {
    return getAddress(`0x${topic.slice(-40)}`) as Address
  } catch {
    return undefined
  }
}

/* ============================================================ CSV parsing */

/** One parsed CSV line for the preview table. */
export interface RecipientRow {
  /** 1-based line number among non-empty lines. */
  line: number
  address?: Address
  /** The whole-token amount as typed (pre-scaling). */
  amountText?: string
  valid: boolean
  error?: string
}

export interface ParsedRecipients {
  rows: RecipientRow[]
  /** Only the fully-valid, de-duplicated rows (address lowercased key already checked). */
  validCount: number
  invalidCount: number
  duplicateCount: number
  /** Sum of the whole-token amounts across valid rows (for display only — not scaled). */
  totalWhole: number
  /** True when there is ≥1 valid row and NO invalid/duplicate rows. */
  clean: boolean
}

/**
 * Parse `address,amount` lines into preview rows. Blank lines are skipped; a leading
 * `address,amount` / `address,amt` header line is ignored. Amount validity here is display-level
 * (a positive finite decimal); the exact base-unit scaling happens in `useCreateAirdrop` once the
 * token's decimals are known.
 */
export function parseRecipients(csv: string): ParsedRecipients {
  const rows: RecipientRow[] = []
  const seen = new Set<string>()
  let line = 0
  let totalWhole = 0
  let duplicateCount = 0

  for (const rawLine of csv.split(/\r?\n/)) {
    const trimmed = rawLine.trim()
    if (trimmed === '') {
      continue
    }
    // Skip an obvious header row.
    if (/^address\s*,\s*(amount|amt|value|tokens)\b/i.test(trimmed)) {
      continue
    }
    line += 1
    const parts = trimmed.split(/[,\t]/).map((p) => p.trim())
    const [addr, amt] = [parts[0], parts[1]]

    if (!addr || !isAddress(addr)) {
      rows.push({ line, address: undefined, amountText: amt, valid: false, error: 'Invalid address' })
      continue
    }
    const key = addr.toLowerCase()
    const normalized = getAddress(key) as Address

    if (amt === undefined || amt === '') {
      rows.push({ line, address: normalized, amountText: amt, valid: false, error: 'Missing amount' })
      continue
    }
    const n = Number(amt)
    if (!Number.isFinite(n) || n <= 0) {
      rows.push({ line, address: normalized, amountText: amt, valid: false, error: 'Amount must be > 0' })
      continue
    }
    if (seen.has(key)) {
      duplicateCount += 1
      rows.push({ line, address: normalized, amountText: amt, valid: false, error: 'Duplicate address' })
      continue
    }
    seen.add(key)
    totalWhole += n
    rows.push({ line, address: normalized, amountText: amt, valid: true })
  }

  const validCount = rows.filter((r) => r.valid).length
  const invalidCount = rows.length - validCount
  return {
    rows,
    validCount,
    invalidCount,
    duplicateCount,
    totalWhole,
    clean: validCount > 0 && invalidCount === 0,
  }
}

/**
 * Build the merkle tree from parsed rows scaled to base units. Returns `undefined` (never throws)
 * until decimals are known / the rows are clean, or if any amount fails to scale (too many
 * decimal places for the token).
 */
export function treeFromRows(parsed: ParsedRecipients, decimals?: number): { tree?: AirdropTree; scaleError?: string } {
  if (decimals === undefined || !parsed.clean) {
    return {}
  }
  try {
    const entries = parsed.rows
      .filter((r) => r.valid && r.address && r.amountText)
      .map((r) => ({ account: r.address as Address, amount: parseUnits(r.amountText as string, decimals) }))
    if (entries.length === 0) {
      return {}
    }
    return { tree: buildTree(entries) }
  } catch (e) {
    return { scaleError: e instanceof Error ? e.message : 'Could not scale amounts for this token.' }
  }
}

/* ============================================================ CREATE flow */

export interface UseCreateAirdrop {
  ready: boolean
  factory?: Address

  // Token (real reads off the pasted address).
  validToken: boolean
  tokenDecimals?: number
  tokenSymbol?: string
  /** Creator's balance of the token (raw), or undefined while loading. */
  tokenBalance?: bigint

  // Parsed recipients + computed tree.
  parsed: ParsedRecipients
  tree?: AirdropTree
  scaleError?: string
  /** True when the creator's balance is known to be below the airdrop total. */
  insufficientBalance: boolean

  inputsValid: boolean

  // Step 1 — deploy the distributor.
  canDeploy: boolean
  deploy: () => Promise<void>
  deployHash?: Hash
  isDeploying: boolean
  /** Address of the distributor deployed by the last successful create. */
  distributor?: Address

  // Step 2 — fund it with a plain transfer.
  canFund: boolean
  fund: () => Promise<void>
  fundHash?: Hash
  isFunding: boolean
  isFunded: boolean

  isWritePending: boolean
  error?: string
  reset: () => void
}

export function useCreateAirdrop({
  chainId,
  owner,
  token,
  csv,
}: {
  chainId?: number
  owner?: Address
  token: string
  csv: string
}): UseCreateAirdrop {
  const factory = getAirdropFactory(chainId)
  const ready = Boolean(factory)

  const validToken = isAddress(token)
  const tokenAddr = assume0xAddress(validToken ? token : undefined)

  const decimalsRead = useReadContract({
    address: tokenAddr,
    chainId,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: ready && validToken },
  })
  const tokenDecimals = decimalsRead.data as number | undefined

  const symbolRead = useReadContract({
    address: tokenAddr,
    chainId,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: ready && validToken },
  })
  const tokenSymbol = symbolRead.data as string | undefined

  const balanceRead = useReadContract({
    address: tokenAddr,
    chainId,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    query: { enabled: ready && validToken && Boolean(owner) },
  })
  const tokenBalance = balanceRead.data as bigint | undefined

  const parsed = useMemo(() => parseRecipients(csv), [csv])
  const { tree, scaleError } = useMemo(() => treeFromRows(parsed, tokenDecimals), [parsed, tokenDecimals])

  const insufficientBalance = tree !== undefined && tokenBalance !== undefined && tokenBalance < tree.tokenTotal

  /* ------------------------------------------------------------- writes */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()
  const [deployHash, setDeployHash] = useState<Hash | undefined>(undefined)
  const [fundHash, setFundHash] = useState<Hash | undefined>(undefined)
  const [distributor, setDistributor] = useState<Address | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  const deployReceipt = useWaitForTransactionReceipt({ hash: deployHash, chainId })
  const fundReceipt = useWaitForTransactionReceipt({ hash: fundHash, chainId })

  const isDeploying = Boolean(deployHash) && deployReceipt.isLoading
  const isFunding = Boolean(fundHash) && fundReceipt.isLoading
  const isFunded = Boolean(fundHash) && fundReceipt.isSuccess

  // Decode the new distributor address from the DistributorCreated log (factory's own address).
  useEffect(() => {
    if (deployReceipt.isSuccess && deployReceipt.data && factory && !distributor) {
      const factoryLower = factory.toLowerCase()
      const log = deployReceipt.data.logs.find((l) => l.address.toLowerCase() === factoryLower && l.topics.length >= 2)
      const created = topicToAddress(log?.topics[1])
      if (created) {
        setDistributor(created)
      }
    }
  }, [deployReceipt.isSuccess, deployReceipt.data, factory, distributor])

  // Refresh the creator's balance after funding lands (so a "fund again" reflects reality).
  useEffect(() => {
    if (fundReceipt.isSuccess) {
      void balanceRead.refetch()
    }
  }, [fundReceipt.isSuccess, balanceRead])

  /* ------------------------------------------------------------- validation */

  const inputsValid = Boolean(ready && owner && factory && validToken && tokenDecimals !== undefined && tree)
  const busy = isWritePending || isDeploying || isFunding

  const canDeploy = inputsValid && !busy && !distributor
  const canFund = Boolean(distributor) && tree !== undefined && !insufficientBalance && !busy && !isFunded

  /* ------------------------------------------------------------- actions */

  const deploy = async (): Promise<void> => {
    if (!canDeploy || !factory || tokenAddr === undefined || !tree) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: factory,
        chainId,
        abi: merkleDistributorFactoryAbi,
        functionName: 'createDistributor',
        args: [tokenAddr, tree.root as Hex],
      })
      setDeployHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const fund = async (): Promise<void> => {
    if (!canFund || tokenAddr === undefined || !distributor || !tree) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: tokenAddr,
        chainId,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [distributor, tree.tokenTotal],
      })
      setFundHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const reset = (): void => {
    setDeployHash(undefined)
    setFundHash(undefined)
    setDistributor(undefined)
    setError(undefined)
  }

  return useMemo(
    () => ({
      ready,
      factory,
      validToken,
      tokenDecimals,
      tokenSymbol,
      tokenBalance,
      parsed,
      tree,
      scaleError,
      insufficientBalance,
      inputsValid,
      canDeploy,
      deploy,
      deployHash,
      isDeploying,
      distributor,
      canFund,
      fund,
      fundHash,
      isFunding,
      isFunded,
      isWritePending,
      error,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      ready,
      factory,
      validToken,
      tokenDecimals,
      tokenSymbol,
      tokenBalance,
      parsed,
      tree,
      scaleError,
      insufficientBalance,
      inputsValid,
      canDeploy,
      deployHash,
      isDeploying,
      distributor,
      canFund,
      fundHash,
      isFunding,
      isFunded,
      isWritePending,
      error,
    ],
  )
}

/* ============================================================ CLAIM flow */

/** A parsed claims.json artifact (the file `useCreateAirdrop` offers for download). */
export interface ClaimsFile {
  root: string
  tokenTotal?: string
  claims: Record<string, AirdropClaim>
}

export interface UseClaimAirdrop {
  /** True when the distributor address is well-formed. */
  validDistributor: boolean
  /** The distributor's airdropped token, resolved on-chain via `token()`. */
  tokenAddress?: Address
  tokenDecimals?: number
  tokenSymbol?: string
  /** The on-chain committed root (real read). */
  onchainRoot?: Hex
  /** The root implied by the loaded claims source (file or CSV). */
  sourceRoot?: Hex
  /**
   * True once BOTH roots are known and they DISAGREE — the loaded file/CSV does not belong to
   * this distributor, so every proof would revert. The UI blocks claiming.
   */
  rootMismatch: boolean
  /** True once both roots are known and match. */
  rootVerified: boolean

  /** The connected wallet's claim from the source, if present. */
  myClaim?: AirdropClaim
  /** Whether the connected wallet is in the airdrop at all. */
  inAirdrop: boolean
  /** Live `isClaimed(index)` for the connected wallet, or undefined while loading. */
  alreadyClaimed?: boolean

  canClaim: boolean
  claim: () => Promise<void>
  claimHash?: Hash
  isWritePending: boolean
  isConfirming: boolean
  isDone: boolean
  error?: string
  reset: () => void
}

export function useClaimAirdrop({
  chainId,
  owner,
  distributor,
  claimsFile,
  csv,
}: {
  chainId?: number
  owner?: Address
  /** Pasted distributor address. */
  distributor: string
  /** Parsed claims.json (has proofs already), or undefined. */
  claimsFile?: ClaimsFile
  /** Re-pasted recipient CSV, used to recompute proofs when no claims.json is loaded. */
  csv?: string
}): UseClaimAirdrop {
  const validDistributor = isAddress(distributor)
  const distributorAddr = assume0xAddress(validDistributor ? distributor : undefined)

  /* ------------------------------------------------------------- distributor reads */

  const tokenRead = useReadContract({
    address: distributorAddr,
    chainId,
    abi: merkleDistributorAbi,
    functionName: 'token',
    query: { enabled: validDistributor },
  })
  const tokenAddress = tokenRead.data as Address | undefined

  const rootRead = useReadContract({
    address: distributorAddr,
    chainId,
    abi: merkleDistributorAbi,
    functionName: 'merkleRoot',
    query: { enabled: validDistributor },
  })
  const onchainRoot = rootRead.data as Hex | undefined

  const decimalsRead = useReadContract({
    address: tokenAddress,
    chainId,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: Boolean(tokenAddress) },
  })
  const tokenDecimals = decimalsRead.data as number | undefined

  const symbolRead = useReadContract({
    address: tokenAddress,
    chainId,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: Boolean(tokenAddress) },
  })
  const tokenSymbol = symbolRead.data as string | undefined

  /* ------------------------------------------------------------- resolve claims source */

  // A loaded claims.json wins; otherwise recompute the tree from the pasted CSV once decimals are
  // known. Both yield {root, claims} in the SAME shape.
  const csvTree = useMemo(() => {
    if (claimsFile || !csv || tokenDecimals === undefined) {
      return undefined
    }
    const parsed = parseRecipients(csv)
    if (!parsed.clean) {
      return undefined
    }
    return treeFromRows(parsed, tokenDecimals).tree
  }, [claimsFile, csv, tokenDecimals])

  const claimsMap: Record<string, AirdropClaim> | undefined = claimsFile?.claims ?? csvTree?.claims
  const sourceRoot = (claimsFile?.root as Hex | undefined) ?? csvTree?.root

  const rootMismatch = Boolean(sourceRoot && onchainRoot && sourceRoot.toLowerCase() !== onchainRoot.toLowerCase())
  const rootVerified = Boolean(sourceRoot && onchainRoot && sourceRoot.toLowerCase() === onchainRoot.toLowerCase())

  const myClaim = owner && claimsMap ? claimsMap[owner.toLowerCase()] : undefined
  const inAirdrop = Boolean(myClaim)

  const claimedRead = useReadContract({
    address: distributorAddr,
    chainId,
    abi: merkleDistributorAbi,
    functionName: 'isClaimed',
    args: myClaim ? [BigInt(myClaim.index)] : undefined,
    query: { enabled: validDistributor && Boolean(myClaim) },
  })
  const alreadyClaimed = claimedRead.data as boolean | undefined

  /* ------------------------------------------------------------- write */

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()
  const [claimHash, setClaimHash] = useState<Hash | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  const claimReceipt = useWaitForTransactionReceipt({ hash: claimHash, chainId })
  const isConfirming = Boolean(claimHash) && claimReceipt.isLoading
  const isDone = Boolean(claimHash) && claimReceipt.isSuccess

  useEffect(() => {
    if (claimReceipt.isSuccess) {
      void claimedRead.refetch()
    }
  }, [claimReceipt.isSuccess, claimedRead])

  const busy = isWritePending || isConfirming
  const canClaim = Boolean(
    validDistributor && owner && myClaim && rootVerified && alreadyClaimed === false && !busy && !isDone,
  )

  const claim = async (): Promise<void> => {
    if (!canClaim || distributorAddr === undefined || !myClaim || !owner) {
      return
    }
    setError(undefined)
    try {
      const hash = await writeContractAsync({
        address: distributorAddr,
        chainId,
        abi: merkleDistributorAbi,
        functionName: 'claim',
        args: [BigInt(myClaim.index), owner, BigInt(myClaim.amount), myClaim.proof as readonly Hex[]],
      })
      setClaimHash(hash)
    } catch (e) {
      setError(toMessage(e))
    }
  }

  const reset = (): void => {
    setClaimHash(undefined)
    setError(undefined)
  }

  return useMemo(
    () => ({
      validDistributor,
      tokenAddress,
      tokenDecimals,
      tokenSymbol,
      onchainRoot,
      sourceRoot,
      rootMismatch,
      rootVerified,
      myClaim,
      inAirdrop,
      alreadyClaimed,
      canClaim,
      claim,
      claimHash,
      isWritePending,
      isConfirming,
      isDone,
      error,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      validDistributor,
      tokenAddress,
      tokenDecimals,
      tokenSymbol,
      onchainRoot,
      sourceRoot,
      rootMismatch,
      rootVerified,
      myClaim,
      inAirdrop,
      alreadyClaimed,
      canClaim,
      claimHash,
      isWritePending,
      isConfirming,
      isDone,
      error,
    ],
  )
}
