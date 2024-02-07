import { Trans, useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { openUri } from 'wallet/src/utils/linking'

export function TermsOfService(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Text color="$neutral2" mx="$spacing4" textAlign="center" variant="buttonLabel4">
      <Trans t={t}>
        By continuing, I agree to the{' '}
        <Text
          color="$accent1"
          variant="buttonLabel4"
          onPress={(): Promise<void> => openUri(uniswapUrls.termsOfServiceUrl)}>
          Terms of Service
        </Text>{' '}
        and consent to the{' '}
        <Text
          color="$accent1"
          variant="buttonLabel4"
          onPress={(): Promise<void> => openUri(uniswapUrls.privacyPolicyUrl)}>
          Privacy Policy
        </Text>
        .
      </Trans>
    </Text>
  )
}
