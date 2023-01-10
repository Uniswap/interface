import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DefaultSectionT, SectionListData } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { SearchableRecipient } from 'src/components/RecipientSelect/types'
import { uniqueAddressesOnly } from 'src/components/RecipientSelect/utils'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useENS } from 'src/features/ens/useENS'
import { selectRecipientsByRecency } from 'src/features/transactions/selectors'
import { selectInactiveAccounts } from 'src/features/wallet/selectors'
import { getValidAddress } from 'src/utils/addresses'

const MAX_RECENT_RECIPIENTS = 15

export function useFullAddressRecipient(searchTerm: string | null): {
  recipient: [{ address: string; name: string }] | typeof EMPTY_ARRAY
  loading: boolean
} {
  const { loading, address: ensAddress, name } = useENS(ChainId.Mainnet, searchTerm, true)
  return useMemo(() => {
    const address =
      getValidAddress(searchTerm, true, false) || getValidAddress(ensAddress, true, false)
    const validatedRecipient = address ? { address, name } : null
    const recipient = validatedRecipient ? [validatedRecipient] : EMPTY_ARRAY
    return { recipient, loading }
  }, [name, loading, searchTerm, ensAddress])
}

export function useRecipients(): {
  sections: SectionListData<SearchableRecipient, DefaultSectionT>[]
  searchableRecipientOptions: {
    data: SearchableRecipient
    key: string
  }[]
  pattern: string | null
  onChangePattern: (newPattern: string | null) => void
  loading: boolean
} {
  const { t } = useTranslation()

  const [pattern, setPattern] = useState<string | null>(null)

  const inactiveLocalAccounts = useAppSelector(selectInactiveAccounts) as SearchableRecipient[]
  const recentRecipients = useAppSelector<SearchableRecipient[]>(selectRecipientsByRecency).slice(
    0,
    MAX_RECENT_RECIPIENTS
  )

  const { recipient: validatedAddressRecipient, loading } = useFullAddressRecipient(pattern)

  const sections = useMemo(
    () =>
      [
        ...(validatedAddressRecipient?.length > 0
          ? [
              {
                title: t('Search Results'),
                data: validatedAddressRecipient,
              },
            ]
          : EMPTY_ARRAY),
        ...(recentRecipients.length > 0
          ? [
              {
                title: t('Recent'),
                data: recentRecipients,
              },
            ]
          : EMPTY_ARRAY),
        ...(inactiveLocalAccounts.length > 0
          ? [
              {
                title: t('Your wallets'),
                data: inactiveLocalAccounts,
              },
            ]
          : EMPTY_ARRAY),
      ] as SectionListData<SearchableRecipient>[],
    [validatedAddressRecipient, recentRecipients, t, inactiveLocalAccounts]
  )

  const searchableRecipientOptions = useMemo(
    () =>
      uniqueAddressesOnly([
        ...validatedAddressRecipient,
        ...inactiveLocalAccounts,
        ...recentRecipients,
      ] as SearchableRecipient[]).map((item) => ({ data: item, key: item.address })),
    [recentRecipients, validatedAddressRecipient, inactiveLocalAccounts]
  )

  const onChangePattern = useCallback((newPattern: string | null) => setPattern(newPattern), [])

  return useMemo(
    () => ({
      sections,
      searchableRecipientOptions,
      pattern,
      onChangePattern,
      loading,
    }),
    [pattern, onChangePattern, searchableRecipientOptions, sections, loading]
  )
}
