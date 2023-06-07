import { t } from '@lingui/macro'
import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { Position } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { useFilterPossiblyMaliciousPositions } from 'hooks/useFilterPossiblyMaliciousPositions'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useMemo, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { switchChain } from 'utils/switchChain'

import { ExpandoRow } from '../ExpandoRow'
import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'
import { PositionInfo } from './cache'
import { useFeeValues } from './hooks'
import useMultiChainPositions from './useMultiChainPositions'

/**
 * Takes an array of PositionInfo objects (format used by the Uniswap Labs gql API).
 * The hook access PositionInfo.details (format used by the NFT position contract),
 * filters the PositionDetails data for malicious content,
 * and then returns the original data in its original format.
 */
function useFilterPossiblyMaliciousPositionInfo(positions: PositionInfo[] | undefined): PositionInfo[] {
  const tokenIdsToPositionInfo: Record<string, PositionInfo> = useMemo(
    () =>
      positions
        ? positions.reduce((acc, position) => ({ ...acc, [position.details.tokenId.toString()]: position }), {})
        : {},
    [positions]
  )
  const positionDetails = useMemo(() => positions?.map((position) => position.details) ?? [], [positions])
  const filteredPositionDetails = useFilterPossiblyMaliciousPositions(positionDetails)

  return useMemo(
    () => filteredPositionDetails.map((positionDetails) => tokenIdsToPositionInfo[positionDetails.tokenId.toString()]),
    [filteredPositionDetails, tokenIdsToPositionInfo]
  )
}

export default function Pools({ account }: { account: string }) {
  const { positions, loading } = useMultiChainPositions(account)
  const filteredPositions = useFilterPossiblyMaliciousPositionInfo(positions)
  const [showClosed, toggleShowClosed] = useReducer((showClosed) => !showClosed, false)

  const [openPositions, closedPositions] = useMemo(() => {
    const openPositions: PositionInfo[] = []
    const closedPositions: PositionInfo[] = []
    for (let i = 0; i < filteredPositions.length; i++) {
      const position = filteredPositions[i]
      if (position.closed) {
        closedPositions.push(position)
      } else {
        openPositions.push(position)
      }
    }
    return [openPositions, closedPositions]
  }, [filteredPositions])

  const toggleWalletDrawer = useToggleAccountDrawer()

  if (!filteredPositions || loading) {
    return <PortfolioSkeleton />
  }

  if (filteredPositions.length === 0) {
    return <EmptyWalletModule type="pool" onNavigateClick={toggleWalletDrawer} />
  }

  return (
    <PortfolioTabWrapper>
      {openPositions.map((positionInfo) => (
        <PositionListItem
          key={positionInfo.details.tokenId.toString() + positionInfo.chainId}
          positionInfo={positionInfo}
        />
      ))}
      <ExpandoRow
        title={t`Closed Positions`}
        isExpanded={showClosed}
        toggle={toggleShowClosed}
        numItems={closedPositions.length}
      >
        {closedPositions.map((positionInfo) => (
          <PositionListItem
            key={positionInfo.details.tokenId.toString() + positionInfo.chainId}
            positionInfo={positionInfo}
          />
        ))}
      </ExpandoRow>
    </PortfolioTabWrapper>
  )
}

const ActiveDot = styled.span<{ closed: boolean; outOfRange: boolean }>`
  background-color: ${({ theme, closed, outOfRange }) =>
    closed ? theme.textSecondary : outOfRange ? theme.accentWarning : theme.accentSuccess};
  border-radius: 50%;
  height: 8px;
  width: 8px;
  margin-left: 4px;
  margin-top: 1px;
`

function calculcateLiquidityValue(price0: number | undefined, price1: number | undefined, position: Position) {
  if (!price0 || !price1) return undefined

  const value0 = parseFloat(position.amount0.toExact()) * price0
  const value1 = parseFloat(position.amount1.toExact()) * price1
  return value0 + value1
}

function PositionListItem({ positionInfo }: { positionInfo: PositionInfo }) {
  const { chainId, position, pool, details, inRange, closed } = positionInfo

  const { priceA, priceB, fees: feeValue } = useFeeValues(positionInfo)
  const liquidityValue = calculcateLiquidityValue(priceA, priceB, position)

  const navigate = useNavigate()
  const toggleWalletDrawer = useToggleAccountDrawer()
  const { chainId: walletChainId, connector } = useWeb3React()
  const onClick = useCallback(async () => {
    if (walletChainId !== chainId) await switchChain(connector, chainId)
    toggleWalletDrawer()
    navigate('/pool/' + details.tokenId)
  }, [walletChainId, chainId, connector, toggleWalletDrawer, navigate, details.tokenId])
  const analyticsEventProperties = useMemo(
    () => ({
      chain_id: chainId,
      pool_token_0_symbol: pool.token0.symbol,
      pool_token_1_symbol: pool.token1.symbol,
      pool_token_0_address: pool.token0.address,
      pool_token_1_address: pool.token1.address,
    }),
    [chainId, pool.token0.address, pool.token0.symbol, pool.token1.address, pool.token1.symbol]
  )

  return (
    <TraceEvent
      events={[BrowserEvent.onClick]}
      name={SharedEventName.ELEMENT_CLICKED}
      element={InterfaceElementName.MINI_PORTFOLIO_POOLS_ROW}
      properties={analyticsEventProperties}
    >
      <PortfolioRow
        onClick={onClick}
        left={<PortfolioLogo chainId={chainId} currencies={[pool.token0, pool.token1]} />}
        title={
          <Row>
            <ThemedText.SubHeader>
              {pool.token0.symbol} / {pool.token1?.symbol}
            </ThemedText.SubHeader>
          </Row>
        }
        descriptor={<ThemedText.Caption>{`${pool.fee / 10000}%`}</ThemedText.Caption>}
        right={
          <>
            <MouseoverTooltip
              placement="left"
              text={
                <div style={{ padding: '4px 0px' }}>
                  <ThemedText.Caption>{`${formatNumber(
                    liquidityValue,
                    NumberType.PortfolioBalance
                  )} (liquidity) + ${formatNumber(feeValue, NumberType.PortfolioBalance)} (fees)`}</ThemedText.Caption>
                </div>
              }
            >
              <ThemedText.SubHeader>
                {formatNumber((liquidityValue ?? 0) + (feeValue ?? 0), NumberType.PortfolioBalance)}
              </ThemedText.SubHeader>
            </MouseoverTooltip>

            <Row justify="flex-end">
              <ThemedText.Caption color="textSecondary">
                {closed ? t`Closed` : inRange ? t`In range` : t`Out of range`}
              </ThemedText.Caption>
              <ActiveDot closed={closed} outOfRange={!inRange} />
            </Row>
          </>
        }
      />
    </TraceEvent>
  )
}
