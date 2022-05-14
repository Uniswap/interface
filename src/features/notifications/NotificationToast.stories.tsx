import { ComponentMeta, ComponentStory } from '@storybook/react'
import React from 'react'
import { i18n } from 'src/app/i18n'
import { Box } from 'src/components/layout'
import { ChainId } from 'src/constants/chains'
import { NotificationToast } from 'src/features/notifications/NotificationToast'
import { AppNotification, AppNotificationType } from 'src/features/notifications/types'

export default {
  title: 'Notifications/NotificationToast',
  component: NotificationToast,
  decorators: [
    (Story) => (
      <Box bg="deprecated_gray50" p="md" width={300}>
        <Story />
      </Box>
    ),
  ],
} as ComponentMeta<typeof NotificationToast>

export const WalletConnectNotification: ComponentStory<typeof NotificationToast> = () => {
  const wcNotification: AppNotification = {
    type: AppNotificationType.WalletConnect,
    title: i18n.t('Connected to {{dappName}}', { dappName: 'Uniswap' }),
    imageUrl: 'https://app.uniswap.org/images/192x192_App_Icon.png',
    chainId: ChainId.Mainnet.toString(),
  }

  return <NotificationToast appNotification={wcNotification} onPress={() => {}} />
}

export const BaseAppNotification: ComponentStory<typeof NotificationToast> = () => {
  const appNotification: AppNotification = {
    type: AppNotificationType.Default,
    title: 'This is a text notification',
  }

  return <NotificationToast appNotification={appNotification} onPress={() => {}} />
}
