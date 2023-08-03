import { Trans } from '@lingui/macro'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import useLeaderboardFilteredData, { LeaderBoard } from 'graphql/leaderboard/LeaderBoard'
import { PAGE_SIZE } from 'graphql/tokens/TokenData'
import { useAtomValue } from 'jotai'
import { ReactNode, useEffect, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'

import { HeaderRow, LoadedUserRow, LoadingRow } from './LeaderBoardRow'
import { rankAtom } from './state'

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

export function LeaderboardUserTable({ address }: { address: string }) {
  const { loading, data: leaderBoard } = useLeaderboardFilteredData(address.toLowerCase())

  const [user, setuser] = useState<Omit<LeaderBoard, 'address' | 'date'>>()
  const currentRank = useAtomValue(rankAtom)

  useEffect(() => {
    if (leaderBoard) {
      setuser({
        id: leaderBoard.id,
        txCount: leaderBoard.txCount,
        totalVolume: leaderBoard.totalVolume,
        rank: Number(currentRank),
      })
    } else if (leaderBoard === null) {
      setuser({ id: address.toLowerCase(), txCount: 0, totalVolume: '0', rank: 300 })
    }
  }, [address, currentRank, leaderBoard])

  /* loading and error state */
  if (loading) {
    return <LoadingTokenTable rowCount={PAGE_SIZE} />
  } else {
    return user ? (
      <GridContainer>
        <HeaderRow />
        <TokenDataContainer>
          {user?.id && (
            <LoadedUserRow
              key={user.id}
              leaderboardListIndex={1}
              leaderboardListLength={1}
              leaderboard={user}
              sortRank={user?.rank ? user?.rank + 1 : 0 + 1}
            />
          )}
        </TokenDataContainer>
      </GridContainer>
    ) : (
      <NoTokensState
        message={
          <>
            <AlertTriangle size={16} />
            <Trans>An error occurred loading leaderboard. Please try again.</Trans>
          </>
        }
      />
    )
  }
}
