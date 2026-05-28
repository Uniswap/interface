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

    expect(tree.toJSON()).toBeNull()
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

    expect(tree.toJSON()).toMatchInlineSnapshot(`
      <Text>
        Rendered
      </Text>
    `)
  })
})
