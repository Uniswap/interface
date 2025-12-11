import { GraphQLApi } from '@universe/api'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { PositionInfo } from 'components/Liquidity/types'
import { parseRestPosition } from 'components/Liquidity/utils/parseFromRest'
import { PoolDetailsPositionsTable } from 'components/Pools/PoolDetails/PoolDetailsPositionsTable'
import { PoolDetailsTransactionsTable } from 'components/Pools/PoolDetails/PoolDetailsTransactionsTable'
import { useAccount } from 'hooks/useAccount'
import { deprecatedStyled } from 'lib/styled-components'
import { useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { ClickableStyle } from 'theme/components/styles'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'

enum PoolDetailsTableTabs {
  TRANSACTIONS = 'transactions',
  POSITIONS = 'positions',
}

const TableHeader = deprecatedStyled(ThemedText.HeadlineMedium)<{ active: boolean }>`
  color: ${({ theme, active }) => !active && theme.neutral2};
  ${({ disabled }) => !disabled && ClickableStyle}
  user-select: none;
`

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
    <Column gap="lg">
      <Row gap="16px">
        <TableHeader
          active={activeTable === PoolDetailsTableTabs.TRANSACTIONS}
          onClick={() => setActiveTable(PoolDetailsTableTabs.TRANSACTIONS)}
          disabled={!positions?.length}
        >
          <Trans i18nKey="common.transactions" />
        </TableHeader>
        {Boolean(positions?.length) && (
          <TableHeader
            active={activeTable === PoolDetailsTableTabs.POSITIONS}
            onClick={() => setActiveTable(PoolDetailsTableTabs.POSITIONS)}
          >
            <Trans i18nKey="pool.positions" />
            {` (${positions?.length})`}
          </TableHeader>
        )}
      </Row>
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
    </Column>
  )
}
