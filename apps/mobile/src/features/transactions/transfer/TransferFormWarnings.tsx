import React, { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { ModalName } from 'src/features/telemetry/constants'
import { useAllTransactionsBetweenAddresses } from 'src/features/transactions/hooks'
import { useIsSmartContractAddress } from 'src/features/transactions/transfer/hooks'
import { TransferSpeedbump } from 'src/features/transactions/transfer/TransferTokenForm'
import {
  useActiveAccountAddressWithThrow,
  useDisplayName,
  useSignerAccounts,
} from 'src/features/wallet/hooks'

interface TransferFormWarningProps {
  recipient?: string
  chainId?: ChainId
  showSpeedbumpModal: boolean
  onNext: () => void
  setTransferSpeedbump: (w: TransferSpeedbump) => void
  setShowSpeedbumpModal: (b: boolean) => void
}

export function TransferFormSpeedbumps({
  recipient,
  chainId,
  showSpeedbumpModal,
  onNext,
  setTransferSpeedbump,
  setShowSpeedbumpModal,
}: TransferFormWarningProps): JSX.Element {
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
    setTransferSpeedbump({
      hasWarning: (isNewRecipient || isSmartContractAddress) && !isSignerRecipient,
      loading: addressLoading,
    })
  }, [
    setTransferSpeedbump,
    isNewRecipient,
    isSmartContractAddress,
    addressLoading,
    isSignerRecipient,
  ])

  const onCloseSmartContractWarning = useCallback(() => {
    setShowSpeedbumpModal(false)
  }, [setShowSpeedbumpModal])

  const onCloseNewRecipientWarning = useCallback(
    () => setShowSpeedbumpModal(false),
    [setShowSpeedbumpModal]
  )

  const displayName = useDisplayName(recipient)

  return (
    <>
      {showSpeedbumpModal && !isSignerRecipient && isSmartContractAddress && isNewRecipient && (
        <WarningModal
          caption={t(
            "You're about to send tokens to a smart contract. Sending tokens to certain smart contracts could result in the loss of your tokens. If you’re not sure this is correct please double check the address before proceeding."
          )}
          closeText={t('Cancel')}
          confirmText={t('Continue')}
          modalName={ModalName.SendWarning}
          severity={WarningSeverity.Low}
          title={t('Is this a wallet address?')}
          onClose={onCloseSmartContractWarning}
          onConfirm={onNext}
        />
      )}
      {showSpeedbumpModal && !isSmartContractAddress && !isSignerRecipient && isNewRecipient && (
        <WarningModal
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

const TransferRecipient = ({
  displayName,
  address,
  type = 'address',
}: TransferRecipientProps): JSX.Element => {
  return (
    <Flex
      centered
      borderColor="backgroundOutline"
      borderRadius="rounded12"
      borderWidth={1}
      gap="spacing8"
      px="spacing16"
      py="spacing12">
      <Text color="textPrimary" textAlign="center" variant="subheadSmall">
        {type === 'ens' ? displayName : address}
      </Text>
      {type === 'ens' && (
        <Text color="textSecondary" textAlign="center" variant="buttonLabelMicro">
          {address}
        </Text>
      )}
    </Flex>
  )
}
