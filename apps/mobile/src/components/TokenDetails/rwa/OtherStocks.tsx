import { FeatureFlags } from '@universe/gating'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native-gesture-handler'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { useGatedTokenDetailsRWAMatch } from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { TokenCard } from 'uniswap/src/components/TokenCard/TokenCard'
import { resolvePrimaryChain } from 'uniswap/src/data/apiClients/dataApiService/rwa/resolvePrimaryChain'
import type { ExploreStockShelfItem } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { useExploreStocks } from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreStocks'
import { useStockTokenCardProps } from 'uniswap/src/data/apiClients/dataApiService/rwa/useStockTokenCardProps'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'

const STOCK_CARD_WIDTH = 204

const LIST_CONTENT_CONTAINER_STYLE = {
  paddingHorizontal: spacing.spacing16,
}

export function OtherStocks(): JSX.Element | null {
  const { t } = useTranslation()
  const rwaMatch = useGatedTokenDetailsRWAMatch(FeatureFlags.RWATdpRelatedTokens)
  const { featured } = useExploreStocks([], {
    enabled: Boolean(rwaMatch),
    excludeSymbol: rwaMatch?.asset.symbol,
  })

  if (!rwaMatch || featured.length === 0) {
    return null
  }

  return (
    <Flex gap="$spacing12" testID={TestID.TokenDetailsRWARelatedTokens}>
      <Text color="$neutral2" mx="$spacing24" variant="subheading2">
        {t('tdp.rwa.otherStocks')}
      </Text>
      <FlatList
        horizontal
        contentContainerStyle={LIST_CONTENT_CONTAINER_STYLE}
        data={featured}
        ItemSeparatorComponent={ItemSeparatorComponent}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
      />
    </Flex>
  )
}

const renderItem = ({ item }: { item: ExploreStockShelfItem }): JSX.Element => <StockCard item={item} />

function keyExtractor(item: ExploreStockShelfItem): string {
  return item.rwa.symbol
}

function ItemSeparatorComponent(): JSX.Element {
  return <Flex width="$spacing12" />
}

const StockCard = memo(function StockCard({ item }: { item: ExploreStockShelfItem }): JSX.Element {
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const { chains: enabledChainIds } = useEnabledChains()
  const cardProps = useStockTokenCardProps(item)
  const resolved = resolvePrimaryChain({ issuer: item.issuer, enabledChainIds })

  const onPress = useEvent((): void => {
    if (!resolved) {
      return
    }
    const currencyId = buildCurrencyId(resolved.chainId, resolved.chainToken.address)
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigateWithPop(currencyId)
  })

  return (
    <TokenCard
      {...cardProps}
      hideNetworkLogo
      layout="vertical"
      width={STOCK_CARD_WIDTH}
      onPress={resolved ? onPress : undefined}
    />
  )
})
