// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { AmountInputPresets } from '@universe/transactions-ui/src/common/AmountInputPresets/AmountInputPresets'
import { beforeAll, describe, expect, it, vi } from 'vitest'

beforeAll(() => {
  // useMedia reads matchMedia, which jsdom lacks.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  })
})

describe('AmountInputPresets', () => {
  it('labels percentages and reads both 100 and max as Max', () => {
    render(
      <AmountInputPresets
        presets={[{ percentage: 25 }, { percentage: 100 }, { percentage: 'max' }]}
        onSelectPreset={vi.fn()}
      />,
    )
    expect(screen.getByText('25%')).toBeTruthy()
    expect(screen.getAllByText('swap.button.max')).toHaveLength(2)
  })

  it('reports the pressed percentage', () => {
    const onSelectPreset = vi.fn()
    render(<AmountInputPresets presets={[{ percentage: 25 }, { percentage: 50 }]} onSelectPreset={onSelectPreset} />)
    fireEvent.click(screen.getByText('50%'))
    expect(onSelectPreset).toHaveBeenCalledWith(50)
  })

  it('reports presses on a disabled preset separately', () => {
    const onSelectPreset = vi.fn()
    const onPressDisabledPreset = vi.fn()
    render(
      <AmountInputPresets
        presets={[{ percentage: 'max', disabled: true }]}
        onPressDisabledPreset={onPressDisabledPreset}
        onSelectPreset={onSelectPreset}
      />,
    )
    fireEvent.click(screen.getByText('swap.button.max'))
    expect(onSelectPreset).not.toHaveBeenCalled()
    expect(onPressDisabledPreset).toHaveBeenCalledWith('max')
  })

  it('keeps a disabled preset with an explanation pressable', () => {
    const onPressDisabledPreset = vi.fn()
    render(
      <AmountInputPresets
        presets={[{ percentage: 'max', disabled: true, disabledTooltip: 'Some ETH pays for network costs.' }]}
        onPressDisabledPreset={onPressDisabledPreset}
        onSelectPreset={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText('swap.button.max'))
    expect(onPressDisabledPreset).toHaveBeenCalledWith('max')
  })
})
