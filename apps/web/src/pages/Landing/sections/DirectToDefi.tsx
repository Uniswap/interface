import { H2 } from 'pages/Landing/components/Generics'
import { DocumentationCard } from 'pages/Landing/components/cards/DocumentationCard'
import { DownloadWalletCard } from 'pages/Landing/components/cards/DownloadWalletCard'
import { LiquidityCard } from 'pages/Landing/components/cards/LiquidityCard'
import { WebappCard } from 'pages/Landing/components/cards/WebappCard'
import { Trans } from 'react-i18next'
import { Flex } from 'ui/src'

export function DirectToDefi() {
  return (
    <Flex alignItems="center" px={40} $md={{ px: 48 }} $sm={{ px: 24 }}>
      <Flex maxWidth={1280} gap={32} $md={{ gap: 24 }}>
        <H2>
          <Trans i18nKey="landing.directToDeFi" />
        </H2>
        <Flex gap="$gap16">
          <Flex row flexWrap="wrap" height="auto" flex={1} gap="$gap16" $md={{ flexDirection: 'column' }}>
            <WebappCard />
            <DownloadWalletCard />
          </Flex>
          <Flex row flexWrap="wrap" height="auto" flex={1} gap="$gap16" $md={{ flexDirection: 'column' }}>
            <DocumentationCard />
            <LiquidityCard />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
