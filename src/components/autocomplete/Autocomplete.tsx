import React, { ReactElement, useMemo, useState } from 'react'
import { ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { SearchTextInput } from 'src/components/input/SearchInput'
import { Flex, Inset } from 'src/components/layout'

export type AutocompleteOption<T> = { data: T; key: string }

type AutocompleteProps<T> = {
  // fn that determines the filtered options to be rendered on search
  filterOptions: (
    pattern: string | null,
    options: AutocompleteOption<T>[]
  ) => AutocompleteOption<T>[]
  options: AutocompleteOption<T>[]
  // renderInput: () => ReactNode
  renderOption: (option: AutocompleteOption<T>) => ReactElement
  placeholder: string

  // icon to display in place of the default clear icon
  clearIcon?: ReactElement
  // if true, input cannot be cleared
  disableClearable?: boolean
  // rendered while list is empty
  EmptyComponent?: ReactElement
  // rendered while search input is empty
  InitialComponent?: ReactElement
  // adornment displayed to the right of the search input
  // e.g. QR code scanner button
  inputEndAdornment?: ReactElement
  // invoked when value changes
  onChange?: (selectedOption: T) => void
  // invoked when the input value changes
  onChangePattern?: (newPattern: string) => void
}

export function Autocomplete<T>({
  EmptyComponent,
  InitialComponent,
  clearIcon,
  disableClearable,
  filterOptions,
  inputEndAdornment,
  onChange,
  onChangePattern,
  options,
  placeholder,
  renderOption,
}: AutocompleteProps<T>) {
  const [pattern, setPattern] = useState<string | null>(null)

  const filteredOptions = useMemo(
    () => filterOptions(pattern, options),
    [filterOptions, pattern, options]
  )

  const renderInitialComponent = Boolean(!pattern && InitialComponent)

  return (
    <Flex flex={1}>
      <Flex row alignItems="center" gap="sm">
        <BackButton />
        <SearchTextInput
          clearIcon={clearIcon}
          disableClearable={disableClearable}
          endAdornment={inputEndAdornment}
          placeholder={placeholder}
          value={pattern}
          onChangeText={(newPattern: string) => {
            setPattern(newPattern)
            onChangePattern?.(newPattern)
          }}
        />
      </Flex>

      {renderInitialComponent ? (
        InitialComponent
      ) : (
        <FlatList
          ItemSeparatorComponent={ItemSeparator}
          ListEmptyComponent={EmptyComponent}
          data={filteredOptions}
          keyExtractor={key}
          renderItem={(info: ListRenderItemInfo<AutocompleteOption<T>>) => (
            <Button onPress={() => onChange?.(info.item.data)}>{renderOption(info.item)}</Button>
          )}
        />
      )}
    </Flex>
  )
}

function ItemSeparator() {
  return <Inset all="xs" />
}

function key<T>(option: AutocompleteOption<T>) {
  return option.key
}
