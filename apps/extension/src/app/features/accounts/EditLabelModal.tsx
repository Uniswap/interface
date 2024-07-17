import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { shortenAddress } from 'utilities/src/addresses'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'
import { useAppDispatch } from 'wallet/src/state'

type EditLabelModalProps = {
  address: Address
  onClose: () => void
}

export function EditLabelModal({ address, onClose }: EditLabelModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const displayName = useDisplayName(address)
  const defaultText = displayName?.type === DisplayNameType.Local ? displayName.name : ''

  const [inputText, setInputText] = useState<string>(defaultText)
  const [isfocused, setIsFocused] = useState(false)

  const onConfirm = useCallback(async () => {
    await dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Rename,
        address,
        newName: inputText,
      }),
    )
    onClose()
  }, [address, dispatch, inputText, onClose])

  return (
    <BottomSheetModal name={ModalName.AccountEditLabel} onClose={onClose}>
      <Flex centered fill borderRadius="$rounded16" gap="$spacing24" mt="$spacing16">
        <Flex centered gap="$spacing12" width="100%">
          <AccountIcon address={address} size={iconSizes.icon48} />
          <Flex borderColor="$surface3" borderRadius="$rounded16" borderWidth="$spacing1" width="100%">
            <TextInput
              autoFocus
              borderRadius="$rounded16"
              placeholder={isfocused ? '' : t('account.wallet.edit.label.input.placeholder')}
              textAlign="center"
              value={inputText}
              width="100%"
              onBlur={() => setIsFocused(false)}
              onChangeText={setInputText}
              onFocus={() => setIsFocused(true)}
            />
          </Flex>
          <Text color="$neutral3" variant="body2">
            {shortenAddress(address)}
          </Text>
        </Flex>
        <Flex centered fill row gap="$spacing12" justifyContent="space-between" width="100%">
          <Button color="$neutral1" flex={1} flexBasis={1} size="small" theme="secondary" onPress={onClose}>
            {t('common.button.cancel')}
          </Button>
          <Button flex={1} flexBasis={1} size="small" theme="accentSecondary" onPress={onConfirm}>
            {t('common.button.save')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
