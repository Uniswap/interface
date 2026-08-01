import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useRef, useState } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  FloorPriceSelector,
  type FloorPriceSelectorHandle,
} from '~/pages/Liquidity/CreateAuction/components/FloorPriceSelector'
import type { InputCurrency } from '~/pages/Liquidity/CreateAuction/components/floorPriceSelectorDraft'
import { type FloorPriceInputState, RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { act, fireEvent, render, screen } from '~/test-utils/render'

const auctionToken = new Token(UniverseChainId.Mainnet, `0x${'1'.padStart(40, '0')}`, 18, 'NEW')
/** 1e9 auction tokens (10^27 base wei with 18 decimals). With USDC raise this puts the minimum FDV at $1000. */
const supply1e9 = CurrencyAmount.fromRawAmount(auctionToken, (10n ** 27n).toString())

/**
 * Harness mirroring the create-auction store's `setFloorPrice`: every commit feeds the canonical
 * floor and the input snapshot back into props. The blur-resync bug only reproduces with that
 * round-trip, because the stale draft survives precisely when the committed canonical (clamped)
 * no longer matches the typed text.
 *
 * Starts in FDV + USD mode via a persisted snapshot ($5000 FDV → 0.000005 USDC/token canonical).
 */
function ControlledFloorPriceSelector() {
  const ref = useRef<FloorPriceSelectorHandle>(null)
  const [floorPrice, setFloorPrice] = useState('0.000005')
  const [floorPriceInput, setFloorPriceInput] = useState<FloorPriceInputState | undefined>({
    floorPrice: '0.000005',
    rawValue: '5000',
    denomination: 'fdv',
    inputCurrency: 'usd',
  })
  const [inputCurrency, setInputCurrency] = useState<InputCurrency>('usd')

  return (
    <>
      <button type="button" data-testid="focus-floor-price" onClick={() => ref.current?.focus()} />
      <div data-testid="canonical-floor-price">{floorPrice}</div>
      <FloorPriceSelector
        ref={ref}
        chainId={UniverseChainId.Mainnet}
        floorPrice={floorPrice}
        floorPriceInput={floorPriceInput}
        raiseCurrency={RaiseCurrency.STABLECOIN}
        tokenTotalSupply={supply1e9}
        inputCurrency={inputCurrency}
        usdPriceNum={1}
        onInputCurrencyChange={setInputCurrency}
        onFloorPriceChange={(value, input) => {
          setFloorPrice(value)
          setFloorPriceInput(input && input.rawValue.trim() !== '' ? { ...input, floorPrice: value } : undefined)
        }}
      />
    </>
  )
}

function focusInput(): HTMLInputElement {
  act(() => {
    fireEvent.click(screen.getByTestId('focus-floor-price'))
  })
  return screen.getByRole('textbox') as HTMLInputElement
}

describe('FloorPriceSelector FDV draft commit/blur', () => {
  it('accepts below-minimum FDV keystrokes while typing (no mid-edit clamp)', () => {
    render(<ControlledFloorPriceSelector />)
    const input = focusInput()
    expect(input.value).toBe('5,000')

    act(() => {
      fireEvent.change(input, { target: { value: '3' } })
    })
    // "3" is below the $1000 minimum FDV but is a prefix of valid values — must not be swallowed.
    expect(input.value).toBe('3')

    act(() => {
      fireEvent.change(input, { target: { value: '300' } })
    })
    expect(input.value).toBe('300')
  })

  it('resyncs the displayed value to the clamped canonical on blur (typed 300 → shows 1,000)', () => {
    render(<ControlledFloorPriceSelector />)
    const input = focusInput()

    act(() => {
      fireEvent.change(input, { target: { value: '300' } })
    })
    // Commit (clamp) happens per change; the draft keeps the raw text while focused.
    expect(screen.getByTestId('canonical-floor-price').textContent).toBe('0.000001')
    expect(input.value).toBe('300')

    act(() => {
      fireEvent.blur(input)
    })
    // After blur the displayed draft must match what the committed (clamped) state renders.
    const refocused = focusInput()
    expect(refocused.value).toBe('1,000')
    expect(screen.getByTestId('canonical-floor-price').textContent).toBe('0.000001')
  })

  it('resyncs a sub-granularity USD FDV to the committed canonical on blur (typed 23,222 → shows 23,000)', () => {
    // With USDC raise and 1e9 supply the floor granularity is 1 USDC wei per token, so FDV is only
    // representable in $1000 steps: 23222 commits to the 23000-equivalent canonical (0.000023).
    render(<ControlledFloorPriceSelector />)
    const input = focusInput()

    act(() => {
      fireEvent.change(input, { target: { value: '23222' } })
    })
    // Mid-edit the raw draft is preserved while the canonical already committed truncated.
    expect(input.value).toBe('23,222')
    expect(screen.getByTestId('canonical-floor-price').textContent).toBe('0.000023')

    act(() => {
      fireEvent.blur(input)
    })
    // After blur the displayed value must equal what the committed canonical renders as…
    const refocused = focusInput()
    expect(refocused.value).toBe('23,000')
    // …and the resync itself must not move the canonical.
    expect(screen.getByTestId('canonical-floor-price').textContent).toBe('0.000023')
  })

  it('keeps a representable typed FDV unchanged across blur (24000 sits on the $1000 grid)', () => {
    render(<ControlledFloorPriceSelector />)
    const input = focusInput()

    act(() => {
      fireEvent.change(input, { target: { value: '24000' } })
      fireEvent.blur(input)
    })
    expect(screen.getByTestId('canonical-floor-price').textContent).toBe('0.000024')
    expect(focusInput().value).toBe('24,000')
  })

  it('keeps a valid typed FDV unchanged across blur', () => {
    render(<ControlledFloorPriceSelector />)
    const input = focusInput()

    act(() => {
      fireEvent.change(input, { target: { value: '2000000' } })
      fireEvent.blur(input)
    })
    expect(screen.getByTestId('canonical-floor-price').textContent).toBe('0.002')

    const refocused = focusInput()
    expect(refocused.value).toBe('2,000,000')
  })

  it('allows retyping from the resynced value (refocus + retype after a clamp)', () => {
    render(<ControlledFloorPriceSelector />)
    const input = focusInput()

    act(() => {
      fireEvent.change(input, { target: { value: '300' } })
      fireEvent.blur(input)
    })

    const refocused = focusInput()
    expect(refocused.value).toBe('1,000')

    act(() => {
      fireEvent.change(refocused, { target: { value: '5000000' } })
    })
    expect(refocused.value).toBe('5,000,000')

    act(() => {
      fireEvent.blur(refocused)
    })
    expect(screen.getByTestId('canonical-floor-price').textContent).toBe('0.005')
    expect(focusInput().value).toBe('5,000,000')
  })
})

describe('FloorPriceSelector raise-currency display', () => {
  it('shows the resolved ticker, never the RaiseCurrency slot name', () => {
    const { container } = render(<ControlledFloorPriceSelector />)
    expect(container.textContent).toContain('USDC')
    expect(container.textContent).not.toContain('STABLECOIN')
  })
})
