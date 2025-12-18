import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, useMedia } from 'ui/src'
import { Search } from 'ui/src/components/icons/Search'
import { SearchInputProps } from 'uniswap/src/components/nfts/types'
import { useDebouncedCallback } from 'utilities/src/react/useDebouncedCallback'

const DEFAULT_SEARCH_INPUT_WIDTH = 320
const DEBOUNCE_DELAY_MS = 300

interface NftListHeaderProps {
  count: number
  onSearchValueChange: (value: string) => void
  SearchInputComponent?: React.ComponentType<SearchInputProps>
}

function DefaultSearchInput({ value, onChangeText, placeholder, width }: SearchInputProps): JSX.Element {
  return (
    <Flex position="relative" width={width}>
      <Input
        placeholder={placeholder}
        value={value}
        backgroundColor="$surface2"
        borderWidth={1}
        borderRadius="$rounded12"
        width={width}
        height={40}
        p="$spacing12"
        pl="$spacing40"
        placeholderTextColor="$neutral2"
        borderColor="$surface3"
        fontWeight="500"
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
        onChangeText={onChangeText}
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

export function NftListHeader({
  count,
  onSearchValueChange,
  SearchInputComponent = DefaultSearchInput,
}: NftListHeaderProps): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const [search, setSearch] = useState('')

  const [debouncedOnChangeText] = useDebouncedCallback((...args: unknown[]) => {
    const value = args[0] as string
    onSearchValueChange(value)
  }, DEBOUNCE_DELAY_MS)

  const handleChangeText = (newValue: string): void => {
    setSearch(newValue)
    debouncedOnChangeText(newValue)
  }

  const displayCount = count > 0 ? `${count} ` : ''
  const title = t('portfolio.nfts.title')
  const placeholder = t('portfolio.nfts.search.placeholder')
  const searchWidth = media.md ? '100%' : DEFAULT_SEARCH_INPUT_WIDTH

  return (
    <Flex
      row
      alignItems="flex-end"
      justifyContent="space-between"
      $md={{ flexDirection: 'column', alignItems: 'flex-start', gap: '$spacing24' }}
    >
      <Flex group row alignItems="center" gap="$spacing8">
        <Text variant="body2" color="$neutral2" textWrap="nowrap">
          {displayCount}
          {title}
        </Text>
      </Flex>
      <SearchInputComponent
        value={search}
        placeholder={placeholder}
        width={searchWidth}
        onChangeText={handleChangeText}
      />
    </Flex>
  )
}
