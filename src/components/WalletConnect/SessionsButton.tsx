import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { i18n } from 'src/app/i18n'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Arrow } from 'src/components/icons/Arrow'
import { OverlayGroup } from 'src/components/icons/OverlayIcon'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'

const ICON_SIZE = 24
const SMALL_ICON_SIZE = 20

export default function SessionsButton({
  sessions,
  onPress,
}: {
  sessions: WalletConnectSession[]
  onPress: () => void
}) {
  const theme = useAppTheme()
  const siteText = sessions.length > 1 ? 'sites' : 'site'

  const sessionIcons = sessions.slice(0, 3).map((session) => {
    return session.dapp.icon ? (
      <RemoteImage
        key={session.id}
        backgroundColor={theme.colors.background3}
        borderRadius={theme.borderRadii.full}
        height={ICON_SIZE}
        uri={session.dapp.icon}
        width={ICON_SIZE}
      />
    ) : null
  })

  return (
    <TouchableArea
      backgroundColor="translucentBackground"
      borderRadius="lg"
      px="md"
      py="sm"
      onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="sm">
          <OverlayGroup iconSize={ICON_SIZE} icons={sessionIcons} />
          <Text variant="subheadLarge">
            {sessions.length + ' ' + i18n.t('{{siteText}} connected', { siteText })}
          </Text>
        </Flex>
        <Arrow color={theme.colors.textSecondary} size={SMALL_ICON_SIZE} />
      </Flex>
    </TouchableArea>
  )
}
