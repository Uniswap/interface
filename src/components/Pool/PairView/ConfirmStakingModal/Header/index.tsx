import { Pair, Percent, TokenAmount } from 'dxswap-sdk'
import React, { useCallback, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import { AutoColumn } from '../../../../Column'
import Slider from '../../../../Slider'
import { Option } from '../../../../Option'
import { ArrowDown } from 'react-feather'
import { parseUnits } from 'ethers/lib/utils'
import DoubleCurrencyLogo from '../../../../DoubleLogo'

interface ConfirmStakeModalHeaderProps {
  stakablePair?: Pair | null
  stakedAmount: TokenAmount | null
  stakableTokenBalance?: TokenAmount
  onStakedAmountChange: (amount: TokenAmount) => void
}

export default function ConfirmStakingModalHeader({
  stakablePair,
  stakedAmount,
  stakableTokenBalance,
  onStakedAmountChange
}: ConfirmStakeModalHeaderProps) {
  const [selectedPercentage, setSelectedPercentage] = useState(0)

  const handlePercentageChange = useCallback(
    percentage => {
      setSelectedPercentage(percentage)
      if (!stakableTokenBalance || !stakablePair) return
      onStakedAmountChange(
        new TokenAmount(
          stakablePair.liquidityToken,
          parseUnits(
            stakableTokenBalance.multiply(new Percent(percentage, '100')).toSignificant(10),
            stakableTokenBalance.token.decimals
          ).toString()
        )
      )
    },
    [onStakedAmountChange, stakablePair, stakableTokenBalance]
  )

  return (
    <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
      <Flex flexDirection="column" alignItems="center">
        <Box mb="20px">
          <Text textAlign="center" fontSize="62px" lineHeight="76px" fontWeight={500} width="100%">
            {selectedPercentage}%
          </Text>
        </Box>
        <Box width="90%" mb="24px">
          <Slider value={selectedPercentage} size={16} onChange={handlePercentageChange} />
        </Box>
        <Flex width="90%" justifyContent="space-around" mb="24px">
          <Box width="20%">
            <Option active={selectedPercentage === 25} onClick={() => handlePercentageChange(25)}>
              25%
            </Option>
          </Box>
          <Box width="20%">
            <Option active={selectedPercentage === 50} onClick={() => handlePercentageChange(50)}>
              50%
            </Option>
          </Box>
          <Box width="20%">
            <Option active={selectedPercentage === 75} onClick={() => handlePercentageChange(75)}>
              75%
            </Option>
          </Box>
          <Box width="20%">
            <Option active={selectedPercentage === 100} onClick={() => handlePercentageChange(100)}>
              MAX
            </Option>
          </Box>
        </Flex>
        <Box mb="16px">
          <ArrowDown size={16} />
        </Box>
        <Flex alignItems="center">
          <Box mr="16px">
            <DoubleCurrencyLogo size={32} currency0={stakablePair?.token0} currency1={stakablePair?.token1} />
          </Box>
          <Box>
            <Text textAlign="center" fontSize="32px" fontWeight={500} width="100%">
              {stakedAmount ? stakedAmount.toSignificant(4) : '0.0'}
            </Text>
          </Box>
        </Flex>
      </Flex>
    </AutoColumn>
  )
}
