import { Interface } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { isAddress } from 'utilities/src/addresses'

//import { Fragment, getAddress, Interface } from 'ethers/lib/utils'
//import { knownABIs, knownABIUrls } from '../constants/knownABIs'

export const useAbi = (address: string): Interface | null => {
  const [abi, setAbi] = useState<Interface | null>(null)

  useEffect(() => {
    void (async () => {
      if (!address || !isAddress(address)) {
        setAbi(null)
        return
      }
      setAbi(new Interface(ERC20_ABI)) // temporary
      // const abi = knownABIs[getAddress(address)]
      // if (abi) {
      // setAbi(new Interface(abi))
      // }
      // const abiURL = knownABIUrls[getAddress(address)]
      // if (abiURL) {
      // const result = await fetch(abiURL)
      // const json = (await result.json()) as readonly Fragment[]
      // setAbi(new Interface(json))
      // }
    })()
  }, [address])

  return abi
}
