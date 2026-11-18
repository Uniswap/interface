import { fireEvent } from '@testing-library/react-native'
import { EmbeddedWalletOnboardingProperties, Experiments, WALLET_FEATURE_FLAG_NAMES } from '@universe/gating'
import { Accordion } from '@universe/mycelium'
import { GatingOverrides } from 'uniswap/src/components/gating/GatingOverrides'
import { renderWithProviders } from 'uniswap/src/test/render'

const PLACEHOLDER = 'Search flags, experiments, layers'
const [firstFlagName, secondFlagName] = Array.from(WALLET_FEATURE_FLAG_NAMES.values()).sort((a, b) =>
  a.localeCompare(b),
)

function renderAndSearch(query: string): ReturnType<typeof renderWithProviders> {
  const result = renderWithProviders(
    <Accordion collapsible type="single">
      <GatingOverrides />
    </Accordion>,
  )
  fireEvent.changeText(result.getByPlaceholderText(PLACEHOLDER), query)
  return result
}

describe('GatingOverrides search', () => {
  it('keeps the same input mounted while typing so it does not lose focus', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <Accordion collapsible type="single">
        <GatingOverrides />
      </Accordion>,
    )
    const input = getByPlaceholderText(PLACEHOLDER)

    fireEvent.changeText(input, Experiments.SwapConfirmation)
    expect(getByPlaceholderText(PLACEHOLDER)).toBe(input)

    fireEvent.changeText(input, '')
    expect(getByPlaceholderText(PLACEHOLDER)).toBe(input)
  })

  it('shows only the feature flags whose name matches', () => {
    const { getByText, queryByText } = renderAndSearch(firstFlagName ?? '')

    expect(getByText(firstFlagName ?? '')).toBeTruthy()
    expect(queryByText(secondFlagName ?? '')).toBeNull()
  })

  it('returns an experiment by its name', () => {
    const { getByText } = renderAndSearch(Experiments.SwapConfirmation)

    expect(getByText(Experiments.SwapConfirmation)).toBeTruthy()
  })

  it('returns an experiment when the query matches only one of its params', () => {
    const { getByText, queryByText } = renderAndSearch(EmbeddedWalletOnboardingProperties.NewFlowEnabled)

    expect(getByText(Experiments.EmbeddedWalletOnboarding)).toBeTruthy()
    expect(queryByText(Experiments.SwapConfirmation)).toBeNull()
  })

  it('shows an empty state when nothing matches', () => {
    const { getByText } = renderAndSearch('zzz-no-such-flag')

    expect(getByText('No results')).toBeTruthy()
  })
})
