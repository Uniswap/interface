import { BrowserEvent, InterfaceElementName, SharedEventName } from '@ubeswap/analytics-events'
import { Position } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent } from 'analytics'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { BIPS_BASE } from 'constants/misc'
import { useFilterPossiblyMaliciousPositions } from 'hooks/useFilterPossiblyMaliciousPositions'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { t } from 'i18n'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useMemo, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { ExpandoRow } from '../ExpandoRow'
import { useToggleAccountDrawer } from '../hooks'
import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'
import { PositionInfo } from './cache'
import { useFeeValues } from './hooks'
import useMultiChainPositions from './useMultiChainPositions'
import { useV2Pairs } from 'hooks/useV2Pairs'
import { toV2LiquidityToken, useTrackedTokenPairs } from 'state/user/hooks'
import { useTokenBalance, useTokenBalancesWithLoadingIndicator } from 'state/connection/hooks'
import { Pair } from '@uniswap/v2-sdk'
import { useTotalSupply } from 'hooks/useTotalSupply'
import JSBI from 'jsbi'

/**
 * Takes an array of PositionInfo objects (format used by the Ubeswap gql API).
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
  const [showV2, toggleShowV2] = useReducer((show) => !show, true)

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

  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )

  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken),
    [tokenPairsWithLiquidityTokens]
  )

  const [v2PairsBalances] = useTokenBalancesWithLoadingIndicator(account ?? undefined, liquidityTokens)

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances]
  )

  const v2Pairs = useV2Pairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

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
        title={t`V2 Pairs`}
        isExpanded={showV2}
        toggle={toggleShowV2}
        numItems={allV2PairsWithLiquidity.length}
      >
        {allV2PairsWithLiquidity.map((pair) => (
          <V2PairListItem
            key={`${pair.chainId}-${pair.token0.address}/${pair.token1.address}`}
            pair={pair}
          ></V2PairListItem>
        ))}
      </ExpandoRow>
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
    closed ? theme.neutral2 : outOfRange ? theme.deprecated_accentWarning : theme.success};
  border-radius: 50%;
  height: 8px;
  width: 8px;
  margin-left: 4px;
  margin-top: 1px;
`

function calculateLiquidityValue(price0: number | undefined, price1: number | undefined, position: Position) {
  if (!price0 || !price1) return undefined

  const value0 = parseFloat(position.amount0.toExact()) * price0
  const value1 = parseFloat(position.amount1.toExact()) * price1
  return value0 + value1
}

function V2PairListItem({ pair }: { pair: Pair }) {
  const { account } = useWeb3React()
  const { chainId } = pair.liquidityToken

  const analyticsEventProperties = useMemo(
    () => ({
      chain_id: chainId,
      pool_token_0_symbol: pair.token0.symbol,
      pool_token_1_symbol: pair.token1.symbol,
      pool_token_0_address: pair.token0.address,
      pool_token_1_address: pair.token1.address,
    }),
    [chainId, pair.token0.address, pair.token0.symbol, pair.token1.address, pair.token1.symbol]
  )

  const userDefaultPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const stakedBalance = undefined

  // if staked balance balance provided, add to standard liquidity amount
  const userPoolBalance = stakedBalance ? userDefaultPoolBalance?.add(stakedBalance) : userDefaultPoolBalance

  const totalPoolTokens = useTotalSupply(pair.liquidityToken)
  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined]

  const navigate = useNavigate()
  const toggleWalletDrawer = useToggleAccountDrawer()
  const { chainId: walletChainId, connector } = useWeb3React()
  const switchChain = useSwitchChain()
  const onClick = useCallback(async () => {
    if (walletChainId !== chainId) await switchChain(connector, chainId)
    toggleWalletDrawer()
    navigate(`/pools/v2?highlight=${`${pair.token0.address}/${pair.token1.address}`}`)
  }, [
    walletChainId,
    chainId,
    switchChain,
    connector,
    toggleWalletDrawer,
    navigate,
    pair.token0.address,
    pair.token1.address,
  ])

  return (
    <TraceEvent
      events={[BrowserEvent.onClick]}
      name={SharedEventName.ELEMENT_CLICKED}
      element={InterfaceElementName.MINI_PORTFOLIO_POOLS_ROW}
      properties={analyticsEventProperties}
    >
      <PortfolioRow
        onClick={onClick}
        left={<PortfolioLogo chainId={chainId} currencies={[pair.token0, pair.token1]} />}
        title={
          <Row>
            <ThemedText.SubHeader>
              {pair.token0.symbol} / {pair.token1?.symbol}
            </ThemedText.SubHeader>
          </Row>
        }
        descriptor={<ThemedText.BodySmall>0.3%</ThemedText.BodySmall>}
        right={
          <>
            <MouseoverTooltip
              placement="left"
              text={
                <div style={{ padding: '4px 0px' }}>
                  {token0Deposited?.toSignificant(6)} {pair.token0.symbol} +{token1Deposited?.toSignificant(6)}{' '}
                  {pair.token1.symbol}
                </div>
              }
            >
              <ThemedText.SubHeader>{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}</ThemedText.SubHeader>
            </MouseoverTooltip>
          </>
        }
      />
    </TraceEvent>
  )
}

function PositionListItem({ positionInfo }: { positionInfo: PositionInfo }) {
  const { formatNumber } = useFormatter()

  const { chainId, position, pool, details, inRange, closed } = positionInfo

  const { priceA, priceB, fees: feeValue } = useFeeValues(positionInfo)
  const liquidityValue = calculateLiquidityValue(priceA, priceB, position)

  const navigate = useNavigate()
  const toggleWalletDrawer = useToggleAccountDrawer()
  const { chainId: walletChainId, connector } = useWeb3React()
  const switchChain = useSwitchChain()
  const onClick = useCallback(async () => {
    if (walletChainId !== chainId) await switchChain(connector, chainId)
    toggleWalletDrawer()
    navigate('/pool/' + details.tokenId)
  }, [walletChainId, chainId, switchChain, connector, toggleWalletDrawer, navigate, details.tokenId])
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
        descriptor={<ThemedText.BodySmall>{`${pool.fee / BIPS_BASE}%`}</ThemedText.BodySmall>}
        right={
          <>
            <MouseoverTooltip
              placement="left"
              text={
                <div style={{ padding: '4px 0px' }}>
                  <ThemedText.BodySmall>{`${formatNumber({
                    input: liquidityValue,
                    type: NumberType.PortfolioBalance,
                  })} (liquidity) + ${formatNumber({
                    input: feeValue,
                    type: NumberType.PortfolioBalance,
                  })} (fees)`}</ThemedText.BodySmall>
                </div>
              }
            >
              <ThemedText.SubHeader>
                {formatNumber({
                  input: (liquidityValue ?? 0) + (feeValue ?? 0),
                  type: NumberType.PortfolioBalance,
                })}
              </ThemedText.SubHeader>
            </MouseoverTooltip>

            <Row justify="flex-end">
              <ThemedText.BodySmall color="neutral2">
                {closed ? t`Closed` : inRange ? t`In range` : t`Out of range`}
              </ThemedText.BodySmall>
              <ActiveDot closed={closed} outOfRange={!inRange} />
            </Row>
          </>
        }
      />
    </TraceEvent>
  )
}
