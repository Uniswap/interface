import { V2_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { ProtocolVersion } from '@universe/api'
import { v3PoolStateAbi } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_HOUR_MS } from 'utilities/src/time/time'
import { useReadContracts } from 'wagmi'
import { getLpFeeFraction } from '~/appGraphql/data/pools/useTopPools'
import { assume0xAddress } from '~/utils/wagmi'

// Minimal V2 factory ABI — the global protocol-fee switch. No shared UniswapV2Factory ABI exists in the repo.
const V2_FACTORY_FEE_TO_ABI = [
  {
    inputs: [],
    name: 'feeTo',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Cache aggressively: the protocol-fee config changes very rarely (governance action).
const CACHE = { staleTime: ONE_HOUR_MS, gcTime: MAX_REACT_QUERY_CACHE_TIME_MS } as const

// v3 `slot0().feeProtocol` packs two 4-bit values (one per token). On each side the protocol takes
// 1/N of the swap fee (N = 0 means no protocol fee on that side). Average the two sides so a single
// fraction represents both swap directions (exact when symmetric, which is the case for every pool observed).
function lpFractionFromV3FeeProtocol(feeProtocol: number): number {
  const feeProtocol0 = feeProtocol & 0x0f
  const feeProtocol1 = (feeProtocol >> 4) & 0x0f
  const lp0 = feeProtocol0 === 0 ? 1 : (feeProtocol0 - 1) / feeProtocol0
  const lp1 = feeProtocol1 === 0 ? 1 : (feeProtocol1 - 1) / feeProtocol1
  return (lp0 + lp1) / 2
}

/**
 * Reads a pool's real LP fee fraction on-chain so APR/fees exclude the exact per-pool protocol fee:
 *   - v3: `slot0().feeProtocol` on the pool
 *   - v2: `feeTo()` on the factory (global per chain; enabled => LPs keep 5/6)
 *   - v4: no protocol fee yet => 1
 * While the read is pending or unavailable it falls back to the getLpFeeFraction schedule, so a value
 * is always returned. Intended for single-pool surfaces; list surfaces use getLpFeeFraction directly (LP-767).
 */
export function usePoolLpFeeFraction({
  chainId,
  poolAddress,
  protocolVersion,
  feeTier,
}: {
  chainId?: UniverseChainId
  poolAddress?: string
  protocolVersion?: ProtocolVersion
  feeTier?: number
}): number {
  const isV3 = protocolVersion === ProtocolVersion.V3
  const isV2 = protocolVersion === ProtocolVersion.V2
  const v2FactoryAddress = chainId === undefined ? undefined : V2_FACTORY_ADDRESSES[chainId]
  // wagmi types chainId to the EVM-chain union; UniverseChainId is wider (includes non-EVM), so pass the numeric id.
  const numericChainId = chainId === undefined ? undefined : Number(chainId)

  const { data: slot0Data } = useReadContracts({
    contracts: [
      {
        address: assume0xAddress(poolAddress) ?? '0x',
        abi: v3PoolStateAbi,
        functionName: 'slot0',
        chainId: numericChainId,
      } as const,
    ],
    query: { enabled: isV3 && Boolean(poolAddress) && chainId !== undefined, ...CACHE },
  })

  const { data: feeToData } = useReadContracts({
    contracts: [
      {
        address: assume0xAddress(v2FactoryAddress) ?? '0x',
        abi: V2_FACTORY_FEE_TO_ABI,
        functionName: 'feeTo',
        chainId: numericChainId,
      } as const,
    ],
    query: { enabled: isV2 && Boolean(v2FactoryAddress) && chainId !== undefined, ...CACHE },
  })

  const scheduleFraction = getLpFeeFraction(protocolVersion, feeTier)

  if (isV3) {
    const slot0 = slot0Data?.[0]?.status === 'success' ? slot0Data[0].result : undefined
    // slot0 tuple index 5 is feeProtocol (uint8)
    const feeProtocol = slot0?.[5]
    return feeProtocol === undefined ? scheduleFraction : lpFractionFromV3FeeProtocol(Number(feeProtocol))
  }

  if (isV2) {
    const feeTo = feeToData?.[0]?.status === 'success' ? feeToData[0].result : undefined
    if (feeTo === undefined) {
      return scheduleFraction
    }
    // Enabled => LPs keep the schedule fraction (5/6); disabled (feeTo unset) => LPs keep everything.
    return feeTo === ZERO_ADDRESS ? 1 : scheduleFraction
  }

  // v4 / unknown => schedule (currently 1, i.e. no protocol fee)
  return scheduleFraction
}
