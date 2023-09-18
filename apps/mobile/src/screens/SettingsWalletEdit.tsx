import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { TextInput } from 'src/components/input/TextInput'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { Flex, Text, useSporeColors } from 'ui/src'
import PencilIcon from 'ui/src/assets/icons/pencil.svg'
import { fonts } from 'ui/src/theme'
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
  const colors = useSporeColors()
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
        <Text variant="bodyLarge">{t('Nickname')}</Text>
      </BackHeader>
      <Flex gap="$spacing36" px="$spacing24" py="$spacing24">
        <Flex gap="$none">
          <Flex row alignItems="center">
            {showEditInput ? (
              <TextInput
                autoFocus
                autoCapitalize="none"
                color={nickname === activeAccount?.name ? 'neutral3' : 'neutral1'}
                fontFamily={fonts.headlineMedium.family}
                fontSize={fonts.headlineMedium.fontSize}
                margin="none"
                maxLength={NICKNAME_MAX_LENGTH}
                numberOfLines={1}
                placeholder={shortenAddress(address)}
                placeholderTextColor={colors.neutral3.val}
                px="none"
                py="none"
                returnKeyType="done"
                value={nickname}
                width="100%"
                onChangeText={setNickname}
                onSubmitEditing={handleNicknameUpdate}
              />
            ) : (
              <Flex row alignItems="center">
                <Flex shrink>
                  <Text color="$neutral1" variant="headlineMedium">
                    {nickname || shortenAddress(address)}
                  </Text>
                </Flex>
                {!ensName && (
                  <Flex gap="$none" ml="$spacing12">
                    <Button
                      IconName={PencilIcon}
                      emphasis={ButtonEmphasis.Secondary}
                      size={ButtonSize.Small}
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
