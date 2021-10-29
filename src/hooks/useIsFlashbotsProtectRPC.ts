import { Contract } from '@ethersproject/contracts'
import { useEffect, useState } from 'react'

import { useBlockNumber } from '../state/application/hooks'
import { useActiveWeb3React } from './web3'

export default function useIsFlashbotsProtectRPC(): [boolean, () => Promise<boolean>] {
  const [isFlashRPC, setIsFlashRPC] = useState<boolean>(false)
  const { library, chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()

  useEffect(() => {
    detectFlashRPC()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockNumber])

  async function detectFlashRPC(): Promise<boolean> {
    console.log('detect start')
    if (!library || !chainId || chainId !== 1) {
      setIsFlashRPC(false)
      return false
    }
    const flasbotsRPCContract = new Contract(
      '0xf1a54b0759b58661cea17cff19dd37940a9b5f1a',
      [
        {
          inputs: [],
          name: 'isFlashRPC',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      library
    )
    const flashbotsRPCDetection: boolean = await flasbotsRPCContract.isFlashRPC()
    console.log('Detect Flashbots RPC: ', flashbotsRPCDetection)
    setIsFlashRPC(flashbotsRPCDetection)
    return flashbotsRPCDetection
  }
  return [isFlashRPC, detectFlashRPC]
}
