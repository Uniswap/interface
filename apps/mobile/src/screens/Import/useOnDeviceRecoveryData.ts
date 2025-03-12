import { useEffect, useMemo, useState } from 'react'
import { useMultiplePortfolioBalancesQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { usePortfolioValueModifiers } from 'uniswap/src/features/dataApi/balances'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { NUMBER_OF_WALLETS_TO_GENERATE } from 'wallet/src/features/onboarding/OnboardingContext'
import {
  AddressWithBalanceAndName,
  hasBalanceOrName,
  useAddressesEnsNames,
} from 'wallet/src/features/onboarding/hooks/useImportableAccounts'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export interface RecoveryWalletInfo extends AddressWithBalanceAndName {
  derivationIndex: number
}

function useStoredAddressesForMnemonic(mnemonicId: string | undefined): {
  addressesWithIndex: RecoveryWalletInfo[]
  loading: boolean
} {
  const [addressesWithIndex, setAddressesWithIndex] = useState<RecoveryWalletInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getAddresses(): Promise<void> {
      if (!mnemonicId) {
        return
      }

      const storedAddresses = await Keyring.getAddressesForStoredPrivateKeys()

      const derivationIndices = Array.from(Array(NUMBER_OF_WALLETS_TO_GENERATE).keys())
      const possibleAddresses = await Promise.all(
        derivationIndices.map((index) => {
          try {
            return Keyring.generateAndStorePrivateKey(mnemonicId, index)
          } catch (error) {
            logger.error(`Failed to generate address for mnemonicId: ${mnemonicId}`, {
              tags: { file: 'useOnDeviceRecoveryData', function: 'getAddresses' },
            })
            return undefined
          }
        }),
      )

      const filteredAddresses = possibleAddresses
        .map((address, index): RecoveryWalletInfo | undefined =>
          address && storedAddresses.find((storedAddress) => areAddressesEqual(storedAddress, address))
            ? { address, derivationIndex: index }
            : undefined,
        )
        .filter((address): address is RecoveryWalletInfo => !!address)

      setAddressesWithIndex(filteredAddresses)
      setLoading(false)
    }

    getAddresses().catch(() => {
      setLoading(false)
    })
  }, [mnemonicId])

  if (!mnemonicId) {
    return { addressesWithIndex: [], loading: false }
  }

  return { addressesWithIndex, loading }
}

// This needs to be separate from useImportableAccounts / useAddressesBalanceAndNames because
// useStoredAddressesForMnemonic loads in addresses in a way that causes react to go into
// a render loop if this is not performed in this way
export function useOnDeviceRecoveryData(mnemonicId: string | undefined): {
  recoveryWalletInfos: RecoveryWalletInfo[]
  significantRecoveryWalletInfos: RecoveryWalletInfo[]
  totalBalance: number | undefined
  loading: boolean
} {
  const { addressesWithIndex, loading: addressesLoading } = useStoredAddressesForMnemonic(mnemonicId)
  const addresses = useMemo(
    () => addressesWithIndex.map((info): string => info.address).filter((a): a is string => typeof a === 'string'),
    [addressesWithIndex],
  )

  const { gqlChains } = useEnabledChains()

  const valueModifiers = usePortfolioValueModifiers(addresses)
  const { data: balancesData, loading: balancesLoading } = useMultiplePortfolioBalancesQuery({
    variables: {
      ownerAddresses: addresses,
      valueModifiers,
      chains: gqlChains,
    },
    skip: !addresses.length,
  })
  const balances = balancesData?.portfolios?.map((portfolio) => portfolio?.tokensTotalDenominatedValue?.value ?? 0)
  const totalBalance = balances?.reduce((acc, balance) => acc + balance, 0)

  const { loading: ensLoading, ensMap } = useAddressesEnsNames(addresses)

  // Need to fetch unitags for each derivation index and cannot use a fetch due (see comment at top of func)
  const unitagStates: Array<ReturnType<typeof useUnitagByAddress>> = Array(NUMBER_OF_WALLETS_TO_GENERATE)

  unitagStates[0] = useUnitagByAddress(addresses[0])
  unitagStates[1] = useUnitagByAddress(addresses[1])
  unitagStates[2] = useUnitagByAddress(addresses[2])
  unitagStates[3] = useUnitagByAddress(addresses[3])
  unitagStates[4] = useUnitagByAddress(addresses[4])
  unitagStates[5] = useUnitagByAddress(addresses[5])
  unitagStates[6] = useUnitagByAddress(addresses[6])
  unitagStates[7] = useUnitagByAddress(addresses[7])
  unitagStates[8] = useUnitagByAddress(addresses[8])
  unitagStates[9] = useUnitagByAddress(addresses[9])

  // Using these values to recalculate dependency array
  const unitagsCombined = unitagStates.map((unitagState) => unitagState?.unitag?.username).join('')
  const unitagLoading = unitagStates.some((unitagState) => unitagState?.loading)

  const recoveryWalletInfos = useMemo((): RecoveryWalletInfo[] => {
    return addressesWithIndex.map((addressWithIndex, index): RecoveryWalletInfo => {
      const { address, derivationIndex } = addressWithIndex
      return {
        address,
        derivationIndex,
        balance: balances?.[index],
        ensName: ensMap ? ensMap[address] : undefined,
        unitag: unitagStates[derivationIndex]?.unitag?.username,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressesWithIndex, balances, balancesLoading, ensMap, unitagsCombined])

  const significantRecoveryWalletInfos = useMemo(
    (): RecoveryWalletInfo[] => (recoveryWalletInfos ?? []).filter(hasBalanceOrName),
    [recoveryWalletInfos],
  )

  const loading = addressesLoading || ensLoading || unitagLoading || balancesLoading

  return {
    recoveryWalletInfos,
    significantRecoveryWalletInfos,
    totalBalance,
    loading,
  }
}
