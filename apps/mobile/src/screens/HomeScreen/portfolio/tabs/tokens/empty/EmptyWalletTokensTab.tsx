import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokensMultiChainResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import type { UniverseChainId } from '@universe/chains'
import { DynamicConfigs, HomeScreenExploreTokensConfigKey, useDynamicConfigValue } from '@universe/gating'
import { Flex, LinearGradient, Text, useIsDarkMode } from '@universe/mycelium'
import { SwirlyArrowDown } from '@universe/mycelium/icons'
import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutRectangle } from 'react-native'
import type { EntryExitAnimationFunction } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { TokenItem } from 'src/components/explore/TokenItem'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { spacing, zIndexes } from 'ui/src/theme'
import { getGetTokensMultiChainQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { normalizeBackendNativeAddress } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { useMultichainExploreMetricsAnalytics } from 'uniswap/src/features/explore/useMultichainExploreMetricsAnalytics'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { isContractInputArrayType } from 'uniswap/src/features/gating/typeGuards'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import {
  areCurrencyIdsEqual,
  buildCurrencyId,
  buildNativeCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
  isNativeCurrencyAddress,
} from 'uniswap/src/utils/currencyId'
import { selectHasUsedExplore } from 'wallet/src/features/behaviorHistory/selectors'
import { TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

const EMPTY_TOKEN_DATA_LIST: TokenItemData[] = []

/** Recommended tokens for empty-wallet home (no nested scroll). */
export const EmptyWalletTokensTab = memo(function EmptyWalletTokensTabInner(): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const appFiatCurrency = useAppFiatCurrency()
  const { chains: enabledChainIds } = useEnabledChains()
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

  // The remote config still speaks GraphQL ContractInput; ETH leads the list as before.
  const currencyIds = useMemo(
    () =>
      [{ chain: ethChainId }, ...recommendedTokens]
        .map(contractInputToCurrencyId)
        .filter((currencyId): currencyId is string => !!currencyId),
    [ethChainId, recommendedTokens],
  )
  const multichainParams = useMemo(
    () => ({
      identifier: {
        case: 'tokens' as const,
        value: { tokens: currencyIds.map((currencyId) => currencyIdToRestContractInput(currencyId)) },
      },
    }),
    [currencyIds],
  )
  const selectTokenItemDataList = useCallback(
    (data: PlainMessage<GetTokensMultiChainResponse> | undefined) =>
      multichainTokensToTokenItemDataList({ multichainTokens: data?.tokens ?? [], currencyIds, enabledChainIds }),
    [currencyIds, enabledChainIds],
  )
  const { data: tokenDataList = EMPTY_TOKEN_DATA_LIST, isLoading: homeExploreTokensLoading } = useQuery(
    getGetTokensMultiChainQueryOptions({
      params: multichainParams,
      enabled: currencyIds.length > 0,
      select: selectTokenItemDataList,
    }),
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

// Reanimated legs of the legacy Tamagui 'quick' presence fade (enter/exit opacity 0).
const fadeInQuick: EntryExitAnimationFunction = () => {
  'worklet'
  return {
    initialValues: { opacity: 0 },
    animations: { opacity: withSporeCurve('quick', 1) },
  }
}

const fadeOutQuick: EntryExitAnimationFunction = () => {
  'worklet'
  return {
    initialValues: { opacity: 1 },
    animations: { opacity: withSporeCurve('quick', 0) },
  }
}

function FooterElement(): JSX.Element {
  const { t } = useTranslation()
  const hasUsedExplore = useSelector(selectHasUsedExplore)

  return (
    <>
      {!hasUsedExplore && (
        <AnimatedFlex centered entering={fadeInQuick} exiting={fadeOutQuick} gap="$spacing8" pt="$spacing8">
          <Text color="$neutral3" variant="subheading2">
            {t('home.explore.footer')}
          </Text>
          <SwirlyArrowDown color="$neutral3" size="$icon.28" />
        </AnimatedFlex>
      )}
    </>
  )
}

function contractInputToCurrencyId({ chain, address }: GraphQLApi.ContractInput): string | undefined {
  const chainId = fromGraphQLChain(chain)
  if (!chainId) {
    return undefined
  }
  return address ? buildCurrencyId(chainId, address) : buildNativeCurrencyId(chainId)
}

function multichainTokensToTokenItemDataList({
  multichainTokens,
  currencyIds,
  enabledChainIds,
}: {
  multichainTokens: PlainMessage<MultichainToken>[]
  currencyIds: string[]
  enabledChainIds: readonly UniverseChainId[]
}): TokenItemData[] {
  return currencyIds
    .map((currencyId) => {
      const multichainToken = multichainTokens.find((token) => multichainTokenHasDeployment(token, currencyId))
      return multichainToken ? multichainTokenToTokenItemData({ multichainToken, currencyId, enabledChainIds }) : null
    })
    .filter((tokenItemData): tokenItemData is TokenItemData => !!tokenItemData)
}

function multichainTokenHasDeployment(multichainToken: PlainMessage<MultichainToken>, currencyId: string): boolean {
  return Object.entries(multichainToken.addresses).some(([chainIdKey, address]) => {
    const chainId = toSupportedChainId(chainIdKey)
    if (!chainId) {
      return false
    }
    // The backend serves natives under placeholder addresses; normalize so they match buildNativeCurrencyId.
    const deploymentCurrencyId = buildCurrencyId(chainId, normalizeBackendNativeAddress({ chainId, address }))
    return areCurrencyIdsEqual(deploymentCurrencyId, currencyId)
  })
}

function multichainTokenToTokenItemData({
  multichainToken,
  currencyId,
  enabledChainIds,
}: {
  multichainToken: PlainMessage<MultichainToken>
  currencyId: string
  enabledChainIds: readonly UniverseChainId[]
}): TokenItemData | null {
  const chainId = currencyIdToChain(currencyId)
  const logoUrl = multichainToken.project?.logoUrl
  if (!chainId || !multichainToken.name || !multichainToken.symbol || !logoUrl) {
    return null
  }

  // The addresses map carries every deployment regardless of request; count only enabled chains
  // (mirrors rankedMultichainTokenToTokenItemData).
  const enabled = new Set<number>(enabledChainIds)
  const networkCount = Object.keys(multichainToken.addresses).filter((chainIdKey) =>
    enabled.has(Number(chainIdKey)),
  ).length

  // The row expects null for natives.
  const address = currencyIdToAddress(currencyId)

  return {
    chainId,
    address: isNativeCurrencyAddress(chainId, address) ? null : address,
    name: multichainToken.name,
    symbol: multichainToken.symbol,
    logoUrl,
    price: multichainToken.price?.spotUsd,
    pricePercentChange24h: multichainToken.price?.percentChange1d,
    networkCount: networkCount || undefined,
  } satisfies TokenItemData
}
