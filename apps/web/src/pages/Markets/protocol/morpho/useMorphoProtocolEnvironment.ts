import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useMemo } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { getContract } from 'utilities/src/contracts/getContract'

import { ERC20_ABI, FEWTOKEN_ROUTER_ABI, MORPHO_ABI, VAULT_ABI } from 'pages/Markets/protocol/morpho/abi'
import {
  MORPHO_DEMO_CHAIN_ID,
  getMorphoProtocolDeployment,
  type MorphoAddress,
} from 'pages/Markets/protocol/morpho/config'

export function useMorphoProtocolEnvironment(targetChainId = MORPHO_DEMO_CHAIN_ID) {
  const account = useAccount()
  const switchChain = useSwitchChain()
  const provider = useEthersWeb3Provider({ chainId: targetChainId })
  const deployment = getMorphoProtocolDeployment(targetChainId)
  const execution = deployment?.execution
  const chainLabel = getChainInfo(targetChainId).label

  const routerContract = useMemo(() => {
    if (!provider || !execution?.routerAddress) {
      return null
    }
    return getContract(execution.routerAddress, FEWTOKEN_ROUTER_ABI, provider, account.address)
  }, [account.address, execution?.routerAddress, provider])

  const morphoContract = useMemo(() => {
    if (!provider || !execution?.morphoAddress) {
      return null
    }
    return getContract(execution.morphoAddress, MORPHO_ABI, provider, account.address)
  }, [account.address, execution?.morphoAddress, provider])

  const getErc20Contract = useMemo(() => {
    if (!provider) {
      return undefined
    }

    return (address: MorphoAddress) => getContract(address, ERC20_ABI, provider, account.address)
  }, [account.address, provider])

  const getVaultContract = useMemo(() => {
    if (!provider) {
      return undefined
    }

    return (address: MorphoAddress) => getContract(address, VAULT_ABI, provider, account.address)
  }, [account.address, provider])

  return {
    account,
    switchChain,
    targetChainId,
    targetChainLabel: chainLabel,
    deployment,
    execution,
    isExecutionConfigured: Boolean(execution?.routerAddress && execution?.morphoAddress),
    routerContract,
    morphoContract,
    getErc20Contract,
    getVaultContract,
  }
}
