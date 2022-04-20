import { Trans } from '@lingui/macro'
import CopyHelper from 'components/AccountDetails/Copy'
import Column from 'components/Column'
import useTheme from 'hooks/useTheme'
import { AlertOctagon } from 'react-feather'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'

import Modal from '../Modal'

const ContentWrapper = styled(Column)`
  align-items: center;
  margin: 32px;
  text-align: center;
`
const WarningIcon = styled(AlertOctagon)`
  min-height: 22px;
  min-width: 22px;
  color: ${({ theme }) => theme.warning};
`

interface ConnectedAccountBlockedProps {
  account: string | null | undefined
  isOpen: boolean
}

export default function ConnectedAccountBlocked(props: ConnectedAccountBlockedProps) {
  const theme = useTheme()
  return (
    <Modal isOpen={props.isOpen} onDismiss={Function.prototype()}>
      <ContentWrapper>
        <WarningIcon />
        <ThemedText.LargeHeader lineHeight={2} marginBottom={1} marginTop={1}>
          <Trans>Blocked Address</Trans>
        </ThemedText.LargeHeader>
        <ThemedText.DarkGray fontSize={12} marginBottom={12}>
          {props.account}
        </ThemedText.DarkGray>
        <ThemedText.Main fontSize={14} marginBottom={12}>
          <Trans>This address is blocked on the Uniswap Labs interface because it is associated with one or more</Trans>{' '}
          <ExternalLink href="https://help.uniswap.org/en/articles/6149816">
            <Trans>blocked activities</Trans>
          </ExternalLink>
          .
        </ThemedText.Main>
        <ThemedText.Main fontSize={12}>
          <Trans>If you believe this is an error, please email: </Trans>{' '}
        </ThemedText.Main>
        <CopyHelper toCopy="compliance@uniswap.org" color={theme.primary1}>
          compliance@uniswap.org.
        </CopyHelper>
      </ContentWrapper>
    </Modal>
  )
}
