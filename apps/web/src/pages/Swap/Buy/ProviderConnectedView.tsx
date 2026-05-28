import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, TouchableTextLink, useIsDarkMode } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ServiceProviderLogoStyles } from 'uniswap/src/features/fiatOnRamp/constants'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'
import { ConnectingViewWrapper } from '~/pages/Swap/Buy/shared'

interface ProviderConnectedViewProps {
  closeModal?: () => void
  selectedServiceProvider: FORServiceProvider
}

export function ProviderConnectedView({ closeModal, selectedServiceProvider }: ProviderConnectedViewProps) {
  const isDarkMode = useIsDarkMode()
  const { t } = useTranslation()

  return (
    <ConnectingViewWrapper closeModal={closeModal}>
      <Flex alignItems="center" gap="$spacing48">
        <Flex alignItems="center" gap="$spacing24">
          <img
            style={ServiceProviderLogoStyles.uniswapLogoWrapper}
            height={120}
            src={getOptionalServiceProviderLogo(selectedServiceProvider.logos, isDarkMode)}
            width={120}
          />
          <Flex alignItems="center" gap="$spacing8">
            <Text variant="subheading1">
              {t('fiatOnRamp.completeTransactionHeader', { serviceProvider: selectedServiceProvider.name })}
            </Text>
            <Text variant="body2" textAlign="center" color="$neutral2">
              {t('fiatOnRamp.continueInTab', { serviceProvider: selectedServiceProvider.name })}
            </Text>
          </Flex>
        </Flex>
        <Text variant="body4" textAlign="center" color="$neutral3">
          <Trans
            i18nKey="fiatOnRamp.disclaimer"
            values={{
              serviceProvider: selectedServiceProvider.name,
            }}
            components={{
              tosLink: (
                <TouchableTextLink
                  onlyUseText
                  variant="buttonLabel4"
                  link={uniswapUrls.termsOfServiceUrl}
                  target="_blank"
                  display="inline"
                  color="$neutral3"
                >
                  {t('common.termsOfService')}
                </TouchableTextLink>
              ),
              privacyLink: (
                <TouchableTextLink
                  onlyUseText
                  variant="buttonLabel4"
                  link={uniswapUrls.privacyPolicyUrl}
                  target="_blank"
                  display="inline"
                  color="$neutral3"
                >
                  {t('common.privacyPolicy')}
                </TouchableTextLink>
              ),
            }}
          />
        </Text>
      </Flex>
    </ConnectingViewWrapper>
  )
}
