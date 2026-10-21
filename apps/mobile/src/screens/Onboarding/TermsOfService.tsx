import { Text } from '@universe/mycelium'
import { Trans } from 'ui/src'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { openUri } from 'uniswap/src/utils/linking'

export function TermsOfService(): JSX.Element {
  return (
    <Text color="$neutral2" mx="$spacing4" textAlign="center" variant="body4">
      <Trans
        components={{
          highlightTerms: (
            <Text
              color="$accent1"
              variant="body4"
              onPress={(): Promise<void> => openUri({ uri: UniswapStaticUrls.termsOfServiceUrl })}
            />
          ),
          highlightPrivacy: (
            <Text
              color="$accent1"
              variant="body4"
              onPress={(): Promise<void> => openUri({ uri: UniswapStaticUrls.privacyPolicyUrl })}
            />
          ),
        }}
        i18nKey="onboarding.termsOfService"
      />
    </Text>
  )
}
