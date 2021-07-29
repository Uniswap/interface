import { PricedTokenAmount } from 'dxswap-sdk'
import React from 'react'
import { Box, Flex } from 'rebass'
import { useNativeCurrencyUSDPrice } from '../../../../hooks/useNativeCurrencyUSDPrice'
import { TYPE } from '../../../../theme'
import CurrencyLogo from '../../../CurrencyLogo'

interface TokenAmountDisplayerProps {
  amount: PricedTokenAmount
  fontSize?: string
  alignRight?: boolean
  showUSDValue: boolean
}

function TokenAmountDisplayer({ amount, fontSize = '14px', alignRight, showUSDValue }: TokenAmountDisplayerProps) {
  const { nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()

  return (
    <Flex justifyContent={alignRight ? 'flex-end' : 'flex-start'} alignItems="center">
      <Box mr="4px">
        <TYPE.small fontWeight="500" fontSize={fontSize} color="text3">
          {showUSDValue
            ? `$${amount.nativeCurrencyAmount.multiply(nativeCurrencyUSDPrice).toSignificant(4)}`
            : amount.toSignificant(4)}
        </TYPE.small>
      </Box>
      {!showUSDValue && (
        <Box mr="4px">
          <CurrencyLogo currency={amount.token} size={fontSize} />
        </Box>
      )}
    </Flex>
  )
}

export default TokenAmountDisplayer
