import { Interface } from '@ethersproject/abi'
import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import POOL_EXTENDED_ABI from 'abis/pool-extended.json'
import PoolPositionListItem from 'components/PoolPositionListItem'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import React, { useMemo } from 'react'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { PoolPositionDetails } from 'types/position'

const DesktopHeader = styled.div`
  display: none;
  font-size: 14px;
  font-weight: 500;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    align-items: center;
    display: flex;
    justify-content: space-between;
    & > div:last-child {
      text-align: right;
      margin-right: 12px;
    }
  }
`

const MobileHeader = styled.div`
  font-weight: medium;
  padding: 8px;
  font-weight: 500;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    display: none;
  }

  @media screen and (max-width: ${MEDIA_WIDTHS.deprecated_upToExtraSmall}px) {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
`

type PoolPositionListProps = React.PropsWithChildren<{
  positions: PoolPositionDetails[]
  filterByOperator?: any
  filterByHolder?: string
}>

export default function PoolPositionList({ positions, filterByOperator, filterByHolder }: PoolPositionListProps) {
  const { account, chainId } = useWeb3React()
  // TODO: we should merge this part with same part in swap page and move to a custom hook
  const poolAddresses = positions.map((p) => p.pool)
  const PoolInterface = new Interface(POOL_EXTENDED_ABI)
  // TODO: check how many times we are making this rpc call
  const results = useMultipleContractSingleData(poolAddresses, PoolInterface, 'getPool')
  // TODO: if we initiate this in state, we can later query from state instead of making rpc call
  //  in 1) swap and 2) each pool url, we could also store poolId at that point
  const operatedPools = useMemo(() => {
    return results
      .map((result, i) => {
        const { result: pools, loading } = result
        if (!chainId || loading || !pools || !pools?.[0]) return ''
        const { name, symbol, decimals, owner } = pools?.[0]
        const isPoolOperator = owner === account
        if (filterByOperator && !isPoolOperator) return ''
        return new Token(chainId, poolAddresses[i], decimals, symbol, name)
      })
      .filter((p) => p !== '')
  }, [account, chainId, filterByOperator, poolAddresses, results])

  return (
    <>
      <DesktopHeader>
        <div>
          {filterByOperator ? <Trans>Operated pools</Trans> : <Trans>Loaded pools</Trans>}
          {positions && ' (' + operatedPools.length + ')'}
        </div>
      </DesktopHeader>
      <MobileHeader>{filterByOperator ? <Trans>Operated pools</Trans> : <Trans>Loaded pools</Trans>}</MobileHeader>
      {operatedPools.length !== 0 ? (
        operatedPools.map((p: any) => {
          return <PoolPositionListItem key={p?.name.toString()} positionDetails={p} />
        })
      ) : (
        <>
          <DesktopHeader>
            <div>
              <Trans>You are not operating a pool. Click the &quot;Create Pool&quot; button to deploy one.</Trans>
            </div>
          </DesktopHeader>
          <MobileHeader>
            <Trans>You are not operating a pool. Click the &quot;Create Pool&quot; button to deploy one.</Trans>
          </MobileHeader>
        </>
      )}
    </>
  )
}
