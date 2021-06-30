import { useEffect } from 'react'
import { SupportedChainId } from '../constants/chains'
import { useActiveWeb3React } from '../hooks/web3'

const backgroundRadialGradientElement = document.getElementById('background-radial-gradient')
const html = document.querySelector('html')
export default function RadialGradientByChainUpdater(): null {
  const { chainId } = useActiveWeb3React()
  // manage background color
  useEffect(() => {
    if (!backgroundRadialGradientElement || !html) {
      return
    }

    switch (chainId) {
      case SupportedChainId.ARBITRUM_ONE:
        backgroundRadialGradientElement.style.background =
          'radial-gradient(96.19% 96.19% at 50% -5.43%, hsla(204, 87%, 55%, 0.2) 0%, hsla(227, 0%, 0%, 0) 100%)'
        return
      case SupportedChainId.OPTIMISM:
        backgroundRadialGradientElement.style.background = ''
        html.style.backgroundColor = ''
        return
    }
    backgroundRadialGradientElement.style.background = ''
  }, [chainId])
  return null
}
