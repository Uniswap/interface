import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Wrench } from 'ui/src/components/icons'
// eslint-disable-next-line no-restricted-imports
import { useDeviceInsets } from 'ui/src/hooks/useDeviceInsets'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { TESTNET_MODE_BANNER_HEIGHT } from 'uniswap/src/hooks/useAppInsets'
import { isMobileApp } from 'utilities/src/platform'

export function TestnetModeBanner(): JSX.Element | null {
  const { isTestnetModeEnabled } = useEnabledChains()
  const { t } = useTranslation()

  const { top } = useDeviceInsets()

  if (!isTestnetModeEnabled) {
    return null
  }

  return (
    <Flex
      row
      centered
      top={top}
      position={isMobileApp ? 'absolute' : 'relative'}
      zIndex="$sticky"
      width="100%"
      p="$padding12"
      height={TESTNET_MODE_BANNER_HEIGHT}
      gap="$gap8"
      backgroundColor="$statusSuccess2"
      borderWidth={1}
      borderStyle="dashed"
      borderColor="$surface3"
    >
      <Wrench color="$greenBase" size="$icon.20" />
      <Text color="$greenBase" variant="body3">
        {t('home.banner.testnetMode')}
      </Text>
    </Flex>
  )
}
