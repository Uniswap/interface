import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OpaqueColorValue } from 'react-native'
import { DeprecatedButton, Flex, Text, getUniconColors, useIsDarkMode } from 'ui/src'
import { iconSizes, opacify } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { shortenAddress } from 'utilities/src/addresses'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
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
  const isDark = useIsDarkMode()

  const [inputText, setInputText] = useState<string>('')

  const nextDerivationIndex = pendingWallet?.derivationIndex
  const onboardingAccountAddress = pendingWallet?.address

  const onPressConfirm = useCallback(() => {
    onConfirm(inputText)
  }, [inputText, onConfirm])

  const placeholderText = nextDerivationIndex
    ? t('account.wallet.create.placeholder', { index: nextDerivationIndex + 1 })
    : ''

  const { color: uniconColor } = onboardingAccountAddress
    ? getUniconColors(onboardingAccountAddress, isDark)
    : { color: '' }

  // Cast because DeprecatedButton component doesnt acccept sytling outside of theme color values for hover and press states
  const hoverAndPressButtonStyle = useMemo(() => {
    return {
      backgroundColor: opacify(15, uniconColor) as unknown as OpaqueColorValue,
    }
  }, [uniconColor])

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
              {shortenAddress(onboardingAccountAddress)}
            </Text>
          )}
        </Flex>

        <Flex centered fill row gap="$spacing12" justifyContent="space-between" width="100%">
          <DeprecatedButton color="$neutral1" flex={1} flexBasis={1} size="small" theme="secondary" onPress={onCancel}>
            {t('common.button.cancel')}
          </DeprecatedButton>
          <DeprecatedButton
            flex={1}
            flexBasis={1}
            hoverStyle={hoverAndPressButtonStyle}
            pressStyle={hoverAndPressButtonStyle}
            size="small"
            style={{ color: uniconColor, backgroundColor: opacify(10, uniconColor) }}
            onPress={onPressConfirm}
          >
            {t('common.button.create')}
          </DeprecatedButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
