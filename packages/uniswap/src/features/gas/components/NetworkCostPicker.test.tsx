import { fireEvent } from '@testing-library/react-native'
import { NetworkCostPicker } from 'uniswap/src/features/gas/components/NetworkCostPicker'
import { renderWithProviders } from 'uniswap/src/test/render'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => {
      const translations: Record<string, string> = {
        'gas.override.mode.auto': 'Auto',
        'gas.override.mode.custom': 'Custom',
      }
      return translations[key] ?? key
    },
  }),
}))

describe('NetworkCostPicker', () => {
  it('calls onChange(true) when Custom is tapped', () => {
    const onChange = vi.fn()
    const { getByText } = renderWithProviders(<NetworkCostPicker enableCustomGasFeeEntry={false} onChange={onChange} />)
    fireEvent.press(getByText('Custom'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange(false) when Auto is tapped', () => {
    const onChange = vi.fn()
    const { getByText } = renderWithProviders(<NetworkCostPicker enableCustomGasFeeEntry onChange={onChange} />)
    fireEvent.press(getByText('Auto'))
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
