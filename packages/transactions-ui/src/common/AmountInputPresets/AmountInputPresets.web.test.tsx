// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import {
  AmountInputPresets,
  type AmountInputPresetsAppearance,
} from '@universe/transactions-ui/src/common/AmountInputPresets/AmountInputPresets'
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

function renderChipSlot(appearance: AmountInputPresetsAppearance): string {
  render(
    <AmountInputPresets
      appearance={appearance}
      presets={[{ percentage: 'max', testID: 'max' }]}
      onSelectPreset={vi.fn()}
    />,
  )
  return screen.getByTestId('max').parentElement?.className ?? ''
}

// Web class assertions: the native leg renders through react-native-web without these classes.
describe('AmountInputPresets (web classes)', () => {
  it('grows chips in a preset row', () => {
    expect(renderChipSlot('outlined')).toMatch(/\bgrow\b/)
  })

  it('lets a lone branded Max hug its label', () => {
    expect(renderChipSlot('branded')).not.toMatch(/\bgrow\b/)
  })
})
