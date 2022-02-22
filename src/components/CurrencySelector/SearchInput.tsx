import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import SearchIcon from 'src/assets/icons/search.svg'
import { TextInput } from 'src/components/input/TextInput'
import { Box } from 'src/components/layout/Box'

interface CurrencySearchTextInputProps {
  value: string | null
  onChangeText: (newSearchFilter: string) => void
}

export function CurrencySearchTextInput({ onChangeText, value }: CurrencySearchTextInputProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  return (
    <Box
      backgroundColor="gray50"
      borderRadius="lg"
      flex={1}
      flexDirection="row"
      height={50}
      minHeight={48}
      paddingRight="md">
      <TextInput
        backgroundColor="none"
        borderWidth={0}
        flex={1}
        fontSize={16}
        fontWeight="500"
        placeholder={t('Search token symbols or address')}
        placeholderTextColor="gray400"
        value={value ?? undefined}
        onChangeText={onChangeText}
      />
      <SearchIcon stroke={theme.colors.gray600} strokeWidth={2} style={styles.inputIcon} />
    </Box>
  )
}

const styles = StyleSheet.create({
  inputIcon: {
    alignSelf: 'center',
  },
})
