import { Currency } from '@kyberswap/ks-sdk-core'
import styled, { CSSProperties } from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import Logo from 'components/Logo'

const Wrapper = styled.div<{ margin: boolean; sizeraw: number }>`
  position: relative;
  display: flex;
  align-items: center;
  flex-direction: row;
  margin-right: ${({ sizeraw, margin }) => margin && ((3 * sizeraw) / 4 + 8).toString() + 'px'};
`

interface DoubleCurrencyLogoProps {
  margin?: boolean
  size?: number
  currency0?: Currency | null
  currency1?: Currency | null
}

const HigherLogo = styled.div`
  z-index: 2;
  display: flex;
  align-items: center;
`
const CoveredLogo = styled.div<{ sizeraw: number }>`
  z-index: 1;
  position: absolute;
  display: flex;
  align-items: center;
  left: ${({ sizeraw }) => ((3 * sizeraw) / 4).toString() + 'px'} !important;
`

export default function DoubleCurrencyLogo({
  currency0,
  currency1,
  size = 16,
  margin = true,
}: DoubleCurrencyLogoProps) {
  return (
    <Wrapper sizeraw={size} margin={margin}>
      {currency0 && (
        <HigherLogo>
          <CurrencyLogo currency={currency0} size={size.toString() + 'px'} />
        </HigherLogo>
      )}
      {currency1 && (
        <CoveredLogo sizeraw={size}>
          <CurrencyLogo currency={currency1} size={size.toString() + 'px'} />
        </CoveredLogo>
      )}
    </Wrapper>
  )
}

export function DoubleCurrencyLogoV2({
  logoUrl1,
  logoUrl2,
  size = 16,
  margin = true,
  style = {},
}: {
  logoUrl1: string
  logoUrl2: string
  size: number
  margin?: boolean
  style?: CSSProperties
}) {
  return (
    <Wrapper sizeraw={size} margin={margin} style={style}>
      {logoUrl1 && (
        <HigherLogo>
          <Logo srcs={[logoUrl1]} style={{ width: size, height: size }} />
        </HigherLogo>
      )}
      {logoUrl2 && (
        <CoveredLogo sizeraw={size}>
          <Logo srcs={[logoUrl2]} style={{ width: size, height: size }} />
        </CoveredLogo>
      )}
    </Wrapper>
  )
}
