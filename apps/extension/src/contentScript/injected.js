import { UniswapInjectedProvider } from './UniswapInjectedProvider'

console.log('[Injected Script]')

window.isUniswapExtensionInstalled = true
const uniswapProvider = new UniswapInjectedProvider()
window.ethereum = uniswapProvider
