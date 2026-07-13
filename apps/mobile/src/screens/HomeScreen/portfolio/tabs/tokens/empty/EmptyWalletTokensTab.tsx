import { GraphQLApi } from '@universe/api'
import { DynamicConfigs, HomeScreenExploreTokensConfigKey, useDynamicConfigValue } from '@universe/gating'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutRectangle } from 'react-native'
import { useSelector } from 'react-redux'
import { TokenItem } from 'src/components/explore/TokenItem'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import { AnimatePresence, Flex, LinearGradient, Text, useIsDarkMode } from 'ui/src'
import { SwirlyArrowDown } from 'ui/src/components/icons'
import { spacing, zIndexes } from 'ui/src/theme'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useMultichainExploreMetricsAnalytics } from 'uniswap/src/features/explore/useMultichainExploreMetricsAnalytics'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { isContractInputArrayType } from 'uniswap/src/features/gating/typeGuards'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { selectHasUsedExplore } from 'wallet/src/features/behaviorHistory/selectors'
import { TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

/** Recommended tokens for empty-wallet home (no nested scroll). */
export const EmptyWalletTokensTab = memo(function EmptyWalletTokensTabInner(): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const appFiatCurrency = useAppFiatCurrency()
  const [maxTokenPriceWrapperWidth, setMaxTokenPriceWrapperWidth] = useState(0)

  const ethChainId = useDynamicConfigValue({
    config: DynamicConfigs.HomeScreenExploreTokens,
    key: HomeScreenExploreTokensConfigKey.EthChainId,
    defaultValue: GraphQLApi.Chain.Ethereum,
    customTypeGuard: (x): x is GraphQLApi.Chain => Object.values(GraphQLApi.Chain).includes(x as GraphQLApi.Chain),
  })

  const recommendedTokens = useDynamicConfigValue({
    config: DynamicConfigs.HomeScreenExploreTokens,
    key: HomeScreenExploreTokensConfigKey.Tokens,
    defaultValue: [],
    customTypeGuard: isContractInputArrayType,
  })

  const { data, loading: homeExploreTokensLoading } = GraphQLApi.useHomeScreenTokensQuery({
    variables: { contracts: recommendedTokens, chain: ethChainId },
  })
  const tokenDataList = useMemo(
    () =>
      [data?.eth, ...(data?.tokens ?? [])]
        .map((token) => gqlTokenToTokenItemData(token))
        .filter((tokenItemData): tokenItemData is TokenItemData => !!tokenItemData),
    [data],
  )

  const homeExploreRowChainCounts = useMemo(
    () => tokenDataList.map((tokenItemData) => tokenItemData.networkCount ?? 1),
    [tokenDataList],
  )

  useMultichainExploreMetricsAnalytics({
    rowChainCounts: homeExploreRowChainCounts,
    isExploreTokensLoading: homeExploreTokensLoading,
  })

  useEffect(() => {
    setMaxTokenPriceWrapperWidth(0)
  }, [appFiatCurrency])

  const onTokenLayout = useCallback((layout: LayoutRectangle) => {
    setMaxTokenPriceWrapperWidth((prev) => Math.max(prev, layout.width))
  }, [])

  return (
    <Flex
      // Negative top margin used to offset padding from tab bar that's difficult to change
      mt={-spacing.spacing12}
    >
      {tokenDataList.map((item, index) => (
        <EmptyWalletTokenRow
          key={`${item.chainId}-${item.address ?? 'native'}`}
          index={index}
          isDarkMode={isDarkMode}
          item={item}
          listLength={tokenDataList.length}
          maxTokenPriceWrapperWidth={maxTokenPriceWrapperWidth}
          onTokenLayout={onTokenLayout}
        />
      ))}
      <FooterElement />
    </Flex>
  )
})

interface EmptyWalletTokenRowProps {
  item: TokenItemData
  index: number
  listLength: number
  isDarkMode: boolean
  maxTokenPriceWrapperWidth: number
  onTokenLayout: (layout: LayoutRectangle) => void
}

const EmptyWalletTokenRow = memo(function EmptyWalletTokenRowInner({
  item,
  index,
  listLength,
  isDarkMode,
  maxTokenPriceWrapperWidth,
  onTokenLayout,
}: EmptyWalletTokenRowProps): JSX.Element {
  const gradientColor = isDarkMode ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)'
  const gradientYStart = -index
  const gradientYEnd = listLength - index

  return (
    <Flex position="relative">
      <TokenItem
        hideNumberedList
        showChart
        containerProps={{ px: '$spacing28' }}
        eventName={MobileEventName.HomeExploreTokenItemSelected}
        index={index}
        metadataDisplayType={TokenMetadataDisplayType.Symbol}
        overlay={
          <Flex height="100%" position="absolute" width="100%" zIndex={zIndexes.mask}>
            <LinearGradient
              colors={[gradientColor, '$surface1']}
              end={{ x: 0, y: gradientYEnd }}
              height="100%"
              start={{ x: 0, y: gradientYStart }}
              width="100%"
            />
          </Flex>
        }
        priceWrapperProps={{ minWidth: maxTokenPriceWrapperWidth }}
        tokenItemData={item}
        onPriceWrapperLayout={onTokenLayout}
      />
    </Flex>
  )
})

function FooterElement(): JSX.Element {
  const { t } = useTranslation()
  const hasUsedExplore = useSelector(selectHasUsedExplore)

  return (
    <AnimatePresence>
      {!hasUsedExplore && (
        <Flex
          centered
          animation="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          gap="$spacing8"
          pt="$spacing8"
        >
          <Text color="$neutral3" variant="subheading2">
            {t('home.explore.footer')}
          </Text>
          <SwirlyArrowDown color="$neutral3" size="$icon.28" />
        </Flex>
      )}
    </AnimatePresence>
  )
}

function gqlTokenToTokenItemData(
  token: GraphQLApi.Maybe<NonNullable<NonNullable<GraphQLApi.HomeScreenTokensQuery['tokens']>[0]>>,
): TokenItemData | null {
  if (!token || !token.project) {
    return null
  }

  const { name, symbol, address, chain, project } = token
  const { logoUrl, markets } = project
  const tokenProjectMarket = markets?.[0]

  const chainId = fromGraphQLChain(chain)

  if (!chainId || !name || !symbol || !logoUrl) {
    return null
  }

  return {
    chainId,
    address: address ?? null,
    name,
    symbol,
    logoUrl,
    price: tokenProjectMarket?.price?.value,
    pricePercentChange24h: tokenProjectMarket?.pricePercentChange24h?.value,
  } satisfies TokenItemData
}
