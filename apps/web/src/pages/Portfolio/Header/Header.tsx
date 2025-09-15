import NetworkFilter from 'components/NetworkFilter/NetworkFilter'
import { usePortfolioParams } from 'pages/Portfolio/Header/hooks/usePortfolioParams'
import { PortfolioTabs } from 'pages/Portfolio/Header/Tabs'
import { PortfolioTab } from 'pages/Portfolio/types'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text } from 'ui/src'
import { Wallet } from 'ui/src/components/icons/Wallet'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'
import { getChainUrlParam } from 'utils/chainParams'

function buildPortfolioUrl(tab: PortfolioTab | undefined, chainId: UniverseChainId | undefined): string {
  const chainUrlParam = chainId ? getChainUrlParam(chainId) : ''
  const currentPath = tab === PortfolioTab.Overview ? '/portfolio' : `/portfolio/${tab}`
  return `${currentPath}${chainId ? `?chain=${chainUrlParam}` : ''}`
}

export default function PortfolioHeader() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tab, chainId: currentChainId } = usePortfolioParams()

  const onNetworkPress = useEvent((chainId: UniverseChainId | undefined) => {
    navigate(buildPortfolioUrl(tab, chainId))
  })

  return (
    <>
      {/* Static Header - Never re-renders */}
      <Flex padding="$spacing24" gap="$spacing16">
        <Flex row justifyContent="space-between">
          <Flex row gap="$spacing12" alignItems="center">
            <Wallet size="$icon.24" color="$accent1" />
            <Text variant="heading1">{t('common.portfolio')}</Text>
          </Flex>
          <NetworkFilter
            showMultichainOption={true}
            showDisplayName={true}
            position="right"
            onPress={onNetworkPress}
            currentChainId={currentChainId}
          />
        </Flex>
        <Text variant="body1" color="$neutral2">
          Track your crypto portfolio across all chains and protocols
        </Text>
      </Flex>

      <PortfolioTabs />
    </>
  )
}
