import React, { useCallback, useMemo, useState } from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components/macro'
import { Link } from 'react-router-dom'
import JSBI from 'jsbi'
import { Token, CurrencyAmount } from '@uniswap/sdk-core'
import { RouteComponentProps } from 'react-router-dom'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { useWalletModalToggle } from '../../state/application/hooks'
import { TYPE } from '../../theme'

import { AutoRow, RowBetween } from '../../components/Row'
import { CardSection, DataCard, CardNoise, CardBGImage } from '../../components/farm/styled'
import { ButtonPrimary } from '../../components/Button'
import StakingModal from '../../components/farm/StakingModal'
import UnstakingModal from '../../components/farm/UnstakingModal'
import ClaimRewardModal from '../../components/farm/ClaimRewardModal'
import { useActiveWeb3React } from '../../hooks/web3'
import { CountUp } from 'use-count-up'

import { currencyId } from '../../utils/currencyId'
import usePrevious from '../../hooks/usePrevious'
import { BIG_INT_ZERO, BIG_INT_SECONDS_IN_WEEK } from '../../constants/misc'
import {
  usePairTokens,
  useRewardInfos,
  usePool,
  useOwnWeeklyEmission,
  // useCalculateAPR,
  useFarmTVL,
} from 'state/farm/farm-hooks'
import { PotionIcon4 } from '../../components/Potions/Potions'
import { Box } from 'rebass/styled-components'
import { HRDark } from '../../components/HR/HR'
import { CurrencyLogoFromList } from 'components/CurrencyLogo/CurrencyLogoFromList'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const PositionInfo = styled(AutoColumn)<{ dim: any }>`
  position: relative;
  max-width: 640px;
  width: 100%;
  opacity: ${({ dim }) => (dim ? 0.6 : 1)};
`

const BottomSection = styled(AutoColumn)`
  border-radius: 8px;
  width: 100%;
  position: relative;
`

const StyledBottomCard = styled(DataCard)<{ dim: any }>`
  background: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.darkTransparent} 0%, ${theme.secondary1_30} 50%, ${theme.darkTransparent} 100%);`};
  border: 1px solid rgba(12, 92, 146, 0.7);
  box-shadow: 0 0 5px rgba(39, 210, 234, 0.1), 0 0 7px rgba(39, 210, 234, 0.3);
  opacity: ${({ dim }) => (dim ? 0.4 : 1)};
  //margin-top: -40px;
  padding: 0 1.25rem 1rem 1.25rem;
  padding-top: 32px;
  z-index: 1;
`

const PoolData = styled(DataCard)`
  background: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.darkTransparent} 0%, ${theme.secondary1_30} 50%, ${theme.darkTransparent} 100%);`};
  border: 1px solid rgba(12, 92, 146, 0.7);
  box-shadow: 0 0 5px rgba(39, 210, 234, 0.1), 0 0 7px rgba(39, 210, 234, 0.3);
  padding: 1.5rem 7rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 12px;
      padding: 1.5rem 1.5rem;
  `};
`

const VoteCard = styled(DataCard)`
  background: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.darkTransparent} 0%, ${theme.secondary1_30} 35%, ${theme.darkTransparent} 100%);`};
  overflow: hidden;
  border: 1px solid rgba(12, 92, 146, 0.7);
  box-shadow: 0 0 5px rgba(39, 210, 234, 0.1), 0 0 7px rgba(39, 210, 234, 0.3);
`

const DataRow = styled(RowBetween)`
  justify-content: center;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 12px;
  `};
`

const Heading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const PoolHeading = styled(Box)<{ align?: string }>`
  text-align: ${({ align }) => align && align};
`

const RewardRate = styled(Box)<{ align?: string }>`
  text-align: ${({ align }) => align && align};
  margin-top: 4%;
`

export default function Manage({ match: { params } }: RouteComponentProps<{ poolId?: string }>) {
  const { account } = useActiveWeb3React()

  const poolId = params.poolId ? parseInt(params.poolId) : 0

  const pool = usePool(poolId)
  const { lpTokenAddress, pendingAmount, stakedRawAmount, rewarderAddress, poolEmissionAmount } = pool || {}
  const { token0, token1, availableLPAmount, lpToken, totalPoolStaked, pair } = usePairTokens(lpTokenAddress)
  const { pendingAmount: pendingRewardAmount, rewardPerSecondAmount } = useRewardInfos(poolId, rewarderAddress)
  const stakedAmount = lpToken ? CurrencyAmount.fromRawAmount(lpToken, stakedRawAmount || 0) : undefined

  const ownPrimaryWeeklyEmission = useOwnWeeklyEmission(poolEmissionAmount, stakedAmount, totalPoolStaked)
  // const primaryAPR = useCalculateAPR(poolEmissionAmount, totalPoolStaked)
  const ownSecondaryWeeklyEmission = useOwnWeeklyEmission(rewardPerSecondAmount, stakedAmount, totalPoolStaked)
  // const secondaryAPR = useCalculateAPR(rewardPerSecondAmount, totalPoolStaked)

  // const totalAPR = JSBI.add(primaryAPR || JSBI.BigInt(0), secondaryAPR || JSBI.BigInt(0))

  // detect existing unstaked LP position to show add button if none found
  const userLiquidityUnstaked = availableLPAmount
  const showAddLiquidityButton = Boolean(stakedAmount?.equalTo('0') && userLiquidityUnstaked?.equalTo('0'))

  // toggle for staking modal and unstaking modal
  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)

  // fade cards if nothing staked or nothing earned yet
  // const disableTop = !stakedAmount || stakedAmount.equalTo(JSBI.BigInt(0))

  // const WETH = token0?.isNative ? tokenA : tokenB
  // const colorToken = token0?.isNative ? token1 : token0
  // const backgroundColor = useColor(colorToken ?? undefined)

  // get the USD value of staked dIFFUSION

  const valueOfTotalStakedAmountInUSDC = useFarmTVL(pair ?? undefined)

  const toggleWalletModal = useWalletModalToggle()

  const handleDepositClick = useCallback(() => {
    if (account) {
      setShowStakingModal(true)
    } else {
      toggleWalletModal()
    }
  }, [account, toggleWalletModal])

  // Just to match the API for the Modals
  const stakingInfo = useMemo(() => {
    if (!stakedAmount || !pendingAmount || !token0 || !token1) {
      return null
    }
    return {
      poolId,
      tokens: [token0, token1] as [Token, Token],
      stakedAmount: stakedAmount!,
      earnedAmount: pendingAmount!,
      lpTokenAddress,
    }
  }, [lpTokenAddress, pendingAmount, poolId, stakedAmount, token0, token1])

  return (
    <PageWrapper gap="lg" justify="center">
      <AutoRow justify={'space-between'}>
        <Heading>
          <PotionIcon4 width={60} height={60} />
          <TYPE.largeHeader style={{ margin: 0 }}>
            {token0?.symbol}-{token1?.symbol} Liquidity Mining
          </TYPE.largeHeader>
        </Heading>
        <DoubleCurrencyLogo currency0={token1 ?? undefined} currency1={token0 ?? undefined} size={48} margin={true} />
      </AutoRow>

      <DataRow style={{ gap: '24px' }}>
        <PoolData>
          <RowBetween>
            <PoolHeading width={1 / 2} align="center">
              <TYPE.mediumHeader color={'primary1'}>Total deposits</TYPE.mediumHeader>
            </PoolHeading>
            {/* <PoolHeading width={1 / 2} align="center">
              <TYPE.mediumHeader color={'primary1'}>APR</TYPE.mediumHeader>
            </PoolHeading> */}
          </RowBetween>
          <HRDark />
          <RowBetween>
            <PoolHeading width={1 / 2} align="center">
              <TYPE.body fontSize={20} fontWeight={500}>
                {valueOfTotalStakedAmountInUSDC
                  ? `$${valueOfTotalStakedAmountInUSDC.toFixed(0, { groupSeparator: ',' })}`
                  : `${totalPoolStaked?.toSignificant(4, { groupSeparator: ',' }) ?? '-'} DIFF - LP`}
              </TYPE.body>
            </PoolHeading>
            {/* <PoolHeading width={1 / 2} align="center">
              <TYPE.body fontSize={20} fontWeight={500}>
                {JSBI.GT(totalAPR, JSBI.BigInt(0)) ? `${JSBI.multiply(totalAPR, JSBI.BigInt(100))}%` : '-'}
              </TYPE.body>
            </PoolHeading> */}
          </RowBetween>
          <CardNoise />
          <RowBetween>
            <RewardRate width={1 / 1} align="left">
              <AutoColumn justify={'start'}>
                <Heading>
                  <CurrencyLogoFromList currency={poolEmissionAmount?.currency ?? undefined} size={'24px'} />
                  <TYPE.body fontWeight={500} margin={'5px'}>
                    {poolEmissionAmount?.multiply(BIG_INT_SECONDS_IN_WEEK)?.toFixed(0, { groupSeparator: ',' }) ?? '-'}
                    <span style={{ color: '#27D2EA' }}> {` ${poolEmissionAmount?.currency.symbol || ''}`}</span>
                    <span> / week</span>
                  </TYPE.body>
                </Heading>
                {rewardPerSecondAmount && (
                  <Heading>
                    <CurrencyLogoFromList currency={rewardPerSecondAmount.currency ?? undefined} size={'24px'} />
                    <TYPE.body fontWeight={500} margin={'5px'}>
                      {rewardPerSecondAmount?.multiply(BIG_INT_SECONDS_IN_WEEK)?.toFixed(0, { groupSeparator: ',' }) ??
                        '-'}
                      <span style={{ color: '#27D2EA' }}>{` ${rewardPerSecondAmount?.currency.symbol || ''}`}</span>
                      <span> / week</span>
                    </TYPE.body>
                  </Heading>
                )}
              </AutoColumn>
            </RewardRate>
          </RowBetween>
        </PoolData>
      </DataRow>

      {showAddLiquidityButton && (
        <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Step 1. Get Diffusion Liquidity tokens</TYPE.white>
              </RowBetween>
              <RowBetween style={{ marginBottom: '1rem' }}>
                <TYPE.white fontSize={14}>
                  {`Diffusion LP tokens are required. Once you've added liquidity to the ${token0?.symbol}-${token1?.symbol} pool you can stake your liquidity tokens on this page.`}
                </TYPE.white>
              </RowBetween>
              <ButtonPrimary
                padding="8px"
                borderRadius="8px"
                width={'fit-content'}
                as={Link}
                to={`/add/v2/${token0 && currencyId(token0)}/${token1 && currencyId(token1)}`}
              >
                {`Add ${token0?.symbol}-${token1?.symbol} liquidity`}
              </ButtonPrimary>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </VoteCard>
      )}

      {stakingInfo && (
        <>
          <StakingModal
            isOpen={showStakingModal}
            onDismiss={() => setShowStakingModal(false)}
            stakingInfo={stakingInfo}
            userLiquidityUnstaked={userLiquidityUnstaked}
          />
          <UnstakingModal
            isOpen={showUnstakingModal}
            onDismiss={() => setShowUnstakingModal(false)}
            stakingInfo={stakingInfo}
          />
          <ClaimRewardModal
            isOpen={showClaimRewardModal}
            onDismiss={() => setShowClaimRewardModal(false)}
            stakingInfo={stakingInfo}
          />
        </>
      )}

      <PositionInfo gap="lg" justify="center" dim={showAddLiquidityButton}>
        <BottomSection gap="lg" justify="center">
          <StyledBottomCard dim={stakingInfo?.stakedAmount?.equalTo(JSBI.BigInt(0))}>
            {/*<CardSection>*/}
            {/*<CardBGImage desaturate />*/}
            <CardNoise />
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Your liquidity deposits</TYPE.white>
              </RowBetween>
              <RowBetween style={{ alignItems: 'baseline' }}>
                <TYPE.white fontSize={36} fontWeight={600}>
                  {stakingInfo?.stakedAmount?.toSignificant(6) ?? '-'}
                </TYPE.white>
                <TYPE.white>
                  DIFF-LP {token0?.symbol}-{token1?.symbol}
                </TYPE.white>
              </RowBetween>
            </AutoColumn>
            <HRDark />
            {/*</CardSection>*/}

            {/*<CardBGImage desaturate />*/}
            <CardNoise />
            <RewardRow
              pendingAmount={pendingAmount}
              ownWeeklyEmission={ownPrimaryWeeklyEmission}
              action={
                stakingInfo?.earnedAmount &&
                JSBI.notEqual(BIG_INT_ZERO, stakingInfo?.earnedAmount?.quotient) && (
                  <ButtonPrimary
                    padding="8px"
                    borderRadius="8px"
                    width="fit-content"
                    onClick={() => setShowClaimRewardModal(true)}
                  >
                    Claim
                  </ButtonPrimary>
                )
              }
            />
            <HRDark />
            {rewardPerSecondAmount && (
              <RewardRow
                pendingAmount={pendingRewardAmount ?? undefined}
                ownWeeklyEmission={ownSecondaryWeeklyEmission}
                style={{ paddingTop: 16 }}
              />
            )}
          </StyledBottomCard>
        </BottomSection>
        <TYPE.main style={{ textAlign: 'center' }} fontSize={14}>
          <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>
            ⭐️
          </span>
          When you withdraw, the contract will automagically claim all rewards on your behalf!
        </TYPE.main>

        {!showAddLiquidityButton && (
          <DataRow style={{ marginBottom: '1rem' }}>
            {stakingInfo && (
              <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={handleDepositClick}>
                {stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0)) ? 'Deposit' : 'Deposit Diffusion LP Tokens'}
              </ButtonPrimary>
            )}

            {stakedAmount?.greaterThan(JSBI.BigInt(0)) && (
              <>
                <ButtonPrimary
                  padding="8px"
                  borderRadius="8px"
                  width="160px"
                  onClick={() => setShowUnstakingModal(true)}
                >
                  Withdraw
                </ButtonPrimary>
              </>
            )}
          </DataRow>
        )}
        {!userLiquidityUnstaked || userLiquidityUnstaked.equalTo('0') ? null : (
          <TYPE.main>{userLiquidityUnstaked.toSignificant(6)} Diffusion LP tokens available</TYPE.main>
        )}
      </PositionInfo>
    </PageWrapper>
  )
}

type RewardRowProps = {
  action?: React.ReactNode
  ownWeeklyEmission?: CurrencyAmount<Token>
  pendingAmount?: CurrencyAmount<Token>
  style?: React.CSSProperties
}
function RewardRow({ action, ownWeeklyEmission, pendingAmount, style }: RewardRowProps) {
  const countUpAmount = pendingAmount?.toFixed(6) ?? '0'
  const countUpAmountPrevious = usePrevious(countUpAmount) ?? '0'
  return (
    <AutoColumn gap="sm" style={style}>
      <RowBetween>
        <div>
          <TYPE.black>Your unclaimed {pendingAmount?.currency.symbol}</TYPE.black>
        </div>
        {action}
      </RowBetween>
      <RowBetween style={{ alignItems: 'baseline' }}>
        <TYPE.largeHeader fontSize={36} fontWeight={600}>
          <CountUp
            key={countUpAmount}
            isCounting
            decimalPlaces={4}
            start={parseFloat(countUpAmountPrevious)}
            end={parseFloat(countUpAmount)}
            thousandsSeparator={','}
            duration={6}
          />
        </TYPE.largeHeader>
        {ownWeeklyEmission?.greaterThan(0) && (
          <TYPE.black fontSize={16} fontWeight={500}>
            <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
              ⚡
            </span>
            {ownWeeklyEmission?.toFixed(0, { groupSeparator: ',' }) ?? '-'} {pendingAmount?.currency.symbol}
            {' / week'}
          </TYPE.black>
        )}
      </RowBetween>
    </AutoColumn>
  )
}
