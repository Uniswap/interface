import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUnitagByName } from 'uniswap/src/features/unitags/hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { SearchableRecipient } from 'wallet/src/features/address/types'
import { uniqueAddressesOnly } from 'wallet/src/features/address/utils'
import { useENS } from 'wallet/src/features/ens/useENS'
import { selectWatchedAddressSet } from 'wallet/src/features/favorites/selectors'
import { DEFAULT_WATCHED_ADDRESSES } from 'wallet/src/features/favorites/slice'
import { selectRecipientsByRecency } from 'wallet/src/features/transactions/selectors'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
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
  // Check ENS (.eth and any direct subdomain) and Unitag
  const {
    loading: dotEthLoading,
    address: dotEthAddress,
    name: dotEthName,
  } = useENS(ChainId.Mainnet, searchTerm, true)

  const {
    loading: ensLoading,
    address: ensAddress,
    name: ensName,
  } = useENS(ChainId.Mainnet, searchTerm, false)

  const { loading: unitagLoading, unitag } = useUnitagByName(searchTerm ?? undefined)

  return useMemo(() => {
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

    return {
      recipients,
      loading: ensLoading || dotEthLoading || unitagLoading,
    }
  }, [
    unitag?.address?.address,
    unitag?.username,
    dotEthAddress,
    ensAddress,
    searchTerm,
    dotEthName,
    ensLoading,
    dotEthLoading,
    unitagLoading,
    ensName,
  ])
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
        { importedWallets: [], viewOnlyWallets: [] }
      ),
    [inactiveLocalAccounts]
  )
  const recentRecipients = useAppSelector(selectRecipientsByRecency).slice(0, MAX_RECENT_RECIPIENTS)

  const { recipients: validatedAddressRecipients, loading } = useValidatedSearchedAddress(pattern)
  const watchedWallets = useAppSelector(selectWatchedAddressSet)

  const sections = useMemo(() => {
    const sectionsArr = []

    // Don't show default favorites as search result for recipient
    for (const address of DEFAULT_WATCHED_ADDRESSES) {
      watchedWallets.delete(address)
    }

    if (validatedAddressRecipients.length) {
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
            }
        ),
      })
    }

    return sectionsArr
  }, [
    validatedAddressRecipients,
    recentRecipients,
    t,
    importedWallets,
    viewOnlyWallets,
    watchedWallets,
  ])

  const searchableRecipientOptions = useMemo(
    () =>
      uniqueAddressesOnly([
        ...validatedAddressRecipients,
        ...inactiveLocalAccounts,
        ...recentRecipients,
      ]).map((item) => ({ data: item, key: item.address })),
    [recentRecipients, validatedAddressRecipients, inactiveLocalAccounts]
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
