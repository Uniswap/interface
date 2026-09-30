import { UniverseChainId } from '@universe/chains'
import { Flex, Text, TouchableArea, UniversalList } from '@universe/mycelium'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import {
  EXPLORE_TOKEN_CONTAINER_PROPS,
  EXPLORE_TOKEN_ROW_HEIGHT,
  exploreListItemKey,
  exploreListItemsAreEqual,
  getExploreListItemSize,
  getExploreListItemType,
  WINDOW_MULTIPLIER,
  type ExploreTokenRow,
} from 'src/components/explore/ExploreSections/exploreListItems'
import { TokenItem } from 'src/components/explore/TokenItem'
import type { TokenItemData } from 'src/components/explore/TokenItemData'
import { ScreenWithHeader } from 'src/components/layout/screens/ScreenWithHeader'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

// AnimatedNumber stress harness: Explore's top-tokens list with fake prices that tick on a timer.
// Mirrors ExploreSections' UniversalList config so recycling, draw distance, and viewport gating match prod.

const ROW_COUNT = 200
const TICK_MS = 5_000
// Per-tick price drift, as a fraction. Wide enough that most digits roll, small enough to stay readable.
const MAX_DRIFT = 0.08
const MAX_PERCENT_CHANGE_STEP = 2
// Spread fake prices from sub-cent to five figures so every FiatTokenPrice formatting branch is exercised.
const MIN_PRICE_EXPONENT = -4
const MAX_PRICE_EXPONENT = 4
const ADDRESS_HEX_LENGTH = 40

const TRUST_WALLET_BASE = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets'
const SAMPLE_LOGOS = [
  `${TRUST_WALLET_BASE}/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png`,
  `${TRUST_WALLET_BASE}/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png`,
  `${TRUST_WALLET_BASE}/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png`,
  `${TRUST_WALLET_BASE}/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png`,
  `${TRUST_WALLET_BASE}/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png`,
  `${TRUST_WALLET_BASE}/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png`,
]

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function buildInitialTokens(): TokenItemData[] {
  return Array.from({ length: ROW_COUNT }, (_, i) => {
    const price = 10 ** randomBetween(MIN_PRICE_EXPONENT, MAX_PRICE_EXPONENT)
    return {
      name: `Fake Token ${i + 1}`,
      symbol: `FAKE${i + 1}`,
      logoUrl: SAMPLE_LOGOS[i % SAMPLE_LOGOS.length] ?? '',
      chainId: UniverseChainId.Mainnet,
      // Stable per row: TokenItem keys AnimatedNumber on currencyId, so a changing address would
      // remount instead of animate.
      address: `0x${(i + 1).toString(16).padStart(ADDRESS_HEX_LENGTH, '0')}`,
      price,
      pricePercentChange24h: randomBetween(-15, 15),
      volume24h: price * randomBetween(1e3, 1e7),
      marketCap: price * randomBetween(1e6, 1e9),
      networkCount: 1,
    }
  })
}

function tickToken(token: TokenItemData): TokenItemData {
  const price = (token.price ?? 1) * (1 + randomBetween(-MAX_DRIFT, MAX_DRIFT))
  return {
    ...token,
    price,
    pricePercentChange24h:
      (token.pricePercentChange24h ?? 0) + randomBetween(-MAX_PERCENT_CHANGE_STEP, MAX_PERCENT_CHANGE_STEP),
    volume24h: (token.volume24h ?? 0) * (1 + randomBetween(-MAX_DRIFT, MAX_DRIFT)),
  }
}

function renderItem({ item, index }: { item: ExploreTokenRow; index: number }): JSX.Element {
  return (
    <TokenItem
      eventName={MobileEventName.ExploreTokenItemSelected}
      index={index}
      metadataDisplayType={item.tokenMetadataDisplayType}
      rowKey={item.key}
      tokenItemData={item.tokenItemData}
      containerProps={EXPLORE_TOKEN_CONTAINER_PROPS}
    />
  )
}

export function AnimatedNumberDebugScreen(): JSX.Element {
  const dimensions = useWindowDimensions()
  const [tokens, setTokens] = useState<TokenItemData[]>(buildInitialTokens)
  const [tick, setTick] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) {
      return undefined
    }
    const id = setInterval(() => {
      setTokens((prev) => prev.map(tickToken))
      setTick((prev) => prev + 1)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [isPaused])

  const togglePaused = useCallback(() => setIsPaused((prev) => !prev), [])

  const listData = useMemo(
    (): ExploreTokenRow[] =>
      tokens.map((tokenItemData) => ({
        rowType: 'token',
        key: tokenItemData.address ?? tokenItemData.name,
        tokenItemData,
        tokenMetadataDisplayType: TokenMetadataDisplayType.Volume,
      })),
    [tokens],
  )

  return (
    <ScreenWithHeader centerElement={<Text variant="body1">Animated Number</Text>}>
      <Flex row alignItems="center" justifyContent="space-between" px="$spacing24" py="$spacing8">
        <Text color="$neutral2" variant="body3">
          {ROW_COUNT} rows · tick {tick} · every {TICK_MS / 1000}s
        </Text>
        <TouchableArea onPress={togglePaused}>
          <Text color="$accent1" variant="buttonLabel3">
            {isPaused ? 'Resume' : 'Pause'}
          </Text>
        </TouchableArea>
      </Flex>
      <Flex fill>
        <UniversalList
          recycleItems
          trackRowViewability
          data={listData}
          drawDistance={dimensions.height * WINDOW_MULTIPLIER}
          estimatedItemSize={EXPLORE_TOKEN_ROW_HEIGHT}
          estimatedListSize={dimensions}
          getFixedItemSize={getExploreListItemSize}
          getItemType={getExploreListItemType}
          itemsAreEqual={exploreListItemsAreEqual}
          keyExtractor={exploreListItemKey}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      </Flex>
    </ScreenWithHeader>
  )
}
