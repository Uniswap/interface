import { ConnectingViewWrapper } from 'pages/Swap/Buy/shared'
import { Trans } from 'react-i18next'
import { Button, Flex, Image, Text, useIsDarkMode } from 'ui/src'
import { UNISWAP_LOGO_LARGE } from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'
import { ServiceProviderLogoStyles } from 'uniswap/src/features/fiatOnRamp/constants'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'

interface ProviderConnectionErrorProps {
  onBack: () => void
  closeModal?: () => void
  selectedServiceProvider: FORServiceProvider
}

export function ProviderConnectionError({ onBack, closeModal, selectedServiceProvider }: ProviderConnectionErrorProps) {
  const isDarkMode = useIsDarkMode()

  return (
    <ConnectingViewWrapper closeModal={closeModal} onBack={onBack}>
      <Flex alignItems="center" gap="$spacing36">
        <Flex row gap="$spacing16">
          <Flex alignItems="center" justifyContent="center" style={ServiceProviderLogoStyles.uniswapLogoWrapper}>
            <Image height={iconSizes.icon64} source={UNISWAP_LOGO_LARGE} width={iconSizes.icon64} />
          </Flex>
          <img
            style={ServiceProviderLogoStyles.uniswapLogoWrapper}
            height={120}
            src={getOptionalServiceProviderLogo(selectedServiceProvider.logos, isDarkMode)}
            width={120}
          />
        </Flex>
        <Flex centered gap="$spacing8">
          <Text variant="subheading1" color="$statusCritical">
            <Trans i18nKey="fiatOnRamp.connection.error" />
          </Text>
          <Text color="$neutral2" variant="body2" textAlign="center">
            <Trans
              i18nKey="fiatOnRamp.connection.errorDescription"
              values={{ serviceProvider: selectedServiceProvider.name }}
            />
          </Text>
        </Flex>
        <Flex row width="100%">
          <Button size="small" emphasis="primary" fill onPress={onBack}>
            <Trans i18nKey="common.tryAgain.error" />
          </Button>
        </Flex>
      </Flex>
    </ConnectingViewWrapper>
  )
}
