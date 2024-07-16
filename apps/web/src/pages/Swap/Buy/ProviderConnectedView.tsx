import { ConnectingViewWrapper } from 'pages/Swap/Buy/shared'
import { Trans } from 'react-i18next'
import { Flex, Text, useIsDarkMode } from 'ui/src'
import { ServiceProviderLogoStyles } from 'uniswap/src/features/fiatOnRamp/constants'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'

interface ProviderConnectedViewProps {
  closeModal: () => void
  selectedServiceProvider: FORServiceProvider
}

export function ProviderConnectedView({ closeModal, selectedServiceProvider }: ProviderConnectedViewProps) {
  const isDarkMode = useIsDarkMode()

  return (
    <ConnectingViewWrapper closeModal={closeModal}>
      <img
        style={ServiceProviderLogoStyles.uniswapLogoWrapper}
        height={120}
        src={getOptionalServiceProviderLogo(selectedServiceProvider?.logos, isDarkMode)}
        width={120}
      />
      <Flex flexDirection="column" alignItems="center">
        <Text variant="subheading1">
          <Trans
            i18nKey="fiatOnRamp.completeTransactionHeader"
            values={{ serviceProvider: selectedServiceProvider.name }}
          />
        </Text>
        <Text variant="body2" textAlign="center" color="$neutral2">
          <Trans i18nKey="fiatOnRamp.continueInTab" values={{ serviceProvider: selectedServiceProvider.name }} />
        </Text>
      </Flex>
    </ConnectingViewWrapper>
  )
}
