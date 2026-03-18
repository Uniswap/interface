import { Flex } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useBackgroundColor } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useBackgroundColor'

interface StyledTokenLogoProps {
  currencyInfo: CurrencyInfo
  size: number
}

export function StyledTokenLogo({ currencyInfo, size }: StyledTokenLogoProps): JSX.Element {
  const backgroundColor = useBackgroundColor()

  return (
    <Flex
      style={{
        borderRadius: size / 2,
        background: backgroundColor,
      }}
    >
      <TokenLogo
        chainId={currencyInfo.currency.chainId}
        name={currencyInfo.currency.name}
        symbol={currencyInfo.currency.symbol}
        url={currencyInfo.logoUrl}
        size={size}
        webFontSize={size / 4}
        lineHeight="unset"
      />
    </Flex>
  )
}
