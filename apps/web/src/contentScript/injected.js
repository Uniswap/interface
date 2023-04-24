import { logger } from 'wallet/src/features/logger/logger'
import { UniswapInjectedProvider } from './UniswapInjectedProvider'

logger.info('Injected Script', '', '')

window.isUniswapExtensionInstalled = true
const uniswapProvider = new UniswapInjectedProvider()
window.ethereum = uniswapProvider
