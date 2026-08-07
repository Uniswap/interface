import { UniversalList } from '@universe/mycelium'
import { memo } from 'react'
import { ScreenWithHeader } from 'src/components/layout/screens/ScreenWithHeader'
import { Flex, Text } from 'ui/src'
import { Star } from 'ui/src/components/icons'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'

interface DemoItem {
  id: string
  label: string
  symbol: string
  logoUrl: string
}

// Rows are a fixed height so getFixedItemSize can report an exact size and skip measurement.
const ROW_HEIGHT = 72

const TRUST_WALLET_BASE = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets'

const ETH_TOKEN = {
  symbol: 'WETH',
  logoUrl: `${TRUST_WALLET_BASE}/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png`,
}

const SAMPLE_TOKENS = [
  ETH_TOKEN,
  { symbol: 'USDC', logoUrl: `${TRUST_WALLET_BASE}/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png` },
  { symbol: 'DAI', logoUrl: `${TRUST_WALLET_BASE}/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png` },
  { symbol: 'WBTC', logoUrl: `${TRUST_WALLET_BASE}/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png` },
  { symbol: 'UNI', logoUrl: `${TRUST_WALLET_BASE}/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png` },
  { symbol: 'LINK', logoUrl: `${TRUST_WALLET_BASE}/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png` },
]

const DATA: DemoItem[] = Array.from({ length: 500 }, (_, i) => {
  const token = SAMPLE_TOKENS[i % SAMPLE_TOKENS.length] ?? ETH_TOKEN
  return { id: `item-${i}`, label: `Item ${i + 1}`, symbol: token.symbol, logoUrl: token.logoUrl }
})

function keyExtractor(item: DemoItem): string {
  return item.id
}

function getFixedItemSize(): number {
  return ROW_HEIGHT
}

// Memoized row so recycled containers only re-render when their item changes.
const TokenRow = memo(function TokenRow({ item }: { item: DemoItem }): JSX.Element {
  return (
    <Flex height={ROW_HEIGHT} justifyContent="center" px="$spacing16">
      <Flex
        row
        alignItems="center"
        backgroundColor="$surface2"
        borderRadius="$rounded12"
        gap="$spacing12"
        px="$spacing12"
        py="$spacing8"
      >
        <Star color="$neutral2" size={20} />
        <TokenLogo size={32} symbol={item.symbol} url={item.logoUrl} />
        <Flex flex={1} gap="$spacing2">
          <Text color="$neutral1" variant="body1">
            {item.label}
          </Text>
          <Text color="$neutral2" variant="body3">
            {item.symbol}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
})

function renderItem({ item }: { item: DemoItem }): JSX.Element {
  return <TokenRow item={item} />
}

export function UniversalListDebugScreen(): JSX.Element {
  return (
    <ScreenWithHeader centerElement={<Text variant="body1">Universal List</Text>}>
      <Flex grow>
        <UniversalList
          recycleItems
          data={DATA}
          getFixedItemSize={getFixedItemSize}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
        />
      </Flex>
    </ScreenWithHeader>
  )
}
