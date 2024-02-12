import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChainId } from 'wallet/src/constants/chains'
import { SearchableRecipient } from 'wallet/src/features/address/types'
import { uniqueAddressesOnly } from 'wallet/src/features/address/utils'
import { useENS } from 'wallet/src/features/ens/useENS'
import { selectWatchedAddressSet } from 'wallet/src/features/favorites/selectors'
import { selectRecipientsByRecency } from 'wallet/src/features/transactions/selectors'
import { useUnitagByName } from 'wallet/src/features/unitags/hooks'
import { selectInactiveAccounts } from 'wallet/src/features/wallet/selectors'
import { useAppSelector } from 'wallet/src/state'
import { getValidAddress } from 'wallet/src/utils/addresses'

const MAX_RECENT_RECIPIENTS = 15

type RecipientSection = {
  title: string
  data: SearchableRecipient[]
}

function useValidatedSearchedAddress(searchTerm: string | null): {
  recipients: SearchableRecipient[]
  loading: boolean
} {
  // Check ENS and Unitag
  const {
    loading: ensLoading,
    address: ensAddress,
    name: ensName,
  } = useENS(ChainId.Mainnet, searchTerm, true)
  const { loading: unitagLoading, unitag } = useUnitagByName(searchTerm ?? undefined)

  return useMemo(() => {
    // Check for a valid unitag, ENS address, or literal address
    const unitagValidatedAddress = getValidAddress(unitag?.address?.address, true, false)
    const ensValidatedAddress = getValidAddress(ensAddress, true, false)
    const literalValidatedAddress = getValidAddress(searchTerm, true, false)

    const recipients = []

    // Add unitag result if available
    if (unitagValidatedAddress) {
      recipients.push({
        address: unitagValidatedAddress,
        name: unitag?.username,
      })
    }

    // Add ENS result if different than unitag result
    if (ensName && ensValidatedAddress && unitagValidatedAddress !== ensValidatedAddress) {
      recipients.push({
        address: ensValidatedAddress,
        name: ensName,
      })
    }

    // Add literal address if validated
    if (literalValidatedAddress) {
      recipients.push({ address: literalValidatedAddress })
    }

    return {
      recipients,
      loading: ensLoading || unitagLoading,
    }
  }, [unitag, ensAddress, searchTerm, ensLoading, unitagLoading, ensName])
}

export function useRecipients(): {
  sections: RecipientSection[]
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

  const inactiveLocalAccounts = useAppSelector(selectInactiveAccounts)
  const recentRecipients = useAppSelector(selectRecipientsByRecency).slice(0, MAX_RECENT_RECIPIENTS)

  const { recipients: validatedAddressRecipient, loading } = useValidatedSearchedAddress(pattern)
  const watchedWallets = useAppSelector(selectWatchedAddressSet)

  const sections = useMemo(() => {
    const sectionsArr = []

    if (validatedAddressRecipient.length) {
      sectionsArr.push({
        title: t('Search results'),
        data: validatedAddressRecipient,
      })
    }

    if (recentRecipients.length) {
      sectionsArr.push({
        title: t('Recent'),
        data: recentRecipients,
      })
    }

    if (inactiveLocalAccounts.length) {
      sectionsArr.push({
        title: t('Your wallets'),
        data: inactiveLocalAccounts,
      })
    }

    if (watchedWallets.size) {
      sectionsArr.push({
        title: t('Favorite wallets'),
        data: Array.from(watchedWallets).map(
          (address) =>
            <SearchableRecipient>{
              address,
            }
        ),
      })
    }

    return sectionsArr
  }, [validatedAddressRecipient, recentRecipients, t, inactiveLocalAccounts, watchedWallets])

  const searchableRecipientOptions = useMemo(
    () =>
      uniqueAddressesOnly([
        ...validatedAddressRecipient,
        ...inactiveLocalAccounts,
        ...recentRecipients,
      ]).map((item) => ({ data: item, key: item.address })),
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
