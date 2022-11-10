import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@shopify/restyle'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { SettingsStackParamList } from 'src/app/navigation/types'
import PencilIcon from 'src/assets/icons/pencil.svg'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { TextInput } from 'src/components/input/TextInput'
import { Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { NICKNAME_MAX_LENGTH } from 'src/constants/accounts'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts } from 'src/features/wallet/hooks'
import { flex } from 'src/styles/flex'
import { shortenAddress } from 'src/utils/addresses'
import { Screens } from './Screens'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsWalletEdit>

export function SettingsWalletEdit({
  route: {
    params: { address },
  },
}: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const theme = useTheme()
  const activeAccount = useAccounts()[address]
  const ensName = useENS(ChainId.Mainnet, address)?.name
  const [nickname, setNickname] = useState(ensName || activeAccount?.name)
  const [showEditInput, setShowEditInput] = useState(false)

  const handleNicknameUpdate = () => {
    Keyboard.dismiss()
    setShowEditInput(false)
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Rename,
        address,
        newName: nickname ?? '',
      })
    )
  }

  const onPressShowEditInput = () => {
    setShowEditInput(true)
  }

  return (
    <Screen>
      <BackHeader alignment="left" mx="md" pt="md">
        <Text variant="subheadLarge">{t('Nickname')}</Text>
      </BackHeader>
      <Flex row alignItems="center" p="lg">
        {showEditInput ? (
          <TextInput
            autoFocus
            autoCapitalize="none"
            color={nickname === activeAccount?.name ? 'textTertiary' : 'textPrimary'}
            fontFamily={theme.textVariants.headlineMedium.fontFamily}
            fontSize={theme.textVariants.headlineMedium.fontSize}
            margin="none"
            maxLength={NICKNAME_MAX_LENGTH}
            placeholder={shortenAddress(address)}
            placeholderTextColor={theme.colors.textTertiary}
            px="none"
            py="none"
            returnKeyType="done"
            value={nickname}
            onChangeText={setNickname}
            onSubmitEditing={handleNicknameUpdate}
          />
        ) : (
          <>
            <Text color="textPrimary" style={flex.shrink} variant="headlineMedium">
              {nickname || shortenAddress(address)}
            </Text>
            {!ensName && (
              <Box ml="sm">
                <Button
                  IconName={PencilIcon}
                  emphasis={ButtonEmphasis.Secondary}
                  size={ButtonSize.Small}
                  onPress={onPressShowEditInput}
                />
              </Box>
            )}
          </>
        )}
      </Flex>
    </Screen>
  )
}
