import { isEqual } from 'lodash'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useUnitagByName } from 'uniswap/src/features/unitags/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { useMemoCompare } from 'utilities/src/react/hooks'
import { useDebounce } from 'utilities/src/time/timing'
import { filterRecipientByNameAndAddress } from 'wallet/src/components/RecipientSearch/filter'
import { filterSections } from 'wallet/src/components/RecipientSearch/utils'
import { SearchableRecipient } from 'wallet/src/features/address/types'
import { uniqueAddressesOnly } from 'wallet/src/features/address/utils'
import { useENS } from 'wallet/src/features/ens/useENS'
import { selectWatchedAddressSet } from 'wallet/src/features/favorites/selectors'
import { DEFAULT_WATCHED_ADDRESSES } from 'wallet/src/features/favorites/slice'
import { selectRecipientsByRecency } from 'wallet/src/features/transactions/selectors'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { selectInactiveAccounts } from 'wallet/src/features/wallet/selectors'
import { useAppSelector } from 'wallet/src/state'

const MAX_RECENT_RECIPIENTS = 15

type RecipientSection = {
  title: string
  data: SearchableRecipient[]
}

function useValidatedSearchedAddress(
  searchTerm: string,
  debounceDelayMs?: number,
): {
  recipients: SearchableRecipient[]
  searchTerm: string
  loading: boolean
} {
  // Check ENS (.eth and any direct subdomain) and Unitag
  const {
    loading: dotEthLoading,
    address: dotEthAddress,
    name: dotEthName,
  } = useENS(UniverseChainId.Mainnet, searchTerm, true)

  const { loading: ensLoading, address: ensAddress, name: ensName } = useENS(UniverseChainId.Mainnet, searchTerm, false)

  const { loading: unitagLoading, unitag } = useUnitagByName(searchTerm ?? undefined)

  const getRecipients = useCallback((): SearchableRecipient[] => {
    if (!searchTerm) {
      return []
    }

    // Check for a valid unitag, ENS address, or literal address
    const unitagValidatedAddress = getValidAddress(unitag?.address?.address, true, false)
    const dotEthValidatedAddress = getValidAddress(dotEthAddress, true, false)
    const ensValidatedAddress = getValidAddress(ensAddress, true, false)
    const literalValidatedAddress = getValidAddress(searchTerm, true, false)

    const recipients = []

    // Add unitag result if available
    if (unitagValidatedAddress) {
      recipients.push({
        address: unitagValidatedAddress,
        name: unitag?.username,
        isUnitag: true,
      })
    }

    // Add raw ENS result if available
    if (!literalValidatedAddress && ensValidatedAddress && ensName) {
      recipients.push({
        address: ensValidatedAddress,
        name: ensName,
      })
    }

    // Add ENS result if different than unitag and raw ENS result
    if (
      !literalValidatedAddress &&
      dotEthName &&
      dotEthValidatedAddress &&
      unitagValidatedAddress !== dotEthValidatedAddress &&
      ensValidatedAddress !== dotEthValidatedAddress
    ) {
      recipients.push({
        address: dotEthValidatedAddress,
        name: dotEthName,
      })
    }

    // Add literal address if validated
    if (literalValidatedAddress) {
      recipients.push({ address: literalValidatedAddress })
    }

    return recipients
  }, [dotEthAddress, dotEthName, ensAddress, ensName, searchTerm, unitag])

  // Use previously created array if its contents haven't changed
  const memoRecipients = useMemoCompare(getRecipients, isEqual)
  const memoResult = useMemo(
    () => ({
      recipients: memoRecipients,
      searchTerm,
      loading: dotEthLoading || ensLoading || unitagLoading,
    }),
    [memoRecipients, searchTerm, dotEthLoading, ensLoading, unitagLoading],
  )
  // Debounce search results to prevent flickering
  const debouncedResult = useDebounce(memoResult, debounceDelayMs)

  // If the searchTerm is empty, we don't have to debounce the result
  // and we can return it right away to prevent unnecessary delay
  return searchTerm ? debouncedResult : memoResult
}

export function useRecipients(
  pattern: string,
  debounceDelayMs?: number,
): {
  sections: RecipientSection[]
  searchableRecipientOptions: {
    data: SearchableRecipient
    key: string
  }[]
  loading: boolean
  debouncedPattern: string
} {
  const { t } = useTranslation()

  const inactiveLocalAccounts = useAppSelector(selectInactiveAccounts)
  const { importedWallets, viewOnlyWallets } = useMemo(
    () =>
      inactiveLocalAccounts.reduce<{ importedWallets: Account[]; viewOnlyWallets: Account[] }>(
        (acc, account) => {
          if (account.type === AccountType.Readonly) {
            acc.viewOnlyWallets.push(account)
          } else {
            acc.importedWallets.push(account)
          }
          return acc
        },
        { importedWallets: [], viewOnlyWallets: [] },
      ),
    [inactiveLocalAccounts],
  )
  const recentRecipients = useAppSelector(selectRecipientsByRecency).slice(0, MAX_RECENT_RECIPIENTS)

  const {
    recipients: validatedAddressRecipients,
    loading,
    searchTerm,
  } = useValidatedSearchedAddress(pattern, debounceDelayMs)

  const watchedWallets = useAppSelector(selectWatchedAddressSet)
  const isPatternEmpty = pattern.length === 0

  const sections = useMemo(() => {
    const sectionsArr = []

    // Don't show default favorites as search result for recipient
    for (const address of DEFAULT_WATCHED_ADDRESSES) {
      watchedWallets.delete(address)
    }

    if (validatedAddressRecipients.length && !isPatternEmpty) {
      sectionsArr.push({
        title: t('send.recipient.section.search'),
        data: validatedAddressRecipients,
      })
    }

    if (recentRecipients.length) {
      sectionsArr.push({
        title: t('send.recipient.section.recent'),
        data: recentRecipients,
      })
    }

    if (importedWallets.length) {
      sectionsArr.push({
        title: t('send.recipient.section.yours'),
        data: importedWallets,
      })
    }

    if (viewOnlyWallets.length) {
      sectionsArr.push({
        title: t('send.recipient.section.viewOnly'),
        data: viewOnlyWallets,
      })
    }

    if (watchedWallets.size) {
      sectionsArr.push({
        title: t('send.recipient.section.favorite'),
        data: Array.from(watchedWallets).map(
          (address) =>
            <SearchableRecipient>{
              address,
            },
        ),
      })
    }

    return sectionsArr
  }, [
    isPatternEmpty,
    validatedAddressRecipients,
    recentRecipients,
    t,
    importedWallets,
    viewOnlyWallets,
    watchedWallets,
  ])

  const searchableRecipientOptions = useMemo(
    () =>
      uniqueAddressesOnly([...validatedAddressRecipients, ...inactiveLocalAccounts, ...recentRecipients]).map(
        (item) => ({ data: item, key: item.address }),
      ),
    [recentRecipients, validatedAddressRecipients, inactiveLocalAccounts],
  )

  return useMemo(
    () => ({
      sections,
      searchableRecipientOptions,
      loading,
      debouncedPattern: searchTerm,
    }),
    [loading, searchableRecipientOptions, sections, searchTerm],
  )
}

export function useFilteredRecipientSections(searchPattern: string, debounceDelayMs?: number): RecipientSection[] {
  const sectionsRef = useRef<RecipientSection[]>([])
  const { sections, searchableRecipientOptions, loading, debouncedPattern } = useRecipients(
    searchPattern,
    debounceDelayMs,
  )

  const getFilteredSections = useCallback(() => {
    const filteredAddresses = filterRecipientByNameAndAddress(debouncedPattern, searchableRecipientOptions).map(
      (item) => item.data.address,
    )
    return filterSections(sections, filteredAddresses)
  }, [debouncedPattern, searchableRecipientOptions, sections])

  // Update displayed sections only if debouncing is finished and the new result is not being loaded
  if (searchPattern === debouncedPattern && !loading) {
    const filteredSections = getFilteredSections()
    const noResult = debouncedPattern.length > 0 && filteredSections.length === 0
    sectionsRef.current = noResult ? [] : filteredSections.length ? filteredSections : sections
  }

  return sectionsRef.current
}
