import { Flex, Input } from 'ui/src'
import { Search } from 'ui/src/components/icons/Search'

interface SearchInputProps {
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  width?: number | string
}

export function SearchInput({ value, onChangeText, placeholder = 'Search', width = 280 }: SearchInputProps) {
  return (
    <Flex position="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        backgroundColor="$surface3"
        borderWidth={1}
        borderRadius="$rounded12"
        width={width}
        height={40}
        padding="$spacing12"
        paddingLeft="$spacing40"
        placeholderTextColor="$neutral3"
        fontSize="$body3"
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
          backgroundColor: '$surface2',
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
        <Search size={20} color="$neutral3" />
      </Flex>
    </Flex>
  )
}
