import type { PlainMessage } from '@bufbuild/protobuf'
import { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TimePeriod } from '~/appGraphql/data/util'

type VolumeKey = 'volume1h' | 'volume1d' | 'volume7d' | 'volume30d' | 'volume1y'

export const TIME_PERIOD_TO_VOLUME_KEY: Record<TimePeriod, VolumeKey> = {
  [TimePeriod.HOUR]: 'volume1h',
  [TimePeriod.DAY]: 'volume1d',
  [TimePeriod.WEEK]: 'volume7d',
  [TimePeriod.MONTH]: 'volume30d',
  [TimePeriod.YEAR]: 'volume1y',
  [TimePeriod.MAX]: 'volume1y',
}

export function sortMultichainTokenByVolume(
  mcToken: MultichainToken,
  timePeriod: TimePeriod,
): PlainMessage<MultichainToken> {
  const volumeKey = TIME_PERIOD_TO_VOLUME_KEY[timePeriod]
  const chainTokens = [...mcToken.chainTokens].sort((a, b) => {
    const aVol = a.stats?.[volumeKey] ?? 0
    const bVol = b.stats?.[volumeKey] ?? 0
    return bVol - aVol
  })
  // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
  return { ...mcToken, chainTokens }
}

/**
 * Returns chain IDs for a multichain token sorted by volume descending for the given time period.
 * Chains with no volume for that period are placed at the end.
 */
export function getChainIdsByVolume(
  mcToken: MultichainToken | undefined,
  timePeriod: TimePeriod,
): UniverseChainId[] | undefined {
  if (!mcToken) {
    return undefined
  }
  const sorted = sortMultichainTokenByVolume(mcToken, timePeriod)
  return sorted.chainTokens.map((ct) => ct.chainId as UniverseChainId)
}
