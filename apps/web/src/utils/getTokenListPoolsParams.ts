import type { PartialMessage } from '@bufbuild/protobuf'
import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { ListPoolsRequest } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { PoolsOrderBy, PoolTokenLogicalOperator } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { Platform, getValidAddress, normalizeTokenAddressForCache } from '@universe/chains'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { nativeAddressForRest } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'

/**
 * Resolves a multichain entry to the address V2/V3 pools actually pair against: entry.address is
 * the native sentinel for a native entry, not the wrapped address, so resolve that instead. The
 * native leg's own address is ORed in separately by each param builder.
 */
export function resolveEntryPoolTokenAddress(entry: MultichainTokenEntry): string | undefined {
  const tokenAddress = entry.isNative ? getWrappedNativeAddress(entry.chainId) : entry.address
  if (!tokenAddress) {
    return undefined
  }
  return getValidAddress({ address: tokenAddress, withEVMChecksum: true, platform: Platform.EVM }) ?? tokenAddress
}

/**
 * The address `ListPools` indexes a chain's native leg under, checksummed like every other entry in
 * `tokenFilter.tokens`. Not always the zero address: chains carrying the legacy 0xEeee… placeholder
 * in chain info are indexed as zero, but Celo and Polygon have a real native token contract (CELO,
 * POL) and the backend indexes those pools under that contract, so it must not be flattened to zero.
 */
function getNativePoolTokenAddress(chainId: UniverseChainId): string {
  const nativeAddress = nativeAddressForRest(chainId)
  return getValidAddress({ address: nativeAddress, withEVMChecksum: true, platform: Platform.EVM }) ?? nativeAddress
}

/** Shared `ListPools` filter shape for "pools containing this token" queries. */
function buildTokenPoolsFilter({
  protocolVersions,
  tokens,
}: {
  protocolVersions: ProtocolVersion[]
  tokens: string[]
}): PartialMessage<ListPoolsRequest>['filter'] {
  return {
    protocolVersions,
    tokenFilter: { tokens, logicalOperator: PoolTokenLogicalOperator.OR },
    // v1 parity: spam is included there, and permissioned adapter tokens may be flagged non-benign.
    includeSpam: true,
    applyTopLevelFilters: true,
  }
}

/**
 * Shared data.v2 `ListPools` params for "pools containing this single token" queries (e.g. the TDP
 * pools table). When `isNative`, ORs in this chain's native leg address alongside the wrapped
 * address, since V4 pools hold the native leg itself rather than a wrapped one.
 */
export function getTokenListPoolsParams({
  chainId,
  tokenAddress,
  isNative,
  protocolVersions,
  sort,
}: {
  chainId: number | undefined
  tokenAddress: string | undefined
  isNative?: boolean
  protocolVersions: ProtocolVersion[]
  sort?: { orderBy: PoolsOrderBy; ascending?: boolean }
}): Omit<PartialMessage<ListPoolsRequest>, 'page'> | undefined {
  // chainIds is a required field on ListPoolsRequest — an empty array isn't "all chains", it's an
  // invalid request. Guard chainId the same way tokenAddress is guarded below.
  if (!tokenAddress || !chainId) {
    return undefined
  }
  const checksummedAddress =
    getValidAddress({ address: tokenAddress, withEVMChecksum: true, platform: Platform.EVM }) ?? tokenAddress
  const tokens = [checksummedAddress]
  if (isNative) {
    const supportedChainId = toSupportedChainId(chainId)
    const nativeAddress = supportedChainId ? getNativePoolTokenAddress(supportedChainId) : DEFAULT_NATIVE_ADDRESS
    // On Celo the native token *is* the wrapped ERC20, so the native leg can repeat this address.
    if (!tokens.includes(nativeAddress)) {
      tokens.push(nativeAddress)
    }
  }
  return {
    chainIds: [chainId],
    sort: sort ?? { orderBy: PoolsOrderBy.TVL },
    filter: buildTokenPoolsFilter({ protocolVersions, tokens }),
  }
}

export interface MultichainTokenListPoolsRequest {
  params: Omit<PartialMessage<ListPoolsRequest>, 'page'>
  /**
   * Pool-token addresses (normalized via `normalizeTokenAddressForCache`) that are real
   * deployments of this token, keyed by chain ID (`PoolStat.chainId`). Built in the same pass as `params` so the request's token list and the caller's
   * post-filter can't drift. Native entries allow their chain's native leg (both the chain-specific
   * native address and the zero address V4 keys native currency on) on their chain only — tighter
   * than the request, which ORs every native leg address across every chainId.
   */
  allowedAddressesByChain: Map<UniverseChainId, Set<string>>
}

/**
 * Combined multichain variant of {@link getTokenListPoolsParams}: one `ListPools` request covering
 * every EVM deployment of a token, for the TDP "All networks" pools view.
 *
 * `chainIds` and `tokenFilter.tokens` are ANDed as independent lists on `ListPoolsRequest` — the
 * server has no (chainId, address) pair filter — so this request can also match a deployment's
 * address on a chain it wasn't paired with (e.g. a squatted same-address token). Callers must
 * post-filter results back to `allowedAddressesByChain` (see `useV2ListTokenPoolsMultichain`).
 */
export function getMultichainTokenListPoolsParams({
  entries,
  protocolVersions,
  sort,
}: {
  entries: MultichainTokenEntry[]
  protocolVersions: ProtocolVersion[]
  sort?: { orderBy: PoolsOrderBy; ascending?: boolean }
}): MultichainTokenListPoolsRequest | undefined {
  const chainIds: number[] = []
  const tokens: string[] = []
  const nativeTokens: string[] = []
  const allowedAddressesByChain = new Map<UniverseChainId, Set<string>>()
  for (const entry of entries) {
    const tokenAddress = resolveEntryPoolTokenAddress(entry)
    // An entry that resolves to no address at all (empty address, or no wrapped-native deployment
    // configured) contributes neither its token nor its chainId — chainIds must never be broadened
    // past the chains whose deployment address is actually in the token filter.
    if (!tokenAddress) {
      continue
    }
    if (!chainIds.includes(entry.chainId)) {
      chainIds.push(entry.chainId)
    }
    if (!tokens.includes(tokenAddress)) {
      tokens.push(tokenAddress)
    }
    const allowed = allowedAddressesByChain.get(entry.chainId) ?? new Set<string>()
    allowed.add(normalizeTokenAddressForCache(tokenAddress))
    if (entry.isNative) {
      const nativeAddress = getNativePoolTokenAddress(entry.chainId)
      if (!nativeTokens.includes(nativeAddress)) {
        nativeTokens.push(nativeAddress)
      }
      allowed.add(normalizeTokenAddressForCache(nativeAddress))
      // V4 keys native currency on the zero address on-chain, so allow it too even where the
      // request asks for a chain-specific native address: on the chain where this token is native a
      // zero-address leg is a legitimate row, and the allowlist must stay a superset.
      allowed.add(normalizeTokenAddressForCache(DEFAULT_NATIVE_ADDRESS))
    }
    allowedAddressesByChain.set(entry.chainId, allowed)
  }
  if (chainIds.length === 0) {
    return undefined
  }
  // Appended after every deployment address so `tokens` stays ordered wrapped-then-native. `tokens`
  // is one flat list applied to every chainId, so for a token that is native on only some chains
  // this over-matches those chains' native-gas pools; the per-chain post-filter drops them.
  for (const nativeAddress of nativeTokens) {
    if (!tokens.includes(nativeAddress)) {
      tokens.push(nativeAddress)
    }
  }
  return {
    params: {
      chainIds,
      sort: sort ?? { orderBy: PoolsOrderBy.TVL },
      filter: buildTokenPoolsFilter({ protocolVersions, tokens }),
    },
    allowedAddressesByChain,
  }
}
