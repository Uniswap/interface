import { AccountType } from 'uniswap/src/features/accounts/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { isWebApp } from 'utilities/src/platform'

export function useIsActiveSignerAddress(address: string): boolean {
  const { evmAccount, svmAccount } = useWallet()
  const isSolanaSignerAddress =
    isWebApp &&
    svmAccount?.accountType === AccountType.SignerMnemonic &&
    areAddressesEqual({
      addressInput1: { address, platform: Platform.SVM },
      addressInput2: { address: svmAccount.address, platform: Platform.SVM },
    })
  const isEvmSignerAddress =
    evmAccount?.accountType === AccountType.SignerMnemonic &&
    areAddressesEqual({
      addressInput1: { address, platform: Platform.EVM },
      addressInput2: { address: evmAccount.address, platform: Platform.EVM },
    })

  return isSolanaSignerAddress || isEvmSignerAddress
}
