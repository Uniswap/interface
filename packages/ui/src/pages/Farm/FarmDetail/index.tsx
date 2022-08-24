import {
  CurrencyAmount,
  // Currency,
  JSBI,
  Token
} from '@teleswap/sdk'
import { ButtonPrimary, ButtonEmpty } from 'components/Button'
import { AutoColumn } from 'components/Column'
// import DoubleCurrencyLogo from 'components/DoubleLogo'
// import ClaimRewardModal from 'components/earn/ClaimRewardModal'
// import StakingModal from 'components/earn/StakingModal'
import { DataCard, CardBGImage, CardNoise, CardSection } from 'components/earn/styled'
import StakingModal from 'components/masterchef/StakingModal'
import UnstakingModal from 'components/masterchef/UnstakingModal'
// import UnstakingModal from 'components/earn/UnstakingModal'
import { RowBetween } from 'components/Row'
import { Chef } from 'constants/farm/chef.enum'
import { BIG_INT_SECONDS_IN_WEEK, UNI, ZERO_ADDRESS } from 'constants/index'
import { BigNumber } from 'ethers'
import useMasterChef from 'hooks/farm/useMasterChef'
import { useColor } from 'hooks/useColor'
import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
// import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useActiveWeb3React } from 'hooks/index'
import { useMasterChefContract } from 'hooks/useContract'
import { useChefPositions } from 'hooks/farm/useChefPositions'
import { TYPE } from 'theme'
// import { CountUp } from 'use-count-up'
// import { currencyId } from 'utils/currencyId'

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
  border-radius: 12px;
  width: 100%;
  position: relative;
`

const StyledDataCard = styled(DataCard)<{ bgColor?: any; showBackground?: any }>`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #1e1a31 0%, #3d51a5 100%);
  z-index: 2;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: ${({ theme, bgColor, showBackground }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor} 0%,  ${showBackground ? theme.black : theme.bg5} 100%) `};
`

const StyledBottomCard = styled(DataCard)<{ dim: any }>`
  background: ${({ theme }) => theme.bg3};
  opacity: ${({ dim }) => (dim ? 0.4 : 1)};
  margin-top: -40px;
  padding: 0 1.25rem 1rem 1.25rem;
  padding-top: 32px;
  z-index: 1;
`

const PoolData = styled(DataCard)`
  background: none;
  border: 1px solid ${({ theme }) => theme.bg4};
  padding: 1rem;
  z-index: 1;
`

// const VoteCard = styled(DataCard)`
//   background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
//   overflow: hidden;
// `

const DataRow = styled(RowBetween)`
  justify-content: center;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 12px;
  `};
`

export default function SimpleSushiMCManage() {
  const { chainId } = useActiveWeb3React()

  const masterChef = useMasterChef(Chef.MASTERCHEF)
  const { pid: pidInHex } = useParams<{ pid: string }>()
  const pid = parseInt(pidInHex)
  const poolName = `DAI/UNI`
  const showAddLiquidityButton = false
  // fade cards if nothing staked or nothing earned yet
  const backgroundColor = useColor()
  const disableTop = true
  const stakingInfo: any = undefined
  const mchefContract = useMasterChefContract()
  const positions = useChefPositions(mchefContract, undefined, chainId)
  // toggle for staking modal and unstaking modal
  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  // const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)
  useEffect(() => {
    if (positions) console.debug('positions[pid]', positions[pid])
  }, [positions])

  const rewardToken = UNI[chainId || 420]

  const parsedPendingSushiAmount = useMemo(() => {
    try {
      if (positions && positions[pid] && positions[pid].pendingSushi) {
        const bi = (positions[pid].pendingSushi as BigNumber).toBigInt();
        console.debug('parsedPendingSushiAmount::bi', bi)
        return CurrencyAmount.fromRawAmount(rewardToken, bi).toFixed(6)
      }
    } catch (error) {
      console.error('parsedPendingSushiAmount::error', error)
    }
    return '--.--'
  }, [rewardToken, positions, pid])

  const parsedStakedAmount = useMemo(() => {
    try {
      if (positions && positions[pid] && positions[pid].amount) {
        const bi = (positions[pid].amount as BigNumber).toBigInt();
        return CurrencyAmount.fromRawAmount(new Token(chainId || 420, ZERO_ADDRESS, 6), bi)?.toSignificant(6)
      }
    } catch (error) {
      console.error('parsedStakedAmount::error', error)
    }
    return '--.--'
  }, [chainId, positions, pid])

  const parsedEarnedToken = useMemo(() => {
    try {
      if (positions && positions[pid] && positions[pid].rewardDebt) {
        const bi = (positions[pid].rewardDebt as BigNumber).toBigInt();
        return CurrencyAmount.fromRawAmount(rewardToken, bi)?.toSignificant(6)
      }
    } catch (error) {
      console.error('parsedEarnedToken::error', error)
    }
    return '--.--'
  }, [rewardToken, positions, pid])
  

  return (
    <PageWrapper gap="lg" justify="center">
      <RowBetween style={{ gap: '24px' }}>
        <TYPE.mediumHeader style={{ margin: 0 }}>{poolName} Liquidity Mining</TYPE.mediumHeader>
        {/* <DoubleCurrencyLogo currency0={currencyA ?? undefined} currency1={currencyB ?? undefined} size={24} /> */}
      </RowBetween>

      <DataRow style={{ gap: '24px' }}>
        <PoolData>
          <AutoColumn gap="sm">
            <TYPE.body style={{ margin: 0 }}>Earned SUSHIs</TYPE.body>
            <TYPE.body fontSize={24} fontWeight={500}>
              { parsedEarnedToken }
            </TYPE.body>
          </AutoColumn>
        </PoolData>
        <PoolData>
          <AutoColumn gap="sm">
            <TYPE.body style={{ margin: 0 }}>Pool Rate</TYPE.body>
            {/* <TYPE.body fontSize={24} fontWeight={500}>
              {stakingInfo?.active
                ? stakingInfo?.totalRewardRate
                    ?.multiply(BIG_INT_SECONDS_IN_WEEK)
                    ?.toFixed(0, { groupSeparator: ',' }) ?? '-'
                : '0'}
              {' UNI / week'}
            </TYPE.body> */}
          </AutoColumn>
        </PoolData>
      </DataRow>

      {/* {showAddLiquidityButton && (
        <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Step 1. Get UNI-V2 Liquidity tokens</TYPE.white>
              </RowBetween>
              <RowBetween style={{ marginBottom: '1rem' }}>
                <TYPE.white fontSize={14}>
                  {`UNI-V2 LP tokens are required. Once you've added liquidity to the ${currencyA?.symbol}-${currencyB?.symbol} pool you can stake your liquidity tokens on this page.`}
                </TYPE.white>
              </RowBetween>
              <ButtonPrimary
                padding="8px"
                borderRadius="8px"
                width={'fit-content'}
                as={Link}
                to={`/add/${currencyA && currencyId(currencyA)}/${currencyB && currencyId(currencyB)}`}
              >
                {`Add ${currencyA?.symbol}-${currencyB?.symbol} liquidity`}
              </ButtonPrimary>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </VoteCard>
      )} */}

      <>
        <StakingModal isOpen={showStakingModal} pid={pid} onDismiss={() => setShowStakingModal(false)} />
        <UnstakingModal isOpen={showUnstakingModal} pid={pid} onDismiss={() => setShowUnstakingModal(false)} />
        {/* <ClaimRewardModal
          isOpen={showClaimRewardModal}
          pid={pid}
          onDismiss={() => setShowClaimRewardModal(false)}
        /> */}
      </>

      <PositionInfo gap="lg" justify="center" dim={showAddLiquidityButton}>
        <BottomSection gap="lg" justify="center">
          <StyledDataCard disabled={disableTop} bgColor={backgroundColor} showBackground={!showAddLiquidityButton}>
            <CardSection>
              <CardBGImage desaturate />
              <CardNoise />
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white fontWeight={600}>Your liquidity deposits</TYPE.white>
                </RowBetween>
                <RowBetween style={{ alignItems: 'baseline' }}>
                  <TYPE.white fontSize={36} fontWeight={600}>
                    {parsedStakedAmount}
                  </TYPE.white>
                  <TYPE.white>{poolName}</TYPE.white>
                </RowBetween>
              </AutoColumn>
            </CardSection>
          </StyledDataCard>
          <StyledBottomCard dim={stakingInfo?.stakedAmount?.equalTo(JSBI.BigInt(0))}>
            <CardBGImage desaturate />
            <CardNoise />
            <AutoColumn gap="sm">
              <RowBetween>
                <div>
                  <TYPE.black>Your unclaimed UNI</TYPE.black>
                </div>
                {/* {stakingInfo?.earnedAmount && JSBI.notEqual(BIG_INT_ZERO, stakingInfo?.earnedAmount?.raw) && ( */}
                {true && (
                  <ButtonEmpty
                    padding="8px"
                    borderRadius="8px"
                    width="fit-content"
                    // onClick={() => setShowClaimRewardModal(true)}
                    onClick={() => masterChef.withdraw(pid, BigNumber.from(0))}
                  >
                    Claim
                  </ButtonEmpty>
                )}
              </RowBetween>
              <RowBetween style={{ alignItems: 'baseline' }}>
                <TYPE.largeHeader fontSize={36} fontWeight={600}>
                  {/* <CountUp
                    key={countUpAmount}
                    isCounting
                    decimalPlaces={4}
                    start={parseFloat(countUpAmountPrevious)}
                    end={parseFloat(countUpAmount)}
                    thousandsSeparator={','}
                    duration={1}
                  /> */}
                </TYPE.largeHeader>
                <TYPE.black fontSize={16} fontWeight={500}>
                  <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                    ⚡
                  </span>
                  { parsedPendingSushiAmount } {" "}
                  {rewardToken.symbol}
                </TYPE.black>
              </RowBetween>
            </AutoColumn>
          </StyledBottomCard>
        </BottomSection>
        <TYPE.main style={{ textAlign: 'center' }} fontSize={14}>
          <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>
            ⭐️
          </span>
          When you withdraw, the contract will automagically claim UNI on your behalf!
        </TYPE.main>

        {!showAddLiquidityButton && (
          <DataRow style={{ marginBottom: '1rem' }}>
            {/* {stakingInfo && stakingInfo.active && ( */}
            {true && (
              <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={() => setShowStakingModal(true)}>
                Deposit
              </ButtonPrimary>
            )}

            {/* {stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0)) && ( */}
            {true && (
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
        {/* {!userLiquidityUnstaked ? null : userLiquidityUnstaked.equalTo('0') ? null : !stakingInfo?.active ? null : (
          <TYPE.main>{userLiquidityUnstaked.toSignificant(6)} UNI-V2 LP tokens available</TYPE.main>
        )} */}
      </PositionInfo>
    </PageWrapper>
  )
}
