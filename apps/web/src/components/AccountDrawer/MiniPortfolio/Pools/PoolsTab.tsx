import { InterfaceElementName } from '@uniswap/analytics-events'
// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ExpandoRow } from 'components/AccountDrawer/MiniPortfolio/ExpandoRow'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import PortfolioRow, {
  PortfolioSkeleton,
  PortfolioTabWrapper,
} from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl, parseRestPosition } from 'components/Liquidity/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import Row from 'components/deprecated/Row'
import { ZERO_ADDRESS } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import { useSwitchChain } from 'hooks/useSwitchChain'
import styled from 'lib/styled-components'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useMemo, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { t } from 'uniswap/src/i18n'
import { NumberType } from 'utilities/src/format/types'

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

const ActiveDot = styled.span<{ closed: boolean; outOfRange: boolean }>`
  background-color: ${({ theme, closed, outOfRange }) =>
    closed ? theme.neutral2 : outOfRange ? theme.deprecated_accentWarning : theme.success};
  border-radius: 50%;
  height: 8px;
  width: 8px;
  margin-left: 4px;
  margin-top: 1px;
`

function useDerivedPositionInfo(positionInfo: PositionInfo): {
  liquidityValue?: CurrencyAmount<Currency>
  feeValue?: CurrencyAmount<Currency>
  totalValue?: CurrencyAmount<Currency>
  formattedFeeTier?: string
} {
  const { feeTier, currency0Amount, currency1Amount } = positionInfo
  const fiatValue0 = useUSDCValue(currency0Amount)
  const fiatValue1 = useUSDCValue(currency1Amount)

  const { fiatFeeValue0, fiatFeeValue1 } = useV3OrV4PositionDerivedInfo(positionInfo)

  return useMemo(() => {
    const liquidityValue = fiatValue0 && fiatValue1 ? fiatValue0.add(fiatValue1) : undefined

    if (positionInfo.version === ProtocolVersion.V3 || positionInfo.version === ProtocolVersion.V4) {
      const feeValue = fiatFeeValue0 && fiatFeeValue1 && fiatFeeValue0.add(fiatFeeValue1)
      const totalValue = liquidityValue && feeValue ? liquidityValue.add(feeValue) : undefined
      const formattedFeeTier = feeTier ? `${Number(feeTier) / BIPS_BASE}%` : undefined // TODO(WEB-5452): support dynamic fee tiers
      return {
        liquidityValue,
        feeValue,
        totalValue,
        formattedFeeTier,
      }
    }

    // V2 has no fee value so the total value and the liquidity value is the same
    return { liquidityValue, totalValue: liquidityValue }
  }, [feeTier, fiatFeeValue0, fiatFeeValue1, fiatValue0, fiatValue1, positionInfo.version])
}

function PositionListItem({ positionInfo }: { positionInfo: PositionInfo }) {
  const isV4EverywhereEnabled = useFeatureFlag(FeatureFlags.V4Everywhere)
  const { formatCurrencyAmount } = useLocalizationContext()

  const { tokenId, status, chainId, currency0Amount, currency1Amount } = positionInfo
  const { liquidityValue, feeValue, totalValue, formattedFeeTier } = useDerivedPositionInfo(positionInfo)
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
      <PortfolioRow
        onClick={onClick}
        left={<PortfolioLogo chainId={chainId} currencies={[token0, token1]} />}
        title={
          <Row>
            <ThemedText.SubHeader>
              {token0.symbol} / {token1?.symbol}
            </ThemedText.SubHeader>
          </Row>
        }
        descriptor={<ThemedText.BodySmall>{formattedFeeTier}</ThemedText.BodySmall>}
        right={
          <>
            <MouseoverTooltip
              placement="left"
              text={
                <div style={{ padding: '4px 0px' }}>
                  <ThemedText.BodySmall>{`${formatCurrencyAmount({
                    value: liquidityValue,
                    type: NumberType.PortfolioBalance,
                  })} (liquidity) + ${formatCurrencyAmount({
                    value: feeValue,
                    type: NumberType.PortfolioBalance,
                  })} (fees)`}</ThemedText.BodySmall>
                </div>
              }
            >
              <ThemedText.SubHeader>
                {formatCurrencyAmount({
                  value: totalValue,
                  type: NumberType.PortfolioBalance,
                })}
              </ThemedText.SubHeader>
            </MouseoverTooltip>

            <Row justify="flex-end">
              <ThemedText.BodySmall color="neutral2">
                {status === PositionStatus.CLOSED
                  ? t('common.closed')
                  : status === PositionStatus.IN_RANGE
                    ? t('common.withinRange')
                    : t('common.outOfRange')}
              </ThemedText.BodySmall>
              <ActiveDot
                closed={status === PositionStatus.CLOSED}
                outOfRange={status === PositionStatus.OUT_OF_RANGE}
              />
            </Row>
          </>
        }
      />
    </Trace>
  )
}
