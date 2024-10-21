import { ButtonPrimary } from 'components/Button/buttons'
import { AutoColumn } from 'components/deprecated/Column'
import Modal from 'components/Modal'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import { useAccount } from 'hooks/useAccount'
import { useTheme } from 'lib/styled-components'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { useIsTransactionConfirmed, useTransaction } from 'state/transactions/hooks'
import { ExternalLink, ThemedText } from 'theme/components'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { Trans } from 'uniswap/src/i18n'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

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
  const account = useAccount()

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const transactionSuccess = transaction?.status === TransactionStatus.Confirmed

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
        <SubmittedView onDismiss={onDismiss} hash={hash} transactionSuccess={transactionSuccess}>
          <AutoColumn gap="md" justify="center">
            {!confirmed ? (
              <>
                <Text fontWeight={535} fontSize={20} textAlign="center">
                  <Trans i18nKey="vote.proposal.submitted" />
                </Text>
              </>
            ) : transactionSuccess ? (
              <>
                <Text fontWeight={500} fontSize={20} textAlign="center">
                  <Trans i18nKey="common.transactionSuccess" />
                </Text>
              </>
            ) : (
              <Text fontWeight={500} fontSize={20} textAlign="center">
                <Trans i18nKey="common.transactionFailed" />
              </Text>
            )}
            {hash && account.chainId && (
              <ExternalLink href={getExplorerLink(account.chainId, hash, ExplorerDataType.TRANSACTION)}>
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
