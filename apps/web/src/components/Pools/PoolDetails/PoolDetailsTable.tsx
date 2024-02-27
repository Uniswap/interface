import { Trans } from '@lingui/macro'
import { Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import Column from 'components/Column'
import { PoolDetailsPositionsTable } from 'components/Pools/PoolDetails/PoolDetailsPositionsTable'
import Row from 'components/Row'
import { ProtocolVersion, Token } from 'graphql/data/__generated__/types-and-hooks'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'

import { PoolDetailsTransactionsTable } from './PoolDetailsTransactionsTable'

enum PoolDetailsTableTabs {
  TRANSACTIONS = 'transactions',
  POSITIONS = 'positions',
}

const TableHeader = styled(ThemedText.HeadlineMedium)<{ active: boolean }>`
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
  token0?: Token
  token1?: Token
  protocolVersion?: ProtocolVersion
}) {
  const [activeTable, setActiveTable] = useState<PoolDetailsTableTabs>(PoolDetailsTableTabs.TRANSACTIONS)
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const { account } = useWeb3React()
  const { positions } = useMultiChainPositions(account ?? '', [chainId])
  const positionsInThisPool = useMemo(
    () =>
      positions?.filter(
        (position) =>
          Pool.getAddress(position.pool.token0, position.pool.token1, position.pool.fee).toLowerCase() ===
          poolAddress.toLowerCase()
      ) ?? [],
    [poolAddress, positions]
  )
  return (
    <Column gap="lg">
      <Row gap="16px">
        <TableHeader
          active={activeTable === PoolDetailsTableTabs.TRANSACTIONS}
          onClick={() => setActiveTable(PoolDetailsTableTabs.TRANSACTIONS)}
          disabled={!positionsInThisPool.length}
        >
          <Trans>Transactions</Trans>
        </TableHeader>
        {Boolean(positionsInThisPool.length) && (
          <TableHeader
            active={activeTable === PoolDetailsTableTabs.POSITIONS}
            onClick={() => setActiveTable(PoolDetailsTableTabs.POSITIONS)}
          >
            <Trans>Positions</Trans>
            {` (${positionsInThisPool?.length})`}
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
        <PoolDetailsPositionsTable positions={positionsInThisPool} />
      )}
    </Column>
  )
}
