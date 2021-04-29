import { PricedTokenAmount } from 'dxswap-sdk'
import React, { useCallback, useState } from 'react'
import { Repeat } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import { useNativeCurrencyUSDPrice } from '../../../../hooks/useNativeCurrencyUSDPrice'
import { TYPE } from '../../../../theme'
import { AutoColumn } from '../../../Column'
import CurrencyLogo from '../../../CurrencyLogo'

const StyledSwitchIcon = styled(Repeat)`
  color: ${props => props.theme.text4};
  cursor: pointer;
`

interface TokenAmountDisplayerProps {
  amount: PricedTokenAmount
  fontSize?: string
  alignRight?: boolean
}

function TokenAmountDisplayer({ amount, fontSize = '14px', alignRight }: TokenAmountDisplayerProps) {
  const { loading, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()

  const [showUSDValue, setShowUSDValue] = useState(false)

  const handleSwitchValueClick = useCallback(() => {
    setShowUSDValue(!showUSDValue)
  }, [showUSDValue])

  return (
    <AutoColumn gap="4px">
      <Flex justifyContent={alignRight ? 'flex-end' : 'flex-start'}>
        <Box mr="4px">
          <TYPE.small fontWeight="500" fontSize={fontSize}>
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
        <Box>
          {loading ? (
            <Skeleton width={fontSize} height={fontSize} />
          ) : (
            <StyledSwitchIcon onClick={handleSwitchValueClick} size={fontSize} />
          )}
        </Box>
      </Flex>
    </AutoColumn>
  )
}

export default TokenAmountDisplayer
