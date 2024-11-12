import { InterfaceElementName } from '@uniswap/analytics-events'
// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { ExpandoRow } from 'components/AccountDrawer/MiniPortfolio/ExpandoRow'
import { PortfolioSkeleton, PortfolioTabWrapper } from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl, parseRestPosition } from 'components/Liquidity/utils'
import { ZERO_ADDRESS } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useMemo, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import { TouchableArea } from 'ui/src'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { t } from 'uniswap/src/i18n'

function isPositionInfo(position: PositionInfo | undefined): position is PositionInfo {
  return !!position
}

function getPositionKey(position: PositionInfo) {
  const { chainId } = position
  if (position.version === ProtocolVersion.V2) {
    return `${position.liquidityToken.address}-${chainId}`
  }

  return `${position.tokenId}-${chainId}`
}

export default function Pools({ account }: { account: string }) {
  const isV4EverywhereEnabled = useFeatureFlag(FeatureFlags.V4Everywhere)

  const { data, isLoading } = useGetPositionsQuery({
    address: account,
    positionStatuses: [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE],
    protocolVersions: isV4EverywhereEnabled
      ? [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4]
      : [ProtocolVersion.V2, ProtocolVersion.V3],
  })

  const { data: closedData } = useGetPositionsQuery({
    address: account,
    positionStatuses: [PositionStatus.CLOSED],
    protocolVersions: isV4EverywhereEnabled
      ? [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4]
      : [ProtocolVersion.V2, ProtocolVersion.V3],
  })

  const openPositions = useMemo(() => data?.positions.map(parseRestPosition).filter(isPositionInfo), [data?.positions])
  const closedPositions = useMemo(
    () => closedData?.positions.map(parseRestPosition).filter(isPositionInfo),
    [closedData?.positions],
  )

  const [showClosed, toggleShowClosed] = useReducer((showClosed) => !showClosed, false)

  const accountDrawer = useAccountDrawer()

  if (!openPositions && isLoading) {
    return <PortfolioSkeleton />
  }

  if (!openPositions || (openPositions?.length === 0 && closedPositions?.length === 0)) {
    return <EmptyWalletModule type="pool" onNavigateClick={accountDrawer.close} />
  }

  return (
    <PortfolioTabWrapper>
      {openPositions.map((positionInfo) => (
        <PositionListItem key={getPositionKey(positionInfo)} positionInfo={positionInfo} />
      ))}
      {closedPositions && closedPositions.length > 0 && (
        <ExpandoRow
          title={t`liquidityPool.positions.closed.title`}
          isExpanded={showClosed}
          toggle={toggleShowClosed}
          numItems={closedPositions.length}
        >
          {closedPositions.map((positionInfo) => (
            <PositionListItem key={getPositionKey(positionInfo)} positionInfo={positionInfo} />
          ))}
        </ExpandoRow>
      )}
    </PortfolioTabWrapper>
  )
}

function PositionListItem({ positionInfo }: { positionInfo: PositionInfo }) {
  const isV4EverywhereEnabled = useFeatureFlag(FeatureFlags.V4Everywhere)

  const { tokenId, chainId, currency0Amount, currency1Amount } = positionInfo
  const token0 = currency0Amount.currency
  const token1 = currency1Amount.currency

  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()
  const account = useAccount()
  const switchChain = useSwitchChain()
  const onClick = useCallback(async () => {
    if (account.chainId !== chainId) {
      await switchChain(chainId)
    }

    accountDrawer.close()

    const positionUrl = isV4EverywhereEnabled
      ? getPositionUrl(positionInfo)
      : positionInfo.version === ProtocolVersion.V3
        ? '/pool/' + tokenId
        : '/pools/v2'
    navigate(positionUrl)
  }, [account.chainId, chainId, switchChain, accountDrawer, navigate, tokenId, isV4EverywhereEnabled, positionInfo])
  const analyticsEventProperties = useMemo(
    () => ({
      chain_id: chainId,
      pool_token_0_symbol: token0.symbol,
      pool_token_1_symbol: token1.symbol,
      pool_token_0_address: token0.isToken ? token0.wrapped.address : ZERO_ADDRESS,
      pool_token_1_address: token1.isToken ? token1.wrapped.address : ZERO_ADDRESS,
    }),
    [chainId, token0, token1],
  )

  return (
    <Trace logPress element={InterfaceElementName.MINI_PORTFOLIO_POOLS_ROW} properties={analyticsEventProperties}>
      <TouchableArea onPress={onClick}>
        <LiquidityPositionCard isClickableStyle isMiniVersion liquidityPosition={positionInfo} />
      </TouchableArea>
    </Trace>
  )
}
