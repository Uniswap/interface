import { Flex, Text } from 'ui/src'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { OverlappingCurrencyLogos } from '~/components/Logo/OverlappingCurrencyLogos'
import { EmptyCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/EmptyCell'

const AMOUNT_COLUMN_WIDTH = 180
// Caps both the symbol text and the logo cluster, in this layout and in the compact row, so the
// "+N" the text accounts for is always the same remainder the cluster hides.
export const MAX_SHOWN = 3

// Symbols of the first MAX_SHOWN currencies, joined, with a "+N" suffix for the remainder.
// `totalCount` defaults to the number of infos but callers pass the claim's full token count, so
// tokens whose metadata didn't resolve are still counted in "+N" rather than silently dropped.
export function formatMultiTokenSymbols(currencyInfos: CurrencyInfo[], totalCount?: number): string {
  const shown = currencyInfos.slice(0, MAX_SHOWN)
  const overflow = (totalCount ?? currencyInfos.length) - shown.length
  // A resolved token can still have no symbol; dropping the blanks avoids a stray ", ," separator.
  const symbols = shown
    .map((currencyInfo) => getSymbolDisplayText(currencyInfo.currency.symbol))
    .filter(Boolean)
    .join(', ')

  if (overflow <= 0) {
    return symbols
  }

  // "+N" stands alone when nothing shown had a symbol, rather than carrying a leading space.
  return symbols ? `${symbols} +${overflow}` : `+${overflow}`
}

// Full-variant row for a set of currencies with no per-currency amount: logo cluster + symbols.
// Mirrors DualTokenLayout's input column so the amount column stays aligned across row types.
export function MultiTokenLayout({
  currencyInfos,
  logoSize,
  totalCount,
}: {
  currencyInfos: CurrencyInfo[]
  logoSize: number
  totalCount?: number
}): JSX.Element {
  if (currencyInfos.length === 0) {
    return <EmptyCell />
  }

  return (
    <Flex row alignItems="center" width="100%" gap="$gap8">
      <Flex row alignItems="center" gap="$gap8" justifyContent="flex-start" minWidth={AMOUNT_COLUMN_WIDTH}>
        {/* Defaulted here rather than in the cluster: an activity row always wants the "+N" chip,
            whereas the reward cards cap silently, so the shared component leaves it opt-in. */}
        <OverlappingCurrencyLogos
          currencyInfos={currencyInfos}
          size={logoSize}
          max={MAX_SHOWN}
          totalCount={totalCount ?? currencyInfos.length}
        />
        <Text variant="body3" fontWeight="500">
          {formatMultiTokenSymbols(currencyInfos, totalCount)}
        </Text>
      </Flex>
    </Flex>
  )
}
