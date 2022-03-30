import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionListData } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { selectRecentRecipients } from 'src/features/transactions/selectors'
import { Account } from 'src/features/wallet/accounts/types'
import { useAccounts, useActiveAccount } from 'src/features/wallet/hooks'
import { parseAddress } from 'src/utils/addresses'
import { unique } from 'src/utils/array'

export function useWalletRecipients(): string[] {
  const activeAccount = useActiveAccount()
  const wallets = Object.values(useAccounts())
    .filter((a) => a.address && a.address !== activeAccount?.address)
    .map((a: Account) => {
      const ret = [a.address]
      if (a.name) ret.concat(a.name)
      return ret
    })
    .flat()
  return wallets
}

export function useRecentRecipients(): string[] {
  const recentRecipients = useAppSelector(selectRecentRecipients)
  return recentRecipients
}

export function useFullAddressRecipient(searchTerm: string | null): string[] {
  const validatedAddress = parseAddress(searchTerm)
  return useMemo(() => (validatedAddress ? [validatedAddress] : []), [validatedAddress])
}

export function useRecipients() {
  const { t } = useTranslation()

  const [pattern, setPattern] = useState<string | null>(null)

  const walletsRecipients = useWalletRecipients()
  const recentRecipients = useRecentRecipients()

  const validatedAddressRecipient = useFullAddressRecipient(pattern)

  const sections = useMemo(
    () =>
      [
        ...(recentRecipients.length > 0 ? [{ title: t('Recent'), data: recentRecipients }] : []),
        ...(walletsRecipients.length > 0
          ? [
              {
                title: t('Your Wallets'),
                data: walletsRecipients,
              },
            ]
          : []),
      ] as SectionListData<string>[],
    [recentRecipients, t, walletsRecipients]
  )

  const searchableRecipientOptions = useMemo(
    () =>
      unique([...validatedAddressRecipient, ...walletsRecipients, ...recentRecipients]).map(
        (item) => ({ data: item, key: item })
      ),
    [recentRecipients, validatedAddressRecipient, walletsRecipients]
  )

  const onChangePattern = useCallback((newPattern) => setPattern(newPattern), [])

  return useMemo(
    () => ({
      sections,
      searchableRecipientOptions,
      onChangePattern,
    }),
    [onChangePattern, searchableRecipientOptions, sections]
  )
}
