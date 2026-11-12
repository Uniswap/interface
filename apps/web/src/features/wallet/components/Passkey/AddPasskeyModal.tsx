import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Platform } from '@universe/chains'
import {
  AuthenticatorAttachment,
  registerNewAuthenticator,
  startAddAuthenticatorSession,
  useEmbeddedWalletState,
} from '@universe/embedded-wallet'
import { Button, Flex, Text, TouchableArea, Loader } from '@universe/mycelium'
import { Chevron } from '@universe/mycelium/icons/Chevron'
import { Cloud } from '@universe/mycelium/icons/Cloud'
import { Mobile } from '@universe/mycelium/icons/Mobile'
import { Passkey } from '@universe/mycelium/icons/Passkey'
import { ShieldCheck } from '@universe/mycelium/icons/ShieldCheck'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { logger } from 'utilities/src/logger/logger'
import { useActiveAddress } from '~/connection/accounts/hooks'
import { useListAuthenticatorsQuery } from '~/features/wallet/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery'
import { resetListAuthenticators } from '~/features/wallet/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { useModalState } from '~/hooks/useModalState'
import { POPUP_MEDIUM_DISMISS_MS } from '~/utils/popups/constants'
import { popupRegistry } from '~/utils/popups/registry'
import { PopupType } from '~/utils/popups/types'

type AddPasskeyStep = 'verify' | 'choose'

export function AddPasskeyModal() {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const queryClient = useQueryClient()
  const { isOpen, onClose } = useModalState(ModalName.AddPasskey)
  const { walletId } = useEmbeddedWalletState()
  const evmAddress = useActiveAddress(Platform.EVM)
  const [step, setStep] = useState<AddPasskeyStep>('verify')

  const { data: unitag, isLoading: unitagLoading } = useUnitagsAddressQuery({
    params: evmAddress ? { address: evmAddress } : undefined,
  })

  const { data: listAuthenticatorsData } = useListAuthenticatorsQuery()

  const handleClose = () => {
    setStep('verify')
    onClose()
  }

  const { mutate: verifyPasskey } = useMutation({
    mutationFn: async () => {
      return await startAddAuthenticatorSession(walletId ?? undefined)
    },
    onSuccess: () => setStep('choose'),
    onError: (error) => {
      logger.error(error, { tags: { file: 'AddPasskeyModal', function: 'verifyPasskey' } })
    },
  })

  const { mutate: registerAuthenticator } = useMutation({
    mutationFn: async (authenticatorAttachment: AuthenticatorAttachment) => {
      const existingCount = listAuthenticatorsData?.authenticators.length ?? 0
      const displayName =
        unitag?.username ?? (evmAddress ? `${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}` : undefined)
      const newPasskeyUsername = displayName ? `${displayName} (${existingCount + 1})` : undefined
      return await registerNewAuthenticator({
        authenticatorAttachment,
        username: newPasskeyUsername,
        walletId: walletId ?? undefined,
      })
    },
    onSuccess: () => {
      popupRegistry.addPopup(
        { type: PopupType.Success, message: t('notification.passkey.added') },
        'passkey-added-success',
        POPUP_MEDIUM_DISMISS_MS,
      )
    },
    onError: (error) => {
      logger.error(error, { tags: { file: 'AddPasskeyModal', function: 'registerAuthenticator' } })
      popupRegistry.addPopup(
        { type: PopupType.Error, error: t('notification.passkey.add.failed') },
        'passkey-add-error',
        POPUP_MEDIUM_DISMISS_MS,
      )
    },
    onSettled: () => {
      resetListAuthenticators(queryClient, walletId)
      handleClose()
    },
  })

  return (
    <Modal name={ModalName.AddPasskey} isModalOpen={isOpen} onClose={handleClose} maxWidth={420}>
      <Flex gap="$gap16" alignItems="center" width="100%">
        {step === 'verify' ? (
          <Trace logImpression modal={ModalName.AddPasskey}>
            <Flex gap="$gap16" alignItems="center" px="$spacing4" width="100%">
              <Flex
                p="$spacing12"
                backgroundColor="$surface2"
                borderRadius="$rounded12"
                alignItems="center"
                justifyContent="center"
              >
                <ShieldCheck size="$icon.24" color="$neutral1" />
              </Flex>

              <Flex gap="$gap8" alignItems="center">
                <Text variant="subheading1" textAlign="center">
                  {t('account.passkey.verify.title')}
                </Text>
                <Text variant="body2" textAlign="center" color="$neutral2">
                  {t('account.passkey.verify.description')}
                </Text>
              </Flex>

              <Flex row alignSelf="stretch" mt="$spacing8">
                <Trace logPress element={ElementName.Confirm}>
                  {/* Arrow wrapper needed: onPress passes GestureResponderEvent, but verifyPasskey expects void */}
                  <Button variant="default" size="medium" onPress={() => verifyPasskey()}>
                    {t('account.passkey.verify.button')}
                  </Button>
                </Trace>
              </Flex>
            </Flex>
          </Trace>
        ) : (
          <Trace logImpression modal={ModalName.AddPasskey}>
            <Flex
              alignItems="center"
              justifyContent="center"
              backgroundColor="$surface2"
              borderRadius="$rounded12"
              p="$padding12"
              width="min-content"
            >
              <Passkey size="$icon.24" color="$neutral1" />
            </Flex>
            <Flex gap="$gap8" pb="$padding8">
              <Text textAlign="center" variant="subheading1">
                {t('common.passkeys.add')}
              </Text>
              <Text textAlign="center" variant="body3" color="$neutral2">
                {t('common.passkeys.add.description')}
              </Text>
            </Flex>
            <Trace logPress element={ElementName.AddPasskeyPlatform}>
              <TouchableArea
                onPress={() => registerAuthenticator(AuthenticatorAttachment.PLATFORM)}
                width="100%"
                disabled={unitagLoading}
              >
                {unitagLoading ? (
                  <Loader.Box height={40} width={250} />
                ) : (
                  <Flex row gap="$gap12" justifyContent="center" alignItems="center" width="100%">
                    <Flex p="$padding6" background={colors.pinkLight.val} borderRadius="$rounded6" height="min-content">
                      <Cloud size="$icon.20" color="$accent1" />
                    </Flex>
                    <Flex>
                      <Text variant="body2">{t('common.device')}</Text>
                      <Text variant="body3" color="$neutral2">
                        {t('account.passkey.type.platform')}
                      </Text>
                    </Flex>
                    <Chevron size="$icon.16" color="$neutral2" rotate="180deg" ml="auto" />
                  </Flex>
                )}
              </TouchableArea>
            </Trace>
            <Trace logPress element={ElementName.AddPasskeyCrossPlatform}>
              <TouchableArea
                onPress={() => registerAuthenticator(AuthenticatorAttachment.CROSS_PLATFORM)}
                width="100%"
                disabled={unitagLoading}
              >
                {unitagLoading ? (
                  <Loader.Box height={40} width={250} />
                ) : (
                  <Flex row gap="$gap12" justifyContent="center" alignItems="center" width="100%">
                    <Flex p="$padding6" background={colors.pinkLight.val} borderRadius="$rounded6" height="min-content">
                      <Mobile size="$icon.20" color="$accent1" />
                    </Flex>
                    <Flex>
                      <Text variant="body2">{t('common.device.other')}</Text>
                      <Text variant="body3" color="$neutral2">
                        {t('account.passkey.type.crossplatform')}
                      </Text>
                    </Flex>
                    <Chevron size="$icon.16" color="$neutral2" rotate="180deg" ml="auto" />
                  </Flex>
                )}
              </TouchableArea>
            </Trace>
          </Trace>
        )}
      </Flex>
    </Modal>
  )
}

export default AddPasskeyModal
