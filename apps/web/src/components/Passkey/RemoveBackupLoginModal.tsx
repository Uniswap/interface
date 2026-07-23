import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { deleteRecoveryMethod } from 'uniswap/src/features/passkey/embeddedWallet'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { getRecoveryMethodLabel } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { useModalState } from '~/hooks/useModalState'
import type { RemoveBackupLoginModalParams } from '~/state/application/reducer'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { useAppSelector } from '~/state/hooks'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

export function RemoveBackupLoginModal() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isOpen, onClose } = useModalState(ModalName.RemoveBackupLogin)
  const { walletId: sessionWalletId } = useEmbeddedWalletState()

  const initialState = useAppSelector(
    (state) => (state.application.openModal as RemoveBackupLoginModalParams | null)?.initialState,
  )
  // Prefer an explicit walletId (recover-with-email rotation has no active session).
  const walletId = initialState?.walletId ?? sessionWalletId

  const providerLabel = initialState?.recoveryMethodType ? getRecoveryMethodLabel(initialState.recoveryMethodType) : ''

  const { mutate: handleRemove, isPending } = useMutation({
    mutationFn: async () => {
      if (!walletId) {
        throw new Error('No walletId available')
      }
      return await deleteRecoveryMethod(walletId)
    },
    onSuccess: () => {
      popupRegistry.addPopup(
        { type: PopupType.Success, message: t('notification.backupLogin.deleted') },
        'backup-login-deleted-success',
        POPUP_MEDIUM_DISMISS_MS,
      )
      queryClient.invalidateQueries({ queryKey: [ReactQueryCacheKey.ListAuthenticators] })
      onClose()
    },
    onError: (error) => {
      logger.error(error, { tags: { file: 'RemoveBackupLoginModal', function: 'handleRemove' } })
    },
  })

  return (
    <Modal name={ModalName.RemoveBackupLogin} isModalOpen={isOpen} onClose={onClose} maxWidth={420}>
      <Trace logImpression modal={ModalName.RemoveBackupLogin}>
        <Flex gap="$gap16" alignItems="center" width="100%">
          <Flex p="$spacing12" backgroundColor="$statusCritical2" borderRadius="$rounded12">
            <WarningIcon color="$statusCritical" size={24} />
          </Flex>

          <Flex gap="$gap8" alignItems="center">
            <Text variant="subheading1" textAlign="center">
              {t('account.passkey.backupLogin.remove.title')}
            </Text>
            <Text variant="body2" textAlign="center" color="$neutral2">
              {initialState?.recoveryMethodIdentifier
                ? t('account.passkey.backupLogin.remove.description', {
                    provider: providerLabel,
                    identifier: initialState.recoveryMethodIdentifier,
                  })
                : t('account.passkey.backupLogin.remove.descriptionNoIdentifier', {
                    provider: providerLabel,
                  })}
            </Text>
          </Flex>

          <Flex row justifyContent="space-between" width="100%" gap="$gap8">
            <Trace logPress element={ElementName.Cancel}>
              <Button variant="default" emphasis="secondary" size="medium" onPress={onClose}>
                {t('common.button.cancel')}
              </Button>
            </Trace>
            <Trace logPress element={ElementName.RemoveBackupLogin}>
              <Button
                variant="critical"
                emphasis="primary"
                size="medium"
                onPress={() => handleRemove()}
                isDisabled={isPending}
                loading={isPending}
              >
                {t('common.button.remove')}
              </Button>
            </Trace>
          </Flex>
        </Flex>
      </Trace>
    </Modal>
  )
}

export default RemoveBackupLoginModal
