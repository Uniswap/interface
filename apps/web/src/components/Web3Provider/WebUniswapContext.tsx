import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { PropsWithChildren, useMemo } from 'react'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { AccountMeta, AccountType } from 'uniswap/src/features/accounts/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

// Adapts useEthersProvider to fit uniswap context hook shape
function useWebProvider(chainId: number) {
  return useEthersProvider({ chainId })
}

function useWagmiAccount(): AccountMeta {
  const account = useAccount()
  return useMemo(() => {
    // TODO(WEB-4736): remove this default account stub once swap flow supports unconnected state.
    if (!account.address) {
      return {
        address: '0x67d615D6bccAA1562B1cca9786384b4840597ecD',
        type: AccountType.Readonly,
      }
    }
    return {
      address: account.address,
      type: AccountType.SignerMnemonic,
    }
  }, [account.address])
}

// Abstracts web-specific transaction flow objects for usage in cross-platform flows in the `uniswap` package.
export function WebUniswapProvider({ children }: PropsWithChildren) {
  const account = useWagmiAccount()
  const signer = useEthersSigner()

  const sharedSwapEnabled = useFeatureFlag(FeatureFlags.UniversalSwap)

  return (
    <UniswapProvider account={account} signer={signer} useProviderHook={useWebProvider} throwOnUse={!sharedSwapEnabled}>
      {children}
    </UniswapProvider>
  )
}
