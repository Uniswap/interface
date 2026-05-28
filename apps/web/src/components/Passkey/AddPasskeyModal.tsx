import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Loader, Text, TouchableArea } from 'ui/src'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { Cloud } from 'ui/src/components/icons/Cloud'
import { Mobile } from 'ui/src/components/icons/Mobile'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { ShieldCheck } from 'ui/src/components/icons/ShieldCheck'
import { colors } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import {
  AuthenticatorAttachment,
  registerNewAuthenticator,
  startAddAuthenticatorSession,
} from 'uniswap/src/features/passkey/embeddedWallet'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { logger } from 'utilities/src/logger/logger'
import { useListAuthenticatorsQuery } from '~/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery'
import { resetListAuthenticators } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { useAccount } from '~/hooks/useAccount'
import { useModalState } from '~/hooks/useModalState'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'

type AddPasskeyStep = 'verify' | 'choose'

export function AddPasskeyModal() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isOpen, onClose } = useModalState(ModalName.AddPasskey)
  const { walletId } = useEmbeddedWalletState()
  const account = useAccount()
  const [step, setStep] = useState<AddPasskeyStep>('verify')

  const { data: unitag, isLoading: unitagLoading } = useUnitagsAddressQuery({
    params: account.address ? { address: account.address } : undefined,
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
        unitag?.username ??
        (account.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : undefined)
      const newPasskeyUsername = displayName ? `${displayName} (${existingCount + 1})` : undefined
      return await registerNewAuthenticator({
        authenticatorAttachment,
        username: newPasskeyUsername,
        walletId: walletId ?? undefined,
      })
    },
    onError: (error) => {
      logger.error(error, { tags: { file: 'AddPasskeyModal', function: 'registerAuthenticator' } })
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
            <Flex gap="$gap16" alignItems="center" px="$padding4" width="100%">
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

              <Flex row alignSelf="stretch">
                <Trace logPress element={ElementName.Confirm}>
                  {/* Arrow wrapper needed: onPress passes GestureResponderEvent, but verifyPasskey expects void */}
                  <Button variant="default" size="medium" onPress={() => verifyPasskey()} mt="$spacing8">
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
              background="$surface2"
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
                    <Flex p="$padding6" background={colors.pinkLight} borderRadius="$rounded6" height="min-content">
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
                    <Flex p="$padding6" background={colors.pinkLight} borderRadius="$rounded6" height="min-content">
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
