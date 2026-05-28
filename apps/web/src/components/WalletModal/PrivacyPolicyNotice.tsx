import styled from 'lib/styled-components'
import { Trans } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Text } from 'ui/src'

const StyledLink = styled(Link)`
  font-weight: 535;
  color: ${({ theme }) => theme.neutral2};
`

export default function PrivacyPolicyNotice() {
  return (
    <Text variant="body3" color="neutral2" textAlign="center">
      <Trans
        i18nKey="wallet.connectingAgreement"
        components={{
          termsLink: <StyledLink to="/terms-of-service" />,
          privacyLink: <StyledLink to="/privacy-policy" />,
        }}
      />
    </Text>
  )
}
