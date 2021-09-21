import { PricedTokenAmount } from '@swapr/sdk'
import React, { useContext } from 'react'
import { Box, Flex } from 'rebass'
import { useNativeCurrencyUSDPrice } from '../../../../hooks/useNativeCurrencyUSDPrice'
import { TYPE } from '../../../../theme'
import CurrencyLogo from '../../../CurrencyLogo'
import { MouseoverTooltip } from '../../../Tooltip'
import { AutoColumn } from '../../../Column'
import { AutoRow } from '../../../Row'
import { ThemeContext } from 'styled-components'

interface TokenAmountDisplayerProps {
  amount: PricedTokenAmount
  fontSize?: string
  alignRight?: boolean
  showUSDValue: boolean
  className?: string
}

function TokenAmountDisplayer({
  amount,
  fontSize = '14px',
  alignRight,
  showUSDValue,
  className
}: TokenAmountDisplayerProps) {
  const theme = useContext(ThemeContext)
  const { nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()
  const tooltipIcons = (token: any) => {
    return (
      <AutoRow>
        <CurrencyLogo currency={token} size={'22px'} />
        <AutoColumn style={{ marginLeft: '4px' }}>
          <TYPE.white>{token.symbol}</TYPE.white>
          <TYPE.body fontWeight={600} fontSize={9}>
            {token.name}
          </TYPE.body>
        </AutoColumn>
      </AutoRow>
    )
  }

  return (
    <Flex justifyContent={alignRight ? 'flex-end' : 'flex-start'} alignItems="center" className={className}>
      <Box mr="4px">
        <MouseoverTooltip
          styled={{ border: 'none', borderRadius: '4px', backgroundColor: theme.bg3 }}
          content={tooltipIcons(amount.token)}
        >
          <TYPE.small fontWeight="500" fontSize={fontSize} color="text3">
            {showUSDValue
              ? `$${amount.nativeCurrencyAmount.multiply(nativeCurrencyUSDPrice).toSignificant(4)}`
              : amount.toSignificant(4)}
          </TYPE.small>
        </MouseoverTooltip>
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
