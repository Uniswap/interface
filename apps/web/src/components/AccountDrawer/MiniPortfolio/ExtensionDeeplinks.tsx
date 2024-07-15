import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { ExtensionRequestMethods, useUniswapExtensionConnector } from 'components/WalletModal/useOrderedConnections'
import { t } from 'i18n'
import { useEffect, useState } from 'react'
import { useTheme } from 'styled-components'
import { Button, Flex, Image, Text } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { RotatableChevron, TimePast } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme/iconSizes'

const UnreadIndicator = () => {
  const theme = useTheme()

  return (
    <Flex position="absolute" left="28px" top="14px">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4" cy="4" r="4" fill={theme.accent1} stroke={theme.surface1} strokeWidth="2px" />
      </svg>
    </Flex>
  )
}

export function ExtensionDeeplinks() {
  const uniswapExtensionConnector = useUniswapExtensionConnector()

  const [activityUnread, setActivityUnread] = useState(false)
  const { hasPendingActivity } = usePendingActivity()
  useEffect(() => {
    if (hasPendingActivity) {
      setActivityUnread(true)
    }
  }, [hasPendingActivity])

  if (!uniswapExtensionConnector) {
    return null
  }

  return (
    <Flex gap="$spacing8">
      <Button
        display="flex"
        alignItems="center"
        gap="$spacing12"
        theme="outline"
        px="$spacing16"
        py="$spacing12"
        fontSize="$large"
        onPress={() => {
          uniswapExtensionConnector.extensionRequest(ExtensionRequestMethods.OPEN_SIDEBAR, 'Tokens')
        }}
      >
        <Image height={iconSizes.icon20} source={UNISWAP_LOGO} width={iconSizes.icon20} />
        <Text display="flex" flex={1} variant="buttonLabel3">
          {t('extension.open')}
        </Text>
        <RotatableChevron width={iconSizes.icon20} height={iconSizes.icon20} color="$neutral1" direction="right" />
      </Button>
      <Button
        display="flex"
        alignItems="center"
        gap="$spacing12"
        theme="outline"
        px="$spacing16"
        py="$spacing12"
        fontSize="$large"
        onPress={() => {
          uniswapExtensionConnector.extensionRequest(ExtensionRequestMethods.OPEN_SIDEBAR, 'Activity')
          setActivityUnread(false)
        }}
      >
        <TimePast size="$icon.20" color="$neutral1" />
        {activityUnread && <UnreadIndicator />}
        <Text display="flex" flex={1} variant="buttonLabel3">
          {t('common.activity')}
        </Text>
        <RotatableChevron width={iconSizes.icon20} height={iconSizes.icon20} color="$neutral1" direction="right" />
      </Button>
    </Flex>
  )
}
