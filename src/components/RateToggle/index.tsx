import React from 'react'
import { Currency } from '@uniswap/sdk-core'
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import { useActiveWeb3React } from 'hooks'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import Switch from '../../assets/svg/switch.svg'
import { useDarkModeManager } from '../../state/user/hooks'
import styled from 'styled-components'

const StyledSwitchIcon = styled.img<{ darkMode: boolean }>`
  margin: 0 4px;
  opacity: 0.4;
  filter: ${({ darkMode }) => (darkMode ? 'invert(0)' : 'invert(1)')};
`

// the order of displayed base currencies from left to right is always in sort order
// currencyA is treated as the preferred base currency
export default function RateToggle({
  currencyA,
  currencyB,
  handleRateToggle,
}: {
  currencyA: Currency
  currencyB: Currency
  handleRateToggle: () => void
}) {
  const { chainId } = useActiveWeb3React()

  const tokenA = wrappedCurrency(currencyA, chainId)
  const tokenB = wrappedCurrency(currencyB, chainId)

  const isSorted = tokenA && tokenB && tokenA.sortsBefore(tokenB)

  const [darkMode] = useDarkModeManager()

  return tokenA && tokenB ? (
    <div style={{ width: 'fit-content', display: 'flex', alignItems: 'center' }}>
      <ToggleWrapper width="fit-content">
        <ToggleElement isActive={isSorted} fontSize="12px" onClick={handleRateToggle}>
          {isSorted ? currencyA.symbol : currencyB.symbol} {' price'}
        </ToggleElement>
        <StyledSwitchIcon onClick={handleRateToggle} width={'16px'} src={Switch} alt="logo" darkMode={darkMode} />

        <ToggleElement isActive={!isSorted} fontSize="12px" onClick={handleRateToggle}>
          {isSorted ? currencyB.symbol : currencyA.symbol}
          {' price'}
        </ToggleElement>
      </ToggleWrapper>
    </div>
  ) : null
}
