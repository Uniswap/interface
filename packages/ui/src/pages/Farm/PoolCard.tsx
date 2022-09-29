import { Token, TokenAmount } from '@teleswap/sdk'
import { ReactComponent as AddIcon } from 'assets/svg/action/add.svg'
import { ReactComponent as RemoveIcon } from 'assets/svg/minus.svg'
import { ButtonPrimary } from 'components/Button'
// import { BIG_INT_SECONDS_IN_WEEK } from '../../constants'
// import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import ClaimRewardModal from 'components/masterchef/ClaimRewardModal'
// import { Break } from 'components/earn/styled'
// import { RowBetween } from 'components/Row'
import StakingModal from 'components/masterchef/StakingModal'
import UnstakingModal from 'components/masterchef/UnstakingModal'
// import { Chef } from 'constants/farm/chef.enum'
// import { Chef } from 'constants/farm/chef.enum'
import { CHAINID_TO_FARMING_CONFIG, LiquidityAsset } from 'constants/farming.config'
import { UNI } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useChefContractForCurrentChain } from 'hooks/farm/useChefContract'
// import { useChefContract } from 'hooks/farm/useChefContract'
// import { useChefPositions } from 'hooks/farm/useChefPositions'
import { ChefStakingInfo } from 'hooks/farm/useChefStakingInfo'
import { useChefPoolAPR } from 'hooks/farm/useFarmAPR'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { usePairSidesValueEstimate, usePairUSDValue } from 'hooks/usePairValue'
import React, { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'
import useUSDCPrice from 'utils/useUSDCPrice'

// import { currencyId } from '../../utils/currencyId'
// import { unwrappedToken } from '../../utils/wrappedCurrency'
import { useTotalSupply } from '../../data/TotalSupply'
// import { StakingInfo } from '../../state/stake/hooks'
import { useColor } from '../../hooks/useColor'
import { TYPE } from '../../theme'
// import { Token } from '@teleswap/sdk'
// import { useMasterChefPoolInfo } from 'hooks/farm/useMasterChefPoolInfo'

const StatContainer = styled.div`
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.4rem;
};
`

const Wrapper = styled.div<{ showBackground: boolean; bgColor: any }>`
  // border-radius: 0.4rem;
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  align-items: center;
  // overflow: hidden;
  // position: relative;
  // opacity: ${({ showBackground }) => (showBackground ? '1' : '1')};
  color: ${({ theme, showBackground }) => (showBackground ? theme.white : theme.text1)} !important;

  :not(:last-child) {
    padding-bottom: 1rem;
    &:after {
      content: '';
      background-color: rgba(255, 255, 255, 0.2);
      height: 1px;
      width: 100%;
      position: relative;
      bottom: 0;
      left: 0;

      margin-top: 1rem;
    }
  }
  // :not(:last-child):after {
  //   content: '';
  //   background-color: rgba(255, 255, 255, 0.2);
  //   height: 1px;
  //   width: 100%;
  //   position: relative;
  //   bottom: 0;
  //   left: 0;

  //   margin-top: 1rem;
  // }
`

const TopSection = styled.div`
  display: flex;
  align-items: center;
  // ${({ theme }) => theme.mediaWidth.upToSmall`
  //   grid-template-columns: 48px 1fr 96px;
  // `};
`

const StakingColumn = styled.div<{ isHide?: boolean }>`
  max-width: 14rem;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  display: ${({ isHide }) => (isHide ? 'none' : 'block')};
  .stakingColTitle {
    margin-bottom: 0.46rem;
  }
  .actions {
    margin-left: 0.8rem;

    svg.button {
      cursor: pointer;
    }
  }
  .estimated-staked-lp-value {
    font-family: 'Poppins';
    font-size: 0.4rem;
    margin-top: 0.33rem;
    width: 100%;
    color: rgba(255, 255, 255, 0.8);
  }
`

const StakingColumnTitle = ({ children }: { children: React.ReactNode }) => (
  <TYPE.gray fontSize={12} width="100%" className="stakingColTitle">
    {children}
  </TYPE.gray>
)

export default function PoolCard({ pid, stakingInfo }: { pid: number; stakingInfo: ChefStakingInfo }) {
  const { chainId } = useActiveWeb3React()
  const farmingConfig = CHAINID_TO_FARMING_CONFIG[chainId || 420]
  const mchefContract = useChefContractForCurrentChain()
  // const masterChef = useMasterChef(Chef.MINICHEF)
  // const positions = useChefPositions(mchefContract, undefined, chainId)
  const history = useHistory()
  // const poolInfos = useMasterChefPoolInfo(farmingConfig?.chefType || Chef.MINICHEF)
  // const token0 = stakingInfo.tokens[0]
  // const token1 = stakingInfo.tokens[1]

  const currency0: Token | undefined = (stakingInfo.stakingAsset as LiquidityAsset).tokenA
  const currency1: Token | undefined = (stakingInfo.stakingAsset as LiquidityAsset).tokenB

  // const isStaking = Boolean(stakingInfo.stakedAmount.greaterThan('0'))

  // // get the color of the token
  // const token = currency0 === ETHER ? token1 : token0
  // const WETH = currency0 === ETHER ? token0 : token1
  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)
  const backgroundColor = useColor()

  const totalSupplyOfStakingToken = useTotalSupply(stakingInfo.stakingToken)
  const [, stakingTokenPair] = stakingInfo.stakingPair
  // const [, stakingTokenPair] = usePair(currency0, currency1, (stakingInfo.stakingAsset as LiquidityAsset).isStable)

  useEffect(() => {
    console.debug('PoolCard data:', {
      pid,
      stakingTokenPair,
      totalSupplyOfStakingToken
    })
  }, [pid, stakingTokenPair, totalSupplyOfStakingToken])

  // // let returnOverMonth: Percent = new Percent('0')
  // let valueOfTotalStakedAmountInWETH: TokenAmount | undefined
  // if (totalSupplyOfStakingToken && stakingTokenPair) {
  //   // take the total amount of LP tokens staked, multiply by ETH value of all LP tokens, divide by all LP tokens
  //   valueOfTotalStakedAmountInWETH = new TokenAmount(
  //     WETH,
  //     JSBI.divide(
  //       JSBI.multiply(
  //         JSBI.multiply(stakingInfo.totalStakedAmount.raw, stakingTokenPair.reserveOf(WETH).raw),
  //         JSBI.BigInt(2) // this is b/c the value of LP shares are ~double the value of the WETH they entitle owner to
  //       ),
  //       totalSupplyOfStakingToken.raw
  //     )
  //   )
  // }

  // // get the USD value of staked WETH
  // const USDPrice = useUSDCPrice(WETH)
  // const valueOfTotalStakedAmountInUSDC =
  //   valueOfTotalStakedAmountInWETH && USDPrice?.quote(valueOfTotalStakedAmountInWETH)
  // console.debug('valueOfTotalStakedAmountInUSDC', valueOfTotalStakedAmountInUSDC)

  const isStaking = true
  const rewardToken = UNI[chainId || 420]
  const priceOfRewardToken = useUSDCPrice(rewardToken)
  const totalValueLockedInUSD = usePairUSDValue(stakingTokenPair, stakingInfo.tvl)
  const calculatedApr = useChefPoolAPR(stakingInfo, stakingTokenPair, stakingInfo.stakedAmount, priceOfRewardToken)
  const [approval, approve] = useApproveCallback(new TokenAmount(stakingInfo.stakingToken, '1'), mchefContract?.address)
  useEffect(() => {
    console.debug(`approval status for ${stakingInfo.stakingAsset.name} is now: ${approval}`)
  }, [stakingInfo, approval])
  const { liquidityValueOfToken0, liquidityValueOfToken1 } = usePairSidesValueEstimate(
    stakingTokenPair,
    new TokenAmount(stakingInfo.stakingToken, stakingInfo.stakedAmount.raw || '0')
  )
  const poolInfo = farmingConfig?.pools[pid]

  return (
    <Wrapper showBackground={isStaking} bgColor={backgroundColor}>
      <TopSection>
        <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} />
        <TYPE.white fontWeight={600} fontSize={18} style={{ marginLeft: '0.26rem' }}>
          {poolInfo?.stakingAsset.name}
        </TYPE.white>
      </TopSection>
      {poolInfo?.stakingAsset.isLpToken && (
        <TYPE.green01
          marginLeft={isMobile ? 'auto' : 32}
          fontSize={14}
          onClick={() => history.push(`/add/${currency0?.address}/${currency1?.address}`)}
          style={{ cursor: 'pointer' }}
        >
          Get {poolInfo?.stakingAsset.name}
        </TYPE.green01>
      )}
      <StatContainer>
        <StakingColumn isHide={isMobile}>
          <StakingColumnTitle>Staked {poolInfo?.stakingAsset.isLpToken ? 'LP' : 'Token'}</StakingColumnTitle>
          <TYPE.white fontSize={16} marginRight="1.5rem">
            {stakingInfo.stakedAmount.toSignificant(6)}
          </TYPE.white>
          {approval !== ApprovalState.NOT_APPROVED ? (
            <div className="actions">
              <AddIcon className="button" onClick={() => setShowStakingModal(true)} style={{ marginRight: 8 }} />
              <RemoveIcon className="button" onClick={() => setShowUnstakingModal(true)} />
            </div>
          ) : (
            <ButtonPrimary
              height={28}
              width="auto"
              fontSize={12}
              padding="0.166rem 0.4rem"
              borderRadius="0.133rem"
              onClick={approve}
            >
              Approve
            </ButtonPrimary>
          )}
          {stakingInfo.stakingAsset.isLpToken && (
            <div className="estimated-staked-lp-value">
              {liquidityValueOfToken0?.toSignificant(4)} {liquidityValueOfToken0?.token.symbol} +{' '}
              {liquidityValueOfToken1?.toSignificant(4)} {liquidityValueOfToken1?.token.symbol}
            </div>
          )}
        </StakingColumn>
        <StakingColumn isHide={isMobile}>
          <StakingColumnTitle>Earned Rewards</StakingColumnTitle>
          <TYPE.white fontSize={16}>
            {stakingInfo.pendingReward.toSignificant(6)} {rewardToken.symbol}
          </TYPE.white>
          <div className="actions">
            <ButtonPrimary
              height={28}
              width="auto"
              fontSize={12}
              padding="0.166rem 0.4rem"
              borderRadius="0.133rem"
              onClick={() => setShowClaimRewardModal(true)}
            >
              Claim
            </ButtonPrimary>
          </div>
        </StakingColumn>
        <StakingColumn>
          <StakingColumnTitle>APR</StakingColumnTitle>
          <TYPE.white fontSize={16}>
            {calculatedApr && calculatedApr !== Infinity ? calculatedApr.toFixed(2) : '--.--'}%
          </TYPE.white>
        </StakingColumn>
        <StakingColumn>
          <StakingColumnTitle>Liquidity TVL</StakingColumnTitle>
          <TYPE.white fontSize={16}>
            $ {totalValueLockedInUSD ? totalValueLockedInUSD.toSignificant(6) : '--.--'}
          </TYPE.white>
        </StakingColumn>
      </StatContainer>

      {/* {isStaking && (
        <>
          <BottomSection showBackground={true}>
            <TYPE.black color={'white'} fontWeight={500}>
              <span>You earned</span>
            </TYPE.black>

            <TYPE.black style={{ textAlign: 'right' }} color={'white'} fontWeight={500}>
              {stakingInfo
                ? stakingInfo.active
                  ? `${stakingInfo.rewardRate
                      ?.multiply(BIG_INT_SECONDS_IN_WEEK)
                      ?.toSignificant(4, { groupSeparator: ',' })} UNI / week`
                  : '0 UNI / week'
                : '-'}
              810.1919 UNI
            </TYPE.black>
          </BottomSection>
        </>
      )} */}
      <>
        <StakingModal
          stakingInfo={stakingInfo}
          isOpen={showStakingModal}
          pid={pid}
          onDismiss={() => setShowStakingModal(false)}
        />
        <UnstakingModal
          stakingInfo={stakingInfo}
          isOpen={showUnstakingModal}
          pid={pid}
          onDismiss={() => setShowUnstakingModal(false)}
        />
        <ClaimRewardModal
          isOpen={showClaimRewardModal}
          pid={pid}
          stakingInfo={stakingInfo}
          onDismiss={() => setShowClaimRewardModal(false)}
        />
      </>
    </Wrapper>
  )
}
