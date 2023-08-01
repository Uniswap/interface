import { Trans } from '@lingui/macro'
import { useNewTopTokens } from 'graphql/tokens/NewTopTokens'
import { PAGE_SIZE, TokenData } from 'graphql/tokens/TokenData'
import { useFetchedTokenData } from 'graphql/tokens/TokenData'
import { useAtomValue } from 'jotai'
import { ReactNode, useMemo } from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import { filterStringAtom, filterTimeAtom, sortAscendingAtom, sortMethodAtom } from '../state'
import { HeaderRow, LoadedRow, LoadingRow } from './TokenRow'

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: ${({ theme }) => theme.deepShadow};
  margin-left: auto;
  margin-right: auto;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
`

const TokenDataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  width: 100%;
`

const NoTokenDisplay = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 60px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 16px;
  font-weight: 500;
  align-items: center;
  padding: 0px 28px;
  gap: 8px;
`

function NoTokensState({ message }: { message: ReactNode }) {
  return (
    <GridContainer>
      <HeaderRow />
      <NoTokenDisplay>{message}</NoTokenDisplay>
    </GridContainer>
  )
}

const LoadingRows = ({ rowCount }: { rowCount: number }) => (
  <>
    {Array(rowCount)
      .fill(null)
      .map((_, index) => {
        return <LoadingRow key={index} first={index === 0} last={index === rowCount - 1} />
      })}
  </>
)

function LoadingTokenTable({ rowCount = PAGE_SIZE }: { rowCount?: number }) {
  return (
    <GridContainer>
      <HeaderRow />
      <TokenDataContainer>
        <LoadingRows rowCount={rowCount} />
      </TokenDataContainer>
    </GridContainer>
  )
}

export default function TokenTable() {
  const { loading, tokens: newTokens } = useNewTopTokens()
  const tokensAddress = newTokens?.map((token) => token.id) || []
  const filterString = useAtomValue(filterStringAtom)
  const { loading: tokenDataLoading, data: tokenData } = useFetchedTokenData(tokensAddress)
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)
  const timePeriod = useAtomValue(filterTimeAtom)

  const filteredAndSortedData = useMemo(() => {
    const sortMethodMapping: { [key: string]: keyof TokenData } = {
      Change: timePeriod === 0 ? 'priceUSDChange' : 'priceUSDChangeWeek',
      TVL: 'tvlUSD',
      Price: 'priceUSD',
      Volume: timePeriod === 0 ? 'volumeUSD' : 'volumeUSDWeek',
    }

    const filtered = tokenData?.filter((obj) => {
      const nameMatch = obj.name.toLowerCase().includes(filterString.toLowerCase())
      const symbolMatch = obj.symbol.toLowerCase().includes(filterString.toLowerCase())

      return nameMatch || symbolMatch
    })

    const sorted = filtered?.sort((a, b) => {
      const fieldA = a[sortMethodMapping[sortMethod]]
      const fieldB = b[sortMethodMapping[sortMethod]]

      if (fieldA < fieldB) {
        return sortAscending ? -1 : 1
      }
      if (fieldA > fieldB) {
        return sortAscending ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [filterString, sortAscending, sortMethod, timePeriod, tokenData])

  /* loading and error state */
  if (loading && tokenDataLoading && !newTokens && !tokenData) {
    return <LoadingTokenTable rowCount={PAGE_SIZE} />
  } else if (!filteredAndSortedData) {
    return (
      <NoTokensState
        message={
          <>
            <AlertTriangle size={16} />
            <Trans>An error occurred loading tokens. Please try again.</Trans>
          </>
        }
      />
    )
  } else {
    return (
      <GridContainer>
        <HeaderRow />
        <TokenDataContainer>
          {filteredAndSortedData?.map(
            (token, index) =>
              token?.address && (
                <LoadedRow
                  key={token.address}
                  tokenListIndex={index}
                  tokenListLength={filteredAndSortedData.length}
                  token={token}
                  sortRank={index + 1}
                />
              )
          )}
        </TokenDataContainer>
      </GridContainer>
    )
  }
}
