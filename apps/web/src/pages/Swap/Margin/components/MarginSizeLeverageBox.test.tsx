import { fireEvent, screen, within } from '@testing-library/react'
import { TestID } from '@universe/test'
import {
  createMarginFormStore,
  type MarginFormStore,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/createMarginFormStore'
import { MarginFormStoreContext } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/MarginFormStoreContext'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { withText } from 'uniswap/src/test/matchers'
import { describe, expect, it } from 'vitest'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginLeverageSection } from '~/pages/Swap/Margin/components/MarginSizeLeverageBox'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket()

function renderBox({
  leverage = 2,
  maxLeverage = 5,
}: { leverage?: number; maxLeverage?: number } = {}): MarginFormStore {
  const store = createMarginFormStore({ initialState: { leverage } })
  const info = { market: MARKET, direction: MarginDirection.LONG, maxLeverage } as unknown as DerivedMarginInfo
  render(
    <MarginFormStoreContext.Provider value={store}>
      <MarginLeverageSection derivedMarginInfo={info} />
    </MarginFormStoreContext.Provider>,
  )
  return store
}

describe(MarginLeverageSection, () => {
  // The readout's AnimatedNumber also renders its value in aria-hidden roll cells; withText matches the
  // copy that is shown and read out.
  it('reads out the leverage with trailing zeros trimmed', () => {
    renderBox({ leverage: 2.5 })
    expect(within(screen.getByTestId(TestID.MarginLeverageReadout)).getByText(withText('2.5x'))).toBeInTheDocument()
  })

  // The cap is the server's: a typed value past it, or a fractional cap's third decimal, would 400 the quote.
  it.each([
    { typed: '9', maxLeverage: 5, expected: 5 },
    { typed: '4.69', maxLeverage: 4.666, expected: 4.66 },
  ])('commits a typed $typed through the cap clamp → $expected', ({ typed, maxLeverage, expected }) => {
    const store = renderBox({ maxLeverage })
    fireEvent.click(screen.getAllByRole('button', { name: 'Leverage' })[0]!)
    const input = screen.getByRole('textbox', { name: 'Leverage' })
    fireEvent.change(input, { target: { value: typed } })
    fireEvent.blur(input)
    expect(store.getState().leverage).toBe(expected)
  })

  it('pulls a leverage above a lowered cap back down to it', () => {
    expect(renderBox({ leverage: 4, maxLeverage: 3 }).getState().leverage).toBe(3)
  })
})
