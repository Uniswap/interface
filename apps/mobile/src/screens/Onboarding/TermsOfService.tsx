import { Trans } from 'react-i18next'
import { Text } from 'ui/src'
import { nextradeUrls } from 'nextrade/src/constants/urls'
import { openUri } from 'nextrade/src/utils/linking'

export function TermsOfService(): JSX.Element {
  return (
    <Text color="$neutral2" mx="$spacing4" textAlign="center" variant="body4">
      <Trans
        components={{
          highlightTerms: (
            <Text
              color="$accent1"
              variant="body4"
              onPress={(): Promise<void> => openUri(nextradeUrls.termsOfServiceUrl)}
            />
          ),
          highlightPrivacy: (
            <Text
              color="$accent1"
              variant="body4"
              onPress={(): Promise<void> => openUri(nextradeUrls.privacyPolicyUrl)}
            />
          ),
        }}
        i18nKey="onboarding.termsOfService"
      />
    </Text>
  )
}
