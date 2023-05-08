import { InjectedProvider } from 'src/contentScript/InjectedProvider'

window.isUniswapExtensionInstalled = true
const uniswapProvider = new InjectedProvider()
window.ethereum = uniswapProvider
