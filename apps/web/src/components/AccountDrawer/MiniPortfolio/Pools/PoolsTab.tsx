import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { ExpandoRow } from 'components/AccountDrawer/MiniPortfolio/ExpandoRow'
import { PortfolioSkeleton } from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl } from 'components/Liquidity/utils/getPositionUrl'
import { parseRestPosition } from 'components/Liquidity/utils/parseFromRest'
import { useAccount } from 'hooks/useAccount'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { AnimatePresence, Flex, TouchableArea } from 'ui/src'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { usePositionVisibilityCheck } from 'uniswap/src/features/visibility/hooks/usePositionVisibilityCheck'
import { useEvent } from 'utilities/src/react/hooks'

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
  const { t } = useTranslation()
  const { chains } = useEnabledChains()
  const isPositionVisible = usePositionVisibilityCheck()

  const { data, isLoading } = useGetPositionsQuery({
    address: account,
    chainIds: chains,
    positionStatuses: [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE],
    protocolVersions: [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4],
    includeHidden: true,
  })

  const { data: closedData } = useGetPositionsQuery({
    address: account,
    chainIds: chains,
    positionStatuses: [PositionStatus.CLOSED],
    protocolVersions: [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4],
    includeHidden: true,
  })

  const openPositions = useMemo(() => data?.positions.map(parseRestPosition).filter(isPositionInfo), [data?.positions])
  const closedPositions = useMemo(
    () => closedData?.positions.map(parseRestPosition).filter(isPositionInfo),
    [closedData?.positions],
  )

  const [showClosed, toggleShowClosed] = useReducer((showClosed) => !showClosed, false)
  const [showHidden, setShowHidden] = useState(false)

  const { visibleOpenPositions, visibleClosedPositions, hiddenPositions } = useMemo(() => {
    function splitByVisibility(positions: PositionInfo[] = []) {
      const visible: PositionInfo[] = []
      const hidden: PositionInfo[] = []
      positions.forEach((pos) => {
        if (
          isPositionVisible({
            poolId: pos.poolId,
            tokenId: pos.tokenId,
            chainId: pos.chainId,
            isFlaggedSpam: pos.isHidden,
          })
        ) {
          visible.push(pos)
        } else {
          hidden.push(pos)
        }
      })
      return { visible, hidden }
    }

    const { visible: visibleOpenPositions, hidden: hiddenOpenPositions } = splitByVisibility(openPositions)
    const { visible: visibleClosedPositions, hidden: hiddenClosedPositions } = splitByVisibility(closedPositions)

    return {
      visibleOpenPositions,
      visibleClosedPositions,
      hiddenPositions: [...hiddenOpenPositions, ...hiddenClosedPositions],
    }
  }, [openPositions, closedPositions, isPositionVisible])

  const accountDrawer = useAccountDrawer()

  if (!openPositions && isLoading) {
    return <PortfolioSkeleton />
  }

  if (!openPositions || (openPositions.length === 0 && closedPositions?.length === 0)) {
    return <EmptyWalletModule type="pool" onNavigateClick={accountDrawer.close} />
  }

  return (
    <AnimatePresence>
      <Flex gap="$spacing12">
        {visibleOpenPositions.map((positionInfo) => (
          <PositionListItem key={getPositionKey(positionInfo)} positionInfo={positionInfo} />
        ))}
      </Flex>
      {visibleClosedPositions.length > 0 && (
        <ExpandoRow
          title={t('liquidityPool.positions.closed.title')}
          isExpanded={showClosed}
          toggle={toggleShowClosed}
          numItems={visibleClosedPositions.length}
        >
          <Flex gap="$spacing12">
            {visibleClosedPositions.map((positionInfo) => (
              <PositionListItem key={getPositionKey(positionInfo)} positionInfo={positionInfo} />
            ))}
          </Flex>
        </ExpandoRow>
      )}
      {hiddenPositions.length > 0 && (
        <ExpandoRow
          title={t('common.hidden')}
          isExpanded={showHidden}
          toggle={() => setShowHidden((prev) => !prev)}
          numItems={hiddenPositions.length}
        >
          <Flex gap="$spacing12">
            {hiddenPositions.map((position) => (
              <PositionListItem key={getPositionKey(position)} positionInfo={position} isVisible={false} />
            ))}
          </Flex>
        </ExpandoRow>
      )}
    </AnimatePresence>
  )
}

function PositionListItem({ positionInfo, isVisible = true }: { positionInfo: PositionInfo; isVisible?: boolean }) {
  const { chainId, currency0Amount, currency1Amount } = positionInfo
  const token0 = currency0Amount.currency
  const token1 = currency1Amount.currency

  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()
  const account = useAccount()
  const switchChain = useSwitchChain()
  const positionUrl = getPositionUrl(positionInfo)

  const onPress = useEvent(async () => {
    if (account.chainId !== chainId) {
      await switchChain(chainId)
    }

    accountDrawer.close()
    navigate(positionUrl)
  })

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
    <Trace logPress element={ElementName.MiniPortfolioPoolsRow} properties={analyticsEventProperties}>
      <TouchableArea onPress={onPress} mx="$spacing16">
        <LiquidityPositionCard
          isMiniVersion
          liquidityPosition={positionInfo}
          showVisibilityOption
          isVisible={isVisible}
        />
      </TouchableArea>
    </Trace>
  )
}
