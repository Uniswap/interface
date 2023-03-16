import { t } from '@lingui/macro'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { Position } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { L2NetworkLogo, LogoContainer } from 'components/Logo/AssetLogo'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { useToggleWalletDrawer } from 'components/WalletDropdown'
import { getChainInfo } from 'constants/chainInfo'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { switchChain } from 'utils/switchChain'

import { ActivityLogo } from '../Activity'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'
import { useFeeValues } from './hooks'
import useMultiChainPositions, { PositionInfo } from './useMultiChainPositions'

export default function Pools({ account }: { account: string }) {
  const { positions, loading } = useMultiChainPositions(account)
  // TODO(cartcrom): add no pools state
  return !positions || loading ? (
    <PortfolioSkeleton />
  ) : (
    <PortfolioTabWrapper>
      {positions.map((positionInfo) => (
        <PositionListItem
          key={positionInfo.details.tokenId.toString() + positionInfo.chainId}
          positionInfo={positionInfo}
        />
      ))}
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

const DoubleArrow = styled.span`
  font-variant: all-small-caps;
  font-feature-settings: 'tnum' on, 'lnum' on, 'ss02' on;
  color: ${({ theme }) => theme.textSecondary};
  :after {
    content: '<->';
  }
  line-height: 5px;
  padding: 0 4px;
`

function calculcateLiquidityValue(price0: number | undefined, price1: number | undefined, position: Position) {
  if (!price0 || !price1) return undefined

  const value0 = parseFloat(position.amount0.toExact()) * price0
  const value1 = parseFloat(position.amount1.toExact()) * price1
  return value0 + value1
}

function PositionListItem({ positionInfo }: { positionInfo: PositionInfo }) {
  const { chainId, position, pool, details, inRange, closed } = positionInfo

  const [src1] = useTokenLogoSource(pool.token0.wrapped.address, pool.token0.chainId, pool.token0.isNative)
  const [src2] = useTokenLogoSource(pool.token1.wrapped.address, pool.token1.chainId, pool.token1.isNative)
  const { priceA, priceB, fees: feeValue } = useFeeValues(positionInfo)
  const liquidityValue = calculcateLiquidityValue(priceA, priceB, position)

  const navigate = useNavigate()
  const toggleWalletDrawer = useToggleWalletDrawer()
  const { chainId: walletChainId, connector } = useWeb3React()
  const onClick = useCallback(async () => {
    if (walletChainId !== chainId) await switchChain(connector, chainId)
    toggleWalletDrawer()
    navigate('/pool/' + details.tokenId)
  }, [walletChainId, chainId, connector, toggleWalletDrawer, navigate, details.tokenId])

  const L2Icon = getChainInfo(chainId)?.circleLogoUrl

  return (
    <PortfolioRow
      onClick={onClick}
      left={
        <LogoContainer>
          <ActivityLogo srcs={[src1, src2]} />
          <L2NetworkLogo networkUrl={L2Icon} parentSize="40px" />
        </LogoContainer>
      }
      title={
        <Row>
          <ThemedText.SubHeader fontWeight={500}>
            {pool.token0.symbol} / {pool.token1?.symbol}
          </ThemedText.SubHeader>
          <ThemedText.Caption color="textSecondary" marginLeft="4px">{`(${pool.fee / 10000}%)`}</ThemedText.Caption>
        </Row>
      }
      descriptor={
        <ThemedText.Caption>
          {formatNumber(priceA, NumberType.FiatTokenPrice)}
          <DoubleArrow />
          {formatNumber(priceB, NumberType.FiatTokenPrice)}
        </ThemedText.Caption>
      }
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
            <ThemedText.SubHeader fontWeight={500}>
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
  )
}
