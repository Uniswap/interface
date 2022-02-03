import { Web3ReactHooks } from '@widgets/web3-react/core'
import { useAtomValue } from 'jotai/utils'
import { injectedAtom, urlAtom, Web3ReactState } from 'lib/state/web3'

export function useActiveWeb3ReactState(): Web3ReactState {
  const injected = useAtomValue(injectedAtom)
  const url = useAtomValue(urlAtom)
  return injected[1].useIsActive() ? injected : url
}

export function useActiveWeb3ReactHooks(): Web3ReactHooks {
  const [, hooks] = useActiveWeb3ReactState()
  return hooks
}

export default function useActiveWeb3React() {
  const { useProvider, useWeb3React } = useActiveWeb3ReactHooks()
  return useWeb3React(useProvider())
}
