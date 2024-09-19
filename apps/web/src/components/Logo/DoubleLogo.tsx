import { Currency } from '@uniswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { useCurrencyInfo } from 'hooks/Tokens'
import styled, { css } from 'lib/styled-components'
import { memo, useState } from 'react'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { useLogolessColorScheme } from 'ui/src'
import { InterfaceChainId, UniverseChainId } from 'uniswap/src/types/chains'

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

function LogolessPlaceholder({ currency, size }: { currency?: Currency; size: string }) {
  const isDarkMode = useIsDarkMode()
  const logolessColorScheme = useLogolessColorScheme(currency?.name ?? currency?.symbol ?? '')
  const { foreground, background } = isDarkMode ? logolessColorScheme.dark : logolessColorScheme.light

  return (
    <MissingImageLogo $size={size} $textColor={foreground} $backgroundColor={background}>
      {currency?.symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
    </MissingImageLogo>
  )
}

export const DoubleCurrencyLogo = memo(function DoubleCurrencyLogo({
  currencies,
  size = 32,
}: {
  currencies: Array<Currency | undefined>
  size?: number
}) {
  const currencyInfos = [useCurrencyInfo(currencies?.[0]), useCurrencyInfo(currencies?.[1])]
  const [error0, setError0] = useState(false)
  const [error1, setError1] = useState(false)
  const invalidCurrencyLogo0 = error0 || !currencyInfos[0]?.logoUrl
  const invalidCurrencyLogo1 = error1 || !currencyInfos[1]?.logoUrl

  if (invalidCurrencyLogo0 && invalidCurrencyLogo1) {
    return <LogolessPlaceholder currency={currencies?.[0]} size={size + 'px'} />
  }
  if (invalidCurrencyLogo0 && currencyInfos[1]?.logoUrl && !error1) {
    return (
      <SingleLogoContainer size={size}>
        <CircleLogoImage onError={() => setError1(true)} src={currencyInfos[1].logoUrl} size={size} />
      </SingleLogoContainer>
    )
  }
  if (invalidCurrencyLogo1 && currencyInfos[0]?.logoUrl && !error0) {
    return (
      <SingleLogoContainer size={size}>
        {' '}
        <CircleLogoImage src={currencyInfos[0].logoUrl} size={size} onError={() => setError0(true)} />
      </SingleLogoContainer>
    )
  }
  return (
    <DoubleLogo logo1={currencyInfos[0]?.logoUrl as string} logo2={currencyInfos[1]?.logoUrl as string} size={size} />
  )
})

const logoContainerCss = css`
  display: flex;
  gap: 2px;
  position: relative;
  top: 0;
  left: 0;
`

export const SingleLogoContainer = styled.div<{ size: number }>`
  ${logoContainerCss}
  img {
    width: ${({ size }) => size}px;
    height: ${({ size }) => size}px;
    border-radius: 50%;
  }
`

const DoubleLogoContainer = styled.div<{ size: number }>`
  ${logoContainerCss}
  img {
    width: ${({ size }) => size / 2}px;
    height: ${({ size }) => size}px;
    object-fit: cover;
  }
  img:first-child {
    border-radius: ${({ size }) => `${size / 2}px 0 0 ${size / 2}px`};
    object-position: 0 0;
  }
  img:last-child {
    border-radius: ${({ size }) => `0 ${size / 2}px ${size / 2}px 0`};
    object-position: 100% 0;
  }
`

export const CircleLogoImage = styled.img<{ size: number }>`
  width: ${({ size }) => size / 2}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
`

interface DoubleLogoProps {
  logo1?: string
  logo2?: string
  onError1?: () => void
  onError2?: () => void
  size: number
}

export function DoubleLogo({ logo1, onError1, logo2, onError2, size }: DoubleLogoProps) {
  return (
    <DoubleLogoContainer size={size}>
      <CircleLogoImage src={logo1 ?? blankTokenUrl} onError={onError1} size={size} />
      <CircleLogoImage src={logo2 ?? blankTokenUrl} onError={onError2} size={size} />
    </DoubleLogoContainer>
  )
}

const StyledLogoParentContainer = styled.div`
  position: relative;
  top: 0;
  left: 0;
`

const L2_LOGO_SIZE_FACTOR = 3 / 8

export const L2LogoContainer = styled.div<{ $size: number }>`
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
`

function SquareL2Logo({ chainId, size }: { chainId: InterfaceChainId; size: number }) {
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
