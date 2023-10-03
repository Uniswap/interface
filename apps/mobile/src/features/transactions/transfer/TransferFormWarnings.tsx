import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'src/features/telemetry/constants'
import { useAllTransactionsBetweenAddresses } from 'src/features/transactions/hooks'
import { useIsSmartContractAddress } from 'src/features/transactions/transfer/hooks'
import { Flex, Text } from 'ui/src'
import { ChainId } from 'wallet/src/constants/chains'
import {
  useActiveAccountAddressWithThrow,
  useDisplayName,
  useSignerAccounts,
} from 'wallet/src/features/wallet/hooks'
import { TransferSpeedbump } from './types'

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
  const previousTransactions = useAllTransactionsBetweenAddresses(activeAddress, recipient)
  const isNewRecipient = !previousTransactions || previousTransactions.length === 0
  const currentSignerAccounts = useSignerAccounts()
  const isSignerRecipient = useMemo(
    () => currentSignerAccounts.some((a) => a.address === recipient),
    [currentSignerAccounts, recipient]
  )

  const { isSmartContractAddress, loading: addressLoading } = useIsSmartContractAddress(
    recipient,
    chainId ?? ChainId.Mainnet
  )

  const shouldWarnSmartContract = isNewRecipient && !isSignerRecipient && isSmartContractAddress
  const shouldWarnNewAddress = isNewRecipient && !isSignerRecipient && !shouldWarnSmartContract

  useEffect(() => {
    setTransferSpeedbump({
      hasWarning: shouldWarnSmartContract || shouldWarnNewAddress,
      loading: addressLoading,
    })
  }, [setTransferSpeedbump, addressLoading, shouldWarnSmartContract, shouldWarnNewAddress])

  const onCloseWarning = (): void => {
    setShowSpeedbumpModal(false)
  }

  const displayName = useDisplayName(recipient)

  return (
    <>
      {showSpeedbumpModal && shouldWarnSmartContract && (
        <WarningModal
          caption={t(
            'You’re about to send tokens to a special type of address—a smart contract. Double-check it’s the address you intended to send to. If it’s wrong, your tokens could be lost forever.'
          )}
          closeText={t('Cancel')}
          confirmText={t('Continue')}
          modalName={ModalName.SendWarning}
          severity={WarningSeverity.None}
          title={t('Is this a wallet address?')}
          onClose={onCloseWarning}
          onConfirm={onNext}
        />
      )}
      {showSpeedbumpModal && shouldWarnNewAddress && (
        <WarningModal
          caption={t(
            'You haven’t transacted with this address before. Please confirm that the address is correct before continuing.'
          )}
          closeText={t('Cancel')}
          confirmText={t('Confirm')}
          modalName={ModalName.SendWarning}
          severity={WarningSeverity.Medium}
          title={t('New address')}
          onClose={onCloseWarning}
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
      borderColor="$surface3"
      borderRadius="$rounded12"
      borderWidth={1}
      gap="$spacing8"
      px="$spacing16"
      py="$spacing12">
      <Text color="$neutral1" textAlign="center" variant="subheading2">
        {type === 'ens' ? displayName : address}
      </Text>
      {type === 'ens' && (
        <Text color="$neutral2" textAlign="center" variant="buttonLabel4">
          {address}
        </Text>
      )}
    </Flex>
  )
}
