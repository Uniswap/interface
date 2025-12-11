import { deprecatedStyled } from 'lib/styled-components'
import { ConnectingViewWrapper } from 'pages/Swap/Buy/shared'
import { Trans, useTranslation } from 'react-i18next'
import { ExternalLink } from 'theme/components/Links'
import { Flex, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { ServiceProviderLogoStyles } from 'uniswap/src/features/fiatOnRamp/constants'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'

const StyledLink = deprecatedStyled(ExternalLink)`
  font-weight: 535;
  color: ${({ theme }) => theme.neutral3};
`

interface ProviderConnectedViewProps {
  closeModal?: () => void
  selectedServiceProvider: FORServiceProvider
}

export function ProviderConnectedView({ closeModal, selectedServiceProvider }: ProviderConnectedViewProps) {
  const isDarkMode = useIsDarkMode()
  const colors = useSporeColors()
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
              <Trans
                i18nKey="fiatOnRamp.completeTransactionHeader"
                values={{ serviceProvider: selectedServiceProvider.name }}
              />
            </Text>
            <Text variant="body2" textAlign="center" color="$neutral2">
              <Trans i18nKey="fiatOnRamp.continueInTab" values={{ serviceProvider: selectedServiceProvider.name }} />
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
                <StyledLink color={colors.neutral3.val} href="https://uniswap.org/terms-of-service/">
                  {t('common.termsOfService')}
                </StyledLink>
              ),
              privacyLink: (
                <StyledLink color={colors.neutral3.val} href="https://uniswap.org/privacy-policy">
                  {t('common.privacyPolicy')}
                </StyledLink>
              ),
            }}
          />
        </Text>
      </Flex>
    </ConnectingViewWrapper>
  )
}
