import { configureStore, createSlice } from '@reduxjs/toolkit'
import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Provider } from 'react-redux'
import { rootReducer } from 'src/app/rootReducer'
import { Box } from 'src/components/layout'
import { ChainId } from 'src/constants/chains'
import { NotificationToastRouter } from 'src/features/notifications/NotificationToastWrapper'
import { AppNotificationType } from 'src/features/notifications/types'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'
import { DynamicThemeProvider } from 'src/styles/DynamicThemeProvider'

const mockAddress = '0x000000'

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { notificationQueue: [{ address: mockAddress }] },
  reducers: {},
})

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    activeAccountAddress: mockAddress,
    accounts: { [mockAddress]: {} },
  },
  reducers: {},
})

const store = configureStore<typeof rootReducer>({
  reducer: {
    notifications: notificationsSlice.reducer,
    wallet: walletSlice.reducer,
  },
})

export default {
  title: 'WIP/Notifications/NotificationToasts',
  component: NotificationToastRouter,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <DynamicThemeProvider>
          <Box width={300}>
            <Story />
          </Box>
        </DynamicThemeProvider>
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
    imageUrl: 'https://app.uniswap.org/images/192x192_App_Icon.png',
    chainId: ChainId.Mainnet,
  },
}

export const DefaultNotification = Template.bind({})
DefaultNotification.args = {
  notification: {
    type: AppNotificationType.Default,
    address: '0x000000',
    title: 'Hello world!',
  },
}
