import { SupportedChainId } from 'constants/chains'
import { useEffect, useState } from 'react'

import { useBlockNumber } from '../state/application/hooks'
import { useContract } from './useContract'
import { useActiveWeb3React } from './web3'

export default function useIsFlashbotsProtectRPC(): [boolean, () => Promise<boolean>] {
  const [isFlashRPC, setIsFlashRPC] = useState<boolean>(false)
  const { library, chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const flashbotsContract = useContract('0xf1a54b0759b58661cea17cff19dd37940a9b5f1a', [
    {
      inputs: [],
      name: 'isFlashRPC',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
  ])

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
