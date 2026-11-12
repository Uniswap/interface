import { isMobileWebAndroid } from '@universe/environment'
import { Flex, fonts, Input } from '@universe/mycelium'
import { Search } from '@universe/mycelium/icons/Search'
import { useEffect, useRef, useState } from 'react'
import { SearchInputProps } from 'uniswap/src/components/nfts/types'
import { useDebouncedCallback } from 'utilities/src/react/useDebouncedCallback'
import { useScrollInputIntoView } from '~/hooks/useScrollInputIntoView'

const DEFAULT_SEARCH_INPUT_WIDTH = 280
const DEBOUNCE_DELAY_MS = 300

export function SearchInput({
  value,
  onChangeText,
  dataTestId,
  placeholder = 'Search',
  width = DEFAULT_SEARCH_INPUT_WIDTH,
}: SearchInputProps) {
  const inputRef = useRef<Input>(null)
  const [internalValue, setInternalValue] = useState(value)
  const [debouncedOnChangeText] = useDebouncedCallback((...args: unknown[]) => {
    onChangeText(args[0] as string)
  }, DEBOUNCE_DELAY_MS)
  useScrollInputIntoView({ inputRef, enabled: isMobileWebAndroid })

  // Sync internal value with external value prop (e.g., when parent clears the input)
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleChangeText = (newValue: string): void => {
    setInternalValue(newValue)
    debouncedOnChangeText(newValue)
  }

  return (
    <Flex position="relative" width={width}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={internalValue}
        onChangeText={handleChangeText}
        testID={dataTestId}
        backgroundColor="$surface2"
        borderWidth="$spacing1"
        borderRadius="$rounded12"
        width={width}
        height={40}
        padding="$spacing12"
        paddingLeft="$spacing40"
        placeholderTextColor="$neutral2"
        fontSize={fonts.body3.fontSize}
        borderColor="$surface3"
        fontWeight="500"
        lineHeight="130%"
        color="$neutral2"
        focusStyle={{
          backgroundColor: '$surface1',
          color: '$neutral1',
          borderColor: '$surface3',
        }}
        hoverStyle={{
          backgroundColor: '$surface1Hovered',
          borderColor: '$surface3',
        }}
      />
      <Flex
        position="absolute"
        left="$spacing12"
        top={0}
        bottom={0}
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
      >
        <Search size="$icon.20" color="$neutral1" />
      </Flex>
    </Flex>
  )
}
