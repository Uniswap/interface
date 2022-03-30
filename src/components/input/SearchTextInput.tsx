import React, { ReactElement } from 'react'
import { useAppTheme } from 'src/app/hooks'
import X from 'src/assets/icons/x.svg'
import { IconButton } from 'src/components/buttons/IconButton'
import { TextInput } from 'src/components/input/TextInput'
import { Box, Flex } from 'src/components/layout'
import SearchIcon from '../../assets/icons/search.svg'

export interface SearchTextInputProps {
  value: string | null
  onChangeText: (newText: string) => void

  clearIcon?: ReactElement
  disableClearable?: boolean
  endAdornment?: ReactElement
  placeholder?: string
}

export function SearchTextInput(props: SearchTextInputProps) {
  const theme = useAppTheme()

  const {
    clearIcon,
    disableClearable,
    endAdornment = (
      <SearchIcon height={20} stroke={theme.colors.gray600} strokeWidth={2} width={20} />
    ),
    onChangeText,
    placeholder,
    value,
  } = props

  const showClearButton = value && !disableClearable

  return (
    <Flex
      row
      alignItems="center"
      backgroundColor="gray50"
      borderRadius="lg"
      flex={1}
      flexGrow={1}
      gap="sm"
      minHeight={48}>
      <TextInput
        backgroundColor="none"
        borderWidth={0}
        flex={1}
        fontSize={16}
        fontWeight="500"
        placeholder={placeholder}
        placeholderTextColor="gray400"
        value={value ?? undefined}
        onChangeText={onChangeText}
      />
      {showClearButton ? (
        <ClearButton clearIcon={clearIcon} onPress={() => onChangeText('')} />
      ) : null}
      <Box mr="md">{endAdornment}</Box>
    </Flex>
  )
}

interface ClearButtonProps {
  clearIcon: SearchTextInputProps['clearIcon']
  onPress: () => void
}

function ClearButton(props: ClearButtonProps) {
  const theme = useAppTheme()

  const { onPress, clearIcon = <X height={12} stroke={theme.colors.textColor} width={12} /> } =
    props

  return <IconButton bg="gray200" borderRadius="full" icon={clearIcon} onPress={onPress} />
}
