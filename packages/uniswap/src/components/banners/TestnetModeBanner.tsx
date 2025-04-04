import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, Text, isWeb } from 'ui/src'
import { Wrench } from 'ui/src/components/icons/Wrench'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useDeviceInsets } from 'ui/src/hooks/useDeviceInsets'
import { zIndexes } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { TESTNET_MODE_BANNER_HEIGHT } from 'uniswap/src/features/settings/hooks'
import { isInterface, isMobileApp } from 'utilities/src/platform'

export function TestnetModeBanner(props: FlexProps): JSX.Element | null {
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
      zIndex={zIndexes.fixed}
      width={isInterface ? 'auto' : '100%'}
      p="$padding12"
      gap="$gap8"
      backgroundColor="$statusSuccess2"
      borderWidth={isWeb ? '$none' : '$spacing1'}
      borderBottomWidth="$spacing1"
      height={TESTNET_MODE_BANNER_HEIGHT}
      borderStyle="dashed"
      borderColor="$surface3"
      {...props}
    >
      <Wrench color="$greenBase" size="$icon.20" />
      <Text color="$greenBase" variant="body3">
        {t('home.banner.testnetMode')}
      </Text>
    </Flex>
  )
}
