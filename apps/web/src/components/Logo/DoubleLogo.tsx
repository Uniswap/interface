import { Currency } from '@uniswap/sdk-core'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { useCurrencyInfo } from 'hooks/Tokens'
import styled from 'lib/styled-components'
import { memo } from 'react'
import { Flex, useColorSchemeFromSeed } from 'ui/src'
import { zIndices } from 'ui/src/theme'
import { STATUS_RATIO } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isMobileApp } from 'utilities/src/platform'

const MissingImageLogo = styled.div<{ $size?: string; $textColor: string; $backgroundColor: string }>`
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
`

function LogolessPlaceholder({ currency, size }: { currency?: Currency; size: number }) {
  const { foreground, background } = useColorSchemeFromSeed(currency?.name ?? currency?.symbol ?? '')

  const chainId = currency?.chainId
  const showNetworkLogo = chainId && chainId !== UniverseChainId.Mainnet
  const networkLogoSize = Math.round(size * STATUS_RATIO)
  const networkLogoBorderWidth = isMobileApp ? 2 : 1.5

  return (
    <MissingImageLogo $size={size + 'px'} $textColor={foreground} $backgroundColor={background}>
      {currency?.symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
      {showNetworkLogo && (
        <Flex bottom={-2} position="absolute" right={-3} zIndex={zIndices.mask}>
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
}: {
  currencies: Array<Currency | undefined>
  size?: number
  customIcon?: React.ReactNode
}) {
  const currencyInfos = [useCurrencyInfo(currencies?.[0]), useCurrencyInfo(currencies?.[1])]
  const invalidCurrencyLogo0 = !currencyInfos[0]?.logoUrl
  const invalidCurrencyLogo1 = !currencyInfos[1]?.logoUrl

  if (invalidCurrencyLogo0 && invalidCurrencyLogo1) {
    return <LogolessPlaceholder currency={currencies?.[0]} size={size} />
  }
  if (invalidCurrencyLogo0 && currencyInfos[1]?.logoUrl) {
    return <TokenLogo url={currencyInfos[1].logoUrl} size={size} chainId={currencyInfos[1]?.currency.chainId} />
  }
  if (invalidCurrencyLogo1 && currencyInfos[0]?.logoUrl) {
    return <TokenLogo url={currencyInfos[0]?.logoUrl} size={size} chainId={currencyInfos[0]?.currency.chainId} />
  }
  return (
    <SplitLogo
      chainId={currencyInfos[0]?.currency.chainId ?? null}
      inputCurrencyInfo={currencyInfos[0]}
      outputCurrencyInfo={currencyInfos[1]}
      customIcon={customIcon}
      size={size}
    />
  )
})

const StyledLogoParentContainer = styled.div`
  position: relative;
  top: 0;
  left: 0;
`

const L2_LOGO_SIZE_FACTOR = 3 / 8

const L2LogoContainer = styled.div<{ $size: number }>`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 2px;
  width: ${({ $size }) => $size * L2_LOGO_SIZE_FACTOR}px;
  height: ${({ $size }) => $size * L2_LOGO_SIZE_FACTOR}px;
  left: 60%;
  position: absolute;
  top: 60%;
  outline: 2px solid ${({ theme }) => theme.surface1};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${zIndices.mask};
`

function SquareL2Logo({ chainId, size }: { chainId: UniverseChainId; size: number }) {
  if (chainId === UniverseChainId.Mainnet) {
    return null
  }

  return (
    <L2LogoContainer $size={size}>
      <ChainLogo chainId={chainId} size={size * L2_LOGO_SIZE_FACTOR} />
    </L2LogoContainer>
  )
}

export function DoubleCurrencyAndChainLogo({
  chainId,
  currencies,
  size = 32,
}: {
  chainId: number
  currencies: Array<Currency | undefined>
  size?: number
}) {
  return (
    <StyledLogoParentContainer>
      <DoubleCurrencyLogo currencies={currencies} size={size} />
      <SquareL2Logo chainId={chainId} size={size} />
    </StyledLogoParentContainer>
  )
}
