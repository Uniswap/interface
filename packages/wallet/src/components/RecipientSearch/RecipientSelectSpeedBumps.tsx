import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { Eye } from 'ui/src/components/icons'
import { PaginatedModalRenderer } from 'uniswap/src/components/modals/PaginatedModals'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { useIsSmartContractAddress } from 'uniswap/src/features/address/useIsSmartContractAddress'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { ConditionalModalRenderer, SpeedBumps } from 'wallet/src/components/modals/SpeedBumps'
import { NewAddressWarningModal } from 'wallet/src/components/RecipientSearch/modals/NewAddressWarningModal'
import { useIsErc20Contract } from 'wallet/src/features/contracts/hooks'
import { useAllTransactionsBetweenAddresses } from 'wallet/src/features/transactions/hooks/useAllTransactionsBetweenAddresses'
import {
  useActiveAccountAddressWithThrow,
  useSignerAccounts,
  useViewOnlyAccounts,
} from 'wallet/src/features/wallet/hooks'

interface RecipientSelectSpeedBumpsProps {
  recipientAddress?: string
  chainId?: UniverseChainId
  checkSpeedBumps: boolean
  setCheckSpeedBumps: (value: boolean) => void
  onConfirm: () => void
}

export function RecipientSelectSpeedBumps({
  recipientAddress,
  checkSpeedBumps,
  chainId,
  ...rest
}: RecipientSelectSpeedBumpsProps): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { defaultChainId } = useEnabledChains()
  const platform = chainIdToPlatform(chainId ?? defaultChainId)

  const activeAddress = useActiveAccountAddressWithThrow()
  const viewOnlyAccounts = useViewOnlyAccounts()
  const currentSignerAccounts = useSignerAccounts()
  const previousTransactions = useAllTransactionsBetweenAddresses(activeAddress, recipientAddress)
  const { isSmartContractAddress, loading: smartContractLoading } = useIsSmartContractAddress(
    recipientAddress,
    chainId ?? defaultChainId,
  )
  const { isERC20ContractAddress, loading: erc20ContractLoading } = useIsErc20Contract(
    recipientAddress,
    chainId ?? defaultChainId,
  )

  const renderViewOnlyWarning = useCallback<PaginatedModalRenderer>(
    (props) => (
      <WarningModal
        isOpen
        backgroundIconColor={colors.surface3.val}
        caption={t('send.recipient.warning.viewOnly.message')}
        rejectText={t('common.button.goBack')}
        acknowledgeText={t('common.button.understand')}
        icon={<Eye color="$neutral1" size="$icon.24" />}
        modalName={ModalName.RecipientSelectViewOnlyWarning}
        severity={WarningSeverity.High}
        title={t('send.recipient.warning.viewOnly.title')}
        {...props}
      />
    ),
    [t, colors.surface3.val],
  )

  const renderNewAddressWarning = useCallback<PaginatedModalRenderer>(
    (props) =>
      recipientAddress ? (
        <NewAddressWarningModal
          address={recipientAddress}
          onAcknowledge={props.onAcknowledge}
          onClose={props.onClose}
        />
      ) : null,
    [recipientAddress],
  )

  const renderSelfSendWarning = useCallback<PaginatedModalRenderer>(
    (props) => (
      <WarningModal
        isOpen
        caption={t('send.warning.self.message')}
        rejectText={t('common.button.cancel')}
        acknowledgeText={t('common.button.understand')}
        modalName={ModalName.RecipientSelectSelfSendWarning}
        severity={WarningSeverity.High}
        title={t('send.warning.self.title')}
        {...props}
      />
    ),
    [t],
  )

  const renderErc20Warning = useCallback<PaginatedModalRenderer>(
    (props) => (
      <WarningModal
        isOpen
        caption={t('send.warning.erc20.message')}
        rejectText={t('common.button.goBack')}
        acknowledgeText={t('common.button.understand')}
        modalName={ModalName.RecipientSelectErc20Warning}
        severity={WarningSeverity.High}
        title={t('send.warning.erc20.title')}
        {...props}
      />
    ),
    [t],
  )

  const renderSmartContractWarning = useCallback<PaginatedModalRenderer>(
    (props) => (
      <WarningModal
        isOpen
        caption={t('send.warning.smartContract.message')}
        rejectText={t('common.button.goBack')}
        acknowledgeText={t('common.button.understand')}
        modalName={ModalName.RecipientSelectSmartContractWarning}
        severity={WarningSeverity.Medium}
        title={t('send.warning.smartContract.title')}
        {...props}
      />
    ),
    [t],
  )

  const isActiveViewOnly = viewOnlyAccounts.some((a) => a.address === activeAddress)

  const isNewRecipient = !previousTransactions || previousTransactions.length === 0
  const isSignerRecipient = useMemo(
    () => currentSignerAccounts.some((a) => a.address === recipientAddress),
    [currentSignerAccounts, recipientAddress],
  )
  const isViewOnlyRecipient = useMemo(
    () => viewOnlyAccounts.some((a) => a.address === recipientAddress),
    [viewOnlyAccounts, recipientAddress],
  )

  const shouldWarnViewOnly = isViewOnlyRecipient
  const shouldWarnERC20 = isERC20ContractAddress
  const shouldWarnSmartContract = isNewRecipient && !isSignerRecipient && isSmartContractAddress && !shouldWarnERC20
  const shouldWarnNewAddress = isNewRecipient && !isSignerRecipient && !shouldWarnSmartContract && !shouldWarnERC20
  const shouldWarnSelfSend = areAddressesEqual({
    addressInput1: { address: activeAddress, platform },
    addressInput2: { address: recipientAddress, platform },
  })

  const modalRenderers = useMemo<ConditionalModalRenderer[]>(
    () => [
      { renderModal: renderViewOnlyWarning, condition: shouldWarnViewOnly },
      { renderModal: renderNewAddressWarning, condition: shouldWarnNewAddress },
      { renderModal: renderSelfSendWarning, condition: shouldWarnSelfSend },
      { renderModal: renderErc20Warning, condition: shouldWarnERC20 },
      { renderModal: renderSmartContractWarning, condition: shouldWarnSmartContract },
    ],
    [
      renderViewOnlyWarning,
      renderNewAddressWarning,
      renderSelfSendWarning,
      renderErc20Warning,
      renderSmartContractWarning,
      shouldWarnViewOnly,
      shouldWarnNewAddress,
      shouldWarnSelfSend,
      shouldWarnERC20,
      shouldWarnSmartContract,
    ],
  )

  return (
    <SpeedBumps
      // Wait until the address is loaded before checking speed bumps
      checkSpeedBumps={checkSpeedBumps && !smartContractLoading && !erc20ContractLoading}
      // Don't check speed bumps if the current account is view-only
      // (the user won't be able to complete the send anyway)
      modalRenderers={isActiveViewOnly ? [] : modalRenderers}
      {...rest}
    />
  )
}
