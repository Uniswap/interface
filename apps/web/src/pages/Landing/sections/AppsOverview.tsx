import { DownloadWalletCard } from 'pages/Landing/components/cards/DownloadWalletCard'
import { LiquidityCard } from 'pages/Landing/components/cards/LiquidityCard'
import { TradingApiCard } from 'pages/Landing/components/cards/TradingApiCard'
import { UnichainCard } from 'pages/Landing/components/cards/UnichainCard'
import { UniswapXCard } from 'pages/Landing/components/cards/UniswapXCard'
import { WebappCard } from 'pages/Landing/components/cards/WebappCard'
import { H2 } from 'pages/Landing/components/Generics'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'

export function AppsOverview() {
  const { t } = useTranslation()
  return (
    <Flex alignItems="center" px={40} $md={{ px: 48 }} $sm={{ px: 24 }}>
      <Flex maxWidth={1280} gap={32} $md={{ gap: 24 }}>
        <H2>{t('landing.appsOverview')}</H2>
        <Flex gap="$gap16">
          <Flex row flexWrap="wrap" height="auto" flex={1} gap="$gap16" $md={{ flexDirection: 'column' }}>
            <WebappCard />
            <DownloadWalletCard />
          </Flex>
          <Flex row flexWrap="wrap" height="auto" flex={1} gap="$gap16" $md={{ flexDirection: 'column' }}>
            <UniswapXCard />
            <LiquidityCard />
          </Flex>
          <Flex row flexWrap="wrap" height="auto" flex={1} gap="$gap16" $md={{ flexDirection: 'column' }}>
            <TradingApiCard />
            <UnichainCard />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
