import { Trans } from 'react-i18next'
import { ReactNode, /*useCallback,*/ useState } from 'react'
import { X } from 'react-feather'
import styled from 'lib/styled-components'
import { ThemedText } from 'theme/components/text'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ModalName} from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { useSetValueCallback } from 'state/pool/hooks'
import { useIsTransactionConfirmed, useTransaction } from 'state/transactions/hooks'
import { ButtonError } from 'components/Button/buttons'
import { AutoColumn } from 'components/deprecated/Column'
import { RowBetween } from 'components/deprecated/Row'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import { useAccount } from 'hooks/useAccount'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
`

const StyledClosed = styled(X)`
  :hover {
    cursor: pointer;
  }
`

interface SetValueModalProps {
  isOpen: boolean
  onDismiss: () => void
  baseTokenSymbol: string
  title: ReactNode
}

export default function SetValueModal({ isOpen, onDismiss, baseTokenSymbol, title }: SetValueModalProps) {
  const account = useAccount()

  // state for create input
  //const [typed, setTyped] = useState('')

  // wrapped onUserInput to clear signatures
  //const onUserInput = useCallback((typed: string) => {
  //  const numberRegEx = RegExp(`^[0-9]*[.,]?[0-9]*$`)
  //  if (numberRegEx.test(String(typed))) {
  //    setTyped(typed)
  //  }
  //}, [])

  const setValueCallback = useSetValueCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const transactionSuccess = transaction?.status === TransactionStatus.Confirmed

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onSetValue() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!account.address || !account.chainId || !setValueCallback) {
      return
    }

    // try delegation and store hash
    const hash = await setValueCallback()?.catch((error) => {
      setAttempting(false)
      logger.info('SetValueModal', 'onSetValue', error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  return (
    <Modal name={ModalName.DappRequest} isModalOpen={isOpen} isDismissible onClose={wrappedOnDismiss} maxHeight={480}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <ThemedText.DeprecatedMediumHeader fontWeight={500}>{title}</ThemedText.DeprecatedMediumHeader>
              <StyledClosed stroke="black" onClick={wrappedOnDismiss} />
            </RowBetween>
            {/* TODO: display return error from hook */}
            <ButtonError
              disabled={false}
              error={false}
              onClick={onSetValue}
            >
              <ThemedText.DeprecatedMediumHeader color="white">
                <Trans>Update Value</Trans>
              </ThemedText.DeprecatedMediumHeader>
            </ButtonError>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Updating Value</Trans>
            </ThemedText.DeprecatedLargeHeader>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash} transactionSuccess={transactionSuccess}>
          <AutoColumn gap="12px" justify="center">
            {!confirmed ? (
              <>
                <ThemedText.DeprecatedLargeHeader>
                  <Trans>Transaction Submitted</Trans>
                </ThemedText.DeprecatedLargeHeader>
                <ThemedText.DeprecatedBody fontSize={20}>
                  <Trans>
                    Updating Nav {baseTokenSymbol}
                  </Trans>
                </ThemedText.DeprecatedBody>
              </>
            ) : transactionSuccess ? (
              <>
                <ThemedText.DeprecatedLargeHeader>
                  <Trans>Transaction Success</Trans>
                </ThemedText.DeprecatedLargeHeader>
                <ThemedText.DeprecatedBody fontSize={20}>
                  <Trans>
                    Updated Nav {baseTokenSymbol}
                  </Trans>
                </ThemedText.DeprecatedBody>
              </>
            ) : (
              <ThemedText.DeprecatedLargeHeader>
                <Trans>Transaction Failed</Trans>
              </ThemedText.DeprecatedLargeHeader>
            )}
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
