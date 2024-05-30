import { Trans } from 'react-i18next'
import { Text } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { openUri } from 'wallet/src/utils/linking'

export function TermsOfService(): JSX.Element {
  return (
    <Text color="$neutral2" mx="$spacing4" textAlign="center" variant="buttonLabel4">
      <Trans
        components={{
          highlightTerms: (
            <Text
              color="$accent1"
              variant="buttonLabel4"
              onPress={(): Promise<void> => openUri(uniswapUrls.termsOfServiceUrl)}
            />
          ),
          highlightPrivacy: (
            <Text
              color="$accent1"
              variant="buttonLabel4"
              onPress={(): Promise<void> => openUri(uniswapUrls.privacyPolicyUrl)}
            />
          ),
        }}
        i18nKey="onboarding.termsOfService"
      />
    </Text>
  )
}
