import { Trans } from '@lingui/macro'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { LeaderBoard, useLeaderboardData } from 'graphql/leaderboard/LeaderBoard'
import { PAGE_SIZE } from 'graphql/tokens/TokenData'
import { useAtomValue, useSetAtom } from 'jotai'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'

import { HeaderRow, LoadedRow, LoadingRow } from './LeaderBoardRow'
import { filterStringAtom, filterTimeAtom, rankAtom, sortAscendingAtom, sortMethodAtom } from './state'

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

const ButtonPagination = styled.button`
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.accentActive};
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 6px;

  :hover {
    opacity: 0.8;
  }

  :focus {
    outline: none;
  }
`

const ButtonNumberPagination = styled.button`
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.textPrimary};
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 6px;

  :hover {
    opacity: 0.8;
  }

  :focus {
    outline: none;
  }
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

const ITEMS_PER_PAGE = 10

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => any
}) {
  let pages = [...Array(totalPages).keys()].map((i) => i + 1)

  if (pages.length > 3) {
    if (currentPage === 1 || currentPage === 2) {
      pages = pages.slice(0, 3)
    } else if (currentPage === totalPages || currentPage === totalPages - 1) {
      pages = pages.slice(-3)
    } else {
      pages = pages.slice(currentPage - 2, currentPage + 1)
    }
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      {currentPage > 1 && <ButtonPagination onClick={() => onPageChange(currentPage - 1)}>Prev</ButtonPagination>}

      {currentPage > 3 && (
        <>
          <ButtonNumberPagination onClick={() => onPageChange(1)}>1</ButtonNumberPagination>
          <span>...</span>
        </>
      )}

      {pages.map((page) => (
        <ButtonNumberPagination
          key={page}
          onClick={() => onPageChange(page)}
          style={{ fontWeight: page === currentPage ? 'bold' : 'normal' }}
        >
          {page}
        </ButtonNumberPagination>
      ))}

      {currentPage < totalPages - 2 && (
        <>
          <span>...</span>
          <ButtonNumberPagination onClick={() => onPageChange(totalPages)}>{totalPages}</ButtonNumberPagination>
        </>
      )}

      {currentPage < totalPages && (
        <ButtonPagination onClick={() => onPageChange(currentPage + 1)}>Next</ButtonPagination>
      )}
    </div>
  )
}

export default function LeaderboardTable({ address }: { address?: string }) {
  const timePeriod = useAtomValue(filterTimeAtom)
  const [currentPage, setCurrentPage] = useState(1)

  const handlePageChange = (newPage: any) => {
    setCurrentPage(newPage)
  }

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

  const setRankString = useSetAtom(rankAtom)

  const paginatedData = filteredAndSortedData
    ? filteredAndSortedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    : []

  useEffect(() => {
    if (address) {
      filteredAndSortedData?.map((leaderboard, index) => {
        if (leaderboard.id.split('-')[0] === address) {
          setRankString(String(index))
        }
      })
    }
  }, [address, filteredAndSortedData, setRankString])

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
          {paginatedData.map((leaderboard, index) =>
            leaderboard?.id ? (
              <LoadedRow
                key={leaderboard.id}
                leaderboardListIndex={index}
                leaderboardListLength={paginatedData.length}
                leaderboard={leaderboard}
                sortRank={(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
              />
            ) : null
          )}
        </TokenDataContainer>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil((filteredAndSortedData?.length || 0) / ITEMS_PER_PAGE)}
          onPageChange={handlePageChange}
        />
      </GridContainer>
    )
  }
}
