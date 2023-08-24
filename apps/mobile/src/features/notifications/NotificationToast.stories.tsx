import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Provider } from 'react-redux'
import { setupStore } from 'src/app/store'
import { Box } from 'src/components/layout'
import { NotificationToastRouter } from 'src/features/notifications/NotificationToastWrapper'
import { config } from 'wallet/src/config'
import { ChainId } from 'wallet/src/constants/chains'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { WalletConnectEvent } from 'wallet/src/features/walletConnect/types'
import { account } from 'wallet/src/test/fixtures'

const store = setupStore({
  wallet: {
    activeAccountAddress: account.address,
    accounts: { [account.address]: account },
    isUnlocked: true,
    settings: {
      swapProtection: SwapProtectionSetting.Auto,
    },
  },
  notifications: {
    notificationQueue: [
      { type: AppNotificationType.Default, title: 'My notification', address: account.address },
    ],
    notificationStatus: {},
    lastTxNotificationUpdate: {},
  },
})

export default {
  title: 'WIP/Notifications/NotificationToasts',
  component: NotificationToastRouter,
  decorators: [
    (Story): JSX.Element => (
      <Provider store={store}>
        <Box width={300}>
          <Story />
        </Box>
      </Provider>
    ),
  ],
} as ComponentMeta<typeof NotificationToastRouter>

const Template: ComponentStory<typeof NotificationToastRouter> = (args) => (
  <NotificationToastRouter {...args} />
)

export const WallectConnectNotification = Template.bind({})
WallectConnectNotification.args = {
  notification: {
    type: AppNotificationType.WalletConnect,
    address: '0x000000',
    event: WalletConnectEvent.Connected,
    dappName: 'Uniswap',
    imageUrl: `${config.uniswapAppUrl}/images/192x192_App_Icon.png`,
    chainId: ChainId.Mainnet,
  },
}
WallectConnectNotification.parameters = {
  chromatic: { delay: 5000 },
}

export const DefaultNotification = Template.bind({})
DefaultNotification.args = {
  notification: {
    type: AppNotificationType.Default,
    address: '0x000000',
    title: 'Hello world!',
  },
}
DefaultNotification.parameters = {
  chromatic: { delay: 5000 },
}
