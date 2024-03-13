import { PreloadedState } from '@reduxjs/toolkit'
import React from 'react'
import { Text } from 'react-native'
import { LazyModalRenderer } from 'src/app/modals/utils'
import { MobileState } from 'src/app/reducer'
import { initialModalState } from 'src/features/modals/modalSlice'
import { renderWithProviders } from 'src/test/render'
import { ModalName } from 'wallet/src/telemetry/constants'
import { mockWalletPreloadedState } from 'wallet/src/test/mocks'

const preloadedState = {
  ...mockWalletPreloadedState,
  modals: initialModalState,
} as unknown as PreloadedState<MobileState>

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
