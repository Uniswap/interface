import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import { Trans } from 'i18n'
import { useTheme } from 'lib/styled-components'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { ExternalLink, ThemedText } from 'theme/components'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

export const ProposalSubmissionModal = ({
  isOpen,
  hash,
  onDismiss,
}: {
  isOpen: boolean
  hash?: string
  onDismiss: () => void
}) => {
  const theme = useTheme()

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      {!hash ? (
        <LoadingView onDismiss={onDismiss}>
          <AutoColumn gap="md" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans i18nKey="common.submitting.proposal" />
            </ThemedText.DeprecatedLargeHeader>
          </AutoColumn>
        </LoadingView>
      ) : (
        <SubmittedView onDismiss={onDismiss} hash={hash}>
          <AutoColumn gap="md" justify="center">
            <Text fontWeight={535} fontSize={20} textAlign="center">
              <Trans i18nKey="vote.proposal.submitted" />
            </Text>
            {hash && (
              <ExternalLink href={getExplorerLink(1, hash, ExplorerDataType.TRANSACTION)}>
                <Text fontWeight={535} fontSize={14} color={theme.accent1}>
                  <Trans i18nKey="common.etherscan.link" />
                </Text>
              </ExternalLink>
            )}
            <ButtonPrimary as={Link} to="/vote" onClick={onDismiss} style={{ margin: '20px 0 0 0' }}>
              <Text fontWeight={535} fontSize={20}>
                <Trans i18nKey="common.return.label" />
              </Text>
            </ButtonPrimary>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
