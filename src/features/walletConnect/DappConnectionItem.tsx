import React from 'react'
import { ListRenderItemInfo } from 'react-native'
import 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import X from 'src/assets/icons/x.svg'
import { Button } from 'src/components/buttons/Button'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout'
import { NetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { disconnectFromApp } from 'src/features/walletConnect/WalletConnect'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { flex } from 'src/styles/flex'
import { openUri } from 'src/utils/linking'

export function DappConnectionItem({
  wrapped,
}: {
  wrapped: ListRenderItemInfo<WalletConnectSession>
}) {
  const theme = useAppTheme()
  const activeAccount = useActiveAccount()
  const { dapp } = wrapped.item

  return (
    <Flex row alignItems="center" justifyContent="space-between" mx="lg">
      <Button name={ElementName.WCOpenDapp} style={flex.shrink} onPress={() => openUri(dapp.url)}>
        <Flex row shrink gap="sm">
          {dapp.icon && (
            <RemoteImage
              borderRadius={theme.borderRadii.full}
              height={25}
              imageUrl={dapp.icon}
              width={25}
            />
          )}
          <Text numberOfLines={1} style={flex.shrink} variant={'h4'}>
            {dapp.name}
          </Text>
        </Flex>
      </Button>
      <Flex row alignItems="center" gap="sm">
        <Button
          name={ElementName.WCDappSwitchNetwork}
          onPress={() => {
            // TODO add switch network for connection functionality
          }}>
          <NetworkPill chainId={1} showBorder={false} />
        </Button>
        <Button
          onPress={() => {
            // TODO handle UX around disconnection (notification? ensure hidden from list?)
            if (activeAccount) disconnectFromApp(wrapped.item.id, activeAccount.address)
          }}>
          <X
            height={16}
            stroke={theme.colors.textColor}
            strokeLinecap="round"
            strokeWidth="2.5"
            width={16}
          />
        </Button>
      </Flex>
    </Flex>
  )
}
