import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { TFunction } from 'i18next'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import type { TdpChainSelection } from 'uniswap/src/utils/linking'
import { TimePeriod } from '~/appGraphql/data/util'
import {
  sortChainStatsByVolume,
  TIME_PERIOD_TO_VOLUME_KEY,
} from '~/features/Explore/state/listTokens/utils/multichainVolume'

export function getVolumeLabelForTimePeriod(t: TFunction, timePeriod: TimePeriod): string {
  switch (timePeriod) {
    case TimePeriod.HOUR:
      return t('explore.volume.1hour')
    case TimePeriod.DAY:
      return t('explore.volume.1day')
    case TimePeriod.WEEK:
      return t('explore.volume.1week')
    case TimePeriod.MONTH:
      return t('explore.volume.1month')
    case TimePeriod.YEAR:
      return t('explore.volume.1year')
    case TimePeriod.MAX:
      return t('explore.volume.all')
    default:
      return timePeriod satisfies never
  }
}

export function getChainLogoUrl(chainId: UniverseChainId | undefined): string | undefined {
  if (chainId === undefined || !isUniverseChainId(chainId)) {
    return undefined
  }
  const networkName = getChainInfo(chainId).assetRepoNetworkName
  if (!networkName) {
    return undefined
  }
  return `${UniswapStaticUrls.uniswapAssetsBlockchainsBaseUrl}/${networkName}/info/logo.png`
}

export function getVolumeBreakdownForPeriod(
  rankedToken: RankedMultichainToken | undefined,
  timePeriod: TimePeriod,
): { chainId: UniverseChainId; volume: number }[] {
  if (!rankedToken?.chainStats.length) {
    return []
  }
  const volumeKey = TIME_PERIOD_TO_VOLUME_KEY[timePeriod]
  const sorted = sortChainStatsByVolume(rankedToken.chainStats, timePeriod)
  return sorted
    .filter((cs) => (cs.stats?.[volumeKey] ?? 0) > 0)
    .map((cs) => ({ chainId: cs.chainId as UniverseChainId, volume: cs.stats?.[volumeKey] ?? 0 }))
}

export function getPercentageDisplay(volume: number, totalVolume: number): string {
  if (totalVolume === 0) {
    return '0%'
  }
  const percentage = (volume / totalVolume) * 100
  return percentage === Math.round(percentage) ? `${Math.round(percentage)}%` : `${percentage.toFixed(1)}%`
}

/** Minimal shape accepted by `useNavigateToTokenDetails` for multichain API tokens. */
export type VolumePopoverTokenDetailsInput = { chainId: number; address: string }

export type NavigateVolumePopoverToTokenDetails = (
  currency: VolumePopoverTokenDetailsInput,
  chainSelection?: TdpChainSelection,
) => void

/**
 * Opens TDP for the given chain's deployment of a multichain token, optionally setting aggregate multichain state.
 */
export function navigateVolumePopoverToTokenDetails({
  navigateToTokenDetails,
  rankedToken,
  chainId,
  chainSelection,
}: {
  navigateToTokenDetails: NavigateVolumePopoverToTokenDetails
  rankedToken: RankedMultichainToken | undefined
  chainId: UniverseChainId
  chainSelection?: TdpChainSelection
}): void {
  const address = rankedToken?.multichainToken?.addresses[String(chainId)]
  if (!address) {
    return
  }
  navigateToTokenDetails({ chainId, address }, chainSelection)
}
