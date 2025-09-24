import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { NotSupportedNetworkNotification } from 'wallet/src/features/notifications/components/NotSupportedNetworkNotification'
import { renderWithProviders } from 'wallet/src/test/render'

// Use the web implementation of NotificationToast for testing
jest.mock('uniswap/src/components/notifications/NotificationToast', () => {
  return jest.requireActual('uniswap/src/components/notifications/NotificationToast.web')
})

describe(NotSupportedNetworkNotification, () => {
  it('renders without error', () => {
    const tree = renderWithProviders(
      <NotSupportedNetworkNotification notification={{ type: AppNotificationType.NotSupportedNetwork }} />,
    )

    expect(tree).toMatchSnapshot()
  })
})
