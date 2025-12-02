import React from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, StyleSheet } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import 'react-native-reanimated'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { AnimatedTouchableArea, Flex, Text } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { noop } from 'utilities/src/react/noop'
import { DappHeaderIcon } from 'wallet/src/components/dappRequests/DappHeaderIcon'

export function DappConnectionItem({
  session,
  isEditing,
  handleDisconnect,
}: {
  session: WalletConnectSession
  isEditing: boolean
  handleDisconnect: (session: WalletConnectSession) => Promise<void>
}): JSX.Element {
  const { t } = useTranslation()
  const { dappRequestInfo } = session

  const menuActions = [{ title: t('common.button.disconnect'), systemIcon: 'trash', destructive: true }]

  const onPress = async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
    if (e.nativeEvent.index === 0) {
      await handleDisconnect(session)
    }
  }

  const onDisconnectSession = async (): Promise<void> => {
    await handleDisconnect(session)
  }

  return (
    <ContextMenu actions={menuActions} style={styles.container} onPress={onPress}>
      <Flex
        grow
        backgroundColor="$surface2"
        borderRadius="$rounded16"
        gap="$spacing12"
        justifyContent="space-between"
        mb="$spacing12"
        py="$spacing24"
        px="$spacing12"
      >
        <Flex
          alignSelf="flex-end"
          position="absolute"
          right={spacing.spacing12}
          top={spacing.spacing12}
          zIndex="$tooltip"
        >
          {isEditing ? (
            <AnimatedTouchableArea
              alignItems="center"
              backgroundColor="$neutral3"
              borderRadius="$roundedFull"
              entering={FadeIn}
              exiting={FadeOut}
              height={iconSizes.icon28}
              justifyContent="center"
              width={iconSizes.icon28}
              zIndex="$tooltip"
              onLongPress={noop}
              onPress={onDisconnectSession}
            >
              <Flex backgroundColor="$surface1" borderRadius="$rounded12" height={2} width={14} />
            </AnimatedTouchableArea>
          ) : (
            <Flex height={iconSizes.icon28} width={iconSizes.icon28} />
          )}
        </Flex>
        <Flex grow centered gap="$gap8">
          <DappHeaderIcon size={iconSizes.icon36} dappInfo={dappRequestInfo} />
          <Text numberOfLines={2} textAlign="center" variant="body3" mt="$spacing4">
            {dappRequestInfo.name || dappRequestInfo.url}
          </Text>
          <Text color="$neutral2" numberOfLines={1} textAlign="center" variant="body4">
            {dappRequestInfo.url}
          </Text>
        </Flex>
      </Flex>
    </ContextMenu>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
  },
})
