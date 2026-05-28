import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { OptionalCurrency } from 'pages/Pool/Positions/create/types'
import { useMemo } from 'react'
import { Flex, Text } from 'ui/src'

export function useTokenControlOptions(currencies: [OptionalCurrency, OptionalCurrency], size: 'small' | 'large') {
  const [token0, token1] = currencies

  const controlOptions = useMemo(() => {
    return [
      {
        value: token0?.symbol ?? '',
        display: (
          <Flex row alignItems="center" gap={size === 'small' ? '$spacing6' : '$gap8'}>
            {token0 && (
              <PortfolioLogo chainId={token0.chainId} currencies={[token0]} size={size === 'small' ? 16 : 20} />
            )}
            <Text variant="buttonLabel3">{token0?.symbol}</Text>
          </Flex>
        ),
      },
      {
        value: token1?.symbol ?? '',
        display: (
          <Flex row alignItems="center" gap={size === 'small' ? '$spacing6' : '$gap8'}>
            {token1 && (
              <PortfolioLogo chainId={token1.chainId} currencies={[token1]} size={size === 'small' ? 16 : 20} />
            )}
            <Text variant="buttonLabel3">{token1?.symbol}</Text>
          </Flex>
        ),
      },
    ]
  }, [token0, token1, size])

  return controlOptions
}
