import React, { ReactElement, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import X from 'src/assets/icons/x.svg'
import { AnimatedButton } from 'src/components/buttons/Button'
import { IconButton } from 'src/components/buttons/IconButton'
import { TextInput } from 'src/components/input/TextInput'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'
import SearchIcon from '../../assets/icons/search.svg'

export interface SearchTextInputProps {
  value: string | null
  onChangeText: (newText: string) => void
  onFocus?: () => void
  onBlur?: () => void
  backgroundColor?: keyof Theme['colors']
  clearIcon?: ReactElement
  disableClearable?: boolean
  endAdornment?: ReactElement
  placeholder?: string
}

export function SearchTextInput(props: SearchTextInputProps) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const {
    backgroundColor = 'neutralSurface',
    clearIcon,
    disableClearable,
    endAdornment = (
      <SearchIcon color={theme.colors.neutralTextTertiary} height={20} strokeWidth={2} width={20} />
    ),
    onBlur,
    onChangeText,
    onFocus,
    placeholder,
    value,
  } = props

  const [isEditing, setIsEditing] = useState(false)
  const showClearButton = value && !disableClearable

  return (
    <Flex centered row>
      <Flex
        row
        alignItems="center"
        backgroundColor={backgroundColor}
        borderRadius="lg"
        flex={1}
        flexGrow={1}
        gap="sm"
        minHeight={48}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          backgroundColor="none"
          borderWidth={0}
          flex={1}
          fontSize={16}
          fontWeight="500"
          placeholder={placeholder}
          placeholderTextColor={theme.colors.neutralTextTertiary}
          value={value ?? undefined}
          onBlur={() => {
            setIsEditing(false)
            onBlur?.()
          }}
          onChangeText={onChangeText}
          onFocus={() => {
            setIsEditing(true)
            onFocus?.()
          }}
        />
        <Box mr="md">
          {showClearButton ? (
            <ClearButton clearIcon={clearIcon} onPress={() => onChangeText('')} />
          ) : (
            endAdornment
          )}
        </Box>
      </Flex>
      {isEditing && (
        <AnimatedButton
          entering={FadeIn}
          exiting={FadeOut}
          onPress={() => {
            setIsEditing(false)
            onChangeText('')
            Keyboard.dismiss()
          }}>
          <Text variant={'subHead1'}>{t('Cancel')}</Text>
        </AnimatedButton>
      )}
    </Flex>
  )
}

interface ClearButtonProps {
  clearIcon: SearchTextInputProps['clearIcon']
  onPress: () => void
}

function ClearButton(props: ClearButtonProps) {
  const theme = useAppTheme()

  const {
    onPress,
    clearIcon = (
      <X color={theme.colors.neutralTextSecondary} height={10} strokeWidth={4} width={10} />
    ),
  } = props

  return (
    <IconButton bg="neutralSurface" borderRadius="full" icon={clearIcon} p="xs" onPress={onPress} />
  )
}
