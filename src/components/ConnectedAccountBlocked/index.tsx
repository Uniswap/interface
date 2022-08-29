import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { AlertOctagon } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'

import { CopyHelper } from '../../theme'
import Modal from '../Modal'

const ContentWrapper = styled(Column)`
  align-items: center;
  margin: 32px;
  text-align: center;
  font-size: 12px;
`
const WarningIcon = styled(AlertOctagon)`
  min-height: 22px;
  min-width: 22px;
  color: ${({ theme }) => theme.deprecated_warning};
`
const Copy = styled(CopyHelper)`
  font-size: 12px;
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
        <ThemedText.DeprecatedLargeHeader lineHeight={2} marginBottom={1} marginTop={1}>
          <Trans>Blocked Address</Trans>
        </ThemedText.DeprecatedLargeHeader>
        <ThemedText.DeprecatedDarkGray fontSize={12} marginBottom={12}>
          {props.account}
        </ThemedText.DeprecatedDarkGray>
        <ThemedText.DeprecatedMain fontSize={14} marginBottom={12}>
          <Trans>This address is blocked on the Uniswap Labs interface because it is associated with one or more</Trans>{' '}
          <ExternalLink href="https://help.uniswap.org/en/articles/6149816">
            <Trans>blocked activities</Trans>
          </ExternalLink>
          .
        </ThemedText.DeprecatedMain>
        <ThemedText.DeprecatedMain fontSize={12}>
          <Trans>If you believe this is an error, please send an email including your address to </Trans>{' '}
        </ThemedText.DeprecatedMain>
        <Copy
          toCopy="compliance@uniswap.org"
          fontSize={14}
          iconSize={16}
          gap={6}
          color={theme.deprecated_primary1}
          iconPosition="right"
        >
          compliance@uniswap.org
        </Copy>
      </ContentWrapper>
    </Modal>
  )
}
