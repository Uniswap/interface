import { Trans } from '@lingui/macro'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { LeaderBoard, useLeaderboardData } from 'graphql/leaderboard/LeaderBoard'
import { PAGE_SIZE } from 'graphql/tokens/TokenData'
import { useAtomValue } from 'jotai/utils'
import { ReactNode, useMemo } from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'

import { HeaderRow, LoadedRow, LoadingRow } from './LeaderBoardRow'
import { filterStringAtom, filterTimeAtom, sortAscendingAtom, sortMethodAtom } from './state'

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

export default function LeaderboardTable() {
  const timePeriod = useAtomValue(filterTimeAtom)

  const { loading, data: leaderBoard } = useLeaderboardData(timePeriod)

  const filterString = useAtomValue(filterStringAtom)
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  const filteredAndSortedData = useMemo(() => {
    type LeaderBoardKeys = Exclude<keyof LeaderBoard, 'address' | 'date'>

    const sortMethodMapping: { [key: string]: LeaderBoardKeys } = {
      Trades: 'txCount',
      VolumeUSDT: 'totalVolume',
    }

    const filtered = leaderBoard?.filter((obj: LeaderBoard | Omit<LeaderBoard, 'address' | 'date'>) => {
      if ('address' in obj) {
        const addressMatch = obj.address.toLowerCase().includes(filterString.toLowerCase())
        return addressMatch
      }

      return obj.id.toLowerCase().includes(filterString.toLowerCase())
    })

    const sorted = filtered?.sort((a, b) => {
      const isTotalVolume = sortMethodMapping[sortMethod] === 'totalVolume'
      const fieldA = isTotalVolume
        ? parseFloat(a[sortMethodMapping[sortMethod]] as string)
        : a[sortMethodMapping[sortMethod]]
      const fieldB = isTotalVolume
        ? parseFloat(b[sortMethodMapping[sortMethod]] as string)
        : b[sortMethodMapping[sortMethod]]

      if (fieldA && fieldB && fieldA < fieldB) {
        return sortAscending ? -1 : 1
      }
      if (fieldA && fieldB && fieldA > fieldB) {
        return sortAscending ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [filterString, leaderBoard, sortAscending, sortMethod])

  /* loading and error state */
  if (loading) {
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
            (leaderboard, index) =>
              leaderboard?.id && (
                <LoadedRow
                  key={leaderboard.id}
                  leaderboardListIndex={index}
                  leaderboardListLength={filteredAndSortedData.length}
                  leaderboard={leaderboard}
                  sortRank={index + 1}
                />
              )
          )}
        </TokenDataContainer>
      </GridContainer>
    )
  }
}
