import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Flex, Text } from 'ui/src'
import { ShieldCheck } from 'ui/src/components/icons/ShieldCheck'
import { Trash } from 'ui/src/components/icons/Trash'
import { Modal } from 'uniswap/src/components/modals/Modal'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { Authenticator } from 'uniswap/src/features/passkey/embeddedWallet'
import {
  Action,
  authenticateWithPasskey,
  deleteAuthenticator,
  disconnectWallet,
} from 'uniswap/src/features/passkey/embeddedWallet'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { AddressDisplay } from '~/components/AccountDetails/AddressDisplay'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { LIST_AUTHENTICATORS_QUERY_KEY } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { StatusIcon } from '~/components/StatusIcon'
import { useDisconnect } from '~/hooks/useDisconnect'
import { useModalState } from '~/hooks/useModalState'
import { usePasskeyAuthWithHelpModal } from '~/hooks/usePasskeyAuthWithHelpModal'
import type { DeletePasskeyModalParams } from '~/state/application/reducer'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { useAppSelector } from '~/state/hooks'

type RemovePasskeyStep = 'verify' | 'speedbump' | 'confirm'

export function RemovePasskeyModal() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isOpen, onClose } = useModalState(ModalName.DeletePasskey)
  const disconnect = useDisconnect()
  const accountDrawer = useAccountDrawer()
  const evmAddress = useActiveAddress(Platform.EVM)
  const { data: portfolioTotalValue } = usePortfolioTotalValue({ evmAddress, svmAddress: undefined })
  const { balanceUSD } = portfolioTotalValue || {}
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const [step, setStep] = useState<RemovePasskeyStep>('verify')
  const [credential, setCredential] = useState<string | undefined>(undefined)
  const [acknowledged, setAcknowledged] = useState(false)

  const { walletId } = useEmbeddedWalletState()
  const initialState = useAppSelector(
    (state) => (state.application.openModal as DeletePasskeyModalParams | null)?.initialState,
  )

  const handleClose = () => {
    setStep('verify')
    setCredential(undefined)
    setAcknowledged(false)
    onClose()
  }

  const { mutate: verifyPasskey } = usePasskeyAuthWithHelpModal(
    async () => {
      return await authenticateWithPasskey(Action.DELETE_AUTHENTICATOR, {
        walletId: walletId ?? undefined,
        authenticatorId: initialState?.authenticatorId,
      })
    },
    {
      onSuccess: (existingCredential) => {
        setCredential(existingCredential)
        setStep('speedbump')
      },
    },
  )

  const { mutate: handleDeleteAuthenticator } = usePasskeyAuthWithHelpModal(
    async () => {
      if (!initialState) {
        return false
      }
      return await deleteAuthenticator({
        // deleteAuthenticator only reads credentialId; cast to satisfy the protobuf class type
        authenticator: { credentialId: initialState.authenticatorId } as Authenticator,
        credential,
      })
    },
    {
      onSuccess: async (success) => {
        if (success && initialState?.isLastAuthenticator) {
          await disconnectWallet(walletId)
          disconnect()
          accountDrawer.close()
        }
        handleClose()
      },
      onError: () => {
        handleClose()
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: [LIST_AUTHENTICATORS_QUERY_KEY] })
        setAcknowledged(false)
      },
    },
  )

  return (
    <Modal name={ModalName.DeletePasskey} isModalOpen={isOpen} onClose={handleClose} maxWidth={420}>
      <Flex gap="$gap16" alignItems="center" width="100%">
        {step === 'verify' && (
          <Trace logImpression modal={ModalName.DeletePasskey}>
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
        )}

        {step === 'speedbump' && (
          <Trace logImpression modal={ModalName.DeletePasskeySpeedbump}>
            <Flex p="$gap12" borderRadius="$rounded12" backgroundColor="$statusCritical2">
              <WarningIcon color="$statusCritical" size={24} />
            </Flex>
            <Flex gap="$gap8" alignItems="center">
              <Text variant="subheading2">{t('account.passkey.delete.speedbump.title')}</Text>
              <Flex display="inline">
                <Text variant="body3" color="$neutral2">
                  {t('account.passkey.delete.speedbump.description')}
                </Text>
              </Flex>
            </Flex>
            <Flex
              backgroundColor="$surface2"
              borderRadius="$rounded20"
              p="$spacing12"
              borderColor="$surface3"
              borderWidth={1}
              gap="$gap4"
            >
              <Flex row gap="$gap12">
                <Text variant="body3" color="$neutral2">
                  1
                </Text>
                <Text variant="body3" color="$neutral1">
                  {t('account.passkey.delete.speedbump.step1')}
                </Text>
              </Flex>
              <Flex row gap="$gap12">
                <Text variant="body3" color="$neutral2">
                  2
                </Text>
                <Text variant="body3" color="$neutral1">
                  {t('account.passkey.delete.speedbump.step2')}
                </Text>
              </Flex>
            </Flex>
            <Flex row alignSelf="stretch">
              <Trace logPress element={ElementName.Continue}>
                <Button py="$padding12" variant="critical" emphasis="secondary" onPress={() => setStep('confirm')}>
                  <Text variant="body3" color="$statusCritical">
                    {t('common.button.continue')}
                  </Text>
                </Button>
              </Trace>
            </Flex>
          </Trace>
        )}

        {step === 'confirm' && (
          <Trace logImpression modal={ModalName.DeletePasskey}>
            <Flex p="$gap12" borderRadius="$rounded12" backgroundColor="$statusCritical2">
              <Trash color="$statusCritical" size={24} />
            </Flex>
            <Flex gap="$gap8" alignItems="center">
              <Text variant="subheading2" textAlign="center">
                {t('account.passkey.delete.title')}
              </Text>
              <Text variant="body3" color="$neutral2" textAlign="center">
                {t('account.passkey.delete.description')}
              </Text>
              <Text variant="body3" color="$statusCritical" textAlign="center">
                {t('account.passkey.delete.descriptionEmphasized')}
              </Text>
            </Flex>
            {evmAddress && (
              <Flex
                row
                gap="$gap12"
                width="100%"
                p="$gap12"
                borderColor="$surface3"
                borderWidth={1}
                borderRadius="$rounded12"
                borderStyle="solid"
              >
                <StatusIcon size={24} showMiniIcons={false} />
                <AddressDisplay address={evmAddress} />
                <Text variant="body3" color="$statusCritical" ml="auto" mr="0">
                  {convertFiatAmountFormatted(balanceUSD, NumberType.FiatTokenPrice)}
                </Text>
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
            <Flex row justifyContent="space-between" width="100%" gap="$gap8">
              <Trace logPress element={ElementName.Cancel}>
                <Button py="$padding12" variant="default" emphasis="secondary" onPress={handleClose}>
                  {t('common.button.cancel')}
                </Button>
              </Trace>
              <Trace logPress element={ElementName.DeletePasskey}>
                <Button
                  py="$padding12"
                  variant="critical"
                  emphasis="primary"
                  // Arrow wrapper needed: onPress passes GestureResponderEvent, but handleDeleteAuthenticator expects void
                  onPress={() => handleDeleteAuthenticator()}
                  isDisabled={!acknowledged}
                >
                  {t('common.button.delete')}
                </Button>
              </Trace>
            </Flex>
          </Trace>
        )}
      </Flex>
    </Modal>
  )
}

export default RemovePasskeyModal
