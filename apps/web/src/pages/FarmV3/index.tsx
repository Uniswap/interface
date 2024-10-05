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
import Modal from 'components/Modal'
import Row, { RowBetween, RowFixed } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TransactionConfirmationModal from 'components/TransactionConfirmationModal'
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
import { Checkbox } from 'nft/components/layout/Checkbox'
import { useV3IncentiveMetadata } from 'pages/Earn/data/useFarms'
import { getIncentiveIdsByPool, getIncentiveKey } from 'pages/Earn/data/v3-incentive-list'
import DoubleTokenLogo from 'pages/Earn/tables/FarmTable/DoubleTokenLogo'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Inbox, Info } from 'react-feather'
import { Link, useParams } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
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

const ResponsiveRow = styled(Row)`
  @media screen and (max-width: ${BREAKPOINTS.md}px) {
    flex-direction: column;
  }
`

function InfoBox({ message, desc }: { message?: string; desc?: string }) {
  const theme = useTheme()
  const [showDesc, setShowDesc] = useState(false)
  return (
    <InfoBoxWrapper onClick={() => setShowDesc(!showDesc)}>
      <InfoBoxContainer>
        <Info size={28} stroke={theme.primary1} />
        <AutoColumn justify="flex-start">
          {message && (
            <ThemedText.BodySmall padding={10} textAlign="center">
              {message}
            </ThemedText.BodySmall>
          )}
          {desc && showDesc && (
            <ThemedText.BodySmall padding={10} textAlign="center">
              {desc}
            </ThemedText.BodySmall>
          )}
        </AutoColumn>
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

export function getAbbreviatedTimeString(timestamp: number) {
  const now = Date.now()
  const timeSince = now - timestamp
  const secondsPassed = Math.floor(timeSince / 1000)
  const minutesPassed = Math.floor(secondsPassed / 60)
  const hoursPassed = Math.floor(minutesPassed / 60)
  const daysPassed = Math.floor(hoursPassed / 24)
  const monthsPassed = Math.floor(daysPassed / 30)

  if (monthsPassed > 0) {
    return `${monthsPassed} months ago`
  } else if (daysPassed > 0) {
    return `${daysPassed} days ago`
  } else if (hoursPassed > 0) {
    return `${hoursPassed} hours ago`
  } else if (minutesPassed > 0) {
    return `${minutesPassed} minutes ago`
  } else {
    return `${secondsPassed} seconds ago`
  }
}

export default function FarmV3() {
  const { account } = useWeb3React()
  const chainId = ChainId.CELO
  const { poolAddress } = useParams<{ poolAddress: string }>()
  const toggleWalletDrawer = useToggleAccountDrawer()
  const incentiveIds = useMemo(() => (poolAddress ? getIncentiveIdsByPool(poolAddress) : []), [poolAddress])

  const theme = useTheme()
  const { formatPercent, formatNumber } = useFormatter()

  const { positions, loading: positionsLoading } = useV3Positions(account)
  const { positions: stakedPositions, loading: stakedPositionsLoading } = useV3StakedPositions(account, incentiveIds)

  const positionsInThisPool = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
      (acc, p) => {
        acc[p.liquidity?.isZero() ? 1 : 0].push(p)
        return acc
      },
      [[], []]
    ) ?? [[], []]

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
  }, [poolAddress, positions])

  const userTokenIds = useMemo(() => {
    return positionsInThisPool.map((p) => p.tokenId).concat((stakedPositions || []).map((p) => p.tokenId))
  }, [positionsInThisPool, stakedPositions])

  const poolContract = usePoolContract(poolAddress)
  const poolFee = useSingleCallResult(poolContract, 'fee', undefined, NEVER_RELOAD).result?.[0] as number
  const poolToken0 = useSingleCallResult(poolContract, 'token0', undefined, NEVER_RELOAD).result?.[0] as string
  const poolToken1 = useSingleCallResult(poolContract, 'token1', undefined, NEVER_RELOAD).result?.[0] as string
  const token0 = useToken(poolToken0, ChainId.CELO)
  const token1 = useToken(poolToken1, ChainId.CELO)

  const [callDeposit, depositTxHash, isDepositing] = useDepositCallback()
  const [callWithdraw, withdrawTxHash, isWithdrawing] = useWithdrawCallback()
  const [callCollectReward, collectRewardTxHash, isCollectingReward] = useCollectRewardCallback()

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

  console.log('userTokenDatas', userTokenDatas)

  let userShare = new Percent(0)
  if (activeTvlNative > 0) {
    userShare = new Percent(Math.round(activeUserTvlNative * 1_000_000), Math.round(activeTvlNative * 1_000_000))
  }

  const showConnectAWallet = Boolean(!account)

  const onWithdraw = useCallback(
    (tokenId: BigNumber) => {
      if (userTokenDatas.find((d) => d.tokenId.eq(tokenId) && (!d.incentiveData || !d.stakeInfo))) {
        console.error('missing token data')
        return
      }
      const collectParams = userTokenDatas
        .filter(
          (d) =>
            d.tokenId.eq(tokenId) &&
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

      if (isWithdrawing == false) {
        callWithdraw(
          tokenId,
          incentiveIds.map((incentiveId) => getIncentiveKey(incentiveId)),
          collectParams
        )
      }
    },
    [userTokenDatas, isWithdrawing, callWithdraw, incentiveIds]
  )

  const onDeposit = useCallback(
    (tokenId: BigNumber) => {
      if (isDepositing == false) {
        callDeposit(
          tokenId,
          incentiveIds.map((incentiveId) => getIncentiveKey(incentiveId))
        )
      }
    },
    [isDepositing, callDeposit, incentiveIds]
  )

  const onCollectReward = useCallback(() => {
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
  }, [isCollectingReward, callCollectReward, userTokenDatas, incentiveIds, unclaimedRewards])

  const onDissmissConfirmationModal = useCallback(() => {}, [])
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false)

  const handleCheckbox = () => {
    setIsDisclaimerAccepted(!isDisclaimerAccepted)
  }

  const [showDisclaimer, setShowDisclaimer] = useState(false)
  useEffect(() => {
    const v3FarmDisclaimerShown = localStorage.getItem('v3FarmDisclaimerShown')
    if (!v3FarmDisclaimerShown) {
      setShowDisclaimer(true)
    }
  }, [])
  const onDisclaimerAccepted = () => {
    localStorage.setItem('v3FarmDisclaimerShown', 'true')
    setShowDisclaimer(false)
  }

  if (!isSupportedChain(chainId)) {
    return <WrongNetworkCard />
  }

  const rewardText = formatNumber({
    input: unclaimedRewards,
    type: NumberType.SwapDetailsAmount,
  })

  return (
    <Trace page={InterfacePageName.FARM_V3} shouldLogImpression>
      <TransactionConfirmationModal
        isOpen={isDepositing}
        attemptingTxn={isDepositing}
        hash={depositTxHash}
        reviewContent={() => <div></div>}
        onDismiss={onDissmissConfirmationModal}
        pendingText="Depositing your position"
      />
      <TransactionConfirmationModal
        isOpen={isWithdrawing}
        attemptingTxn={isWithdrawing}
        hash={withdrawTxHash}
        reviewContent={() => <div></div>}
        onDismiss={onDissmissConfirmationModal}
        pendingText="Withdrawing your position"
      />
      <TransactionConfirmationModal
        isOpen={isCollectingReward}
        attemptingTxn={isCollectingReward}
        hash={collectRewardTxHash}
        reviewContent={() => <div></div>}
        onDismiss={onDissmissConfirmationModal}
        pendingText="Collecting Rewards"
      />
      <Modal isOpen={showDisclaimer} $scrollOverlay={true} onDismiss={() => setShowDisclaimer(false)} maxHeight={90}>
        <div style={{ padding: '16px' }}>
          <div>
            <p>
              This website-hosted user interface (this &quot;Interface&quot;) is an open source frontend software portal
              to the Ubeswap protocol, a decentralized and community-driven collection of blockchain-enabled smart
              contracts and tools (the &quot;Ubeswap Protocol&quot;). This Interface and the Ubeswap Protocol are made
              available by QW3 Labs, however all transactions conducted on the protocol are run by related
              permissionless smart contracts. As the Interface is open-sourced and the Ubeswap Protocol and its related
              smart contracts are accessible by any user, entity or third party, there are a number of third party web
              and mobile user-interfaces that allow for interaction with the Ubeswap Protocol.
            </p>
            <p>
              THIS INTERFACE AND THE UBESWAP PROTOCOL ARE PROVIDED &quot;AS IS&quot;, AT YOUR OWN RISK, AND WITHOUT
              WARRANTIES OF ANY KIND. QW3 Labs, does not provide, own, or control the Ubeswap Protocol or any
              transactions conducted on the protocol or via related smart contracts. By using or accessing this
              Interface or the Ubeswap Protocol and related smart contracts, you agree that no developer or entity
              involved in creating, deploying or maintaining this Interface or the Ubeswap Protocol will be liable for
              any claims or damages whatsoever associated with your use, inability to use, or your interaction with
              other users of, this Interface or the Ubeswap Protocol, including any direct, indirect, incidental,
              special, exemplary, punitive or consequential damages, or loss of profits, digital assets, tokens, or
              anything else of value.
            </p>
          </div>
          <Checkbox checked={isDisclaimerAccepted} hovered={true} onChange={handleCheckbox}>
            <div style={{ marginRight: '10px' }}>I understand</div>
          </Checkbox>
          <AutoColumn justify="center">
            <ButtonPrimary
              disabled={!isDisclaimerAccepted}
              style={{ marginTop: '16px', width: 'fit-content', padding: '8px 20px' }}
              onClick={onDisclaimerAccepted}
            >
              OK
            </ButtonPrimary>
          </AutoColumn>
        </div>
      </Modal>
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

            <ResponsiveRow align="flex-start" gap="md">
              <DarkCard>
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
                            input: activeTvlNative * nativePrice,
                            type: NumberType.FiatTokenPrice,
                          })}{' '}
                          - In-Range
                        </ThemedText.LabelMicro>
                        <ThemedText.LabelMicro textAlign="right">
                          {formatNumber({
                            input: inactiveTvlNative * nativePrice,
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
              <DarkCard>
                <AutoColumn gap="md" style={{ width: '100%' }}>
                  <AutoColumn gap="md">
                    <RowBetweenRelative>
                      <Label>
                        <Trans>Unclaimed Rewards</Trans>
                      </Label>
                      {unclaimedRewards > 0 && (
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
                      )}
                    </RowBetweenRelative>

                    <Row justify="space-between">
                      {unclaimedRewards > 0 ? (
                        <ThemedText.DeprecatedLargeHeader
                          fontSize={rewardText.length > 9 ? '30px' : '36px'}
                          fontWeight={535}
                        >
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
            </ResponsiveRow>

            {metadata && (
              <InfoBox
                message={
                  'Last calculation time: ' +
                  new Date(metadata.timestamp * 1000).toISOString() +
                  ' (' +
                  getAbbreviatedTimeString(metadata.timestamp * 1000) +
                  ')'
                }
                desc="All the TVL calculations and reward distributions are done periodically, every half an hour."
              />
            )}

            <PositionstWrapper>
              {positionsLoading || stakedPositionsLoading ? (
                <PositionsLoadingPlaceholder />
              ) : positionsInThisPool && stakedPositions && positionsInThisPool.length + stakedPositions.length > 0 ? (
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
                  {showConnectAWallet ? (
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
                  ) : (
                    <TraceEvent
                      events={[BrowserEvent.onClick]}
                      name={InterfaceEventName.NEW_POSITION_BUTTON_CLICKED}
                      properties={{ received_swap_quote: false }}
                      element={InterfaceElementName.NEW_POSITION_BUTTON}
                    >
                      <ButtonPrimary
                        style={{ marginTop: '2em', marginBottom: '2em', padding: '8px 16px' }}
                        as={Link}
                        to={`/add/${poolToken0}/${poolToken1}/${poolFee}`}
                      >
                        + <Trans>Create New Position</Trans>
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
