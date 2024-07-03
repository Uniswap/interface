import { useEffect, useMemo, useState } from 'react'
import { useMultiplePortfolioBalancesQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
// eslint-disable-next-line no-restricted-imports
import { usePortfolioValueModifiers } from 'wallet/src/features/dataApi/balances'
import { useENSName } from 'wallet/src/features/ens/api'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export type RecoveryWalletInfo = AddressWithIndex & {
  balance?: number
  ensName?: Maybe<string>
  unitag?: string
}

type AddressWithIndex = {
  address: string
  derivationIndex: number
}

function useStoredAddressesForMnemonic(mnemonicId: string | undefined): {
  addressesWithIndex: AddressWithIndex[]
  loading: boolean
} {
  const [addressesWithIndex, setAddressesWithIndex] = useState<AddressWithIndex[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getAddresses(): Promise<void> {
      if (!mnemonicId) {
        return
      }

      const storedAddresses = await Keyring.getAddressesForStoredPrivateKeys()

      const derivationIndices = Array.from(Array(10).keys())
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
        .map((address, index): AddressWithIndex | undefined =>
          address && storedAddresses.find((storedAddress) => areAddressesEqual(storedAddress, address))
            ? { address, derivationIndex: index }
            : undefined,
        )
        .filter((address): address is AddressWithIndex => !!address)

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

export function useOnDeviceRecoveryData(mnemonicId: string | undefined): {
  recoveryWalletInfos: RecoveryWalletInfo[]
  significantRecoveryWalletInfos: RecoveryWalletInfo[]
  totalBalance: number | undefined
  loading: boolean
} {
  const { addressesWithIndex, loading: addressesLoading } = useStoredAddressesForMnemonic(mnemonicId)
  const addresses = addressesWithIndex.map((address) => address.address)

  const valueModifiers = usePortfolioValueModifiers(addresses)
  const { data: balancesData, loading: balancesLoading } = useMultiplePortfolioBalancesQuery({
    variables: {
      ownerAddresses: addresses,
      valueModifiers,
    },
    skip: !addresses.length,
  })
  const balances = balancesData?.portfolios?.map((portfolio) => portfolio?.tokensTotalDenominatedValue?.value ?? 0)
  const totalBalance = balances?.reduce((acc, balance) => acc + balance, 0)

  // Need to fetch ENS names and unitags for each deriviation index
  const ensNameStates: Array<ReturnType<typeof useENSName>> = Array(10)
  const unitagStates: Array<ReturnType<typeof useUnitagByAddress>> = Array(10)

  ensNameStates[0] = useENSName(addresses[0])
  ensNameStates[1] = useENSName(addresses[1])
  ensNameStates[2] = useENSName(addresses[2])
  ensNameStates[3] = useENSName(addresses[3])
  ensNameStates[4] = useENSName(addresses[4])
  ensNameStates[5] = useENSName(addresses[5])
  ensNameStates[6] = useENSName(addresses[6])
  ensNameStates[7] = useENSName(addresses[7])
  ensNameStates[8] = useENSName(addresses[8])
  ensNameStates[9] = useENSName(addresses[9])

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
  const ensNamesCombined = ensNameStates.map((ensState) => ensState?.data).join('')
  const ensLoading = ensNameStates.some((ensState) => ensState?.loading)
  const unitagsCombined = unitagStates.map((unitagState) => unitagState?.unitag?.username).join('')
  const unitagLoading = unitagStates.some((unitagState) => unitagState?.loading)

  const recoveryWalletInfos = useMemo((): RecoveryWalletInfo[] => {
    return addressesWithIndex.map((addressWithIndex, index): RecoveryWalletInfo => {
      const { address, derivationIndex } = addressWithIndex
      return {
        address,
        derivationIndex,
        balance: balances?.[index],
        ensName: ensNameStates[derivationIndex]?.data,
        unitag: unitagStates[derivationIndex]?.unitag?.username,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressesWithIndex, balances, balancesLoading, ensNamesCombined, unitagsCombined])

  const significantRecoveryWalletInfos = useMemo(
    () =>
      recoveryWalletInfos?.filter(
        (recoveryAddressInfo) =>
          recoveryAddressInfo.balance || recoveryAddressInfo.ensName || recoveryAddressInfo.unitag,
      ) ?? [],
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
