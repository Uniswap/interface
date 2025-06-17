import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { ExcludedNetworkLogos } from 'uniswap/src/components/network/ExcludedNetworkLogos'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface ExcludedNetworkBannerProps {
  chainIds: UniverseChainId[]
}

export const ExcludedNetworkBanner = memo(function ExcludedNetworkBanner({
  chainIds,
}: ExcludedNetworkBannerProps): JSX.Element {
  const { t } = useTranslation()

  const chainInfo = chainIds.length === 1 && chainIds[0] !== undefined ? getChainInfo(chainIds[0]) : null

  const titleText = chainInfo
    ? t('smartWallet.insufficientFunds.single.network.banner.title', { chain: chainInfo.name })
    : t('smartWallet.insufficientFunds.network.banner.title', { count: chainIds.length })

  return (
    <Flex grow backgroundColor="$statusCritical2" borderRadius="$rounded16" flexDirection="row" p="$spacing12">
      <Flex row alignItems="center" gap="$gap12" overflow="hidden">
        <ExcludedNetworkLogos chainIds={chainIds} />
        <Flex alignItems="flex-start">
          <Text color="$statusCritical" ellipsizeMode="tail" numberOfLines={1} variant="buttonLabel3">
            {titleText}
          </Text>
          <Flex row alignItems="center" gap="$gap8" minHeight={spacing.spacing20}>
            <Text ellipsizeMode="tail" numberOfLines={1} variant="body4" color="$neutral2">
              {t('smartWallet.insufficientFunds.network.banner.description')}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
})
