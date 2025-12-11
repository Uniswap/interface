import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { spacing } from 'ui/src/theme'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { isChainSupportedForChainedActions } from 'uniswap/src/features/transactions/swap/utils/chainedActions'

const CHAINS_WITHOUT_ACROSS_BRIDGING: UniverseChainId[] = [UniverseChainId.Celo, UniverseChainId.Avalanche] as const

export function UnsupportedChainedActionsBanner({
  oppositeToken,
  chainFilter,
}: {
  oppositeToken?: TradeableAsset
  chainFilter?: UniverseChainId
}): JSX.Element | null {
  const { t } = useTranslation()

  const isChainedActionsEnabled = useFeatureFlag(FeatureFlags.ChainedActions)
  if (!isChainedActionsEnabled) {
    return null
  }

  // If there is no opposite token, hide the banner
  if (!oppositeToken?.chainId) {
    return null
  }

  // If there is no chain filter, hide the banner
  if (!chainFilter) {
    return null
  }

  // If the chain is not supported for chained actions, hide the banner
  if (isChainSupportedForChainedActions(oppositeToken.chainId) && isChainSupportedForChainedActions(chainFilter)) {
    return null
  }

  // If the chain is the same as the chain filter, hide the banner
  if (oppositeToken.chainId === chainFilter) {
    return null
  }

  const ineligibleChain = !isChainSupportedForChainedActions(chainFilter) ? chainFilter : oppositeToken.chainId

  // imply no bridging support IFF across doesn't support the chain either
  const message = CHAINS_WITHOUT_ACROSS_BRIDGING.includes(ineligibleChain)
    ? t('swap.chainedActions.unsupportedChain', { chain: getChainLabel(ineligibleChain) })
    : t('swap.chainedActions.unsupportedChain.someTokens', { chain: getChainLabel(ineligibleChain) })

  return (
    <Flex
      row
      backgroundColor="$surface2"
      borderRadius="$rounded12"
      gap="$spacing12"
      mx={spacing.spacing16}
      p="$spacing12"
    >
      <InfoCircleFilled color="$neutral2" size="$icon.20" />
      <Text variant="body3">{message}</Text>
    </Flex>
  )
}
