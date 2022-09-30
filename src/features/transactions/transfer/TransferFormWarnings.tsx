import { AnyAction } from '@reduxjs/toolkit'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { ModalName } from 'src/features/telemetry/constants'
import { useAllTransactionsBetweenAddresses } from 'src/features/transactions/hooks'
import { clearRecipient } from 'src/features/transactions/transactionState/transactionState'
import { useIsSmartContractAddress } from 'src/features/transactions/transfer/hooks'
import { TransferWarning } from 'src/features/transactions/transfer/TransferTokenForm'
import {
  useActiveAccountAddressWithThrow,
  useDisplayName,
  useSignerAccounts,
} from 'src/features/wallet/hooks'

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
  const currentSignerAccounts = useSignerAccounts()
  const isSignerRecipient = useMemo(
    () => currentSignerAccounts.some((a) => a.address === recipient),
    [currentSignerAccounts, recipient]
  )

  const { isSmartContractAddress, loading: addressLoading } = useIsSmartContractAddress(
    recipient,
    chainId ?? ChainId.Mainnet
  )

  useEffect(() => {
    setTransferWarning({
      hasWarning: (isNewRecipient || isSmartContractAddress) && !isSignerRecipient,
      loading: addressLoading,
    })
  }, [
    setTransferWarning,
    isNewRecipient,
    isSmartContractAddress,
    addressLoading,
    isSignerRecipient,
  ])

  const onCloseSmartContractWarning = useCallback(() => {
    dispatch(clearRecipient())
    setShowWarningModal(false)
  }, [dispatch, setShowWarningModal])

  const onCloseNewRecipientWarning = useCallback(
    () => setShowWarningModal(false),
    [setShowWarningModal]
  )

  const displayName = useDisplayName(recipient)

  return (
    <>
      {showWarningModal && !isSignerRecipient && isSmartContractAddress && (
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
      {showWarningModal && !isSmartContractAddress && !isSignerRecipient && isNewRecipient && (
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
          <TransferRecipient
            address={recipient}
            displayName={displayName?.name}
            type={displayName?.type}
          />
        </WarningModal>
      )}
    </>
  )
}

interface TransferRecipientProps {
  displayName?: string
  address?: string
  type?: string
}

const TransferRecipient = ({ displayName, address, type = 'address' }: TransferRecipientProps) => {
  return (
    <Flex
      centered
      borderColor="backgroundOutline"
      borderRadius="md"
      borderWidth={1}
      gap="xs"
      px="md"
      py="sm">
      <Text color="textPrimary" textAlign="center" variant="subheadSmall">
        {type === 'ens' ? displayName : address}
      </Text>
      {type === 'ens' && (
        <Text color="textSecondary" textAlign="center" variant="caption">
          {address}
        </Text>
      )}
    </Flex>
  )
}
