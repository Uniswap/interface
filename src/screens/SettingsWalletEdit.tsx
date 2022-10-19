import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@shopify/restyle'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { SettingsStackParamList } from 'src/app/navigation/types'
import PencilIcon from 'src/assets/icons/pencil.svg'
import { Button } from 'src/components/buttons/Button'
import { ColorSelector } from 'src/components/ColorSelector/ColorSelector'
import { useUpdateColorCallback } from 'src/components/ColorSelector/hooks'
import { TextInput } from 'src/components/input/TextInput'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'
import { Screens } from './Screens'

const EDIT_BUTTON_ICON_SIZE = 16

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
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    activeAccount?.customizations?.palette?.userThemeColor || theme.colors.userThemeColor
  )
  const updateThemeColor = useUpdateColorCallback()

  const updateColor = (color: string) => {
    setSelectedColor(color)
    updateThemeColor(activeAccount, color)
  }

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
        <Text variant="subheadLarge">{t('Nickname and theme')}</Text>
      </BackHeader>
      <Flex gap="xl" px="lg" py="lg">
        <Flex gap="none">
          <Box bg="backgroundBackdrop" pb="md">
            <Text color="textSecondary" variant="subheadLarge">
              {t('Nickname')}
            </Text>
          </Box>
          <Flex alignItems="center" flexDirection="row">
            {showEditInput ? (
              <TextInput
                autoFocus
                autoCapitalize="none"
                color={nickname === activeAccount?.name ? 'textTertiary' : 'textPrimary'}
                fontFamily={theme.textVariants.headlineMedium.fontFamily}
                fontSize={theme.textVariants.headlineMedium.fontSize}
                margin="none"
                numberOfLines={1}
                placeholder={shortenAddress(address)}
                placeholderTextColor={theme.colors.textTertiary}
                px="none"
                py="none"
                returnKeyType="done"
                value={nickname}
                width="100%"
                onChangeText={setNickname}
                onSubmitEditing={handleNicknameUpdate}
              />
            ) : (
              <>
                <Text color="textPrimary" variant="headlineMedium">
                  {nickname || shortenAddress(address)}
                </Text>
                {!ensName && (
                  <Button
                    alignItems="center"
                    bg="backgroundAction"
                    borderRadius="md"
                    justifyContent="center"
                    marginLeft="sm"
                    p="xs"
                    onPress={onPressShowEditInput}>
                    <PencilIcon
                      color={theme.colors.textPrimary}
                      height={EDIT_BUTTON_ICON_SIZE}
                      strokeWidth="1.5"
                      width={EDIT_BUTTON_ICON_SIZE}
                    />
                  </Button>
                )}
              </>
            )}
          </Flex>
        </Flex>
        <Flex gap="none">
          <Box bg="backgroundBackdrop" pb="md">
            <Text color="textSecondary" variant="subheadLarge">
              {t('Theme')}
            </Text>
          </Box>
          <Flex alignItems="center" flexDirection="row">
            <ColorSelector selectedColor={selectedColor} updateColor={updateColor} />
          </Flex>
        </Flex>
      </Flex>
    </Screen>
  )
}
