import { TokenAmount } from 'dxswap-sdk'
import React, { useCallback, useState } from 'react'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import { TYPE } from '../../../../../theme'
import CurrencyLogo from '../../../../CurrencyLogo'
import NumericalInput from '../../../../Input/NumericalInput'
import Radio from '../../../../Radio'
import { Card, Divider } from '../styleds'
import border8pxRadius from '../../../../../assets/images/border-8px-radius.png'
import { parseUnits } from 'ethers/lib/utils'

const RelativeContainer = styled.div`
  position: relative;
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

interface RewardAmountProps {
  reward: TokenAmount | null
  unlimitedPool: boolean
  onRewardAmountChange: (newAmount: TokenAmount) => void
  onUnlimitedPoolChange: (newValue: boolean) => void
}

export default function RewardAmount({
  reward,
  unlimitedPool,
  onRewardAmountChange,
  onUnlimitedPoolChange
}: RewardAmountProps) {
  const [amount, setAmount] = useState('')

  const handleLocalUserInput = useCallback(
    rawValue => {
      if (!reward || !reward.token) return
      setAmount(rawValue)
      const parsedAmount = rawValue ? parseUnits(rawValue, reward.token.decimals).toString() : '0'
      onRewardAmountChange(new TokenAmount(reward.token, parsedAmount))
    },
    [onRewardAmountChange, reward]
  )

  const handleLocalRadioChange = useCallback(
    event => {
      onUnlimitedPoolChange(event.target.value === 'unlimited')
    },
    [onUnlimitedPoolChange]
  )

  return (
    <Card>
      <Flex width="100%">
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
        <Flex flex="1" flexDirection="column">
          <Box mb="24px">
            <TYPE.small fontWeight="600" color="text4" letterSpacing="0.08em">
              POOL SIZE
            </TYPE.small>
          </Box>
          <Flex>
            <Box mr="26px">
              <Radio checked={unlimitedPool} label="Unlimited" value="unlimited" onChange={handleLocalRadioChange} />
            </Box>
            <Box>
              <Radio disabled label="Limited" value="limited" onChange={handleLocalRadioChange} />
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  )
}
