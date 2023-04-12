import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import LocalLoader from 'components/LocalLoader'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import TransferHistoryTable from 'pages/Bridge/BridgeTransferHistory/TransferHistoryTable'

import useTransferHistory from './useTransferHistory'

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

  return (
    <div className={className}>
      <Flex flexDirection="column" style={{ flex: 1 }}>
        <TransferHistoryTable transfers={transfers} />
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
