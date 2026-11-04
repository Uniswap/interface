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
import { MarginLeverageSection } from '~/pages/Swap/Margin/components/MarginLeverageSection'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket()

function renderSection({
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

describe('MarginLeverageSection', () => {
  // The readout's AnimatedNumber also renders its value in aria-hidden roll cells, so the container's
  // raw textContent holds it twice; withText matches the copy that is shown and read out.
  it('reads out the committed leverage with trailing zeros trimmed', () => {
    renderSection({ leverage: 2.5 })
    expect(within(screen.getByTestId(TestID.MarginLeverageReadout)).getByText(withText('2.5x'))).toBeInTheDocument()
  })

  it('steps by 0.25 in either direction', () => {
    const store = renderSection()
    fireEvent.click(screen.getByRole('button', { name: 'Increase leverage' }))
    expect(store.getState().leverage).toBe(2.25)
    fireEvent.click(screen.getByRole('button', { name: 'Decrease leverage' }))
    fireEvent.click(screen.getByRole('button', { name: 'Decrease leverage' }))
    expect(store.getState().leverage).toBe(1.75)
  })

  // 1.89 + 0.25 is 2.1399999999999997 and 2.01 - 0.25 is 1.7599999999999998 in floats.
  it.each([
    { from: 1.89, button: 'Increase leverage', expected: 2.14 },
    { from: 2.01, button: 'Decrease leverage', expected: 1.76 },
  ])('steps from $from to $expected without float drift', ({ from, button, expected }) => {
    const store = renderSection({ leverage: from })
    fireEvent.click(screen.getByRole('button', { name: button }))
    expect(store.getState().leverage).toBe(expected)
  })

  // The cap is the server's, known from the markets registry before any quote; stepping past it must
  // not hand the quote a leverage the backend will 400.
  it('clamps a step at the cap and floors a fractional cap to 2 decimals', () => {
    const store = renderSection({ leverage: 4.6, maxLeverage: 4.666 })
    fireEvent.click(screen.getByRole('button', { name: 'Increase leverage' }))
    expect(store.getState().leverage).toBe(4.66)
  })

  it('commits a typed value through the same clamp', () => {
    const store = renderSection()
    fireEvent.click(screen.getByRole('button', { name: 'Leverage' }))
    const input = screen.getByRole('textbox', { name: 'Leverage' })
    fireEvent.change(input, { target: { value: '9' } })
    fireEvent.blur(input)
    expect(store.getState().leverage).toBe(5)
  })

  it('pulls a leverage above a lowered cap back down to it', () => {
    const store = renderSection({ leverage: 4, maxLeverage: 3 })
    expect(store.getState().leverage).toBe(3)
  })

  // The slider writes `leverage` itself; the open quote's debounce is what spares a drag a request per move.
  it('writes an arrow-key step straight to leverage', () => {
    const store = renderSection()
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' })
    expect(store.getState().leverage).toBe(2.1)
    expect(within(screen.getByTestId(TestID.MarginLeverageReadout)).getByText(withText('2.1x'))).toBeInTheDocument()
  })

  it('snaps to a tick label', () => {
    const store = renderSection()
    fireEvent.click(screen.getByText('3x'))
    expect(store.getState().leverage).toBe(3)
  })

  it('snaps to a tick label exactly on a fractional cap', () => {
    const store = renderSection({ maxLeverage: 5.7 })
    fireEvent.click(screen.getByText('4x'))
    expect(store.getState().leverage).toBe(4)
  })
})
