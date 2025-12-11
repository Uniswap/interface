import { deprecatedStyled } from 'lib/styled-components'
import { Trans } from 'react-i18next'
import { ExternalLink } from 'theme/components/Links'
import { Text } from 'ui/src'

const StyledLink = deprecatedStyled(ExternalLink)`
  font-weight: 535;
  color: ${({ theme }) => theme.neutral2};
`

export default function PrivacyPolicyNotice() {
  return (
    <Text variant="body3" color="neutral2" textAlign="center">
      <Trans
        i18nKey="wallet.connectingAgreement"
        components={{
          termsLink: <StyledLink href="https://uniswap.org/terms-of-service/" />,
          privacyLink: <StyledLink href="https://uniswap.org/privacy-policy" />,
        }}
      />
    </Text>
  )
}
