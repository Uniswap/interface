import { PreloadedState } from '@reduxjs/toolkit'
import React from 'react'
import { Text } from 'react-native'
import { LazyModalRenderer } from 'src/app/modals/utils'
import { RootState } from 'src/app/rootReducer'
import { initialModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { mockWalletPreloadedState } from 'src/test/fixtures'
import { renderWithProviders } from 'src/test/render'

const preloadedState = {
  ...mockWalletPreloadedState,
  modals: initialModalState,
} as unknown as PreloadedState<RootState>

describe(LazyModalRenderer, () => {
  it('renders null when modal is not open', () => {
    const tree = renderWithProviders(
      <LazyModalRenderer name={ModalName.Experiments}>
        <Text>Rendered</Text>
      </LazyModalRenderer>,
      { preloadedState }
    )

    expect(tree.toJSON()).toBeNull()
  })

  it('renders modal when modal is open', () => {
    const state = {
      ...preloadedState,
      modals: {
        ...initialModalState,
        [ModalName.Experiments]: { isOpen: true },
      },
    }

    const tree = renderWithProviders(
      <LazyModalRenderer name={ModalName.Experiments}>
        <Text>Rendered</Text>
      </LazyModalRenderer>,
      { preloadedState: state }
    )

    expect(tree.toJSON()).toMatchInlineSnapshot(`
      <Text>
        Rendered
      </Text>
    `)
  })
})
