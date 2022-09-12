import { AnyAction } from '@reduxjs/toolkit'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Box } from 'src/components/layout'
import { WarningSeverity } from 'src/components/modals/types'
import WarningModal from 'src/components/modals/WarningModal'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { ModalName } from 'src/features/telemetry/constants'
import { useAllTransactionsBetweenAddresses } from 'src/features/transactions/hooks'
import { clearRecipient } from 'src/features/transactions/transactionState/transactionState'
import { useIsSmartContractAddress } from 'src/features/transactions/transfer/hooks'
import { TransferWarning } from 'src/features/transactions/transfer/TransferTokenForm'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'

interface TransferFormWarningProps {
  dispatch: React.Dispatch<AnyAction>
  recipient?: string
  chainId?: ChainId
  showWarningModal: boolean
  onNext: () => void
  setTransferWarning: (w: TransferWarning) => void
  setShowWarningModal: (b: boolean) => void
}

export function TransferFormWarnings({
  dispatch,
  recipient,
  chainId,
  showWarningModal,
  onNext,
  setTransferWarning,
  setShowWarningModal,
}: TransferFormWarningProps) {
  const { t } = useTranslation()

  const activeAddress = useActiveAccountAddressWithThrow()
  const isNewRecipient = useAllTransactionsBetweenAddresses(activeAddress, recipient).length === 0

  const { isSmartContractAddress, loading: addressLoading } = useIsSmartContractAddress(
    recipient,
    chainId ?? ChainId.Mainnet
  )

  useEffect(() => {
    setTransferWarning({
      hasWarning: isNewRecipient || isSmartContractAddress,
      loading: addressLoading,
    })
  }, [setTransferWarning, isNewRecipient, isSmartContractAddress, addressLoading])

  const onCloseSmartContractWarning = useCallback(() => {
    dispatch(clearRecipient())
    setShowWarningModal(false)
  }, [dispatch, setShowWarningModal])

  const onCloseNewRecipientWarning = useCallback(
    () => setShowWarningModal(false),
    [setShowWarningModal]
  )

  return (
    <>
      {showWarningModal && isSmartContractAddress && (
        <WarningModal
          isVisible
          caption={t(
            'This address is a smart contract. In many cases, sending tokens directly to a contract will result in the loss of your assets. Please select a different address.'
          )}
          confirmText={t('OK')}
          modalName={ModalName.SendWarning}
          severity={WarningSeverity.High}
          title={t('Smart contract address')}
          onClose={onCloseSmartContractWarning}
          onConfirm={onCloseSmartContractWarning}
        />
      )}
      {showWarningModal && !isSmartContractAddress && isNewRecipient && (
        <WarningModal
          isVisible
          caption={t(
            "You haven't transacted with this address before. Please confirm that the address is correct before continuing."
          )}
          closeText={t('Cancel')}
          confirmText={t('Confirm')}
          modalName={ModalName.SendWarning}
          severity={WarningSeverity.Medium}
          title={t('New address')}
          onClose={onCloseNewRecipientWarning}
          onConfirm={onNext}>
          <Box borderColor="backgroundOutline" borderRadius="xs" borderWidth={1}>
            <Text color="textPrimary" px="md" py="sm" textAlign="center" variant="subheadSmall">
              {recipient}
            </Text>
          </Box>
        </WarningModal>
      )}
    </>
  )
}
