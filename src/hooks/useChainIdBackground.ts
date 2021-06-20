import { SupportedChainId } from 'constants/chains'
import React from 'react'
import { useActiveWeb3React } from './web3'

export const useChainIdBackground = () => {
  const { chainId } = useActiveWeb3React()
  React.useEffect(() => {
    const background = document.querySelector('#background-radial-gradient')
    if (background === null) {
      return
    }
    let gradient
    switch (chainId) {
      case SupportedChainId.ARBITRUM_ONE:
        gradient =
          'radial-gradient(96.19% 96.19% at 50% -5.43%, hsla(204, 87%, 55%, 0.2) 0%, hsla(227, 0%, 0%, 0) 100%)'
        break
      default:
        gradient = 'radial-gradient(50% 50% at 50% 50%, #fc077d10 0%, rgba(255, 255, 255, 0) 100%)'
    }
    ;(background as HTMLDivElement).style.background = gradient
  }, [chainId])
}
