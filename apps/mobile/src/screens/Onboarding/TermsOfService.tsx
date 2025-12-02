import { Trans } from 'react-i18next'
import { Text } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { openUri } from 'uniswap/src/utils/linking'

export function TermsOfService(): JSX.Element {
  return (
    <Text color="$neutral2" mx="$spacing4" textAlign="center" variant="body4">
      <Trans
        components={{
          highlightTerms: (
            <Text
              key="terms-of-service"
              color="$accent1"
              variant="body4"
              onPress={(): Promise<void> => openUri({ uri: uniswapUrls.termsOfServiceUrl })}
            />
          ),
          highlightPrivacy: (
            <Text
              key="privacy-policy"
              color="$accent1"
              variant="body4"
              onPress={(): Promise<void> => openUri({ uri: uniswapUrls.privacyPolicyUrl })}
            />
          ),
        }}
        i18nKey="onboarding.termsOfService"
      />
    </Text>
  )
}
