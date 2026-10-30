import type { UniverseChainId } from '@universe/chains'
import { Text, type TextCompatProps } from '@universe/mycelium'
import { Flex, TouchableArea } from '@universe/mycelium'
import { forwardRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fonts } from 'ui/src/theme/fonts'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { usePositionSort } from '~/features/Liquidity/hooks/usePositionSort'
import { PoolPositionsTable } from '~/features/Liquidity/PositionsTable'
import { useAccount } from '~/hooks/useAccount'
import { PoolDetailsTransactionsTable } from '~/pages/PoolDetails/components/PoolDetailsTransactionsTable'
import { usePoolPositions } from '~/pages/PoolDetails/hooks/usePoolPositions'

enum PoolDetailsTableTabs {
  TRANSACTIONS = 'transactions',
  POSITIONS = 'positions',
}

// Note: this intentionally scales via media-scoped fontSize/lineHeight rather than a `variant`
// swap. Swapping to a subheading variant inside `$sm` leaks the subHeading font family (and its
// family-relative size tokens) to all widths on web, shrinking the tabs on desktop too.
const TableHeaderText = forwardRef<HTMLElement, TextCompatProps>(function TableHeaderText({ $sm: sm, ...props }, ref) {
  return (
    <Text
      ref={ref}
      variant="heading3"
      userSelect="none"
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $sm={{ fontSize: fonts.subheading2.fontSize, lineHeight: fonts.subheading2.lineHeight, ...sm }}
      {...props}
    />
  )
})

export function PoolDetailsTableTab({
  poolAddress,
  chainId,
  token0,
  token1,
  isPoolDataLoading,
  showWalletPositions = true,
}: {
  poolAddress: string
  chainId: UniverseChainId
  token0?: ParsedToken
  token1?: ParsedToken
  isPoolDataLoading?: boolean
  /** False when the page lists the wallet's positions elsewhere, which drops the Positions tab. */
  showWalletPositions?: boolean
}) {
  const { t } = useTranslation()
  const [activeTable, setActiveTable] = useState<PoolDetailsTableTabs>(PoolDetailsTableTabs.TRANSACTIONS)
  const account = useAccount()
  const { sort, onSort } = usePositionSort()
  // No account disables the query, so the tab never appears.
  const { positions, isPlaceholderData } = usePoolPositions({
    account: showWalletPositions ? account.address : undefined,
    chainId,
    poolIdOrAddress: poolAddress,
    sort,
  })
  // The Positions tab is only offered while the wallet holds something here, so losing the last
  // position (or the wallet) has to fall back to transactions rather than strand the empty tab.
  const showPositions = activeTable === PoolDetailsTableTabs.POSITIONS && positions.length > 0

  return (
    <Flex gap="$gap24">
      {positions.length ? (
        <Flex row flexWrap="wrap" gap="$gap16">
          <TouchableArea onPress={() => setActiveTable(PoolDetailsTableTabs.TRANSACTIONS)}>
            <TableHeaderText color={activeTable === PoolDetailsTableTabs.TRANSACTIONS ? '$neutral1' : '$neutral2'}>
              {t('common.transactions')}
            </TableHeaderText>
          </TouchableArea>
          <TouchableArea onPress={() => setActiveTable(PoolDetailsTableTabs.POSITIONS)}>
            <TableHeaderText color={activeTable === PoolDetailsTableTabs.POSITIONS ? '$neutral1' : '$neutral2'}>
              {t('pool.positions')}
              {` (${positions.length})`}
            </TableHeaderText>
          </TouchableArea>
        </Flex>
      ) : (
        <TableHeaderText color="$neutral1">{t('common.transactions')}</TableHeaderText>
      )}
      {showPositions ? (
        <PoolPositionsTable positions={positions} isPlaceholderData={isPlaceholderData} sort={sort} onSort={onSort} />
      ) : (
        <PoolDetailsTransactionsTable
          poolAddress={poolAddress}
          token0={token0}
          token1={token1}
          isPoolDataLoading={isPoolDataLoading}
        />
      )}
    </Flex>
  )
}
