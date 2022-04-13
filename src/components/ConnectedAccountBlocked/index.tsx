import { Trans } from '@lingui/macro'
import Column from 'components/Column'
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
          <ExternalLink href="">
            <Trans>blocked activities</Trans>
          </ExternalLink>
          .
        </ThemedText.Main>
        <ThemedText.Main fontSize={14}>
          <Trans>If you believe this is an error, please email compliance@uniswap.org.</Trans>
        </ThemedText.Main>
      </ContentWrapper>
    </Modal>
  )
}
