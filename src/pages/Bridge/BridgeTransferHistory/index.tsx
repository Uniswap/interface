import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Info } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import LocalLoader from 'components/LocalLoader'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

import { ITEMS_PER_PAGE } from '../consts'
import ActionCell from './ActionCell'
import RouteCell from './RouteCell'
import StatusBadge from './StatusBadge'
import TimeCell from './TimeCell'
import TimeStatusCell from './TimeStatusCell'
import TokenReceiveCell from './TokenReceiveCell'
import useTransferHistory from './useTransferHistory'

const commonCSS = css`
  width: 100%;
  padding: 0 16px;

  display: grid;
  grid-template-columns: 112px 100px 80px 150px 48px;
  justify-content: space-between;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    column-gap: 4px;
    grid-template-columns: 112px 100px 64px minmax(auto, 130px) 48px;
  `}
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    column-gap: 16px;
    grid-template-columns: 156px 64px minmax(auto, 130px) 28px;
  `}
`

const TableHeader = styled.div`
  ${commonCSS}
  height: 48px;
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 20px 20px 0 0;
`

const TableColumnText = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
`

const TableRow = styled.div`
  ${commonCSS}
  height: 60px;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  &:last-child {
    border-bottom: none;
  }
`

const PaginationButton = styled.button`
  flex: 0 0 36px;
  height: 36px;
  padding: 0px;
  margin: 0px;
  border: none;

  display: flex;
  justify-content: center;
  align-items: center;

  cursor: pointer;
  border-radius: 999px;
  color: ${({ theme }) => theme.subText};
  background: ${({ theme }) => theme.buttonGray};
  transition: color 150ms;

  &:active {
    color: ${({ theme }) => theme.text};
  }

  @media (hover: hover) {
    &:hover {
      color: ${({ theme }) => theme.text};
    }
  }

  &:disabled {
    color: ${({ theme }) => rgba(theme.subText, 0.4)};
    cursor: not-allowed;
  }
`

type Props = {
  className?: string
}
const TransferHistory: React.FC<Props> = ({ className }) => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [shouldShowLoading, setShouldShowLoading] = useState(true)
  const { isCompletelyEmpty, range, transfers, canGoNext, canGoPrevious, onClickNext, onClickPrevious } =
    useTransferHistory(account || '')

  const isThisPageEmpty = transfers.length === 0

  const timeOutRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    // This is to ensure loading is displayed at least 0.5s
    const existingTimeout = timeOutRef.current
    timeOutRef.current = setTimeout(() => {
      setShouldShowLoading(false)
    }, 500)
    return () => {
      existingTimeout && clearTimeout(existingTimeout)
    }
  }, [])

  // toast error
  if (shouldShowLoading) {
    return <LocalLoader />
  }

  if (isCompletelyEmpty) {
    return (
      <Flex
        sx={{
          width: '100%',
          height: '180px', // to match the Loader's height
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: theme.subText,
          gap: '16px',
        }}
      >
        <Info size={48} />
        <Text
          sx={{
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
          }}
        >
          <Trans>You haven&apos;t made any transfers yet</Trans>
        </Text>
      </Flex>
    )
  }

  const renderInvisibleRows = () => {
    if (transfers.length === ITEMS_PER_PAGE) {
      return null
    }
    if (!upToMedium) {
      return Array(ITEMS_PER_PAGE - transfers.length)
        .fill(0)
        .map((_, i) => {
          return (
            <TableRow
              key={i}
              style={{
                visibility: 'hidden',
              }}
            />
          )
        })
    }
    return null
  }

  const getTxsUrl = (txHash: string) => `https://anyswap.net/explorer/tx?params=${txHash}`

  const renderTable = () => {
    if (upToExtraSmall) {
      return (
        <>
          <TableHeader>
            <TableColumnText>
              <Trans>DATE | STATUS</Trans>
            </TableColumnText>
            <TableColumnText>
              <Trans>ROUTE</Trans>
            </TableColumnText>
            <TableColumnText>
              <Trans>AMOUNT</Trans>
            </TableColumnText>
            <TableColumnText />
          </TableHeader>
          {transfers.map((transfer, i) => (
            <TableRow key={i}>
              <Flex style={{ gap: '8px' }}>
                <TimeStatusCell timestamp={transfer.createdAt * 1000} />
                <StatusBadge status={transfer.status} iconOnly />
              </Flex>
              <RouteCell fromChainID={Number(transfer.srcChainId)} toChainID={Number(transfer.dstChainId)} />
              <TokenReceiveCell transfer={transfer} />
              <ActionCell url={getTxsUrl(transfer.srcTxHash)} />
            </TableRow>
          ))}
          {renderInvisibleRows()}
        </>
      )
    }

    return (
      <>
        <TableHeader>
          <TableColumnText>
            <Trans>CREATED</Trans>
          </TableColumnText>
          <TableColumnText>
            <Trans>STATUS</Trans>
          </TableColumnText>
          <TableColumnText>
            <Trans>ROUTE</Trans>
          </TableColumnText>
          <TableColumnText>
            <Trans>RECEIVED AMOUNT</Trans>
          </TableColumnText>
          <TableColumnText>
            <Trans>ACTION</Trans>
          </TableColumnText>
        </TableHeader>
        {transfers.map((transfer, i) => (
          <TableRow key={i}>
            <TimeCell timestamp={transfer.createdAt * 1000} />
            <StatusBadge status={transfer.status} />
            <RouteCell fromChainID={Number(transfer.srcChainId)} toChainID={Number(transfer.dstChainId)} />
            <TokenReceiveCell transfer={transfer} />
            <ActionCell url={getTxsUrl(transfer.srcTxHash)} />
          </TableRow>
        ))}
        {renderInvisibleRows()}
      </>
    )
  }

  return (
    <div className={className}>
      <Flex flexDirection="column" style={{ flex: 1 }}>
        {renderTable()}
      </Flex>
      <Flex
        sx={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 0',
          gap: '12px',
          borderTop: `1px solid ${theme.border}`,
        }}
      >
        <PaginationButton disabled={!canGoPrevious} onClick={onClickPrevious}>
          <ChevronLeft width={18} />
        </PaginationButton>

        <Flex
          sx={{
            width: '120px',
            fontSize: '12px',
            color: theme.subText,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isThisPageEmpty ? '-' : `${range[0]} - ${range[1]}`}
        </Flex>

        <PaginationButton disabled={!canGoNext} onClick={onClickNext}>
          <ChevronRight width={18} />
        </PaginationButton>
      </Flex>
    </div>
  )
}

export default styled(TransferHistory)`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: ${({ theme }) => rgba(theme.background, 0.3)};
  border-radius: 20px;
`
