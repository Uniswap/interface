import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { GraphQLApi } from '@universe/api'
import { DynamicConfigs, HomeScreenExploreTokensConfigKey, useDynamicConfigValue } from '@universe/gating'
import { ForwardedRef, forwardRef, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, LayoutRectangle, RefreshControl } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { TokenItem } from 'src/components/explore/TokenItem'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'
import { TAB_BAR_HEIGHT, TabProps } from 'src/components/layout/TabHelpers'
import { AnimatePresence, Flex, LinearGradient, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { SwirlyArrowDown } from 'ui/src/components/icons'
import { spacing, zIndexes } from 'ui/src/theme'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { isContractInputArrayType } from 'uniswap/src/features/gating/typeGuards'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { isAndroid } from 'utilities/src/platform'
import { selectHasUsedExplore } from 'wallet/src/features/behaviorHistory/selectors'
import { TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

const ESTIMATED_ITEM_SIZE = 68

export const HomeExploreTab = memo(
  forwardRef<FlatList<unknown>, TabProps>(function _HomeExploreTab(
    { containerProps, scrollHandler, headerHeight, refreshing, onRefresh },
    ref,
  ) {
    const isDarkMode = useIsDarkMode()
    const colors = useSporeColors()
    const insets = useAppInsets()
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

    const { onContentSizeChange } = useAdaptiveFooter(containerProps?.contentContainerStyle)

    const { data } = GraphQLApi.useHomeScreenTokensQuery({
      variables: { contracts: recommendedTokens, chain: ethChainId },
    })
    const tokenDataList = useMemo(
      () =>
        [data?.eth, ...(data?.tokens ?? [])]
          .map((token) => gqlTokenToTokenItemData(token))
          .filter((tokenItemData): tokenItemData is TokenItemData => !!tokenItemData),
      [data],
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: fiat currency causes price layout width to change but does not change token data
    useEffect(() => {
      setMaxTokenPriceWrapperWidth(0)
    }, [appFiatCurrency])

    const onTokenLayout = useCallback((layout: LayoutRectangle) => {
      setMaxTokenPriceWrapperWidth((prev) => Math.max(prev, layout.width))
    }, [])

    const renderToken = useCallback(
      ({ item, index }: { item: TokenItemData; index: number }) => {
        const gradientColor = isDarkMode ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)'

        // Used to position each row properly along the gradient to align with the overall layout
        // Needed because can't apply single gradient to flat list as it's built for virtualization
        const gradientYStart = -index
        const gradientYEnd = tokenDataList.length - index

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
      },
      [isDarkMode, tokenDataList.length, maxTokenPriceWrapperWidth, onTokenLayout],
    )

    const refreshControl = useMemo(() => {
      return (
        <RefreshControl
          progressViewOffset={insets.top + (isAndroid && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)}
          refreshing={refreshing ?? false}
          tintColor={colors.neutral3.get()}
          onRefresh={onRefresh}
        />
      )
    }, [refreshing, headerHeight, onRefresh, colors.neutral3, insets.top])

    return (
      <ReactNavigationPerformanceView screenName={MobileScreens.Home}>
        <Flex
          grow
          // Negative top margin used to offset padding from tab bar that's difficult to change
          mt={-spacing.spacing12}
        >
          <AnimatedFlatList
            // biome-ignore lint/suspicious/noExplicitAny: FlatList ref type is complex with animated wrapper
            ref={ref as ForwardedRef<Animated.FlatList<any>>}
            ListFooterComponent={FooterElement}
            data={tokenDataList}
            estimatedItemSize={ESTIMATED_ITEM_SIZE}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            refreshControl={refreshControl}
            refreshing={refreshing}
            renderItem={renderToken}
            showsVerticalScrollIndicator={false}
            updateCellsBatchingPeriod={10}
            onContentSizeChange={onContentSizeChange}
            onRefresh={onRefresh}
            onScroll={scrollHandler}
            {...containerProps}
          />
        </Flex>
      </ReactNavigationPerformanceView>
    )
  }),
)

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
