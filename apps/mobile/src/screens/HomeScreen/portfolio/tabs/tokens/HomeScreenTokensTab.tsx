import { NetworkStatus } from '@apollo/client'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import { FadeInDown, FadeOut, runOnJS, useAnimatedReaction } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { TokenBalanceItemRow } from 'src/components/TokenBalanceList/TokenBalanceList'
import { useRafCoalescedScrollWindow } from 'src/screens/HomeScreen/portfolio/tabs/common/hooks/useRafCoalescedScrollWindow'
import { useWalletTabEmptyStyle } from 'src/screens/HomeScreen/portfolio/tabs/common/hooks/useWalletTabEmptyStyle'
import { TabMeasuredLayout } from 'src/screens/HomeScreen/portfolio/tabs/common/TabMeasuredLayout'
import { WalletPortfolioEmptyState } from 'src/screens/HomeScreen/portfolio/tabs/tokens/empty/WalletPortfolioEmptyState'
import type { ScrollWindowRange } from 'src/screens/HomeScreen/portfolio/types'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { Flex } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { EmptyTokensList } from 'uniswap/src/components/portfolio/EmptyTokensList'
import { TOKEN_BALANCE_ITEM_ESTIMATED_HEIGHT } from 'uniswap/src/components/portfolio/TokenBalanceItem/TokenBalanceItem'
import { useTokenBalanceListContext } from 'uniswap/src/features/portfolio/TokenBalanceListContext'
import { isHiddenTokenBalancesRow, type TokenBalanceListRow } from 'uniswap/src/features/portfolio/types'
import { noop } from 'utilities/src/react/noop'

/** Off-viewport buffer (dp) for Tokens tab scroll windowing. */
const TOKEN_DRAW_DISTANCE = 1500
type TokenRowDescriptor =
  | { kind: 'token'; rowId: TokenBalanceListRow }
  /** `HIDDEN_TOKEN_BALANCES_ROW` divider - variable height, always rendered. */
  | { kind: 'special'; rowId: TokenBalanceListRow }

interface HomeScreenTokensTabProps {
  testID?: string
  onHeightChange: (height: number) => void
  /** Outer FlatList scroll offset; used to derive which token rows are within the visible window. */
  feedScrollValue: SharedValue<number>
  /** Outer FlatList viewport height, approximately device height. */
  viewportHeight: number
  /** Y-offset of the Tokens tab's first row inside the outer FlatList content. */
  bodyOffsetY: number
}

const tokenPlaceholderStyle: ViewStyle = { height: TOKEN_BALANCE_ITEM_ESTIMATED_HEIGHT, width: '100%' }

export const HomeScreenTokensTab = memo(function HomeScreenTokensTabInner({
  testID,
  onHeightChange,
  feedScrollValue,
  viewportHeight,
  bodyOffsetY,
}: HomeScreenTokensTabProps): JSX.Element {
  const emptyComponentStyle = useWalletTabEmptyStyle()
  const { rows: tokenRows } = useTokenBalanceListContext()
  const hasTokenRows = !!tokenRows.length

  const rowDescriptors = useMemo<TokenRowDescriptor[]>(
    () =>
      tokenRows.map((rowId) =>
        isHiddenTokenBalancesRow(rowId) ? { kind: 'special', rowId } : { kind: 'token', rowId },
      ),
    [tokenRows],
  )

  const numRows = rowDescriptors.length
  const initialEnd = Math.min(
    numRows - 1,
    Math.ceil((viewportHeight + TOKEN_DRAW_DISTANCE) / TOKEN_BALANCE_ITEM_ESTIMATED_HEIGHT) + 1,
  )
  const firstWindowEnd = Math.max(0, initialEnd)
  const initialVisibleRange = useMemo(
    (): ScrollWindowRange => ({
      start: 0,
      end: firstWindowEnd,
    }),
    [firstWindowEnd],
  )
  const [visibleRange, scheduleVisibleRange] = useRafCoalescedScrollWindow(initialVisibleRange)

  useAnimatedReaction(
    () => {
      const scrollY = feedScrollValue.value
      const relStart = scrollY - bodyOffsetY - TOKEN_DRAW_DISTANCE
      const relEnd = scrollY - bodyOffsetY + viewportHeight + TOKEN_DRAW_DISTANCE
      const start = Math.max(0, Math.floor(relStart / TOKEN_BALANCE_ITEM_ESTIMATED_HEIGHT))
      const end = Math.max(0, Math.min(numRows - 1, Math.floor(relEnd / TOKEN_BALANCE_ITEM_ESTIMATED_HEIGHT)))
      return { start, end }
    },
    (range, prev) => {
      if (!prev || range.start !== prev.start || range.end !== prev.end) {
        runOnJS(scheduleVisibleRange)(range)
      }
    },
    [numRows, bodyOffsetY, viewportHeight, scheduleVisibleRange],
  )

  return (
    <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
      <TokenListInlineError />
      {hasTokenRows ? (
        rowDescriptors.map((row, i) => {
          if (row.kind === 'special') {
            return <TokenBalanceItemRow key={row.rowId} item={row.rowId} />
          }
          const isVisible = i <= firstWindowEnd || (i >= visibleRange.start && i <= visibleRange.end)
          if (!isVisible) {
            return <View key={row.rowId} style={tokenPlaceholderStyle} />
          }
          return <TokenBalanceItemRow key={row.rowId} item={row.rowId} />
        })
      ) : (
        <Flex px="$spacing24">
          <EmptyTokensList
            emptyCondition
            emptyTokensComponent={
              <Flex centered pt="$spacing48" px="$spacing36" style={emptyComponentStyle}>
                <WalletPortfolioEmptyState />
              </Flex>
            }
            errorCardContainerStyle={{ pt: '$spacing24' }}
          />
        </Flex>
      )}
    </TabMeasuredLayout>
  )
})

function TokenListInlineError(): JSX.Element | null {
  const { t } = useTranslation()
  const { balancesById, networkStatus, refetch, isPortfolioBalancesLoading } = useTokenBalanceListContext()

  useAppStateTrigger({ from: 'background', to: 'active', callback: refetch || noop })

  const hasData = !!balancesById
  const hasErrorWithCachedValues = !isPortfolioBalancesLoading && hasData && networkStatus === NetworkStatus.error

  return hasErrorWithCachedValues ? (
    <AnimatedFlex entering={FadeInDown} exiting={FadeOut} px="$spacing24" py="$spacing8">
      <BaseCard.InlineErrorState title={t('home.tokens.error.fetch')} onRetry={refetch} />
    </AnimatedFlex>
  ) : null
}
