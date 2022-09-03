import { Currency } from '@uniswap/sdk-core'
import CurrencyLogo from '../CurrencyLogo'
import styled from 'styled-components/macro'

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
  style?:any
}

const HigherLogo = styled(CurrencyLogo)`
  z-index: 2;
  color: ${theme => theme.theme.black} !important;

`
const CoveredLogo = styled(CurrencyLogo)<{ sizeraw: number }>`
  position: absolute;
  left: ${({ sizeraw }) => '-' + (sizeraw / 2).toString() + 'px'} !important;
  color: ${theme => theme.theme.shadow1} !important ;

`

export default function DoubleCurrencyLogo({
  currency0,
  currency1,
  size = 16,
  margin = false,
  style = {}
}: DoubleCurrencyLogoProps) {
  return (
    <Wrapper style={style} sizeraw={size} margin={margin}>
      {currency0 && <HigherLogo currency={currency0} size={size.toString() + 'px'} />}
      {currency1 && <CoveredLogo currency={currency1} size={size.toString() + 'px'} sizeraw={size} />}
    </Wrapper>
  )
}
