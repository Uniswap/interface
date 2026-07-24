import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Flex, Text, TouchableArea } from 'ui/src'
import { FileListLock } from 'ui/src/components/icons/FileListLock'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Trash } from 'ui/src/components/icons/Trash'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { Authenticator } from 'uniswap/src/features/passkey/embeddedWallet'
import { deleteAuthenticatorWithPasskey, disconnectWallet } from 'uniswap/src/features/passkey/embeddedWallet'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { AddressDisplay } from '~/components/AccountDetails/AddressDisplay'
import { useSetMenu, MenuStateVariant } from '~/components/AccountDrawer/menuState'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { resetListAuthenticators } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { getProviderIcon } from '~/components/Passkey/authenticatorProvider'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { StatusIcon } from '~/components/StatusIcon'
import { useDisconnect } from '~/hooks/useDisconnect'
import { useModalState } from '~/hooks/useModalState'
import type { DeletePasskeyModalParams } from '~/state/application/reducer'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { useAppSelector } from '~/state/hooks'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

type RemovePasskeyStep = 'speedbump' | 'confirm'

function formatLastExported(lastExportedMs?: number): string | undefined {
  if (lastExportedMs == null) {
    return undefined
  }
  const date = new Date(lastExportedMs)
  if (isNaN(date.getTime())) {
    return undefined
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })
}

export function RemovePasskeyModal() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isOpen, onClose } = useModalState(ModalName.DeletePasskey)
  const disconnect = useDisconnect()
  const accountDrawer = useAccountDrawer()
  const setMenuState = useSetMenu()
  const evmAddress = useActiveAddress(Platform.EVM)
  const { data: portfolioTotalValue } = usePortfolioTotalValue({ evmAddress, svmAddress: undefined })
  const { balanceUSD } = portfolioTotalValue || {}
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const [step, setStep] = useState<RemovePasskeyStep>('speedbump')
  const [acknowledged, setAcknowledged] = useState(false)

  const { walletId } = useEmbeddedWalletState()
  const initialState = useAppSelector(
    (state) => (state.application.openModal as DeletePasskeyModalParams | null)?.initialState,
  )
  const lastExportedFormatted = formatLastExported(initialState?.lastExportedMs)

  const handleClose = () => {
    setStep('speedbump')
    setAcknowledged(false)
    resetDeleteMutation()
    onClose()
  }

  const {
    mutate: handleDeleteAuthenticator,
    isPending,
    isError,
    reset: resetDeleteMutation,
  } = useMutation({
    mutationFn: async () => {
      if (!initialState) {
        return false
      }
      return await deleteAuthenticatorWithPasskey({
        // deleteAuthenticatorWithPasskey only reads credentialId; cast to satisfy the protobuf class type
        authenticator: { credentialId: initialState.authenticatorId } as Authenticator,
        walletId: walletId ?? undefined,
      })
    },
    onSuccess: async (success) => {
      // Silent re-enable on falsy success is intentional: it corresponds to the user
      // cancelling the WebAuthn prompt. Real failures throw and surface via `isError` below.
      if (!success) {
        return
      }
      popupRegistry.addPopup(
        { type: PopupType.Success, message: t('notification.passkey.deleted') },
        'passkey-deleted-success',
        POPUP_MEDIUM_DISMISS_MS,
      )
      if (initialState?.isLastAuthenticator) {
        await disconnectWallet(walletId)
        disconnect()
        accountDrawer.close()
      }
      handleClose()
    },
    onError: (error) => {
      logger.error(error, { tags: { file: 'RemovePasskeyModal', function: 'handleDeleteAuthenticator' } })
    },
    onSettled: () => {
      resetListAuthenticators(queryClient, walletId)
    },
  })

  const handleNavigateToRecoveryPhrase = () => {
    handleClose()
    setMenuState({ variant: MenuStateVariant.RECOVERY_PHRASE_DOWNLOAD_PROMPT })
    if (!accountDrawer.isOpen) {
      accountDrawer.open()
    }
  }

  return (
    <Modal name={ModalName.DeletePasskey} isModalOpen={isOpen} onClose={handleClose} maxWidth={420}>
      <Flex gap="$gap16" alignItems="center" width="100%">
        {step === 'speedbump' && (
          <Trace logImpression modal={ModalName.DeletePasskeySpeedbump}>
            <Flex gap="$gap16" alignItems="center" width="100%">
              <Flex p="$gap12" borderRadius="$rounded12" backgroundColor="$statusCritical2">
                <WarningIcon color="$statusCritical" size={24} />
              </Flex>
              <Flex gap="$gap8" alignItems="center">
                <Text variant="subheading2" textAlign="center">
                  {t('account.passkey.delete.speedbump.title')}
                </Text>
                <Text variant="body3" color="$neutral2" textAlign="center">
                  {t('account.passkey.delete.speedbump.description')}
                </Text>
              </Flex>
              <Trace logPress element={ElementName.RecoveryPhraseShortcut}>
                <TouchableArea
                  width="100%"
                  borderRadius="$rounded16"
                  borderWidth={1}
                  borderColor="$surface3"
                  p="$padding12"
                  hoverStyle={{ backgroundColor: '$surface2' }}
                  onPress={handleNavigateToRecoveryPhrase}
                >
                  <Flex row alignItems="center" gap="$gap12">
                    <Flex
                      height={40}
                      width={40}
                      backgroundColor="$surface2"
                      borderRadius="$rounded12"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <FileListLock size={iconSizes.icon20} color="$neutral2" />
                    </Flex>
                    <Flex flex={1}>
                      <Text variant="body2" color="$neutral1">
                        {t('account.passkey.delete.speedbump.recoveryPhrase')}
                      </Text>
                      {lastExportedFormatted ? (
                        <Text variant="body3" color="$neutral2">
                          {t('account.passkey.delete.speedbump.lastViewed', { date: lastExportedFormatted })}
                        </Text>
                      ) : (
                        <Text variant="body3" color="$statusCritical">
                          {t('account.passkey.delete.speedbump.neverViewed')}
                        </Text>
                      )}
                    </Flex>
                    <RotatableChevron direction="end" size="$icon.20" color="$neutral3" />
                  </Flex>
                </TouchableArea>
              </Trace>
              <Flex row width="100%" gap="$gap8">
                <Trace logPress element={ElementName.Cancel}>
                  <Button flex={1} py="$padding12" variant="default" emphasis="secondary" onPress={handleClose}>
                    {t('common.button.cancel')}
                  </Button>
                </Trace>
                <Trace logPress element={ElementName.Continue}>
                  <Button
                    flex={1}
                    py="$padding12"
                    variant="critical"
                    emphasis="secondary"
                    onPress={() => setStep('confirm')}
                  >
                    <Text variant="buttonLabel3" color="$statusCritical">
                      {t('common.button.continue')}
                    </Text>
                  </Button>
                </Trace>
              </Flex>
            </Flex>
          </Trace>
        )}

        {step === 'confirm' && (
          <Trace logImpression modal={ModalName.DeletePasskey}>
            <Flex gap="$gap16" alignItems="center" width="100%">
              <Flex row width="100%" alignItems="center">
                <TouchableArea
                  onPress={() => {
                    setStep('speedbump')
                    setAcknowledged(false)
                    resetDeleteMutation()
                  }}
                  hoverStyle={{ opacity: 0.7 }}
                  testID={TestID.DeletePasskeyBack}
                >
                  <RotatableChevron direction="left" size="$icon.24" color="$neutral2" />
                </TouchableArea>
              </Flex>
              <Flex p="$gap12" borderRadius="$rounded12" backgroundColor="$statusCritical2">
                <Trash color="$statusCritical" size={24} />
              </Flex>
              <Flex gap="$gap8" alignItems="center">
                <Text variant="subheading2" textAlign="center">
                  {t('account.passkey.delete.title')}
                </Text>
                <Text variant="body3" color="$statusCritical" textAlign="center">
                  {t('account.passkey.delete.description')}
                </Text>
              </Flex>
              {evmAddress && (
                <Flex
                  width="100%"
                  borderColor="$surface3"
                  borderWidth={1}
                  borderRadius="$rounded16"
                  borderStyle="solid"
                  p="$padding4"
                >
                  <Flex row gap="$gap12" px="$padding8" py="$padding8" alignItems="center">
                    <StatusIcon size={24} showMiniIcons={false} />
                    <AddressDisplay address={evmAddress} />
                    <Text variant="body3" color="$neutral1" ml="auto" mr="0">
                      {convertFiatAmountFormatted(balanceUSD, NumberType.FiatTokenPrice)}
                    </Text>
                  </Flex>
                  {initialState && (
                    <Flex
                      row
                      gap="$gap8"
                      m="$spacing2"
                      px="$padding8"
                      py="$padding8"
                      backgroundColor="$statusCritical2"
                      borderBottomLeftRadius="$rounded12"
                      borderBottomRightRadius="$rounded12"
                      alignItems="center"
                    >
                      {getProviderIcon(initialState.authenticatorProvider)}
                      <Text variant="body3" color="$statusCritical">
                        {initialState.authenticatorLabel}
                      </Text>
                    </Flex>
                  )}
                </Flex>
              )}
              <Flex
                row
                gap="$gap12"
                width="100%"
                borderRadius="$rounded16"
                backgroundColor="$surface2"
                justifyContent="center"
                alignItems="center"
                p="$padding12"
              >
                <Trace logPress element={ElementName.DeletePasskeyAcknowledge}>
                  <Checkbox
                    size="$icon.16"
                    checked={acknowledged}
                    onPress={() => setAcknowledged((prev) => !prev)}
                    testID={TestID.DeletePasskeyAcknowledge}
                  />
                </Trace>
                <Text variant="body4" color="$neutral1">
                  {t('account.passkey.delete.acknowledge')}
                </Text>
              </Flex>
              {isError && (
                <Text variant="body3" color="$statusCritical" textAlign="center">
                  {t('common.card.error.description')}
                </Text>
              )}
              <Flex row justifyContent="space-between" width="100%" gap="$gap8">
                <Trace logPress element={ElementName.Cancel}>
                  <Button flex={1} py="$padding12" variant="default" emphasis="secondary" onPress={handleClose}>
                    {t('common.button.cancel')}
                  </Button>
                </Trace>
                <Trace logPress element={ElementName.DeletePasskey}>
                  <Button
                    flex={1}
                    py="$padding12"
                    variant="critical"
                    emphasis="primary"
                    icon={<Passkey color={acknowledged ? '$white' : '$neutral2'} size={16} />}
                    // Arrow wrapper needed: onPress passes GestureResponderEvent, but handleDeleteAuthenticator expects void
                    onPress={() => handleDeleteAuthenticator()}
                    disabled={!acknowledged || isPending}
                  >
                    {t('common.button.delete')}
                  </Button>
                </Trace>
              </Flex>
            </Flex>
          </Trace>
        )}
      </Flex>
    </Modal>
  )
}

export default RemovePasskeyModal
