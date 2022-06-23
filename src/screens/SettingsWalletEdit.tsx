import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@shopify/restyle'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { SettingsStackParamList } from 'src/app/navigation/types'
import PencilIcon from 'src/assets/icons/pencil.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { TextInput } from 'src/components/input/TextInput'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'
import { Screens } from './Screens'
const EDIT_BUTTON_SIZE = 30
const EDIT_BUTTON_ICON_SIZE = 10

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
    <Screen px="lg" py="lg">
      <Flex alignItems="center" flexDirection="row" mb="xl">
        <BackButton color="textSecondary" />
        <Text variant="largeLabel">{t('Edit nickname or theme')}</Text>
      </Flex>
      <Flex gap="xl">
        <Flex gap="none">
          <Box bg="mainBackground" pb="md">
            <Text color="textSecondary" fontWeight="500" variant="body1">
              {t('Nickname')}
            </Text>
          </Box>
          <Flex alignItems="center" flexDirection="row">
            {showEditInput ? (
              <TextInput
                autoFocus
                autoCapitalize="none"
                fontFamily={theme.textVariants.largeLabel.fontFamily}
                fontSize={theme.textVariants.largeLabel.fontSize}
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
                <Text color={nickname ? 'mainForeground' : 'textTertiary'} variant="largeLabel">
                  {nickname || shortenAddress(address)}
                </Text>
                {!ensName && (
                  <Button
                    alignItems="center"
                    bg="translucentBackground"
                    borderRadius="full"
                    height={EDIT_BUTTON_SIZE}
                    justifyContent="center"
                    marginLeft="sm"
                    width={EDIT_BUTTON_SIZE}
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
        {/* TODO: Theme edit */}
      </Flex>
    </Screen>
  )
}
