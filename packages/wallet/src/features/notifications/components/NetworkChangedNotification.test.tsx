import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { NetworkChangedNotification } from 'wallet/src/features/notifications/components/NetworkChangedNotification'
import { renderWithProviders } from 'wallet/src/test/render'

// Mock the account store hooks
vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: vi.fn(() => undefined),
  useActiveAddresses: vi.fn(() => ({
    evmAddress: undefined,
    svmAddress: undefined,
  })),
}))

// Use the web implementation of NotificationToast for testing
vi.mock('uniswap/src/components/notifications/NotificationToast', async () => {
  return await vi.importActual('uniswap/src/components/notifications/NotificationToast.web')
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
    const title = queryByText('notification.swap.network')
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
    const title = queryByText('notification.send.network')
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
    const title = queryByText('notification.network.changed')
    expect(title).toBeTruthy()
  })
})
