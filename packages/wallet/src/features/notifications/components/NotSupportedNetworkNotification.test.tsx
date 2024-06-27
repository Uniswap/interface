import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { renderWithProviders } from 'wallet/src/test/render'
import { NotSupportedNetworkNotification } from './NotSupportedNetworkNotification'

describe(NotSupportedNetworkNotification, () => {
  it('renders without error', () => {
    const tree = renderWithProviders(
      <NotSupportedNetworkNotification
        notification={{ type: AppNotificationType.NotSupportedNetwork }}
      />
    )

    expect(tree).toMatchSnapshot()
  })
})
