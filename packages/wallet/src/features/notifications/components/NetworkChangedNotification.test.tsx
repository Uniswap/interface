import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { NetworkChangedNotification } from 'wallet/src/features/notifications/components/NetworkChangedNotification'
import { renderWithProviders } from 'wallet/src/test/render'

// Use the web implementation of NotificationToast for testing
jest.mock('uniswap/src/components/notifications/NotificationToast', () => {
  return jest.requireActual('uniswap/src/components/notifications/NotificationToast.web')
})

describe(NetworkChangedNotification, () => {
  it('renders with swap flow', () => {
    const { queryByText } = renderWithProviders(
      <NetworkChangedNotification
        notification={{
          type: AppNotificationType.NetworkChanged,
          chainId: UniverseChainId.Mainnet,
          flow: 'swap',
        }}
      />,
    )
    const title = queryByText('Swapping on Ethereum')
    expect(title).toBeTruthy()
  })

  it('renders with send flow', () => {
    const { queryByText } = renderWithProviders(
      <NetworkChangedNotification
        notification={{
          type: AppNotificationType.NetworkChanged,
          chainId: UniverseChainId.Mainnet,
          flow: 'send',
        }}
      />,
    )
    const title = queryByText('Sending on Ethereum')
    expect(title).toBeTruthy()
  })

  it('renders withoout flow', () => {
    const { queryByText } = renderWithProviders(
      <NetworkChangedNotification
        notification={{
          type: AppNotificationType.NetworkChanged,
          chainId: UniverseChainId.Mainnet,
        }}
      />,
    )
    const title = queryByText('Switched to Ethereum')
    expect(title).toBeTruthy()
  })
})
