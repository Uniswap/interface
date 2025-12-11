import { useNftsTabQuery } from '@universe/api/src/clients/graphql/generated'
import { GetThemeValueForKey } from 'ui/src'

/**
 * Shared props type for search input components
 */
export interface SearchInputProps {
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  width?: GetThemeValueForKey<'width'>
}

type UseNftsTabQueryOptions = Parameters<typeof useNftsTabQuery>[0]
export type NftsNextFetchPolicy = UseNftsTabQueryOptions['nextFetchPolicy']
