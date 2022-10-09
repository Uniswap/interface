import { Currency } from '@teleswap/sdk'
import { Flex } from 'rebass'
import styled from 'styled-components'

import CurrencyLogo from '../CurrencyLogo'

const Wrapper = styled.div<{ margin: boolean; sizeraw?: number }>`
  position: relative;
  display: flex;
  flex-direction: row;
  margin-right: ${({ sizeraw, margin }) => margin && (sizeraw || 0 / 3 + 8).toString() + 'px'};
`

interface DoubleCurrencyLogoProps {
  margin?: boolean
  size?: string | number
  currency0?: Currency
  currency1?: Currency
}

const HigherLogo = styled(CurrencyLogo)`
  z-index: 2;
`
const CoveredLogo = styled(CurrencyLogo)`
  transform: translateX(-50%);
`

export default function DoubleCurrencyLogoHorizontal({
  currency0,
  currency1,
  size = 16,
  margin = false
}: DoubleCurrencyLogoProps) {
  return (
    <Wrapper margin={margin}>
      {currency0 && <HigherLogo currency={currency0} size={typeof size === 'string' ? size : size.toString() + 'px'} />}
      {currency1 && (
        <CoveredLogo
          className="coveredIcon"
          currency={currency1}
          size={typeof size === 'string' ? size : size.toString() + 'px'}
        />
      )}
    </Wrapper>
  )
}

export function DoubleCurrencyLogoVertical({
  currency0,
  currency1,
  size = 16,
  margin = false
}: DoubleCurrencyLogoProps) {
  return (
    <Flex
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        margin: `${({ sizeraw, margin }) => margin && (sizeraw / 3 + 8).toString() + 'px'} 0px`
      }}
    >
      {currency0 && <HigherLogo currency={currency0} size={typeof size === 'string' ? size : size.toString() + 'px'} />}
      {currency1 && (
        <CoveredLogo currency={currency1} size={typeof size === 'string' ? size : size.toString() + 'px'} />
      )}
    </Flex>
  )
}
