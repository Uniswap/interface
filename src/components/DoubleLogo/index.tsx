import { Currency } from '@uniswap/sdk-core'
import styled from 'styled-components/macro'

import CurrencyLogo from '../Logo/CurrencyLogo'

const Wrapper = styled.div<{ margin: boolean; sizeraw: number }>`
  position: relative;
  display: flex;
  flex-direction: row;
  margin-left: ${({ sizeraw, margin }) => margin && (sizeraw / 3 + 8).toString() + 'px'};
`

interface DoubleCurrencyLogoProps {
  margin?: boolean
  size?: number
  currency0?: Currency
  currency1?: Currency
}

const HigherLogoWrapper = styled.div`
  z-index: 1;
`
const CoveredLogoWapper = styled.div<{ sizeraw: number }>`
  position: absolute;
  left: ${({ sizeraw }) => '-' + (sizeraw / 2).toString() + 'px'} !important;
`

export default function DoubleCurrencyLogo({
  currency0,
  currency1,
  size = 16,
  margin = false,
}: DoubleCurrencyLogoProps) {
  return (
    <Wrapper sizeraw={size} margin={margin}>
      {currency0 && (
        <HigherLogoWrapper>
          <CurrencyLogo hideL2Icon currency={currency0} size={size.toString() + 'px'} />
        </HigherLogoWrapper>
      )}
      {currency1 && (
        <CoveredLogoWapper sizeraw={size}>
          <CurrencyLogo hideL2Icon currency={currency1} size={size.toString() + 'px'} />
        </CoveredLogoWapper>
      )}
    </Wrapper>
  )
}
