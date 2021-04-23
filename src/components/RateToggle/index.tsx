import React from 'react'
import { Currency } from '@uniswap/sdk-core'
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import { useActiveWeb3React } from 'hooks'
import { useTranslation } from 'react-i18next'
import { wrappedCurrency } from 'utils/wrappedCurrency'

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
  const { t } = useTranslation()
  const { chainId } = useActiveWeb3React()

  const tokenA = wrappedCurrency(currencyA, chainId)
  const tokenB = wrappedCurrency(currencyB, chainId)

  const isSorted = tokenA && tokenB && tokenA.sortsBefore(tokenB)

  return tokenA && tokenB ? (
    <ToggleWrapper width="fit-content">
      <ToggleElement isActive={isSorted} fontSize="12px" onClick={handleRateToggle}>
        {isSorted ? currencyA.symbol : currencyB.symbol} {t('rate')}
      </ToggleElement>
      <ToggleElement isActive={!isSorted} fontSize="12px" onClick={handleRateToggle}>
        {isSorted ? currencyB.symbol : currencyA.symbol} {t('rate')}
      </ToggleElement>
    </ToggleWrapper>
  ) : null
}
