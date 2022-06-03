import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box, Flex } from 'src/components/layout'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { editAccount } from 'src/features/wallet/walletSlice'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectColor>

const COLORS = [
  '#FC72FF',
  '#FADE4D',
  '#B1F13C',
  '#33CFF1',
  '#6100FF',
  '#F13333',
  '#FF6F1E',
  '#5CFE9D',
  '#3E68FF',
  '#C0C0C0',
]

// Detect next view based on import account type
function useNextOnboardingScreen(currentScreen: OnboardingScreens) {
  const activeAccount = useActiveAccount()

  switch (currentScreen) {
    case OnboardingScreens.SelectColor:
      if (activeAccount?.type === AccountType.Native) {
        return OnboardingScreens.Backup
      }
      return OnboardingScreens.Notifications
    default:
      undefined
  }
}

export function SelectColorScreen({ navigation }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccount()

  // only show backup flow if importing accounts from seed phrase, assume new accounts activated.
  const nextScreen = useNextOnboardingScreen(OnboardingScreens.SelectColor)

  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined)

  const onPressNext = useCallback(() => {
    if (activeAccount && selectedColor && nextScreen) {
      dispatch(
        editAccount({
          address: activeAccount.address,
          updatedAccount: {
            ...activeAccount,
            customizations: {
              ...activeAccount.customizations,
              palette: {
                ...(activeAccount?.customizations?.palette ?? {
                  deprecated_secondary1: 'deprecated_secondary1',
                  deprecated_background1: 'deprecated_background1',
                  deprecated_textColor: 'deprecated_textColor',
                }),
                deprecated_primary1: selectedColor,
              },
            },
          },
        })
      )
      navigation.navigate(nextScreen)
    }
  }, [activeAccount, dispatch, navigation, nextScreen, selectedColor])

  const renderItem = useCallback(
    ({ item: color }: ListRenderItemInfo<string>) => (
      <Button
        borderRadius="full"
        borderWidth={selectedColor === color ? 1 : 1}
        my="sm"
        name={ElementName.SelectColor + '-' + color}
        padding="sm"
        style={{
          borderColor: selectedColor === color ? color : theme.colors.none,
        }}
        testID={ElementName.SelectColor + '-' + color}
        onPress={() => setSelectedColor(color)}>
        <Box
          borderRadius="full"
          height={28}
          style={{
            backgroundColor: color,
          }}
          width={28}
        />
      </Button>
    ),
    [selectedColor, theme.colors.none]
  )

  return (
    <OnboardingScreen
      stepCount={4}
      stepNumber={1}
      subtitle={t(
        'Make your wallet feel like you by selecting a color. We’ll generate a special gradient based on your address'
      )}
      title={t('Choose a color')}>
      <FlatList
        columnWrapperStyle={ColumnStyle.base}
        data={COLORS}
        keyExtractor={(color) => color}
        numColumns={5}
        renderItem={renderItem}
      />
      <Flex grow justifyContent="flex-end">
        <PrimaryButton
          disabled={!selectedColor}
          label={t('Next')}
          name={ElementName.Next}
          testID={ElementName.Next}
          variant="onboard"
          onPress={onPressNext}
        />
      </Flex>
    </OnboardingScreen>
  )
}

const ColumnStyle = StyleSheet.create({
  base: {
    justifyContent: 'space-around',
  },
})
