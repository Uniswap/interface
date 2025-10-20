import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { shortenAddress } from 'utilities/src/addresses'
import { SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'

type CreateWalletModalProps = {
  isOpen: boolean
  pendingWallet?: SignerMnemonicAccount
  onCancel: () => void
  onConfirm: (walletLabel: string) => void
}

// Expects a pending account to be created before opening this modal
export function CreateWalletModal({
  isOpen,
  pendingWallet,
  onCancel,
  onConfirm,
}: CreateWalletModalProps): JSX.Element | null {
  const { t } = useTranslation()

  const [inputText, setInputText] = useState<string>('')

  const nextDerivationIndex = pendingWallet?.derivationIndex
  const onboardingAccountAddress = pendingWallet?.address

  const onPressConfirm = useCallback(() => {
    onConfirm(inputText)
  }, [inputText, onConfirm])

  const placeholderText = nextDerivationIndex
    ? t('account.wallet.create.placeholder', { index: nextDerivationIndex + 1 })
    : ''

  return (
    <Modal isModalOpen={isOpen} name={ModalName.AccountEditLabel} onClose={onCancel}>
      <Flex centered fill borderRadius="$rounded16" gap="$spacing24" mt="$spacing16">
        <Flex centered gap="$spacing12" width="100%">
          {onboardingAccountAddress && <AccountIcon address={onboardingAccountAddress} size={iconSizes.icon48} />}
          <Flex borderColor="$surface3" borderRadius="$rounded16" borderWidth="$spacing1" width="100%">
            <TextInput
              autoFocus
              borderRadius="$rounded16"
              placeholder={placeholderText}
              py="$spacing12"
              textAlign="center"
              value={inputText}
              width="100%"
              onChangeText={setInputText}
            />
          </Flex>
          {onboardingAccountAddress && (
            <Text color="$neutral3" variant="body3">
              {shortenAddress({ address: onboardingAccountAddress })}
            </Text>
          )}
        </Flex>

        <Flex row alignSelf="stretch" gap="$spacing12">
          <Button size="small" emphasis="secondary" onPress={onCancel}>
            {t('common.button.cancel')}
          </Button>
          <Button variant="branded" emphasis="secondary" size="small" onPress={onPressConfirm}>
            {t('common.button.create')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
