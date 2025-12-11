import { Currency } from '@uniswap/sdk-core'
import { deprecatedStyled } from 'lib/styled-components'
import { memo } from 'react'
import { Flex, useColorSchemeFromSeed } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { STATUS_RATIO } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { isMobileApp } from 'utilities/src/platform'

const MissingImageLogo = deprecatedStyled.div<{ $size?: string; $textColor: string; $backgroundColor: string }>`
  --size: ${({ $size }) => $size};
  border-radius: 100px;
  color: ${({ $textColor }) => $textColor};
  background-color: ${({ $backgroundColor }) => $backgroundColor};
  font-size: calc(var(--size) / 3);
  font-weight: 535;
  height: ${({ $size }) => $size ?? '24px'};
  line-height: ${({ $size }) => $size ?? '24px'};
  text-align: center;
  width: ${({ $size }) => $size ?? '24px'};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`

function LogolessPlaceholder({
  currency,
  size,
  includeNetwork = true,
}: {
  currency?: Currency
  size: number
  includeNetwork?: boolean
}) {
  const { foreground, background } = useColorSchemeFromSeed(currency?.name ?? currency?.symbol ?? '')

  const chainId = currency?.chainId
  const showNetworkLogo = includeNetwork && chainId && chainId !== UniverseChainId.Mainnet
  const networkLogoSize = Math.round(size * STATUS_RATIO)
  const networkLogoBorderWidth = isMobileApp ? 2 : 1.5

  return (
    <MissingImageLogo $size={size + 'px'} $textColor={foreground} $backgroundColor={background}>
      {currency?.symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
      {showNetworkLogo && (
        <Flex bottom={-2} position="absolute" right={-3} zIndex={zIndexes.mask}>
          <NetworkLogo borderWidth={networkLogoBorderWidth} chainId={chainId} size={networkLogoSize} />
        </Flex>
      )}
    </MissingImageLogo>
  )
}

export const DoubleCurrencyLogo = memo(function DoubleCurrencyLogo({
  currencies,
  size = 32,
  customIcon,
  includeNetwork = true,
}: {
  currencies: Array<Currency | undefined>
  size?: number
  customIcon?: React.ReactNode
  includeNetwork?: boolean
}) {
  const currencyId0 = currencies[0] ? buildCurrencyId(currencies[0].chainId, currencyAddress(currencies[0])) : undefined
  const currencyId1 = currencies[1] ? buildCurrencyId(currencies[1].chainId, currencyAddress(currencies[1])) : undefined

  const currencyInfos = [useCurrencyInfo(currencyId0), useCurrencyInfo(currencyId1)]
  const invalidCurrencyLogo0 = !currencyInfos[0]?.logoUrl
  const invalidCurrencyLogo1 = !currencyInfos[1]?.logoUrl
  const chainId = includeNetwork ? (currencyInfos[0]?.currency.chainId ?? null) : null

  if (invalidCurrencyLogo0 && invalidCurrencyLogo1) {
    return <LogolessPlaceholder currency={currencies[0]} size={size} includeNetwork={Boolean(chainId)} />
  }
  if (invalidCurrencyLogo0 && currencyInfos[1]?.logoUrl) {
    return <TokenLogo url={currencyInfos[1].logoUrl} size={size} chainId={chainId} />
  }
  if (invalidCurrencyLogo1 && currencyInfos[0]?.logoUrl) {
    return <TokenLogo url={currencyInfos[0]?.logoUrl} size={size} chainId={chainId} />
  }
  return (
    <SplitLogo
      chainId={chainId}
      inputCurrencyInfo={currencyInfos[0]}
      outputCurrencyInfo={currencyInfos[1]}
      customIcon={customIcon}
      size={size}
    />
  )
})
