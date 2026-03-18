import { GraphQLApi } from '@universe/api'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, TouchableArea } from 'ui/src'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { PositionInfo } from '~/components/Liquidity/types'
import { parseRestPosition } from '~/components/Liquidity/utils/parseFromRest'
import { useAccount } from '~/hooks/useAccount'
import { PoolDetailsPositionsTable } from '~/pages/PoolDetails/components/PoolDetailsPositionsTable'
import { PoolDetailsTransactionsTable } from '~/pages/PoolDetails/components/PoolDetailsTransactionsTable'

enum PoolDetailsTableTabs {
  TRANSACTIONS = 'transactions',
  POSITIONS = 'positions',
}

const TableHeaderText = styled(Text, {
  variant: 'heading2',
  userSelect: 'none',
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
      <Flex row gap="$gap16">
        <TouchableArea onPress={() => setActiveTable(PoolDetailsTableTabs.TRANSACTIONS)} disabled={!positions?.length}>
          <TableHeaderText color={activeTable === PoolDetailsTableTabs.TRANSACTIONS ? '$neutral1' : '$neutral2'}>
            {t('common.transactions')}
          </TableHeaderText>
        </TouchableArea>
        {Boolean(positions?.length) && (
          <TouchableArea onPress={() => setActiveTable(PoolDetailsTableTabs.POSITIONS)}>
            <TableHeaderText color={activeTable === PoolDetailsTableTabs.POSITIONS ? '$neutral1' : '$neutral2'}>
              {t('pool.positions')}
              {` (${positions?.length})`}
            </TableHeaderText>
          </TouchableArea>
        )}
      </Flex>
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
