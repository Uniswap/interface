import { GraphQLApi } from '@universe/api'
import { useEffect, useMemo, useState } from 'react'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
// biome-ignore lint/style/noRestrictedImports: Direct access needed for custom portfolio query with multiple addresses
import { usePortfolioValueModifiers } from 'uniswap/src/features/dataApi/balances/balances'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import {
  AddressWithBalanceAndName,
  hasBalanceOrName,
  useAddressesEnsNames,
} from 'wallet/src/features/onboarding/hooks/useImportableAccounts'
import { NUMBER_OF_WALLETS_TO_GENERATE } from 'wallet/src/features/onboarding/OnboardingContext'
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
          } catch (_error) {
            logger.error(`Failed to generate address for mnemonicId: ${mnemonicId}`, {
              tags: { file: 'useOnDeviceRecoveryData', function: 'getAddresses' },
            })
            return undefined
          }
        }),
      )

      const filteredAddresses = possibleAddresses
        .map((address, index): RecoveryWalletInfo | undefined =>
          address &&
          storedAddresses.find((storedAddress) =>
            // TODO(WALL-7065): Update to support solana
            areAddressesEqual({
              addressInput1: { address: storedAddress, platform: Platform.EVM },
              addressInput2: { address, platform: Platform.EVM },
            }),
          )
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
  const { data: balancesData, loading: balancesLoading } = GraphQLApi.useMultiplePortfolioBalancesQuery({
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
  const unitagStates: Array<ReturnType<typeof useUnitagsAddressQuery>> = Array(NUMBER_OF_WALLETS_TO_GENERATE)

  unitagStates[0] = useUnitagsAddressQuery({ params: addresses[0] ? { address: addresses[0] } : undefined })
  unitagStates[1] = useUnitagsAddressQuery({ params: addresses[1] ? { address: addresses[1] } : undefined })
  unitagStates[2] = useUnitagsAddressQuery({ params: addresses[2] ? { address: addresses[2] } : undefined })
  unitagStates[3] = useUnitagsAddressQuery({ params: addresses[3] ? { address: addresses[3] } : undefined })
  unitagStates[4] = useUnitagsAddressQuery({ params: addresses[4] ? { address: addresses[4] } : undefined })
  unitagStates[5] = useUnitagsAddressQuery({ params: addresses[5] ? { address: addresses[5] } : undefined })
  unitagStates[6] = useUnitagsAddressQuery({ params: addresses[6] ? { address: addresses[6] } : undefined })
  unitagStates[7] = useUnitagsAddressQuery({ params: addresses[7] ? { address: addresses[7] } : undefined })
  unitagStates[8] = useUnitagsAddressQuery({ params: addresses[8] ? { address: addresses[8] } : undefined })
  unitagStates[9] = useUnitagsAddressQuery({ params: addresses[9] ? { address: addresses[9] } : undefined })

  // Using these values to recalculate dependency array
  const unitagsCombined = unitagStates.map((unitagState) => unitagState.data?.username).join('')
  const unitagLoading = unitagStates.some((unitagState) => unitagState.isLoading)

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to recalculate this when unitagsCombined or balancesLoading changes
  const recoveryWalletInfos = useMemo((): RecoveryWalletInfo[] => {
    return addressesWithIndex.map((addressWithIndex, index): RecoveryWalletInfo => {
      const { address, derivationIndex } = addressWithIndex
      return {
        address,
        derivationIndex,
        balance: balances?.[index],
        ensName: ensMap ? ensMap[address] : undefined,
        unitag: unitagStates[derivationIndex]?.data?.username,
      }
    })
  }, [addressesWithIndex, balances, balancesLoading, ensMap, unitagsCombined])

  const significantRecoveryWalletInfos = useMemo(
    (): RecoveryWalletInfo[] => recoveryWalletInfos.filter(hasBalanceOrName),
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
