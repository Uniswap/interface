import { iconSizes } from 'ui/src/theme'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { OverlappingCurrencyLogos } from '~/components/Logo/OverlappingCurrencyLogos'
import type { RewardTokenRef } from '~/features/Liquidity/LPIncentives/buildLpIncentiveRewards'

/**
 * Cluster of reward-token logos for the LP-incentive summary surfaces. Resolves the token refs the
 * rewards data carries into currency metadata so the three surfaces don't each repeat it.
 *
 * Network badges are dropped by the shared cluster: logos overlap, so badges collide with the
 * neighbouring token, and the chain is already spelled out per-row inside the rewards modal. No
 * "+N" chip either — these surfaces cap the cluster silently.
 */
export function LpIncentiveRewardLogos({
  tokens,
  size = iconSizes.icon24,
  max,
}: {
  tokens: RewardTokenRef[]
  size?: number
  max?: number
}): JSX.Element {
  const currencyInfos = useCurrencyInfos(tokens.map((token) => buildCurrencyId(token.chainId, token.address)))
  const resolved = currencyInfos.filter((currencyInfo): currencyInfo is CurrencyInfo => Boolean(currencyInfo))

  return <OverlappingCurrencyLogos currencyInfos={resolved} size={size} max={max} />
}
