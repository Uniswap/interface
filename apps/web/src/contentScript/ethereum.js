import { logger } from 'wallet/src/features/logger/logger'
import { InjectedProvider } from './InjectedProvider'

logger.info('Injected Script', '', '')

window.isUniswapExtensionInstalled = true
const uniswapProvider = new InjectedProvider()
window.ethereum = uniswapProvider
