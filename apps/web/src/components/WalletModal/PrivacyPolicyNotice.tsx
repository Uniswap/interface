import { Trans } from 'react-i18next'
import { Text } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { deprecatedStyled } from '~/lib/deprecated-styled'
import { ExternalLink } from '~/theme/components/Links'

const StyledLink = deprecatedStyled(ExternalLink)`
  font-weight: 535;
  color: ${({ theme }) => theme.neutral3};
`

export function PrivacyPolicyNotice() {
  return (
    <Text variant="body4" color="$neutral3" textAlign="center">
      <Trans
        i18nKey="wallet.connectingAgreement"
        components={{
          termsLink: <StyledLink href={uniswapUrls.termsOfServiceUrl} />,
          privacyLink: <StyledLink href={uniswapUrls.privacyPolicyUrl} />,
        }}
      />
    </Text>
  )
}
