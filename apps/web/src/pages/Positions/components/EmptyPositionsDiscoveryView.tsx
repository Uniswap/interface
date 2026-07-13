import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { ExploreContextProvider } from '~/features/Explore/state'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { NoPositionsBanner } from '~/features/Liquidity/components/emptyStates/NoPositionsBanner'
import { useAccount } from '~/hooks/useAccount'
import { TopVerifiedAuctionsDiscoverySection } from '~/pages/Explore/tables/Auctions/TopVerifiedAuctionsDiscoverySection'
import { ExploreTopPoolTable } from '~/pages/Explore/tables/Pools/PoolTable'

const EXPLORE_POOLS_HREF = '/explore/pools'
const TOP_POOLS_ROW_COUNT = 10

export function EmptyPositionsDiscoveryView(): JSX.Element {
  const { t } = useTranslation()
  const { isConnected } = useAccount()
  const accountDrawer = useAccountDrawer()

  return (
    <Flex gap="$spacing40" width="100%">
      <NoPositionsBanner
        title={isConnected ? t('positions.noPositions.title') : t('positions.welcome.connect.wallet')}
        description={isConnected ? t('positions.noPositions.description') : t('positions.welcome.connect.description')}
        cta={
          isConnected ? undefined : (
            <Button
              variant="default"
              size="small"
              emphasis="secondary"
              fill={false}
              borderRadius="$roundedFull"
              onPress={accountDrawer.open}
            >
              {t('common.connectWallet.button')}
            </Button>
          )
        }
      />

      <Flex gap="$spacing16" width="100%">
        <Text variant="subheading1" color="$neutral1">
          {t('pool.top.title')}
        </Text>
        <ExploreContextProvider>
          <ExploreTablesFilterStoreContextProvider>
            <ExploreTopPoolTable staticSize pageSize={TOP_POOLS_ROW_COUNT} />
          </ExploreTablesFilterStoreContextProvider>
        </ExploreContextProvider>
        <Trace logPress element={ElementName.PositionsEmptyStateExplorePools}>
          <Button
            tag="a"
            href={EXPLORE_POOLS_HREF}
            variant="default"
            emphasis="tertiary"
            size="small"
            fill={false}
            borderRadius="$roundedFull"
            icon={<ArrowRight />}
            iconPosition="after"
            alignSelf="flex-start"
            $platform-web={{ textDecoration: 'none' }}
          >
            {t('pool.top.seeAll')}
          </Button>
        </Trace>
      </Flex>

      <TopVerifiedAuctionsDiscoverySection />
    </Flex>
  )
}
