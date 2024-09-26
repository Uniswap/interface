import { useIsSupportedChainIdCallback } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { useCallback } from 'react'
import { useAppDispatch } from 'state/hooks'
import { endSwitchingChain, startSwitchingChain } from 'state/wallets/reducer'
import { trace } from 'tracing/trace'
import { InterfaceChainId } from 'uniswap/src/types/chains'
import { useSwitchChain as useSwitchChainWagmi } from 'wagmi'

export function useSwitchChain() {
  const dispatch = useAppDispatch()
  const isSupportedChainCallback = useIsSupportedChainIdCallback()
  const { switchChain } = useSwitchChainWagmi()
  const account = useAccount()

  return useCallback(
    (chainId: InterfaceChainId) => {
      const isSupportedChain = isSupportedChainCallback(chainId)
      if (!isSupportedChain) {
        throw new Error(`Chain ${chainId} not supported for connector (${account.connector?.name})`)
      }
      if (account.chainId === chainId) {
        // some wallets (e.g. SafeWallet) only support single-chain & will throw error on `switchChain` even if already on the correct chain
        return
      }
      return trace(
        { name: 'Switch chain', op: 'wallet.switch_chain' },
        () =>
          new Promise<void>((resolve, reject) => {
            dispatch(startSwitchingChain(chainId))
            switchChain(
              { chainId },
              {
                onSettled(_, error) {
                  dispatch(endSwitchingChain())
                  if (error) {
                    reject(error)
                  } else {
                    resolve()
                  }
                },
              },
            )
          }),
      )
    },
    [isSupportedChainCallback, account.chainId, account.connector?.name, dispatch, switchChain],
  )
}
