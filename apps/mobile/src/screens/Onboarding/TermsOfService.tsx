import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { openUri } from 'wallet/src/utils/linking'

export function TermsOfService(): JSX.Element {
  return (
    <Text color="$neutral2" mx="$spacing4" textAlign="center" variant="buttonLabel4">
      <Trans i18nKey="onboarding.termsOfService">
        By continuing, I agree to the
        <Flex>
          <Text
            color="$accent1"
            variant="buttonLabel4"
            onPress={(): Promise<void> => openUri(uniswapUrls.termsOfServiceUrl)}>
            Terms of Service
          </Text>
        </Flex>
        and consent to the
        <Flex>
          <Text
            color="$accent1"
            variant="buttonLabel4"
            onPress={(): Promise<void> => openUri(uniswapUrls.privacyPolicyUrl)}>
            Privacy Policy
          </Text>
        </Flex>
        .
      </Trans>
    </Text>
  )
}
