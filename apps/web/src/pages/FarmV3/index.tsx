import { BigNumber } from '@ethersproject/bignumber'
import { BrowserEvent, InterfaceElementName, InterfaceEventName, InterfacePageName } from '@ubeswap/analytics-events'
import { ChainId, Token } from '@ubeswap/sdk-core'
import { Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { Trace, TraceEvent } from 'analytics'
import { useToggleAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { isSupportedChain } from 'constants/chains'
import { BIPS_BASE } from 'constants/misc'
import { useToken } from 'hooks/Tokens'
import { usePoolContract } from 'hooks/useContract'
import { useV3Positions, useV3StakedPositions } from 'hooks/useV3Positions'
import { Trans } from 'i18n'
import { NEVER_RELOAD, useSingleCallResult } from 'lib/hooks/multicall'
import { getIncentiveIdsByPool, getIncentiveKey } from 'pages/Earn/data/v3-incentive-list'
import DoubleTokenLogo from 'pages/Earn/tables/FarmTable/DoubleTokenLogo'
import { useMemo } from 'react'
import { AlertTriangle, Inbox } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { PositionDetails } from 'types/position'
import { useMedia } from 'ui'
import PositionList from './PositionList'
import { useDepositCallback, useWithdrawCallback } from './farm-actions'
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

const MainContentWrapper = styled.main`
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  padding: 0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

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

            <MainContentWrapper>
              <ErrorContainer>
                <ThemedText.BodyPrimary color={theme.neutral3} textAlign="center">
                  <NetworkIcon strokeWidth={1.2} />
                  <div data-testid="pools-unsupported-err">
                    <Trans>Your connected network is unsupported.</Trans>
                  </div>
                </ThemedText.BodyPrimary>
              </ErrorContainer>
            </MainContentWrapper>
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

  const poolContract = usePoolContract(poolAddress)
  const poolFee = useSingleCallResult(poolContract, 'fee', undefined, NEVER_RELOAD).result?.[0] as number
  const poolToken0 = useSingleCallResult(poolContract, 'token0', undefined, NEVER_RELOAD).result?.[0] as string
  const poolToken1 = useSingleCallResult(poolContract, 'token1', undefined, NEVER_RELOAD).result?.[0] as string
  const token0 = useToken(poolToken0, ChainId.CELO)
  const token1 = useToken(poolToken1, ChainId.CELO)

  const [isDepositing, callDeposit] = useDepositCallback()
  const [isWithdrawing, callWithdraw] = useWithdrawCallback()

  console.log('poolFee', poolFee)
  console.log('poolToken0', poolToken0)
  console.log('poolToken1', poolToken1)

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

            <MainContentWrapper>
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
            </MainContentWrapper>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </Trace>
  )
}
