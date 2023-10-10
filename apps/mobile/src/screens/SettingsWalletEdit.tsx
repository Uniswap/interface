import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { TextInput } from 'src/components/input/TextInput'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { Button, Flex, Icons, Text } from 'ui/src'
import { NICKNAME_MAX_LENGTH } from 'wallet/src/constants/accounts'
import { ChainId } from 'wallet/src/constants/chains'
import { useENS } from 'wallet/src/features/ens/useENS'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'
import { Screens } from './Screens'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsWalletEdit>

export function SettingsWalletEdit({
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const activeAccount = useAccounts()[address]
  const ensName = useENS(ChainId.Mainnet, address)?.name
  const [nickname, setNickname] = useState(ensName || activeAccount?.name)
  const [showEditInput, setShowEditInput] = useState(false)

  const handleNicknameUpdate = (): void => {
    Keyboard.dismiss()
    setShowEditInput(false)
    setNickname(nickname?.trim())
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Rename,
        address,
        newName: nickname?.trim() ?? '',
      })
    )
  }

  const onPressShowEditInput = (): void => {
    setShowEditInput(true)
  }

  return (
    <Screen>
      <BackHeader alignment="center" mx="$spacing16" pt="$spacing16">
        <Text variant="body1">{t('Nickname')}</Text>
      </BackHeader>
      <Flex gap="$spacing36" px="$spacing24" py="$spacing24">
        <Flex>
          <Flex row alignItems="center">
            {showEditInput ? (
              <TextInput
                autoFocus
                autoCapitalize="none"
                color={nickname === activeAccount?.name ? '$neutral3' : '$neutral1'}
                fontFamily="$heading"
                fontSize="$medium"
                margin="$none"
                maxLength={NICKNAME_MAX_LENGTH}
                numberOfLines={1}
                placeholder={shortenAddress(address)}
                placeholderTextColor="$neutral3"
                px="$none"
                py="$none"
                returnKeyType="done"
                value={nickname}
                width="100%"
                onChangeText={setNickname}
                onSubmitEditing={handleNicknameUpdate}
              />
            ) : (
              <Flex row alignItems="center" gap="$spacing16">
                {/* <Flex shrink> */}
                <Text color="$neutral1" variant="heading2">
                  {nickname || shortenAddress(address)}
                </Text>
                {/* </Flex> */}
                {!ensName && (
                  <Flex ml="$spacing12">
                    <Button
                      icon={<Icons.Pencil color="$neutral2" />}
                      size="medium"
                      theme="secondary"
                      onPress={onPressShowEditInput}
                    />
                  </Flex>
                )}
              </Flex>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Screen>
  )
}
