import { FLASHBOTS_PROTECT_CHECK_ADDRESS } from 'constants/addresses'
import FLASHBOTS_PROTECT_CHECK_ABI from '../abis/flashbots_protect_rpc_check.json'
import { SupportedChainId } from 'constants/chains'
import { useEffect, useState } from 'react'

import { useBlockNumber } from '../state/application/hooks'
import { useContract } from './useContract'
import { useActiveWeb3React } from './web3'

export default function useIsFlashbotsProtectRPC(): [boolean, () => Promise<boolean>] {
  const [isFlashRPC, setIsFlashRPC] = useState<boolean>(false)
  const { library, chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const flashbotsContract = useContract(FLASHBOTS_PROTECT_CHECK_ADDRESS, FLASHBOTS_PROTECT_CHECK_ABI)

  useEffect(() => {
    detectFlashRPC()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockNumber])

  async function detectFlashRPC(): Promise<boolean> {
    console.log('detect start')
    if (!library || !chainId || chainId !== SupportedChainId.MAINNET) {
      setIsFlashRPC(false)
      return false
    }
    if (flashbotsContract) {
      const flashbotsRPCDetection: boolean = await flashbotsContract.isFlashRPC()
      console.log('Detect Flashbots RPC: ', flashbotsRPCDetection)
      setIsFlashRPC(flashbotsRPCDetection)
      return flashbotsRPCDetection
    }
    return false
  }
  return [isFlashRPC, detectFlashRPC]
}
