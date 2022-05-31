import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionListData } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { selectRecipientsByRecency } from 'src/features/transactions/selectors'
import { selectInactiveAccountAddresses } from 'src/features/wallet/selectors'
import { parseAddress } from 'src/utils/addresses'
import { unique } from 'src/utils/array'

const MAX_RECENT_RECIPIENTS = 15

export function useFullAddressRecipient(searchTerm: string | null): string[] {
  const validatedAddress = parseAddress(searchTerm)
  return useMemo(() => (validatedAddress ? [validatedAddress] : []), [validatedAddress])
}

export function useRecipients() {
  const { t } = useTranslation()

  const [pattern, setPattern] = useState<string | null>(null)

  const inactiveLocalAddresses = useAppSelector(selectInactiveAccountAddresses)
  const recentRecipients = useAppSelector(selectRecipientsByRecency).slice(0, MAX_RECENT_RECIPIENTS)

  const validatedAddressRecipient = useFullAddressRecipient(pattern)

  const sections = useMemo(
    () =>
      [
        ...(recentRecipients.length > 0 ? [{ title: t('Recent'), data: recentRecipients }] : []),
        ...(inactiveLocalAddresses.length > 0
          ? [
              {
                title: t('Your Wallets'),
                data: inactiveLocalAddresses,
              },
            ]
          : []),
      ] as SectionListData<string>[],
    [recentRecipients, t, inactiveLocalAddresses]
  )

  const searchableRecipientOptions = useMemo(
    () =>
      unique([...validatedAddressRecipient, ...inactiveLocalAddresses, ...recentRecipients]).map(
        (item) => ({ data: item, key: item })
      ),
    [recentRecipients, validatedAddressRecipient, inactiveLocalAddresses]
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
