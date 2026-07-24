import { GraphQLApi } from '@universe/api'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, TouchableArea } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { parseRestPosition } from 'uniswap/src/features/positions/parseRestPosition'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { useAccount } from '~/hooks/useAccount'
import { PoolDetailsPositionsTable } from '~/pages/PoolDetails/components/PoolDetailsPositionsTable'
import { PoolDetailsTransactionsTable } from '~/pages/PoolDetails/components/PoolDetailsTransactionsTable'

enum PoolDetailsTableTabs {
  TRANSACTIONS = 'transactions',
  POSITIONS = 'positions',
}

// Note: this intentionally scales via media-scoped fontSize/lineHeight rather than a `variant`
// swap. Swapping to a subheading variant inside `$sm` leaks the subHeading font family (and its
// family-relative size tokens) to all widths on web, shrinking the tabs on desktop too.
const TableHeaderText = styled(Text, {
  variant: 'heading3',
  userSelect: 'none',
  $sm: {
    fontSize: fonts.subheading2.fontSize,
    lineHeight: fonts.subheading2.lineHeight,
  },
})

export function PoolDetailsTableTab({
  poolAddress,
  token0,
  token1,
  protocolVersion,
}: {
  poolAddress: string
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  protocolVersion?: GraphQLApi.ProtocolVersion
}) {
  const { t } = useTranslation()
  const [activeTable, setActiveTable] = useState<PoolDetailsTableTabs>(PoolDetailsTableTabs.TRANSACTIONS)
  const account = useAccount()
  const { data } = useGetPositionsQuery({ address: account.address, poolId: poolAddress })
  const positions = useMemo(
    () =>
      data?.positions
        .map((position) => parseRestPosition(position))
        .filter((position): position is PositionInfo => position !== undefined),
    [data?.positions],
  )
  return (
    <Flex gap="$gap24">
      {positions?.length ? (
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
      {activeTable === PoolDetailsTableTabs.TRANSACTIONS ? (
        <PoolDetailsTransactionsTable
          poolAddress={poolAddress}
          token0={token0}
          token1={token1}
          protocolVersion={protocolVersion}
        />
      ) : (
        <PoolDetailsPositionsTable positions={positions} />
      )}
    </Flex>
  )
}
