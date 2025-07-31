import isEqual from 'lodash/isEqual'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useUnitagsUsernameQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { SearchableRecipient } from 'uniswap/src/features/address/types'
import { uniqueAddressesOnly } from 'uniswap/src/features/address/utils'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { selectWatchedAddressSet } from 'uniswap/src/features/favorites/selectors'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { selectRecipientsByRecency } from 'uniswap/src/features/transactions/selectors'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { useMemoCompare } from 'utilities/src/react/hooks'
import { useDebounce } from 'utilities/src/time/timing'
import { filterRecipientByNameAndAddress } from 'wallet/src/components/RecipientSearch/filter'
import { filterSections } from 'wallet/src/components/RecipientSearch/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { selectInactiveAccounts } from 'wallet/src/features/wallet/selectors'

const MAX_RECENT_RECIPIENTS = 15

type RecipientSection = {
  title?: string
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
  } = useENS({ nameOrAddress: searchTerm, autocompleteDomain: true })

  const {
    loading: ensLoading,
    address: ensAddress,
    name: ensName,
  } = useENS({
    nameOrAddress: searchTerm,
    autocompleteDomain: false,
  })

  const { data: unitag, isLoading: unitagLoading } = useUnitagsUsernameQuery({
    params: searchTerm ? { username: searchTerm } : undefined,
  })

  const getRecipients = useCallback((): SearchableRecipient[] => {
    if (!searchTerm) {
      return []
    }

    // TODO(WALL-7065): Update to support Solana validation
    // Check for a valid unitag, ENS address, or literal address
    const unitagValidatedAddress = getValidAddress({
      address: unitag?.address?.address,
      platform: Platform.EVM,
      withEVMChecksum: true,
      log: false,
    })
    const dotEthValidatedAddress = getValidAddress({
      address: dotEthAddress,
      platform: Platform.EVM,
      withEVMChecksum: true,
      log: false,
    })
    const ensValidatedAddress = getValidAddress({
      address: ensAddress,
      platform: Platform.EVM,
      withEVMChecksum: true,
      log: false,
    })
    const literalValidatedAddress = getValidAddress({
      address: searchTerm,
      platform: Platform.EVM,
      withEVMChecksum: true,
      log: false,
    })

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

  const inactiveLocalAccounts = useSelector(selectInactiveAccounts)
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
  const recentRecipients = useSelector(selectRecipientsByRecency).slice(0, MAX_RECENT_RECIPIENTS)

  const {
    recipients: validatedAddressRecipients,
    loading,
    searchTerm,
  } = useValidatedSearchedAddress(pattern, debounceDelayMs)

  const watchedWallets = useSelector(selectWatchedAddressSet)

  const isPatternEmpty = pattern.length === 0

  const sections = useMemo(() => {
    const sectionsArr = []

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

export function useFilteredRecipientSections(
  searchPattern: string,
  debounceDelayMs?: number,
): { sections: RecipientSection[]; loading: boolean } {
  const sectionsRef = useRef<RecipientSection[]>([])
  const { sections, searchableRecipientOptions, loading, debouncedPattern } = useRecipients(
    searchPattern,
    debounceDelayMs,
  )
  const isDebouncingOrLoading = loading || searchPattern !== debouncedPattern

  const getFilteredSections = useCallback(() => {
    const filteredAddresses = filterRecipientByNameAndAddress(debouncedPattern, searchableRecipientOptions).map(
      (item) => item.data.address,
    )
    return filterSections({ sections, filteredAddresses })
  }, [debouncedPattern, searchableRecipientOptions, sections])

  const getFilteredRecipientList = useCallback(
    () => filterRecipientByNameAndAddress(debouncedPattern, searchableRecipientOptions).map((item) => item.data),
    [debouncedPattern, searchableRecipientOptions],
  )

  // Update displayed sections only if debouncing is finished and the new result is not being loaded
  if (searchPattern === debouncedPattern && !loading) {
    if (debouncedPattern.length > 0) {
      const recipients = getFilteredRecipientList()
      sectionsRef.current = recipients.length ? [{ data: recipients }] : []
    } else {
      const filteredSections = getFilteredSections()
      sectionsRef.current = filteredSections.length ? filteredSections : sections
    }
  }

  return { sections: sectionsRef.current, loading: isDebouncingOrLoading }
}
