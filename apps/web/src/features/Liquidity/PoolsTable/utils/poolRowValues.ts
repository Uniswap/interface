import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { UniverseChainId } from '@universe/chains'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { type FiatNumberType, NumberType } from 'utilities/src/format/types'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import type { PoolLinkData } from '~/features/Liquidity/PoolsTable/types'
import { getProtocolVersionFromLabel } from '~/features/Liquidity/utils/protocolVersion'
import type { PoolStat } from '~/types/explore'
import { getChainUrlParam } from '~/utils/params/chainParams'

export function getPoolVolumes(pool: PoolStat): { tvl: number; volume24h: number; volume30d: number } {
  return {
    tvl: pool.totalLiquidity?.value ?? 0,
    volume24h: pool.volume1Day?.value ?? 0,
    volume30d: pool.volume30Day?.value ?? 0,
  }
}

export function buildV4CurrencyId(
  pool: PoolStat,
  chainId: UniverseChainId,
): {
  token0CurrencyId?: string
  token1CurrencyId?: string
} {
  // Rows carry the lowercase label `convertPoolToPoolStat` stamps on them ('v4'), not an uppercase
  // 'V4' — comparing against 'V4' directly never matched, so v4 rows lost their currency ids.
  if (getProtocolVersionFromLabel(pool.protocolVersion?.toLowerCase()) !== ProtocolVersion.V4) {
    return {}
  }
  // A v4 native leg arrives as a falsy address, the 'NATIVE' sentinel, or the zero address
  // (liquidity service via convertPoolToPoolStat) — canonicalize all of them.
  const rawToken0 = pool.token0?.address
  const rawToken1 = pool.token1?.address
  const token0 =
    !rawToken0 || rawToken0 === NATIVE_CHAIN_ID || rawToken0 === ZERO_ADDRESS ? getNativeAddress(chainId) : rawToken0
  const token1 =
    !rawToken1 || rawToken1 === NATIVE_CHAIN_ID || rawToken1 === ZERO_ADDRESS ? getNativeAddress(chainId) : rawToken1
  return {
    token0CurrencyId: token0 ? buildCurrencyId(chainId, token0) : undefined,
    token1CurrencyId: token1 ? buildCurrencyId(chainId, token1) : undefined,
  }
}

export function getPoolLink(
  pool: PoolStat,
  opts: { chainId: UniverseChainId; linkBuilder?: (data: PoolLinkData) => string },
): string {
  const poolIdOrHash = pool.id
  const linkData: PoolLinkData = {
    chainId: opts.chainId,
    poolIdOrHash,
    token0Address: pool.token0?.address ?? undefined,
    token1Address: pool.token1?.address ?? undefined,
    fee: pool.feeTier ?? undefined,
    hookAddress: pool.hookAddress,
    protocolVersion: pool.protocolVersion?.toLowerCase(),
  }
  return opts.linkBuilder?.(linkData) ?? `/explore/pools/${getChainUrlParam(opts.chainId)}/${poolIdOrHash}`
}

export function formatVolume(
  amount: number,
  convertFiatAmountFormatted: (amount: number, type: FiatNumberType) => string,
): string {
  return amount ? convertFiatAmountFormatted(amount, NumberType.FiatTokenStats) : '-'
}

export function formatOptionalFiatAmount(
  amount: number | undefined,
  convertFiatAmountFormatted: (amount: number, type: FiatNumberType) => string,
): string {
  return amount === undefined
    ? '-'
    : convertFiatAmountFormatted(amount, amount === 0 ? NumberType.FiatStandard : NumberType.FiatTokenStats)
}
