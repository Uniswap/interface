import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { Box } from 'src/components/layout'
import { ChainId } from 'src/constants/chains'
import { DefaultNotification, WCNotification } from 'src/features/notifications/Notifications'
import { NotificationToast } from 'src/features/notifications/NotificationToast'
import { AppNotificationType } from 'src/features/notifications/types'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'

export default {
  title: 'Notifications/NotificationToasts',
  component: WCNotification,
  decorators: [
    (Story) => (
      <Box bg="mainBackground" p="md" width={300}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof WCNotification>

export const WallectConnectNotification: ComponentStory<typeof WCNotification> = () => {
  return (
    <WCNotification
      notification={{
        type: AppNotificationType.WalletConnect,
        address: '0x000000',
        event: WalletConnectEvent.Connected,
        dappName: 'Uniswap',
        imageUrl: 'https://app.uniswap.org/images/192x192_App_Icon.png',
        chainId: ChainId.Mainnet.toString(),
      }}
    />
  )
}

export const BaseAppNotification: ComponentStory<typeof DefaultNotification> = () => {
  return <NotificationToast title={'This is a text notification'} />
}
