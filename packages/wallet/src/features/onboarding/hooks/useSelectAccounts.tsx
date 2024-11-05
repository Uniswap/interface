import isEqual from 'lodash/isEqual'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AddressWithBalanceAndName } from 'wallet/src/features/onboarding/hooks/useImportableAccounts'

export function useSelectAccounts(initialAccounts: AddressWithBalanceAndName[] = []): {
  selectedAddresses: string[]
  toggleAddressSelection: (address: string) => void
} {
  const initialSelectedAddresses = useMemo(() => initialAccounts.map((account) => account.address), [initialAccounts])
  const [selectedAddresses, setSelectedAddresses] = useState(initialSelectedAddresses)

  const toggleAddressSelection = (address: string): void => {
    // prevents a last address from being deselected
    if (selectedAddresses.length === 1 && selectedAddresses.includes(address)) {
      return
    }
    if (selectedAddresses.includes(address)) {
      setSelectedAddresses(selectedAddresses.filter((selectedAddress) => selectedAddress !== address))
    } else {
      setSelectedAddresses([...selectedAddresses, address])
    }
  }

  // stores the last value of data extracted from useSelectWalletScreenQuery
  const initialSelectedAddressesRef = useRef(initialSelectedAddresses)

  // selects all accounts in case when useSelectWalletScreenQuery returns extra accounts
  // after selectedAddresses useState initialization
  useEffect(() => {
    if (isEqual(initialSelectedAddressesRef.current, initialSelectedAddresses)) {
      return
    }
    initialSelectedAddressesRef.current = initialSelectedAddresses
    setSelectedAddresses(initialSelectedAddresses)
  }, [initialSelectedAddresses])

  return { selectedAddresses, toggleAddressSelection }
}
