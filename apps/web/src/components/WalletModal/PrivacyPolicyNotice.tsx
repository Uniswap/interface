import { Trans } from 'react-i18next'
import { Text } from 'ui/src'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { ExternalLink } from '~/theme/components/Links'

export function PrivacyPolicyNotice() {
  return (
    <Text variant="body4" color="$neutral3" textAlign="center">
      <Trans
        i18nKey="wallet.connectingAgreement"
        components={{
          termsLink: (
            <ExternalLink
              href={UniswapStaticUrls.termsOfServiceUrl}
              color="$neutral3"
              fontSize="$micro"
              lineHeight="$micro"
            />
          ),
          privacyLink: (
            <ExternalLink
              href={UniswapStaticUrls.privacyPolicyUrl}
              color="$neutral3"
              fontSize="$micro"
              lineHeight="$micro"
            />
          ),
        }}
      />
    </Text>
  )
}
