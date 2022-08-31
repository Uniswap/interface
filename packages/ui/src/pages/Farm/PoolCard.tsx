import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import { TYPE, StyledInternalLink } from '../../theme'
// import { ETHER, JSBI, TokenAmount } from '@teleswap/sdk'
// import { StakingInfo } from '../../state/stake/hooks'
import { useColor } from '../../hooks/useColor'
// import { currencyId } from '../../utils/currencyId'
// import { unwrappedToken } from '../../utils/wrappedCurrency'
// import { useTotalSupply } from '../../data/TotalSupply'
// import { usePair } from '../../data/Reserves'
// import useUSDCPrice from '../../utils/useUSDCPrice'
// import { BIG_INT_SECONDS_IN_WEEK } from '../../constants'
import { AutoColumn } from 'components/Column'
import { ButtonPrimary } from 'components/Button'
// import DoubleCurrencyLogo from 'components/DoubleLogo'
// import { Break } from 'components/earn/styled'
// import { RowBetween } from 'components/Row'
import StakingModal from 'components/masterchef/StakingModal'
import UnstakingModal from 'components/masterchef/UnstakingModal'
// import { Chef } from 'constants/farm/chef.enum'
import { CHAINID_TO_FARMING_CONFIG } from 'constants/farming.config'
import { useActiveWeb3React } from 'hooks'
import { useChefPositions } from 'hooks/farm/useChefPositions'
import { useChefContract } from 'hooks/farm/useChefContract'
import { CurrencyAmount, Token } from '@teleswap/sdk'
import { BigNumber } from 'ethers'
import { UNI, ZERO_ADDRESS } from 'constants/index'
import { Chef } from 'constants/farm/chef.enum'
import useMasterChef from 'hooks/farm/useMasterChef'
// import { Token } from '@teleswap/sdk'
// import { useMasterChefPoolInfo } from 'hooks/farm/useMasterChefPoolInfo'

const StatContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  display: none;
`};
`

const Wrapper = styled(AutoColumn)<{ showBackground: boolean; bgColor: any }>`
  border-radius: 12px;
  width: 100%;
  overflow: hidden;
  position: relative;
  opacity: ${({ showBackground }) => (showBackground ? '1' : '1')};
  color: ${({ theme, showBackground }) => (showBackground ? theme.white : theme.text1)} !important;
`

const TopSection = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 48px 1fr 96px;
  `};
`

// const BottomSection = styled.div<{ showBackground: boolean }>`
//   padding: 12px 16px;
//   opacity: ${({ showBackground }) => (showBackground ? '1' : '0.4')};
//   border-radius: 0 0 12px 12px;
//   display: flex;
//   flex-direction: row;
//   align-items: baseline;
//   justify-content: space-between;
//   z-index: 1;
// `

const StakingColumn = styled.div`
  max-width: 288px;
  width: 100%;
`

export default function PoolCard({ pid }: { pid: number }) {
  const { chainId } = useActiveWeb3React()
  const farmingConfig = CHAINID_TO_FARMING_CONFIG[chainId || 420]
  const mchefContract = useChefContract(farmingConfig?.chefType || Chef.MINICHEF)
  const masterChef = useMasterChef(Chef.MINICHEF)
  const positions = useChefPositions(mchefContract, undefined, chainId)
  // const poolInfos = useMasterChefPoolInfo(farmingConfig?.chefType || Chef.MINICHEF)
  // const token0 = stakingInfo.tokens[0]
  // const token1 = stakingInfo.tokens[1]

  // const currency0 = unwrappedToken(new Token(chainId || 420, farmingConfig?.pools[pid].stakingAsset.backedAsset?.[0] || '', 18))
  // const currency1 = unwrappedToken(new Token(chainId || 420, farmingConfig?.pools[pid].stakingAsset.backedAsset?.[1] || '', 18))

  // const isStaking = Boolean(stakingInfo.stakedAmount.greaterThan('0'))

  // // get the color of the token
  // const token = currency0 === ETHER ? token1 : token0
  // const WETH = currency0 === ETHER ? token0 : token1
  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const backgroundColor = useColor()

  // const totalSupplyOfStakingToken = useTotalSupply(stakingInfo.stakedAmount.token)
  // const [, stakingTokenPair] = usePair(...stakingInfo.tokens)

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

  const isStaking = true
  const rewardToken = UNI[chainId || 420]

  const parsedStakedAmount = useMemo(() => {
    try {
      if (positions && positions[pid] && positions[pid].amount) {
        const bi = (positions[pid].amount as BigNumber).toBigInt()
        return CurrencyAmount.fromRawAmount(new Token(chainId || 420, ZERO_ADDRESS, 18), bi)?.toSignificant(6)
      }
    } catch (error) {
      console.error('parsedStakedAmount::error', error)
    }
    return '--.--'
  }, [chainId, positions, pid])

  const parsedPendingSushiAmount = useMemo(() => {
    try {
      if (positions && positions[pid] && positions[pid].pendingSushi) {
        const bi = (positions[pid].pendingSushi as BigNumber).toBigInt()
        console.debug('parsedPendingSushiAmount::bi', bi)
        return CurrencyAmount.fromRawAmount(rewardToken, bi).toFixed(6)
      }
    } catch (error) {
      console.error('parsedPendingSushiAmount::error', error)
    }
    return '--.--'
  }, [rewardToken, positions, pid])

  return (
    <Wrapper showBackground={isStaking} bgColor={backgroundColor}>
      <TopSection>
        {/* <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} /> */}
        <TYPE.white fontWeight={600} fontSize={18} style={{ marginLeft: '8px' }}>
          {farmingConfig?.pools[pid].stakingAsset.name}
        </TYPE.white>

        {farmingConfig?.pools[pid].stakingAsset.isLpToken && (
          <TYPE.green01 marginLeft={32} fontSize={14}>
            Get {farmingConfig?.pools[pid].stakingAsset.name}
          </TYPE.green01>
        )}
      </TopSection>

      <StatContainer>
        <StakingColumn>
          <TYPE.gray fontSize={12}>Staked LP</TYPE.gray>
          <TYPE.white fontSize={16}>{parsedStakedAmount}</TYPE.white>
          <ButtonPrimary
            height={28}
            width="auto"
            fontSize={12}
            padding="5px 12px"
            onClick={() => setShowStakingModal(true)}
          >
            Stake
          </ButtonPrimary>
          <ButtonPrimary
            height={28}
            width="auto"
            fontSize={12}
            padding="5px 12px"
            onClick={() => setShowUnstakingModal(true)}
          >
            Withdraw
          </ButtonPrimary>
        </StakingColumn>
        <StakingColumn>
          <TYPE.gray fontSize={12}>Earned Rewards</TYPE.gray>
          <TYPE.white fontSize={16}>
            {parsedPendingSushiAmount} {rewardToken.symbol}
          </TYPE.white>
          <ButtonPrimary
            height={28}
            width="auto"
            fontSize={12}
            padding="5px 12px"
            onClick={() => masterChef.harvest(pid)}
          >
            Claim
          </ButtonPrimary>
        </StakingColumn>
        <StakingColumn>
          <TYPE.gray fontSize={12}>APR</TYPE.gray>
          <TYPE.white fontSize={16}>19.810%</TYPE.white>
        </StakingColumn>
        <StakingColumn>
          <TYPE.gray fontSize={12}>Liquidity</TYPE.gray>
          <TYPE.white fontSize={16}>$1145141919.810</TYPE.white>
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
        <StakingModal isOpen={showStakingModal} pid={pid} onDismiss={() => setShowStakingModal(false)} />
        <UnstakingModal isOpen={showUnstakingModal} pid={pid} onDismiss={() => setShowUnstakingModal(false)} />
        {/* <ClaimRewardModal
          isOpen={showClaimRewardModal}
          pid={pid}
          onDismiss={() => setShowClaimRewardModal(false)}
        /> */}
      </>
    </Wrapper>
  )
}
