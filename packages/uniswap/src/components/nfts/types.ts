import { GetThemeValueForKey } from 'ui/src'

/**
 * Shared props type for search input components
 */
export interface SearchInputProps {
  value: string
  onChangeText: (value: string) => void
  dataTestId?: string
  placeholder?: string
  width?: GetThemeValueForKey<'width'>
}
