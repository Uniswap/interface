import { BigNumber } from '@ethersproject/bignumber'
import { BrowserEvent, InterfaceElementName, InterfaceEventName, InterfacePageName } from '@ubeswap/analytics-events'
import { ChainId, CurrencyAmount, Percent, Token } from '@ubeswap/sdk-core'
import { Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { Trace, TraceEvent } from 'analytics'
import { useToggleAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import { DarkCard, LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Row, { RowBetween, RowFixed } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { isSupportedChain } from 'constants/chains'
import { BIPS_BASE } from 'constants/misc'
import { CELO_CELO, UBE } from 'constants/tokens'
import { formatEther } from 'ethers/lib/utils'
import { useToken } from 'hooks/Tokens'
import { usePoolContract } from 'hooks/useContract'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { useV3Positions, useV3StakedPositions } from 'hooks/useV3Positions'
import { Trans } from 'i18n'
import { NEVER_RELOAD, useSingleCallResult } from 'lib/hooks/multicall'
import { useV3IncentiveMetadata } from 'pages/Earn/data/useFarms'
import { getIncentiveIdsByPool, getIncentiveKey } from 'pages/Earn/data/v3-incentive-list'
import DoubleTokenLogo from 'pages/Earn/tables/FarmTable/DoubleTokenLogo'
import { useMemo } from 'react'
import { AlertTriangle, Inbox, Info } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { PositionDetails } from 'types/position'
import { useMedia } from 'ui'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import PositionList from './PositionList'
import {
  useCollectRewardCallback,
  useDepositCallback,
  useIncentiveTokenData,
  useWithdrawCallback,
} from './farm-actions'
import { LoadingRows } from './styled'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;
  max-width: 870px;
  width: 100%;

  @media (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    max-width: 800px;
    padding-top: 48px;
  }

  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    max-width: 500px;
    padding-top: 20px;
  }
`
const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.neutral2};
  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  }
`

const ErrorContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  max-width: 300px;
  min-height: 25vh;
`

// responsive text
// disable the warning because we don't use the end prop, we just want to filter it out
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Label = styled(({ end, ...props }) => <ThemedText.DeprecatedLabel {...props} />)<{ end?: boolean }>`
  display: flex;
  font-size: 16px;
  justify-content: ${({ end }) => (end ? 'flex-end' : 'flex-start')};
  align-items: center;
`

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`

const NetworkIcon = styled(AlertTriangle)`
  ${IconStyle}
`

const InboxIcon = styled(Inbox)`
  ${IconStyle}
`

const PositionstWrapper = styled.div`
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  padding: 0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

export const RowBetweenRelative = styled(Row)`
  justify-content: space-between;
  position: relative;
`

const ResponsiveButtonConfirmed = styled(ButtonConfirmed)`
  border-radius: 12px;
  padding: 6px 8px;
  width: fit-content;
  font-size: 16px;
  position: absolute;
  top: -8px;
  right: -8px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    width: fit-content;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: fit-content;
  }
`

const InfoBoxWrapper = styled.div`
  margin: 0 auto;
  width: 100%;
`

const InfoBoxContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 10px;
  gap: 16px;
  border: 1px solid ${({ theme }) => theme.accent1};
  border-radius: 20px;
  background: ${({ theme }) => theme.surface4};
  backdrop-filter: blur(5px);
`

function InfoBox({ message }: { message?: string }) {
  const theme = useTheme()
  return (
    <InfoBoxWrapper>
      <InfoBoxContainer>
        <Info size={28} stroke={theme.primary1} />
        {message && (
          <ThemedText.BodySmall padding={10} textAlign="center">
            {message}
          </ThemedText.BodySmall>
        )}
      </InfoBoxContainer>
    </InfoBoxWrapper>
  )
}

function PositionsLoadingPlaceholder() {
  return (
    <LoadingRows>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </LoadingRows>
  )
}

const Badge = styled(ThemedText.LabelMicro)`
  padding: 2px 6px;
  background: ${({ theme }) => theme.surface2};
  border-radius: 5px;
`

function PoolDescription({
  token0,
  token1,
  feeTier,
  chainId,
}: {
  token0: Token
  token1: Token
  feeTier: number
  chainId: ChainId
}) {
  const tokens = [token0, token1]
  const media = useMedia()
  return (
    <Row gap="sm">
      <DoubleTokenLogo chainId={chainId} tokens={tokens} size={30} />
      {media.lg ? (
        <ThemedText.HeadlineSmall>
          {token0.symbol}-{token1.symbol} Farm
        </ThemedText.HeadlineSmall>
      ) : (
        <ThemedText.HeadlineMedium>
          {token0.symbol}-{token1.symbol} {feeTier / BIPS_BASE}% Farm
        </ThemedText.HeadlineMedium>
      )}

      <Badge>V3</Badge>
      <Badge>{feeTier / BIPS_BASE}%</Badge>
    </Row>
  )
}

function WrongNetworkCard() {
  const theme = useTheme()

  return (
    <>
      <PageWrapper>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow padding="0">
              <ThemedText.H1Large>
                <Trans>Positions</Trans>
              </ThemedText.H1Large>
            </TitleRow>

            <PositionstWrapper>
              <ErrorContainer>
                <ThemedText.BodyPrimary color={theme.neutral3} textAlign="center">
                  <NetworkIcon strokeWidth={1.2} />
                  <div data-testid="pools-unsupported-err">
                    <Trans>Your connected network is unsupported.</Trans>
                  </div>
                </ThemedText.BodyPrimary>
              </ErrorContainer>
            </PositionstWrapper>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

export default function FarmV3() {
  const { account } = useWeb3React()
  const chainId = ChainId.CELO
  const { poolAddress } = useParams<{ poolAddress: string }>()
  console.log('poolAddress', poolAddress)
  const toggleWalletDrawer = useToggleAccountDrawer()
  const incentiveIds = poolAddress ? getIncentiveIdsByPool(poolAddress) : []

  const theme = useTheme()
  const { formatPercent, formatNumber } = useFormatter()

  const { positions, loading: positionsLoading } = useV3Positions(account)
  const { positions: stakedPositions, loading: stakedPositionsLoading } = useV3StakedPositions(account, incentiveIds)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      return acc
    },
    [[], []]
  ) ?? [[], []]

  const positionsInThisPool = useMemo(() => {
    if (poolAddress && openPositions) {
      return openPositions.filter(
        (position) =>
          Pool.getAddress(
            new Token(ChainId.CELO, position.token0, 18, '', ''),
            new Token(ChainId.CELO, position.token1, 18, '', ''),
            position.fee
          ).toLowerCase() === poolAddress.toLowerCase()
      )
    }
    return []
  }, [poolAddress, openPositions])

  const userTokenIds = useMemo(() => {
    return positionsInThisPool.map((p) => p.tokenId).concat((stakedPositions || []).map((p) => p.tokenId))
  }, [positionsInThisPool, stakedPositions])

  const poolContract = usePoolContract(poolAddress)
  const poolFee = useSingleCallResult(poolContract, 'fee', undefined, NEVER_RELOAD).result?.[0] as number
  const poolToken0 = useSingleCallResult(poolContract, 'token0', undefined, NEVER_RELOAD).result?.[0] as string
  const poolToken1 = useSingleCallResult(poolContract, 'token1', undefined, NEVER_RELOAD).result?.[0] as string
  const token0 = useToken(poolToken0, ChainId.CELO)
  const token1 = useToken(poolToken1, ChainId.CELO)

  const [isDepositing, callDeposit] = useDepositCallback()
  const [isWithdrawing, callWithdraw] = useWithdrawCallback()
  const [isCollectingReward, callCollectReward] = useCollectRewardCallback()

  const nativePrice = useUSDPrice(CurrencyAmount.fromRawAmount(CELO_CELO, 1e18)).data || 0
  const ubePrice = useUSDPrice(CurrencyAmount.fromRawAmount(UBE[ChainId.CELO], 1e18)).data || 0

  const metadata = useV3IncentiveMetadata(incentiveIds[0])

  const activeTvlNative = parseFloat(formatEther(BigNumber.from(metadata?.activeTvlNative || '0')))
  const inactiveTvlNative = parseFloat(formatEther(BigNumber.from(metadata?.inactiveTvlNative || '0')))
  const ubeYearlyReward = parseFloat(
    formatEther(
      BigNumber.from(metadata?.distributedRewards || '0')
        .mul(365 * 24 * 60 * 60)
        .div(metadata?.duration || 1)
    )
  )
  const ubeDailyReward = parseFloat(
    formatEther(
      BigNumber.from(metadata?.distributedRewards || '0')
        .mul(24 * 60 * 60)
        .div(metadata?.duration || 1)
    )
  )
  const ubeYearlyRewardUsd = ubeYearlyReward * ubePrice
  let apr = new Percent(0)
  if (activeTvlNative * nativePrice > 0) {
    apr = new Percent(Math.round(ubeYearlyRewardUsd * 1_000_000), Math.round(activeTvlNative * nativePrice * 1_000_000))
  }

  const userTokenDatas = useIncentiveTokenData(incentiveIds[0], userTokenIds)

  const activeUserTvlNative = useMemo(() => {
    return parseFloat(
      formatEther(
        userTokenDatas
          .filter((d) => d.incentiveData?.isActive && d.incentiveData?.isStaked)
          .reduce((acc, curr) => {
            return acc.add(curr.incentiveData?.tvlNative || 0)
          }, BigNumber.from(0))
      )
    )
  }, [userTokenDatas])

  const unclaimedRewards = useMemo(() => {
    return parseFloat(
      formatEther(
        userTokenDatas
          .filter((d) => d.incentiveData && d.stakeInfo)
          .reduce((acc, curr) => {
            return acc.add(curr.incentiveData?.accumulatedRewards || 0).sub(curr.stakeInfo?.claimedReward || 0)
          }, BigNumber.from(0))
      )
    )
  }, [userTokenDatas])

  let userShare = new Percent(0)
  if (activeTvlNative > 0) {
    userShare = new Percent(Math.round(activeUserTvlNative * 1_000_000), Math.round(activeTvlNative * 1_000_000))
  }

  if (!isSupportedChain(chainId)) {
    return <WrongNetworkCard />
  }

  const showConnectAWallet = Boolean(!account)

  const onWithdraw = (tokenId: BigNumber) => {
    if (isWithdrawing == false) {
      callWithdraw(
        tokenId,
        incentiveIds.map((incentiveId) => getIncentiveKey(incentiveId))
      )
    }
  }

  const onDeposit = (tokenId: BigNumber) => {
    if (isDepositing == false) {
      callDeposit(
        tokenId,
        incentiveIds.map((incentiveId) => getIncentiveKey(incentiveId))
      )
    }
  }

  console.log('userTokenDatas', userTokenDatas)

  const onCollectReward = () => {
    if (isCollectingReward == false && unclaimedRewards > 0) {
      const collectParams = userTokenDatas
        .filter(
          (d) =>
            d.incentiveData &&
            d.stakeInfo &&
            d.incentiveData.accumulatedRewards.gt(d.stakeInfo.claimedReward) &&
            (d.incentiveData.merkleProof?.length || 0) > 0
        )
        .map((d) => ({
          key: getIncentiveKey(incentiveIds[0]),
          tokenId: d.tokenId,
          accumulatedRewards: d.incentiveData!.accumulatedRewards,
          proof: d.incentiveData!.merkleProof!,
        }))

      callCollectReward(collectParams)
    }
  }

  return (
    <Trace page={InterfacePageName.FARM_V3} shouldLogImpression>
      <PageWrapper>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow padding="0">
              {token0 && token1 ? (
                <PoolDescription token0={token0} token1={token1} feeTier={poolFee} chainId={chainId} />
              ) : (
                'Liquidity Mining'
              )}
            </TitleRow>

            <Row align="flex-start" gap="md">
              <DarkCard width="50%">
                <AutoColumn gap="md" style={{ width: '100%' }}>
                  <AutoColumn gap="md">
                    <Label>
                      <Trans>Total Deposits</Trans>
                    </Label>
                    <Row justify="space-between">
                      {(activeTvlNative + inactiveTvlNative) * nativePrice > 0 ? (
                        <ThemedText.DeprecatedLargeHeader fontSize="36px" fontWeight={535}>
                          {formatNumber({
                            input: (activeTvlNative + inactiveTvlNative) * nativePrice,
                            type: NumberType.FiatTokenPrice,
                          })}
                        </ThemedText.DeprecatedLargeHeader>
                      ) : (
                        <ThemedText.DeprecatedLargeHeader color={theme.neutral1} fontSize="36px" fontWeight={535}>
                          <Trans>-</Trans>
                        </ThemedText.DeprecatedLargeHeader>
                      )}
                      <AutoColumn>
                        <ThemedText.LabelMicro textAlign="right">
                          {formatNumber({
                            input: activeTvlNative,
                            type: NumberType.FiatTokenPrice,
                          })}{' '}
                          - In-Range
                        </ThemedText.LabelMicro>
                        <ThemedText.LabelMicro textAlign="right">
                          {formatNumber({
                            input: inactiveTvlNative,
                            type: NumberType.FiatTokenPrice,
                          })}{' '}
                          - Out-of-Range
                        </ThemedText.LabelMicro>
                      </AutoColumn>
                    </Row>
                  </AutoColumn>
                  <LightCard padding="12px 16px">
                    <AutoColumn gap="md">
                      <RowBetween>
                        <ThemedText.DeprecatedMain>Your In-Range Liquidity</ThemedText.DeprecatedMain>
                        <ThemedText.DeprecatedMain>
                          {formatNumber({ input: activeUserTvlNative * nativePrice, type: NumberType.FiatTokenPrice })}
                        </ThemedText.DeprecatedMain>
                      </RowBetween>
                      <RowBetween>
                        <ThemedText.DeprecatedMain>Your Pool Share</ThemedText.DeprecatedMain>
                        <ThemedText.DeprecatedMain>{formatPercent(userShare)}</ThemedText.DeprecatedMain>
                      </RowBetween>
                    </AutoColumn>
                  </LightCard>
                </AutoColumn>
              </DarkCard>
              <DarkCard width="50%">
                <AutoColumn gap="md" style={{ width: '100%' }}>
                  <AutoColumn gap="md">
                    <RowBetweenRelative>
                      <Label>
                        <Trans>Unclaimed Rewards</Trans>
                      </Label>
                      <ResponsiveButtonConfirmed
                        data-testid="collect-fees-button"
                        disabled={false}
                        confirmed={false}
                        width="fit-content"
                        style={{ borderRadius: '12px' }}
                        padding="4px 8px"
                        onClick={onCollectReward}
                      >
                        <ThemedText.DeprecatedMain color={theme.white}>
                          <Trans>Collect</Trans>
                        </ThemedText.DeprecatedMain>
                      </ResponsiveButtonConfirmed>
                    </RowBetweenRelative>

                    <Row justify="space-between">
                      {unclaimedRewards > 0 ? (
                        <ThemedText.DeprecatedLargeHeader fontSize="36px" fontWeight={535}>
                          {formatNumber({
                            input: unclaimedRewards,
                            type: NumberType.SwapDetailsAmount,
                          })}
                          &nbsp; UBE
                        </ThemedText.DeprecatedLargeHeader>
                      ) : (
                        <ThemedText.DeprecatedLargeHeader color={theme.neutral1} fontSize="36px" fontWeight={535}>
                          <Trans>-</Trans>
                        </ThemedText.DeprecatedLargeHeader>
                      )}
                      <RowFixed>
                        <ThemedText.BodySecondary textAlign="right">APR:</ThemedText.BodySecondary>
                        &nbsp;&nbsp;
                        <ThemedText.MediumHeader textAlign="right">{formatPercent(apr)}</ThemedText.MediumHeader>
                      </RowFixed>
                    </Row>
                  </AutoColumn>
                  <LightCard padding="12px 16px">
                    <AutoColumn gap="md">
                      <RowBetween>
                        <ThemedText.DeprecatedMain>Daily Rewards</ThemedText.DeprecatedMain>
                        <ThemedText.DeprecatedMain>
                          {formatNumber({ input: ubeDailyReward, type: NumberType.SwapDetailsAmount })}
                          &nbsp; UBE
                        </ThemedText.DeprecatedMain>
                      </RowBetween>
                      <RowBetween>
                        <ThemedText.DeprecatedMain>Your Daily Rewards</ThemedText.DeprecatedMain>
                        <ThemedText.DeprecatedMain>
                          {formatNumber({
                            input: activeTvlNative > 0 ? (ubeDailyReward * activeUserTvlNative) / activeTvlNative : 0,
                            type: NumberType.SwapDetailsAmount,
                          })}
                          &nbsp; UBE
                        </ThemedText.DeprecatedMain>
                      </RowBetween>
                    </AutoColumn>
                  </LightCard>
                </AutoColumn>
              </DarkCard>
            </Row>

            {metadata && (
              <InfoBox
                message={
                  'Last calculation time: ' +
                  new Date(metadata.timestamp * 1000).toISOString().slice(0, 16).replace('T', ' ')
                }
              />
            )}

            <PositionstWrapper>
              {positionsLoading || stakedPositionsLoading ? (
                <PositionsLoadingPlaceholder />
              ) : positionsInThisPool && stakedPositions ? (
                <PositionList
                  positions={positionsInThisPool}
                  stakedPositons={stakedPositions}
                  onWithdraw={onWithdraw}
                  onDeposit={onDeposit}
                />
              ) : (
                <ErrorContainer>
                  <ThemedText.BodyPrimary color={theme.neutral3} textAlign="center">
                    <InboxIcon strokeWidth={1} style={{ marginTop: '2em' }} />
                    <div>
                      <Trans>Your active V3 liquidity positions will appear here.</Trans>
                    </div>
                  </ThemedText.BodyPrimary>
                  {showConnectAWallet && (
                    <TraceEvent
                      events={[BrowserEvent.onClick]}
                      name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
                      properties={{ received_swap_quote: false }}
                      element={InterfaceElementName.CONNECT_WALLET_BUTTON}
                    >
                      <ButtonPrimary
                        style={{ marginTop: '2em', marginBottom: '2em', padding: '8px 16px' }}
                        onClick={toggleWalletDrawer}
                      >
                        <Trans>Connect a wallet</Trans>
                      </ButtonPrimary>
                    </TraceEvent>
                  )}
                </ErrorContainer>
              )}
            </PositionstWrapper>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </Trace>
  )
}
