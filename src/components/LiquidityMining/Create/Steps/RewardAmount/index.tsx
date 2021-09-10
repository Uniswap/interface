import { Pair, TokenAmount } from '@swapr/sdk'
import React, { useCallback, useEffect, useState } from 'react'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import { TYPE } from '../../../../../theme'
import CurrencyLogo from '../../../../CurrencyLogo'
import NumericalInput from '../../../../Input/NumericalInput'
import Radio from '../../../../Radio'
import { Card, Divider } from '../../../styleds'
import border8pxRadius from '../../../../../assets/images/border-8px-radius.png'
import DoubleCurrencyLogo from '../../../../DoubleLogo'
import { tryParseAmount } from '../../../../../state/swap/hooks'
import { usePrevious } from 'react-use'

const RelativeContainer = styled.div<{ disabled?: boolean }>`
  position: relative;
  transition: opacity 0.3s ease;
  opacity: ${props => (props.disabled ? 0.5 : 1)};
`

const StyledNumericalInput = styled(NumericalInput)`
  border: 8px solid;
  border-radius: 8px;
  border-image: url(${border8pxRadius}) 8;
  width: 100%;
  height: 33px;
  font-weight: 600;
  font-size: 16px;
  line-height: 16px;
  text-transform: uppercase;
  padding-left: 8px;
  padding-right: 8px;
  background-color: ${props => props.theme.dark1};
`

const RewardInputLogo = styled(CurrencyLogo)`
  position: absolute;
  top: 8px;
  right: 16px;
`

const StakablePairInputLogoContainer = styled.div`
  position: absolute;
  top: 8px;
  right: 16px;
`

const FlexContainer = styled(Flex)`
  ${props => props.theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
  `}
`

const PoolSizeContainer = styled(Box)`
  ${props => props.theme.mediaWidth.upToExtraSmall`
    margin-top: 16px !important;
  `}
`

interface RewardAmountProps {
  reward: TokenAmount | null
  unlimitedPool: boolean
  stakablePair: Pair | null
  onRewardAmountChange: (newAmount: TokenAmount) => void
  onUnlimitedPoolChange: (newValue: boolean) => void
  onStakingCapChange: (newValue: TokenAmount | null) => void
}

export default function RewardAmount({
  reward,
  unlimitedPool,
  stakablePair,
  onRewardAmountChange,
  onUnlimitedPoolChange,
  onStakingCapChange
}: RewardAmountProps) {
  const previousReward = usePrevious(reward)
  const [amount, setAmount] = useState('')
  const [stakingCapString, setStakingCapString] = useState('')

  useEffect(() => {
    if (!reward) setAmount('')
  }, [reward])

  useEffect(() => {
    if (unlimitedPool) {
      setStakingCapString('')
      onStakingCapChange(null)
    }
  }, [onStakingCapChange, stakablePair, unlimitedPool])

  useEffect(() => {
    if (reward && reward.token && (!previousReward || !previousReward.token.equals(reward.token))) {
      const parsedAmount = tryParseAmount(amount, reward.token) as TokenAmount | undefined
      onRewardAmountChange(parsedAmount || new TokenAmount(reward.token, '0'))
    }
  }, [onRewardAmountChange, reward, amount, previousReward])

  const handleLocalUserInput = useCallback(
    rawValue => {
      if (!reward || !reward.token) return
      setAmount(rawValue)
      const parsedAmount = tryParseAmount(rawValue, reward.token) as TokenAmount | undefined
      onRewardAmountChange(parsedAmount || new TokenAmount(reward.token, '0'))
    },
    [onRewardAmountChange, reward]
  )

  const handleLocalStakingCapChange = useCallback(
    rawValue => {
      if (!stakablePair || !stakablePair.liquidityToken) return
      setStakingCapString(rawValue)
      const parsedAmount = tryParseAmount(rawValue, stakablePair.liquidityToken) as TokenAmount | undefined
      onStakingCapChange(parsedAmount || new TokenAmount(stakablePair.liquidityToken, '0'))
    },
    [onStakingCapChange, stakablePair]
  )

  const handleLocalRadioChange = useCallback(
    event => {
      onUnlimitedPoolChange(event.target.value === 'unlimited')
    },
    [onUnlimitedPoolChange]
  )

  return (
    <Card>
      <FlexContainer width="100%">
        <Flex flex="1" flexDirection="column">
          <Box mb="16px">
            <TYPE.small fontWeight="600" color="text4" letterSpacing="0.08em">
              TOTAL REWARD
            </TYPE.small>
          </Box>
          <Box>
            <RelativeContainer>
              <StyledNumericalInput value={amount} onUserInput={handleLocalUserInput} />
              <RewardInputLogo size="16px" currency={reward?.token} />
            </RelativeContainer>
          </Box>
        </Flex>
        <Box mx="18px">
          <Divider />
        </Box>
        <PoolSizeContainer flex="1" flexDirection="column">
          <Box mb="24px">
            <TYPE.small fontWeight="600" color="text4" letterSpacing="0.08em">
              POOL SIZE
            </TYPE.small>
          </Box>
          <Flex flexDirection="column">
            <Box mb="16px">
              <Radio checked={unlimitedPool} label="Unlimited" value="unlimited" onChange={handleLocalRadioChange} />
            </Box>
            <Box mb="16px">
              <Radio checked={!unlimitedPool} label="Limited" value="limited" onChange={handleLocalRadioChange} />
            </Box>
            <Box>
              <RelativeContainer disabled={unlimitedPool}>
                <StyledNumericalInput
                  disabled={unlimitedPool}
                  value={stakingCapString}
                  onUserInput={handleLocalStakingCapChange}
                />
                <StakablePairInputLogoContainer>
                  <DoubleCurrencyLogo size={16} currency0={stakablePair?.token0} currency1={stakablePair?.token1} />
                </StakablePairInputLogoContainer>
              </RelativeContainer>
            </Box>
          </Flex>
        </PoolSizeContainer>
      </FlexContainer>
    </Card>
  )
}
