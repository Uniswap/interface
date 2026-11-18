// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { SettingsSheet, SettingsSheetPage } from '@universe/transactions-ui/src/common/SettingsSheet/SettingsSheet'
import { beforeAll, describe, expect, it, vi } from 'vitest'

// SettingsSheetPage reads useMedia, which needs matchMedia; jsdom has none.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): Partial<MediaQueryList> => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  })
})

describe('SettingsSheet', () => {
  it('renders its pages', () => {
    render(
      <SettingsSheet>
        <span>page</span>
      </SettingsSheet>,
    )
    expect(screen.getByText('page')).toBeTruthy()
  })
})

describe('SettingsSheetPage', () => {
  it('renders only the content without a title or close handler', () => {
    render(
      <SettingsSheetPage>
        <span>rows</span>
      </SettingsSheetPage>,
    )
    expect(screen.getByText('rows')).toBeTruthy()
    expect(screen.queryByText('common.button.save')).toBeNull()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('renders the title and reports back and save', () => {
    const onPressBack = vi.fn()
    const onClose = vi.fn()
    render(
      <SettingsSheetPage showBackChevron title="Trade options" onClose={onClose} onPressBack={onPressBack}>
        <span>screen</span>
      </SettingsSheetPage>,
    )
    expect(screen.getByText('Trade options')).toBeTruthy()
    fireEvent.click(screen.getByText('common.button.save'))
    expect(onClose).toHaveBeenCalledTimes(1)
    const [back] = screen.getAllByRole('button')
    fireEvent.click(back as HTMLElement)
    expect(onPressBack).toHaveBeenCalledTimes(1)
  })

  it('keeps the hidden back chevron pressable', () => {
    const onPressBack = vi.fn()
    render(
      <SettingsSheetPage title="Max slippage" onPressBack={onPressBack}>
        <span>screen</span>
      </SettingsSheetPage>,
    )
    const [back] = screen.getAllByRole('button')
    fireEvent.click(back as HTMLElement)
    expect(onPressBack).toHaveBeenCalledTimes(1)
  })
})
