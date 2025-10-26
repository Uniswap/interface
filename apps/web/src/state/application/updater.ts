import { useWeb3React } from '@web3-react/core'
import { useAccount } from 'hooks/useAccount'
import useDebounce from 'hooks/useDebounce'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { useEffect, useState } from 'react'
import { updateChainId } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'

export default function Updater(): null {
  const account = useAccount()
  const { provider } = useWeb3React()
  const supportedChain = useSupportedChainId(account.chainId)
  const dispatch = useAppDispatch()
  const windowVisible = useIsWindowVisible()

  const [activeChainId, setActiveChainId] = useState(account.chainId)

  // biome-ignore lint/correctness/useExhaustiveDependencies: +dispatch
  useEffect(() => {
    if (provider && account.chainId && windowVisible) {
      setActiveChainId(account.chainId)
    }
  }, [dispatch, account.chainId, provider, windowVisible])

  const debouncedChainId = useDebounce(activeChainId, 100)

  useEffect(() => {
    const chainId = debouncedChainId ? supportedChain : null
    dispatch(updateChainId({ chainId }))
  }, [dispatch, debouncedChainId, supportedChain])

  return null
}
