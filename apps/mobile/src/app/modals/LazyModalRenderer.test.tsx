import React from 'react'
import { Text } from 'react-native'
import { LazyModalRenderer } from 'src/app/modals/LazyModalRenderer'
import { preloadedMobileState, preloadedModalsState } from 'src/test/fixtures'
import { renderWithProviders } from 'src/test/render'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

describe(LazyModalRenderer, () => {
  it('renders null when modal is not open', () => {
    const tree = renderWithProviders(
      <LazyModalRenderer name={ModalName.FiatOnRampAggregator}>
        <Text>Rendered</Text>
      </LazyModalRenderer>,
      { preloadedState: preloadedMobileState() },
    )

    // under RTL/jsdom toJSON() maps to asFragment(), which is never null; assert empty render
    expect(tree.queryByText('Rendered')).toBeNull()
  })

  it('renders modal when modal is open', () => {
    const tree = renderWithProviders(
      <LazyModalRenderer name={ModalName.FiatOnRampAggregator}>
        <Text>Rendered</Text>
      </LazyModalRenderer>,
      {
        preloadedState: preloadedMobileState({
          modals: preloadedModalsState({
            [ModalName.FiatOnRampAggregator]: { isOpen: true },
          }),
        }),
      },
    )

    expect(tree.getByText('Rendered')).toBeDefined()
  })
})
