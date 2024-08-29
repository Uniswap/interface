import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { Eye } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { PaginatedModalRenderer } from 'uniswap/src/components/modals/PaginatedModals'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { isSameAddress } from 'utilities/src/addresses'
import { NewAddressWarningModal } from 'wallet/src/components/RecipientSearch/modals/NewAddressWarningModal'
import { ConditionalModalRenderer, SpeedBumps } from 'wallet/src/components/modals/SpeedBumps'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { useIsErc20Contract } from 'wallet/src/features/contracts/hooks'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { useAllTransactionsBetweenAddresses } from 'wallet/src/features/transactions/hooks/useAllTransactionsBetweenAddresses'
import { useIsSmartContractAddress } from 'wallet/src/features/transactions/transfer/hooks/useIsSmartContractAddress'
import {
  useActiveAccountAddressWithThrow,
  useSignerAccounts,
  useViewOnlyAccounts,
} from 'wallet/src/features/wallet/hooks'

interface RecipientSelectSpeedBumpsProps {
  recipientAddress?: string
  chainId?: WalletChainId
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

  const activeAddress = useActiveAccountAddressWithThrow()
  const viewOnlyAccounts = useViewOnlyAccounts()
  const currentSignerAccounts = useSignerAccounts()
  const previousTransactions = useAllTransactionsBetweenAddresses(activeAddress, recipientAddress)
  const { isSmartContractAddress, loading: addressLoading } = useIsSmartContractAddress(
    recipientAddress,
    chainId ?? UniverseChainId.Mainnet,
  )

  const renderViewOnlyWarning = useCallback<PaginatedModalRenderer>(
    (props) => (
      <WarningModal
        backgroundIconColor={colors.surface2.val}
        caption={t('send.recipient.warning.viewOnly.message')}
        closeText={t('common.button.goBack')}
        confirmText={t('common.button.understand')}
        icon={<Eye color="$neutral2" size={iconSizes.icon24} />}
        modalName={ModalName.RecipientSelectViewOnlyWarning}
        severity={WarningSeverity.High}
        title={t('send.recipient.warning.viewOnly.title')}
        {...props}
      />
    ),
    [t, colors.surface2.val],
  )

  const renderNewAddressWarning = useCallback<PaginatedModalRenderer>(
    (props) => (recipientAddress ? <NewAddressWarningModal address={recipientAddress} {...props} /> : null),
    [recipientAddress],
  )

  const renderSelfSendWarning = useCallback<PaginatedModalRenderer>(
    (props) => (
      <WarningModal
        caption={t('send.warning.self.message')}
        closeText={t('common.button.cancel')}
        confirmText={t('common.button.understand')}
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
        caption={t('send.warning.erc20.message')}
        closeText={t('common.button.cancel')}
        confirmText={t('common.button.understand')}
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
        caption={t('send.warning.smartContract.message')}
        closeText={t('common.button.cancel')}
        confirmText={t('common.button.understand')}
        modalName={ModalName.RecipientSelectSmartContractWarning}
        severity={WarningSeverity.None}
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
  const shouldWarnSelfSend = isSameAddress(activeAddress, recipientAddress)
  const shouldWarnErc20 = useIsErc20Contract(recipientAddress, chainId ?? UniverseChainId.Mainnet)
  const shouldWarnSmartContract = isNewRecipient && !isSignerRecipient && isSmartContractAddress
  const shouldWarnNewAddress = isNewRecipient && !isSignerRecipient && !shouldWarnSmartContract

  const modalRenderers = useMemo<ConditionalModalRenderer[]>(
    () => [
      { renderModal: renderViewOnlyWarning, condition: shouldWarnViewOnly },
      { renderModal: renderNewAddressWarning, condition: shouldWarnNewAddress },
      { renderModal: renderSelfSendWarning, condition: shouldWarnSelfSend },
      { renderModal: renderErc20Warning, condition: shouldWarnErc20 },
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
      shouldWarnErc20,
      shouldWarnSmartContract,
    ],
  )

  return (
    <SpeedBumps
      // Wait until the address is loaded before checking speed bumps
      checkSpeedBumps={checkSpeedBumps && !addressLoading}
      // Don't check speed bumps if the current account is view-only
      // (the user won't be able to complete the transfer anyway)
      modalRenderers={isActiveViewOnly ? [] : modalRenderers}
      {...rest}
    />
  )
}
