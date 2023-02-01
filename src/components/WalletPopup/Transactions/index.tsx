import { Trans } from '@lingui/macro'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList } from 'react-window'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import Tab from 'components/WalletPopup/Transactions/Tab'
import { NUMBERS } from 'components/WalletPopup/Transactions/helper'
import useCancellingOrders, { CancellingOrderInfo } from 'components/swapv2/LimitOrder/useCancellingOrders'
import { useActiveWeb3React } from 'hooks'
import { fetchListTokenByAddresses, findCacheToken, useIsLoadedTokenDefault } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { useSortRecentTransactions } from 'state/transactions/hooks'
import {
  TRANSACTION_GROUP,
  TransactionDetails,
  TransactionExtraInfo1Token,
  TransactionExtraInfo2Token,
} from 'state/transactions/type'

import TransactionItem from './TransactionItem'

const ContentWrapper = styled.div`
  width: 100%;
  flex: 1 1 0;
  overflow-y: auto;
  overflow-x: hidden;
  .scrollbar {
    &::-webkit-scrollbar {
      display: block;
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${({ theme }) => theme.border};
    }
    overflow-x: hidden !important;
  }
`

const Wrapper = styled.div`
  width: 100%;
  flex: 1 1 0;
  overflow: hidden;

  display: flex;
  flex-direction: column;
  gap: 12px;
`

function RowItem({
  index,
  style,
  transaction,
  setRowHeight,
  isMinimal,
  cancellingOrderInfo,
}: {
  transaction: TransactionDetails
  style: CSSProperties
  index: number
  setRowHeight: (v: number, height: number) => void
  isMinimal: boolean
  cancellingOrderInfo: CancellingOrderInfo
}) {
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    /** because react-window don't support dynamic height => manually calc height for each item
     *
     * --- warning ---
     * title
     * left    right
     *
     * => item height = warning_height + tile_height + max(height_left, height_right) + gap + padding
     */
    const leftCol = rowRef.current?.querySelector('.left-column')
    const rightCol = rowRef.current?.querySelector('.right-column')
    if (leftCol && rightCol && rowRef.current) {
      const { paddingTop, paddingBottom, gap } = getComputedStyle(rowRef.current)
      const rowGap = parseFloat(gap)
      const warningHeight = rowRef.current.dataset.stalled === 'true' ? NUMBERS.STALL_WARNING_HEIGHT + rowGap : 0
      const rowNum = Math.max(leftCol.children.length, rightCol.children.length) + 1 // 1 for title
      setRowHeight(
        index,
        parseFloat(paddingTop) +
          parseFloat(paddingBottom) +
          warningHeight +
          NUMBERS.TRANSACTION_LINE_HEIGHT * rowNum +
          (rowNum - 1) * rowGap,
      )
    }
  }, [rowRef, index, setRowHeight])

  return (
    <TransactionItem
      isMinimal={isMinimal}
      ref={rowRef}
      style={style}
      transaction={transaction}
      cancellingOrderInfo={cancellingOrderInfo}
    />
  )
}

// This is intentional, we don't need to persist in localStorage
let storedActiveTab = ''
function ListTransaction({ isMinimal }: { isMinimal: boolean }) {
  const transactions = useSortRecentTransactions(false)
  const { chainId } = useActiveWeb3React()
  const [activeTab, setActiveTab] = useState<TRANSACTION_GROUP | string>(storedActiveTab)
  const theme = useTheme()
  const cancellingOrderInfo = useCancellingOrders()

  const listTokenAddress = useRef<string[]>([])
  const pushAddress = (address: string) => {
    if (address && !listTokenAddress.current.includes(address)) listTokenAddress.current.push(address)
  }

  const formatTransactions = useMemo(() => {
    const result: TransactionDetails[] = []
    transactions.forEach(list => {
      list.forEach(txs => {
        if (!activeTab || txs.group === activeTab) {
          result.push(txs)
          const { tokenAddress } = (txs.extraInfo as TransactionExtraInfo1Token) ?? {}
          const { tokenAddressIn, tokenAddressOut } = (txs.extraInfo as TransactionExtraInfo2Token) ?? {}
          pushAddress(tokenAddress)
          pushAddress(tokenAddressIn)
          pushAddress(tokenAddressOut)
        }
      })
    })

    return result
  }, [transactions, activeTab])

  const total = listTokenAddress.current
  const isLoadedTokenDefault = useIsLoadedTokenDefault()
  useEffect(() => {
    if (!isLoadedTokenDefault) return
    const list: string[] = listTokenAddress.current.filter(address => !findCacheToken(address))
    if (list.length) fetchListTokenByAddresses(list, chainId).catch(console.error)
  }, [total, isLoadedTokenDefault, chainId])

  const onRefChange = useCallback((node: HTMLDivElement) => {
    if (!node?.classList.contains('scrollbar')) {
      node?.classList.add('scrollbar')
    }
  }, [])

  const rowHeights = useRef<{ [key: string]: number }>({})
  const listRef = useRef<any>(null)
  const setRowHeight = useCallback((index: number, size: number) => {
    listRef.current?.resetAfterIndex(0)
    rowHeights.current = { ...rowHeights.current, [index]: size }
  }, [])

  function getRowHeight(index: number) {
    return rowHeights.current[index] || 100
  }

  useEffect(() => {
    storedActiveTab = activeTab
  }, [activeTab])

  return (
    <Wrapper>
      <Tab activeTab={activeTab} setActiveTab={setActiveTab} />
      <ContentWrapper>
        {formatTransactions.length === 0 ? (
          <Flex flexDirection="column" alignItems="center" color={theme.subText} sx={{ gap: 10, marginTop: '20px' }}>
            <Info size={32} />
            <Text fontSize={'14px'}>
              <Trans>You have no Transaction History</Trans>
            </Text>
          </Flex>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <VariableSizeList
                height={height}
                width={width}
                itemSize={getRowHeight}
                ref={listRef}
                outerRef={onRefChange}
                itemCount={formatTransactions.length}
                itemData={formatTransactions}
              >
                {({ data, index, style }) => (
                  <RowItem
                    isMinimal={isMinimal}
                    style={style}
                    transaction={data[index]}
                    index={index}
                    key={data[index].hash}
                    setRowHeight={setRowHeight}
                    cancellingOrderInfo={cancellingOrderInfo}
                  />
                )}
              </VariableSizeList>
            )}
          </AutoSizer>
        )}
      </ContentWrapper>
    </Wrapper>
  )
}

export default memo(ListTransaction)
