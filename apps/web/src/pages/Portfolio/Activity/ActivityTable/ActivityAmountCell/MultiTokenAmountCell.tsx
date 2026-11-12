import { Flex, Text } from '@universe/mycelium'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { OverlappingCurrencyLogos } from '~/components/Logo/OverlappingCurrencyLogos'
import { CompactLayout } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/CompactLayout'
import { EmptyCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/EmptyCell'
import { useActivityTypeLabel } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/useActivityTypeLabel'
import {
  AMOUNT_COLUMN_WIDTH,
  COMPACT_THUMBNAIL_SIZE,
} from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/utils'
import { ActivityAmountModel, ActivityCellVariant } from '~/pages/Portfolio/Activity/ActivityTable/activityTableModels'

// Match TokenAmountDisplay's 32px logo so the full-row cluster lines up with dual-token amounts.
const FULL_MULTI_TOKEN_LOGO_SIZE = 32
// Caps both the symbol text and the logo cluster, in the full layout and in the compact row, so the
// "+N" the text accounts for is always the same remainder the cluster hides.
const MAX_SHOWN = 3

// Symbols of the first MAX_SHOWN currencies, joined, with a "+N" suffix for the remainder.
// `totalCount` defaults to the number of infos but callers pass the claim's full token count, so
// tokens whose metadata didn't resolve are still counted in "+N" rather than silently dropped.
function formatMultiTokenSymbols(currencyInfos: CurrencyInfo[], totalCount?: number): string {
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

interface MultiTokenAmountCellProps {
  transaction: TransactionDetails
  amount: Extract<ActivityAmountModel, { kind: 'multi-token' }>
  variant?: ActivityCellVariant
}

export function MultiTokenAmountCell({
  transaction,
  amount,
  variant = 'full',
}: MultiTokenAmountCellProps): JSX.Element {
  const multiTokenCurrencyInfos = useCurrencyInfos(amount.currencyIds)
  const typeLabel = useActivityTypeLabel({ transaction, variant })

  // Unresolved currencies are dropped rather than rendered as gaps in the cluster.
  const resolved = multiTokenCurrencyInfos.filter((currencyInfo): currencyInfo is CurrencyInfo => Boolean(currencyInfo))

  // The claim's full token count, so an unresolved token lands in "+N" instead of vanishing.
  const totalCount = amount.currencyIds.length

  // Checked after the compact branch rather than before it: a compact row with nothing resolved
  // still keeps its type label, matching what the single-token case renders in that state.
  if (variant === 'compact') {
    return (
      <CompactLayout
        typeLabel={typeLabel}
        logo={
          resolved.length > 0 ? (
            <OverlappingCurrencyLogos
              currencyInfos={resolved}
              size={COMPACT_THUMBNAIL_SIZE}
              max={MAX_SHOWN}
              totalCount={totalCount}
            />
          ) : null
        }
        amountText={formatMultiTokenSymbols(resolved, totalCount)}
      />
    )
  }

  if (resolved.length === 0) {
    return <EmptyCell />
  }

  // Mirrors DualTokenLayout's input column so the amount column stays aligned across row types.
  return (
    <Flex row alignItems="center" width="100%" gap="$gap8">
      <Flex row alignItems="center" gap="$gap8" justifyContent="flex-start" minWidth={AMOUNT_COLUMN_WIDTH}>
        <OverlappingCurrencyLogos
          currencyInfos={resolved}
          size={FULL_MULTI_TOKEN_LOGO_SIZE}
          max={MAX_SHOWN}
          totalCount={totalCount}
        />
        <Text variant="body3" fontWeight="500">
          {formatMultiTokenSymbols(resolved, totalCount)}
        </Text>
      </Flex>
    </Flex>
  )
}
