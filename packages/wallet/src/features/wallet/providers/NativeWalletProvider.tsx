import { Store } from '@reduxjs/toolkit'
import { PropsWithChildren, useMemo } from 'react'
import { useStore } from 'react-redux'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { WalletProvider } from 'uniswap/src/features/wallet/contexts/WalletProvider'
import { createEVMWalletService } from 'uniswap/src/features/wallet/services/createEVMWalletService'
import { WalletService } from 'uniswap/src/features/wallet/services/IWalletService'
import { WalletMeta } from 'uniswap/src/features/wallet/types/WalletMeta'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { HexString } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { WalletState } from 'wallet/src/state/walletReducer'

const NATIVE_UNISWAP_WALLET_ID = 'native-uniswap-wallet'
const NATIVE_UNISWAP_WALLET_NAME = 'Native Uniswap Wallet'

export function getUniswapWalletMeta(): WalletMeta {
  return {
    id: NATIVE_UNISWAP_WALLET_ID,
    name: NATIVE_UNISWAP_WALLET_NAME,
  }
}

function useNativeWalletService(): WalletService {
  const store: Store<WalletState> = useStore()

  const getAccountType = useEvent((address: HexString) => {
    const account = store.getState().wallet.accounts[address]
    if (!account) {
      throw new Error('Account not found')
    }
    return account.type
  })

  return useMemo(
    () => createEVMWalletService({ getWalletMeta: getUniswapWalletMeta, getAccountType }),
    [getAccountType],
  )
}

export function NativeWalletProvider({ children }: PropsWithChildren): JSX.Element {
  const account = useActiveAccount()
  const walletService = useNativeWalletService()

  const evmAddress = useMemo(() => {
    if (!account?.address) {
      return undefined
    }
    const address = getValidAddress({
      address: account.address,
      platform: Platform.EVM,
      withEVMChecksum: true,
    }) as Nullable<HexString>
    if (!address) {
      logger.error(new Error('Invalid address stored in wallet state'), {
        tags: { file: 'NativeWalletProvider.tsx', function: 'useNativeWalletService' },
      })
      return undefined
    }
    return address
  }, [account?.address])

  return (
    // SVM address is not yet supported in the native wallet
    <WalletProvider walletService={walletService} evmAddress={evmAddress} svmAddress={undefined}>
      {children}
    </WalletProvider>
  )
}
