// Returns supported and unsupported chainIds based on the connected wallet

import { showTestnetsAtom } from 'components/AccountDrawer/TestnetsToggle'
import { TESTNET_CHAIN_IDS, getChainPriority, useIsSupportedChainIdCallback } from 'constants/chains'
import { useConnectedWalletSupportedChains } from 'hooks/useConnectedWalletSupportedChains'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { ALL_CHAIN_IDS } from 'uniswap/src/constants/chains'
import { InterfaceChainId } from 'uniswap/src/types/chains'

// Returns testnets if testnets are enabled
export function useSupportedChainIds(): { supported: InterfaceChainId[]; unsupported: InterfaceChainId[] } {
  const walletSupportsChain = useConnectedWalletSupportedChains()
  const isSupportedChain = useIsSupportedChainIdCallback()
  const showTestnets = useAtomValue(showTestnetsAtom)

  return useMemo(() => {
    const { supported, unsupported } = ALL_CHAIN_IDS.filter((chain: number) => {
      return isSupportedChain(chain) && (showTestnets || !TESTNET_CHAIN_IDS.includes(chain))
    })
      .sort((a, b) => getChainPriority(a) - getChainPriority(b))
      .reduce(
        (acc, chain) => {
          if (walletSupportsChain.includes(chain)) {
            acc.supported.push(chain)
          } else {
            acc.unsupported.push(chain)
          }
          return acc
        },
        { supported: [], unsupported: [] } as Record<string, InterfaceChainId[]>,
      )
    return { supported, unsupported }
  }, [isSupportedChain, showTestnets, walletSupportsChain])
}
