import styled from 'lib/styled-components'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'

const StyledLink = styled(ExternalLink)`
  font-weight: 535;
  color: ${({ theme }) => theme.neutral2};
`

export default function PrivacyPolicyNotice() {
  return (
    <ThemedText.BodySmall color="neutral2">
      <Trans
        i18nKey="wallet.connectingAgreement"
        components={{
          termsLink: <StyledLink href="https://rigoblock.com/legal" />,
          privacyLink: <StyledLink href="https://rigoblock.com/legal" />,
        }}
      />
    </ThemedText.BodySmall>
  )
}
